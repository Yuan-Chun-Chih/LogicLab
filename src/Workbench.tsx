import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState, type DragEvent } from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls, Handle, Position, addEdge, useEdgesState, useNodesState, useReactFlow, type Connection, type CoordinateExtent, type OnNodeDrag } from '@xyflow/react'
import { Check, CircleHelp, Focus, Grip, Play, RotateCcw, Square, Trash2, Undo2, Redo2 } from 'lucide-react'
import GateSymbol from './GateSymbol'
import SignalEdge, { type WorkbenchEdge } from './SignalEdge'
import { advanceCircuit, checkCircuit, evaluateCircuit, expectedCircuitOutput, getInputVectors, getTruthTable, type Bit, type CheckResult, type CircuitDiagnostic, type CircuitNode, type CircuitSpec, type ComponentType, type GateType, type Signal } from './logic'
import { soundManager } from './sound'

export interface WorkbenchHandle { test: () => CheckResult }
interface Props { spec: CircuitSpec; freeMode?: boolean; onEdit?: () => void }

const signalClass = (value: Signal) => value === 1 ? 'signal-high' : value === 0 ? 'signal-low' : 'signal-unknown'
const signalStroke = (value: Signal) => value === 1 ? 'var(--signal-high)' : value === 0 ? 'var(--signal-low)' : 'var(--signal-unknown)'
const withoutSignalClass = (value?: string) => (value ?? '').replace(/\bsignal-(?:high|low|unknown)\b/g, '').trim()
const edgeTypes = { signal: SignalEdge }
const DEFAULT_MAX_COMPONENTS = 8
const DESKTOP_NODE_EXTENT: CoordinateExtent = [[0, 0], [860, 620]]
const MOBILE_NODE_EXTENT: CoordinateExtent = [[0, 0], [580, 980]]
const DESKTOP_VIEW_EXTENT: CoordinateExtent = [[-70, -70], [1010, 750]]
const MOBILE_VIEW_EXTENT: CoordinateExtent = [[-45, -45], [710, 1100]]
type Snapshot = { nodes: CircuitNode[]; edges: WorkbenchEdge[]; inputs: Record<string, Bit>; state: Record<string, Bit>; clocks: Record<string, Signal>; truthOpen: boolean }
type WalkthroughStatus =
  | { kind: 'step'; index: number; total: number; inputs: Record<string, Bit>; passed: boolean; expected: Record<string, Signal>; actual: Record<string, Signal> }
  | { kind: 'done'; passedCount: number; total: number; failed: boolean }
  | { kind: 'stopped' }

function initialNodes(spec: CircuitSpec): CircuitNode[] {
  const compact = window.innerWidth <= 1000
  const inputs: CircuitNode[] = spec.inputs.map((label, index) => ({ id: label, type: 'input', position: { x: compact ? 10 : 35, y: (compact ? 55 : 75) + index * (compact ? 125 : 142) }, data: { label }, draggable: true, deletable: false }))
  const outputs: CircuitNode[] = spec.outputs.map((label, index) => ({ id: label, type: 'output', position: { x: compact ? 475 : 690, y: (compact ? 120 : 155) + index * (compact ? 140 : 170) }, data: { label }, draggable: true, deletable: false }))
  return [...inputs, ...outputs]
}

function InputNode({ data }: { data: CircuitNode['data'] }) {
  return <div className="io-node input-node"><span className="io-kind">INPUT</span><strong>{data.label}</strong><button type="button" className={`input-switch nodrag nopan ${data.value === 1 ? 'on' : ''}`} onClick={event => { event.stopPropagation(); data.onToggle?.() }} disabled={!data.onToggle} aria-label={`切換輸入 ${data.label}，目前 ${data.value ?? 'X'}，點擊切換為 ${data.value === 1 ? 0 : 1}`} aria-pressed={data.value === 1} title="切換 0／1"><span className="switch-digit">0</span><span className="switch-track" aria-hidden="true"><span className="switch-thumb" /></span><span className="switch-digit">1</span></button><Handle id="out" type="source" position={Position.Right} className={signalClass(data.value ?? 'X')} aria-label={`${data.label} 輸出接點`} /></div>
}

function OutputNode({ data }: { data: CircuitNode['data'] }) {
  return <div className="io-node output-node"><span className="io-kind">OUTPUT</span><strong>{data.label}</strong><span className="output-readout" aria-label={`輸出 ${data.label} 為 ${data.value ?? 'X'}`}>{data.value ?? 'X'}</span><Handle id="in" type="target" position={Position.Left} className={signalClass(data.value ?? 'X')} aria-label={`${data.label} 輸入接點`} /></div>
}

function GateNode({ data }: { data: CircuitNode['data'] }) {
  const type = data.gate ?? 'AND'
  return <div className="symbol-node">{data.onDelete && <button type="button" className="node-remove-icon nodrag nopan" onClick={event => { event.stopPropagation(); data.onDelete?.() }} aria-label={`刪除 ${type} 元件`}><Trash2 size={13} /></button>}<GateSymbol type={type} inputSignals={data.inputSignals} value={data.value ?? 'X'} /><span className="symbol-caption">{type}{data.instance && <small className="component-instance">#{data.instance}</small>}</span>
    <Handle id="a" type="target" position={Position.Left} style={{ top: type === 'NOT' ? '50%' : '30%' }} className={signalClass(data.inputSignals?.a ?? 'X')} aria-label={`${type} 輸入 A`} />
    {type !== 'NOT' && <Handle id="b" type="target" position={Position.Left} style={{ top: '70%' }} className={signalClass(data.inputSignals?.b ?? 'X')} aria-label={`${type} 輸入 B`} />}
    <Handle id="out" type="source" position={Position.Right} className={signalClass(data.value ?? 'X')} aria-label={`${type} 輸出`} />
  </div>
}

function DffNode({ data }: { data: CircuitNode['data'] }) {
  return <div className="symbol-node dff-node">{data.onDelete && <button type="button" className="node-remove-icon nodrag nopan" onClick={event => { event.stopPropagation(); data.onDelete?.() }} aria-label="刪除 D 正反器元件"><Trash2 size={13} /></button>}<GateSymbol type="DFF" inputSignals={data.inputSignals} value={data.value ?? 'X'} /><span className="symbol-caption">D 正反器{data.instance && <small className="component-instance">#{data.instance}</small>}</span>
    <Handle id="d" type="target" position={Position.Left} style={{ top: '24%' }} className={signalClass(data.inputSignals?.d ?? 'X')} aria-label="D 資料輸入" />
    <Handle id="clk" type="target" position={Position.Left} style={{ top: '50%' }} className={signalClass(data.inputSignals?.clk ?? 'X')} aria-label="CLK 時脈輸入" />
    <Handle id="rst" type="target" position={Position.Left} style={{ top: '76%' }} className={data.inputSignals?.rst === undefined ? 'signal-optional' : signalClass(data.inputSignals.rst)} aria-label="RST 重置輸入" />
    <Handle id="out" type="source" position={Position.Right} className={signalClass(data.value ?? 'X')} aria-label="Q 輸出" />
  </div>
}

const nodeTypes = { input: InputNode, output: OutputNode, gate: GateNode, dff: DffNode }

const Inner = forwardRef<WorkbenchHandle, Props>(function Inner({ spec, freeMode = false, onEdit }, ref) {
  const [nodes, setNodes, onNodesChange] = useNodesState<CircuitNode>(initialNodes(spec))
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkbenchEdge>([])
  const [inputs, setInputs] = useState<Record<string, Bit>>(Object.fromEntries(spec.inputs.map(name => [name, 0 as Bit])))
  const [state, setState] = useState<Record<string, Bit>>({})
  const [clocks, setClocks] = useState<Record<string, Signal>>({})
  const [notice, setNotice] = useState('從元件列加入邏輯閘，接好導線後點 INPUT 開關切換 0／1。')
  const [connecting, setConnecting] = useState(false)
  const [truthOpen, setTruthOpen] = useState(false)
  const [diagnostic, setDiagnostic] = useState<CircuitDiagnostic | null>(null)
  const [walkthroughActive, setWalkthroughActive] = useState(false)
  const [walkthroughStatus, setWalkthroughStatus] = useState<WalkthroughStatus | null>(null)
  const walkthroughIdRef = useRef(0)
  const walkthroughBackupRef = useRef<{ inputs: Record<string, Bit>; state: Record<string, Bit>; clocks: Record<string, Signal> } | null>(null)
  const historyRef = useRef<{ past: Snapshot[]; future: Snapshot[] }>({ past: [], future: [] })
  const dragStartRef = useRef<Snapshot | null>(null)
  const draggingRef = useRef(false)
  const [historyCounts, setHistoryCounts] = useState({ undo: 0, redo: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const { screenToFlowPosition, fitView } = useReactFlow()
  const compact = window.innerWidth <= 1000
  const nodeExtent = compact ? MOBILE_NODE_EXTENT : DESKTOP_NODE_EXTENT
  const translateExtent = compact ? MOBILE_VIEW_EXTENT : DESKTOP_VIEW_EXTENT
  const componentCount = nodes.filter(node => node.type === 'gate' || node.type === 'dff').length
  const maxComponents = spec.maxComponents ?? DEFAULT_MAX_COMPONENTS

  const snapshot = (): Snapshot => ({
    nodes: nodes.map(node => ({ ...node, position: { ...node.position }, data: { ...node.data } })),
    edges: edges.map(edge => ({ ...edge, data: { ...edge.data } })),
    inputs: { ...inputs }, state: { ...state }, clocks: { ...clocks }, truthOpen,
  })
  const syncHistoryButtons = () => setHistoryCounts({ undo: historyRef.current.past.length, redo: historyRef.current.future.length })
  const recordHistory = (before: Snapshot = snapshot()) => {
    historyRef.current.past.push(before)
    if (historyRef.current.past.length > 60) historyRef.current.past.shift()
    historyRef.current.future = []
    syncHistoryButtons()
    setDiagnostic(null)
    setWalkthroughStatus(null)
  }
  const restore = (entry: Snapshot) => {
    setNodes(entry.nodes); setEdges(entry.edges); setInputs(entry.inputs)
    setState(entry.state); setClocks(entry.clocks); setTruthOpen(entry.truthOpen)
    setDiagnostic(null); setWalkthroughStatus(null); setConnecting(false)
    onEdit?.()
  }
  const undo = () => {
    const previous = historyRef.current.past.pop()
    if (!previous) return
    historyRef.current.future.push(snapshot())
    restore(previous); syncHistoryButtons(); setNotice('已復原上一步。')
  }
  const redo = () => {
    const next = historyRef.current.future.pop()
    if (!next) return
    historyRef.current.past.push(snapshot())
    restore(next); syncHistoryButtons(); setNotice('已重做上一步。')
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (walkthroughActive) return
      if (event.defaultPrevented || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault(); if (event.shiftKey) redo(); else undo(); return
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault(); redo(); return
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !target?.closest('button')) {
        const selectedNodes = nodes.filter(node => node.selected && (node.type === 'gate' || node.type === 'dff')).map(node => node.id)
        const selectedEdges = edges.filter(edge => edge.selected || selectedNodes.includes(edge.source) || selectedNodes.includes(edge.target)).map(edge => edge.id)
        if (!selectedNodes.length && !selectedEdges.length) return
        event.preventDefault(); recordHistory()
        setNodes(current => current.filter(node => !selectedNodes.includes(node.id)))
        setEdges(current => current.filter(edge => !selectedEdges.includes(edge.id)))
        setState(current => Object.fromEntries(Object.entries(current).filter(([id]) => !selectedNodes.includes(id))))
        setClocks(current => Object.fromEntries(Object.entries(current).filter(([id]) => !selectedNodes.includes(id))))
        setNotice('已刪除選取的元件或導線。'); soundManager.playDisconnect(); onEdit?.()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })
  useEffect(() => () => { walkthroughIdRef.current += 1 }, [])

  const removeComponent = useCallback((id: string) => {
    if (walkthroughActive) return
    recordHistory()
    setNodes(current => current.filter(node => node.id !== id))
    setEdges(current => current.filter(edge => edge.source !== id && edge.target !== id))
    setState(current => { const next = { ...current }; delete next[id]; return next })
    setClocks(current => { const next = { ...current }; delete next[id]; return next })
    setNotice('已移除元件及其相連導線。')
    soundManager.playDisconnect()
    onEdit?.()
  }, [nodes, edges, inputs, state, clocks, truthOpen, setNodes, setEdges, onEdit, walkthroughActive])

  const removeEdge = useCallback((id: string) => {
    if (walkthroughActive) return
    recordHistory()
    setEdges(current => current.filter(edge => edge.id !== id))
    setNotice('已移除選取的導線。')
    soundManager.playDisconnect()
    onEdit?.()
  }, [nodes, edges, inputs, state, clocks, truthOpen, setEdges, onEdit, walkthroughActive])
  const live = useMemo(() => evaluateCircuit(nodes, edges, inputs, state), [nodes, edges, inputs, state])
  const displayedNodes = useMemo(() => nodes.map(node => {
    const value = live.values[node.id] ?? 'X'
    const inputSignals = Object.fromEntries(['a', 'b', 'd', 'clk', 'rst'].map(port => [port, live.ports[`${node.id}:${port}`] ?? 'X'])) as Record<string, Signal>
    if (node.type === 'dff' && !spec.inputs.includes('RST') && !edges.some(edge => edge.target === node.id && edge.targetHandle === 'rst')) delete inputSignals.rst
    return { ...node, className: `${withoutSignalClass(node.className)} ${signalClass(value)} ${diagnostic?.output === node.id ? 'diagnostic-target' : ''}`.trim(), data: { ...node.data, value, inputSignals, onDelete: !walkthroughActive && (node.type === 'gate' || node.type === 'dff') ? () => removeComponent(node.id) : undefined, onToggle: !walkthroughActive && node.type === 'input' ? () => toggleInput(node.id) : undefined } }
  }), [nodes, live, edges, spec.inputs, diagnostic, walkthroughActive, removeComponent])
  const displayedEdges = useMemo(() => edges.map(edge => {
    const value = live.values[edge.source] ?? 'X'
    const source = nodes.find(node => node.id === edge.source)
    const target = nodes.find(node => node.id === edge.target)
    return { ...edge, className: `${withoutSignalClass(edge.className)} ${signalClass(value)} ${diagnostic?.output === edge.target ? 'diagnostic-target' : ''}`.trim(), data: { ...edge.data, signal: value, backwards: Boolean(source && target && source.position.x > target.position.x), onDelete: walkthroughActive ? undefined : () => removeEdge(edge.id) }, style: { ...edge.style, stroke: signalStroke(value), strokeWidth: value === 1 ? 3.6 : 3, strokeDasharray: value === 'X' ? '7 6' : undefined } }
  }), [edges, live, nodes, diagnostic, removeEdge, walkthroughActive])
  const truth = useMemo(() => getTruthTable(nodes, edges, spec.inputs, spec.outputs), [nodes, edges, spec])

  useImperativeHandle(ref, () => ({ test: () => {
    if (walkthroughActive) stopWalkthrough()
    if (freeMode) { setTruthOpen(true); setDiagnostic(null); return { ok: true, message: '已產生完整真值表。切換輸入，也能觀察畫布上的即時結果。' } }
    const result = checkCircuit(nodes, edges, spec)
    setDiagnostic(result.diagnostic ?? null)
    if (result.diagnostic) {
      setInputs(result.diagnostic.inputs)
      if (result.diagnostic.state) setState(result.diagnostic.state)
      if (result.diagnostic.clocks) setClocks(result.diagnostic.clocks)
    }
    return result
  } }), [freeMode, nodes, edges, spec, walkthroughActive])

  const addComponent = useCallback((type: ComponentType, position?: { x: number; y: number }) => {
    if (walkthroughActive) return
    if (!spec.allowed.includes(type)) return
    if (componentCount >= maxComponents) { setNotice(`本關最多放 ${maxComponents} 個元件。可先刪除不需要的元件。`); return }
    recordHistory()
    setNodes(current => {
      const count = current.filter(node => node.type === 'gate' || node.type === 'dff').length
      const compact = window.innerWidth <= 1000
      const expanded = maxComponents > DEFAULT_MAX_COMPONENTS
      const columns = expanded ? compact ? 2 : 3 : compact ? 1 : 2
      const autoPosition = spec.goal === 'toggle' && count === 1
        ? { x: compact ? 205 : 440, y: compact ? 180 : 245 }
        : { x: (compact ? expanded ? 170 : 205 : 200) + (count % columns) * (expanded ? compact ? 155 : 170 : 240), y: (compact ? 42 : 40) + Math.floor(count / columns) * (compact ? expanded ? 145 : 115 : 140) }
      const rawPosition = position ?? autoPosition
      const nextPosition = { x: Math.max(nodeExtent[0][0], Math.min(rawPosition.x, nodeExtent[1][0] - 140)), y: Math.max(nodeExtent[0][1], Math.min(rawPosition.y, nodeExtent[1][1] - 100)) }
      const instance = Math.max(0, ...current.map(node => node.data.instance ?? 0)) + 1
      return [...current, { id: `component-${crypto.randomUUID()}`, type: type === 'DFF' ? 'dff' : 'gate', position: nextPosition, data: { label: type, instance, gate: type === 'DFF' ? undefined : type as GateType } }]
    })
    setNotice(`${type === 'DFF' ? 'D 正反器' : type + ' 閘'}已加入畫布。`)
    soundManager.playConnect()
    onEdit?.()
  }, [spec.allowed, spec.goal, maxComponents, setNodes, onEdit, nodeExtent, componentCount, nodes, edges, inputs, state, clocks, truthOpen, walkthroughActive])

  const onConnect = useCallback((connection: Connection) => {
    if (walkthroughActive) return
    if (!connection.source || !connection.target || !connection.targetHandle) return
    if (edges.some(edge => edge.target === connection.target && edge.targetHandle === connection.targetHandle)) {
      setNotice('這個輸入接點已有導線。選取舊導線後按 Delete 移除。')
      return
    }
    const source = nodes.find(node => node.id === connection.source)
    const target = nodes.find(node => node.id === connection.target)
    const backwards = source && target && source.position.x > target.position.x
    recordHistory()
    setEdges(current => addEdge({ ...connection, type: 'signal', data: { backwards: Boolean(backwards) } }, current))
    soundManager.playConnect()
    setConnecting(false)
    setNotice('接線完成。可切換輸入，或按「測試電路」檢查所有情況。')
    onEdit?.()
  }, [edges, nodes, inputs, state, clocks, truthOpen, setEdges, onEdit, walkthroughActive])

  const handleNodesChange: typeof onNodesChange = changes => {
    if (changes.some(change => change.type === 'remove' || (change.type === 'position' && !draggingRef.current && change.position))) recordHistory()
    onNodesChange(changes)
    if (changes.some(change => change.type === 'remove')) onEdit?.()
  }
  const handleEdgesChange: typeof onEdgesChange = changes => {
    if (changes.some(change => change.type === 'remove')) recordHistory()
    onEdgesChange(changes)
    if (changes.some(change => change.type === 'remove')) onEdit?.()
  }

  const keepNodeVisible: OnNodeDrag<CircuitNode> = (_event, node) => {
    draggingRef.current = false
    const before = dragStartRef.current
    dragStartRef.current = null
    if (before && before.nodes.some(item => item.id === node.id && (item.position.x !== node.position.x || item.position.y !== node.position.y))) {
      recordHistory(before)
      onEdit?.()
    }
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const topLeft = screenToFlowPosition({ x: rect.left + 20, y: rect.top + 20 })
    const bottomRight = screenToFlowPosition({ x: rect.right - 20, y: rect.bottom - 20 })
    const width = node.measured?.width ?? (node.type === 'input' ? 116 : node.type === 'output' ? 105 : 140)
    const height = node.measured?.height ?? (node.type === 'input' ? 80 : node.type === 'output' ? 73 : 100)
    const minX = Math.max(nodeExtent[0][0], topLeft.x)
    const minY = Math.max(nodeExtent[0][1], topLeft.y)
    const maxX = Math.max(minX, Math.min(nodeExtent[1][0] - width, bottomRight.x - width))
    const maxY = Math.max(minY, Math.min(nodeExtent[1][1] - height, bottomRight.y - height))
    const x = Math.max(minX, Math.min(node.position.x, maxX))
    const y = Math.max(minY, Math.min(node.position.y, maxY))
    if (Math.abs(x - node.position.x) > 0.5 || Math.abs(y - node.position.y) > 0.5) {
      setNodes(current => current.map(item => item.id === node.id ? { ...item, position: { x, y } } : item))
      setNotice('元件已移回目前可見的工作台範圍。')
    }
  }

  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/logiclab') as ComponentType
    if (!type || !spec.allowed.includes(type)) return
    addComponent(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
  }

  function toggleInput(name: string) {
    if (walkthroughActive) return
    recordHistory()
    soundManager.playSwitch()
    const next = { ...inputs, [name]: (inputs[name] === 1 ? 0 : 1) as Bit }
    const before = evaluateCircuit(nodes, edges, inputs, state)
    const previousClocks = { ...clocks }
    nodes.filter(node => node.type === 'dff').forEach(node => { previousClocks[node.id] ??= before.ports[`${node.id}:clk`] ?? 'X' })
    const advanced = advanceCircuit(nodes, edges, next, state, previousClocks)
    setInputs(next)
    setState(advanced.state)
    setClocks(advanced.clocks)
  }

  function reset() {
    if (walkthroughActive) return
    recordHistory()
    setNodes(initialNodes(spec)); setEdges([]); setInputs(Object.fromEntries(spec.inputs.map(name => [name, 0 as Bit]))); setState({}); setClocks({}); setTruthOpen(false)
    setNotice('畫布已清空，可以重新接線。')
    onEdit?.()
  }

  function stopWalkthrough() {
    if (!walkthroughActive) return
    walkthroughIdRef.current += 1
    const backup = walkthroughBackupRef.current
    if (backup) {
      setInputs(backup.inputs); setState(backup.state); setClocks(backup.clocks)
    }
    walkthroughBackupRef.current = null
    setWalkthroughActive(false)
    setWalkthroughStatus({ kind: 'stopped' })
  }

  async function runWalkthrough() {
    if (walkthroughActive) { stopWalkthrough(); return }
    const runId = ++walkthroughIdRef.current
    const backup = { inputs: { ...inputs }, state: { ...state }, clocks: { ...clocks } }
    walkthroughBackupRef.current = backup
    setDiagnostic(null); setWalkthroughStatus(null); setWalkthroughActive(true)
    let simulationState: Record<string, Bit> = spec.steps ? {} : { ...state }
    let simulationClocks: Record<string, Signal> = spec.steps ? Object.fromEntries(nodes.filter(node => node.type === 'dff').map(node => [node.id, 0])) : { ...clocks }
    let passedCount = 0
    let firstFailure: { diagnostic: CircuitDiagnostic; state: Record<string, Bit>; clocks: Record<string, Signal> } | null = null
    const rows = spec.steps?.map(step => step.inputs) ?? getInputVectors(spec.inputs)

    for (let index = 0; index < rows.length; index += 1) {
      if (runId !== walkthroughIdRef.current) return
      const vector = rows[index]
      let result: ReturnType<typeof evaluateCircuit>
      if (spec.steps) {
        const advanced = advanceCircuit(nodes, edges, vector, simulationState, simulationClocks)
        simulationState = advanced.state
        simulationClocks = advanced.clocks
        result = advanced.result
      } else result = evaluateCircuit(nodes, edges, vector, simulationState)
      const expected = spec.steps?.[index]?.expected ?? expectedCircuitOutput(spec, vector)
      const actual = Object.fromEntries(spec.outputs.map(output => [output, result.values[output] ?? 'X'])) as Record<string, Signal>
      const rowPassed = !result.error && spec.outputs.every(output => expected[output] === 'X' || actual[output] === expected[output])
      if (rowPassed) passedCount += 1
      else if (!firstFailure) {
        const output = spec.outputs.find(name => expected[name] !== 'X' && actual[name] !== expected[name]) ?? spec.outputs[0]
        const target = expected[output]
        firstFailure = { diagnostic: { inputs: vector, output, expected: target === 1 ? 1 : 0, actual: actual[output] ?? 'X', step: spec.steps ? index + 1 : undefined, state: { ...simulationState }, clocks: { ...simulationClocks } }, state: { ...simulationState }, clocks: { ...simulationClocks } }
      }
      setInputs(vector); setState(simulationState); setClocks(simulationClocks)
      setWalkthroughStatus({ kind: 'step', index, total: rows.length, inputs: vector, passed: rowPassed, expected, actual })
      soundManager.playTick(rowPassed)
      await new Promise(resolve => window.setTimeout(resolve, 520))
    }

    if (runId !== walkthroughIdRef.current) return
    setWalkthroughActive(false)
    walkthroughBackupRef.current = null
    setWalkthroughStatus({ kind: 'done', passedCount, total: rows.length, failed: Boolean(firstFailure) })
    if (firstFailure) {
      setInputs(firstFailure.diagnostic.inputs); setState(firstFailure.state); setClocks(firstFailure.clocks)
      setDiagnostic(firstFailure.diagnostic)
      soundManager.playError()
    } else {
      setInputs(backup.inputs); setState(backup.state); setClocks(backup.clocks)
      soundManager.playSuccess()
    }
  }

  return <div className="workbench">
    <div className="workbench-toolbar">
      <div className="toolbox-label"><Grip size={17} /><span>元件列 <small>{componentCount}/{maxComponents}</small></span></div>
      <div className="toolbox-items">{spec.allowed.map(type => <button key={type} draggable={!walkthroughActive && componentCount < maxComponents} disabled={walkthroughActive || componentCount >= maxComponents} onDragStart={event => { event.dataTransfer.setData('application/logiclab', type); event.dataTransfer.effectAllowed = 'move' }} onClick={() => addComponent(type)} className="palette-item" aria-label={`加入 ${type === 'DFF' ? 'D 正反器' : type + ' 閘'}`}><GateSymbol type={type} compact /><span>{type}</span></button>)}</div>
      <div className="toolbar-actions">
        <div className="history-actions"><button type="button" onClick={undo} disabled={walkthroughActive || !historyCounts.undo} aria-label="復原" title="復原 Ctrl+Z"><Undo2 size={16} /><span>復原</span></button><button type="button" onClick={redo} disabled={walkthroughActive || !historyCounts.redo} aria-label="重做" title="重做 Ctrl+Shift+Z"><Redo2 size={16} /><span>重做</span></button></div>
        <button type="button" className={`walkthrough-action ${walkthroughActive ? 'active' : ''}`} onClick={runWalkthrough} aria-label={walkthroughActive ? '停止逐列演示' : '逐列演示'} title={walkthroughActive ? '停止演示' : '逐列觀察輸入組合'}>{walkthroughActive ? <><Square size={15} /><span>停止演示</span></> : <><Play size={15} /><span>逐列演示</span></>}</button>
        <button type="button" className="fit-canvas" onClick={() => fitView({ padding: compact ? 0.08 : 0.15, duration: 220, maxZoom: 1 })} aria-label="顯示全圖"><Focus size={16} /><span>顯示全圖</span></button>
        <button type="button" className="reset-canvas" onClick={reset} disabled={walkthroughActive}><Trash2 size={16} /><span>清空</span></button>
      </div>
    </div>
    {diagnostic && <div className="diagnostic-panel" role="status"><strong>{diagnostic.step ? `時序第 ${diagnostic.step} 步` : '第一組失敗輸入'}</strong><span>{spec.inputs.map(name => `${name}=${diagnostic.inputs[name]}`).join(' · ')}</span><span>預期 <b>{diagnostic.output}={diagnostic.expected}</b></span><span>實際 <b>{diagnostic.output}={diagnostic.actual}</b></span></div>}
    {walkthroughStatus && <div className={`walkthrough-banner ${walkthroughStatus.kind === 'step' ? walkthroughStatus.passed ? 'pass' : 'fail' : walkthroughStatus.kind === 'done' ? walkthroughStatus.failed ? 'fail' : 'pass' : 'stopped'}`} role="status" aria-live="polite">
      {walkthroughStatus.kind === 'step' && <><strong>逐列演示 · {walkthroughStatus.index + 1} / {walkthroughStatus.total}</strong><span>{spec.inputs.map(name => `${name}=${walkthroughStatus.inputs[name]}`).join(' · ')}</span><span>預期 {spec.outputs.map(name => `${name}=${walkthroughStatus.expected[name] === 'X' ? '不限（無關項）' : walkthroughStatus.expected[name]}`).join(' · ')}</span><span>實際 {spec.outputs.map(name => `${name}=${walkthroughStatus.actual[name]}`).join(' · ')}</span><b>{walkthroughStatus.passed ? '符合' : '不符合'}</b></>}
      {walkthroughStatus.kind === 'done' && <><strong>{walkthroughStatus.failed ? '演示已完成，停在第一組失敗輸入' : '逐列演示完成'}</strong><span>{walkthroughStatus.passedCount} / {walkthroughStatus.total} 組符合</span></>}
      {walkthroughStatus.kind === 'stopped' && <><strong>逐列演示已停止</strong><span>已還原演示前的輸入狀態。</span></>}
    </div>}
    <div className="flow-surface circuit-canvas" ref={canvasRef} onDrop={drop} onDragOver={event => { event.preventDefault(); event.dataTransfer.dropEffect = 'move' }}><ReactFlow nodes={displayedNodes} edges={displayedEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect} nodesDraggable={!walkthroughActive} nodesConnectable={!walkthroughActive} onNodeDragStart={() => { dragStartRef.current = snapshot(); draggingRef.current = true }} onNodeDragStop={keepNodeVisible} onEdgeClick={() => setNotice('已選取導線。點選線路旁的刪除按鈕，即可只移除這條線。')} onConnectStart={() => { setConnecting(true); setNotice('已選取來源接點。點選目的接點，或拖曳到目的接點完成連線。') }} onConnectEnd={() => setConnecting(false)} connectOnClick connectionRadius={34} fitView fitViewOptions={{ padding: compact ? 0.04 : 0.2 }} nodeExtent={nodeExtent} translateExtent={translateExtent} autoPanOnNodeDrag={false} minZoom={0.35} maxZoom={1.6} deleteKeyCode={null} proOptions={{ hideAttribution: true }}><Background color="#263c59" gap={22} size={1} /><Controls showInteractive={false} /></ReactFlow></div>
    <div className={`workbench-status ${connecting ? 'connecting' : ''}`} role="status"><CircleHelp size={16} /><span>{notice}</span><span className="status-tip"><Check size={15} /> 先點來源，再點目的接點</span></div>
    {live.error && <p className="canvas-error">{live.error}</p>}
    {truthOpen && <div className="truth-panel"><div><strong>目前電路的真值表</strong><button onClick={() => setTruthOpen(false)} aria-label="關閉真值表"><RotateCcw size={15} /></button></div><table><thead><tr>{spec.inputs.map(name => <th key={name}>{name}</th>)}{spec.outputs.map(name => <th key={name}>{name}</th>)}</tr></thead><tbody>{truth.map((row, index) => <tr key={index}>{spec.inputs.map(name => <td key={name}>{row.inputs[name]}</td>)}{spec.outputs.map(name => <td key={name}>{row.outputs[name]}</td>)}</tr>)}</tbody></table></div>}
  </div>
})

const Workbench = forwardRef<WorkbenchHandle, Props>(function Workbench(props, ref) {
  return <ReactFlowProvider><Inner key={props.spec.goal + (props.freeMode ? '-free' : '')} ref={ref} {...props} /></ReactFlowProvider>
})

export default Workbench
