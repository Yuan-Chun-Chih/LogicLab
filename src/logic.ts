import type { Edge, Node } from '@xyflow/react'

export type Bit = 0 | 1
export type Signal = Bit | 'X'
export type GateType = 'AND' | 'OR' | 'XOR' | 'NAND' | 'NOT'
export type ComponentType = GateType | 'DFF'
export type CircuitGoal = 'and' | 'or' | 'xor' | 'nand-not' | 'xor-sop' | 'demorgan-nand' | 'half-adder' | 'mux' | 'parity3' | 'register' | 'register-reset' | 'toggle' | 'xor-nand' | 'full-adder' | 'majority'
export interface CircuitStep { inputs: Record<string, Bit>; expected: Record<string, Bit> }
export interface CircuitSpec { goal: CircuitGoal; inputs: string[]; outputs: string[]; allowed: ComponentType[]; steps?: CircuitStep[] }
export type CircuitNode = Node<{ label: string; gate?: GateType; value?: Signal; inputSignals?: Record<string, Signal>; onDelete?: () => void; onToggle?: () => void }>
export type CircuitResult = { values: Record<string, Signal>; ports: Record<string, Signal>; error?: string }
export type CircuitDiagnostic = { inputs: Record<string, Bit>; output: string; expected: Bit; actual: Signal; step?: number; state?: Record<string, Bit>; clocks?: Record<string, Signal> }
export type CheckResult = { ok: boolean; message: string; diagnostic?: CircuitDiagnostic }

export function gateValue(type: GateType, a: Signal, b: Signal = 'X'): Signal {
  if (type === 'NOT') return a === 'X' ? 'X' : a === 0 ? 1 : 0
  if (type === 'AND' || type === 'NAND') {
    const and: Signal = a === 0 || b === 0 ? 0 : a === 'X' || b === 'X' ? 'X' : 1
    return type === 'NAND' ? (and === 'X' ? 'X' : and === 0 ? 1 : 0) : and
  }
  if (type === 'OR') return a === 1 || b === 1 ? 1 : a === 'X' || b === 'X' ? 'X' : 0
  if (a === 'X' || b === 'X') return 'X'
  return a === b ? 0 : 1
}

export const halfAdder = (a: Bit, b: Bit) => ({ S: (a ^ b) as Bit, C: (a & b) as Bit })
export const fullAdder = (a: Bit, b: Bit, ci: Bit) => ({ S: (a ^ b ^ ci) as Bit, C: ((a & b) | (a & ci) | (b & ci)) as Bit })

export function evaluateCircuit(nodes: CircuitNode[], edges: Edge[], inputs: Record<string, Bit>, state: Record<string, Bit> = {}): CircuitResult {
  const values: Record<string, Signal> = {}
  const ports: Record<string, Signal> = {}
  const byId = new Map(nodes.map(node => [node.id, node]))
  const active = new Set<string>()
  let error: string | undefined

  const readPort = (nodeId: string, port: string): Signal => {
    const attached = edges.filter(edge => edge.target === nodeId && edge.targetHandle === port)
    if (attached.length > 1) { error = '一個輸入接點只能接一條線。'; return 'X' }
    return attached.length ? visit(attached[0].source) : 'X'
  }
  const visit = (id: string): Signal => {
    if (id in values) return values[id]
    if (active.has(id)) { error = '偵測到組合電路迴路，請檢查導線。'; return 'X' }
    const node = byId.get(id)
    if (!node) return 'X'
    active.add(id)
    let value: Signal = 'X'
    if (node.type === 'input') value = inputs[node.data.label] ?? 'X'
    if (node.type === 'dff') value = state[id] ?? 0
    if (node.type === 'output') value = readPort(id, 'in')
    if (node.type === 'gate' && node.data.gate) {
      const a = readPort(id, 'a')
      const b = node.data.gate === 'NOT' ? 'X' : readPort(id, 'b')
      ports[`${id}:a`] = a
      if (node.data.gate !== 'NOT') ports[`${id}:b`] = b
      value = gateValue(node.data.gate, a, b)
    }
    active.delete(id)
    values[id] = value
    return value
  }
  nodes.forEach(node => visit(node.id))
  nodes.filter(node => node.type === 'dff').forEach(node => {
    for (const port of ['d', 'clk', 'rst']) ports[`${node.id}:${port}`] = readPort(node.id, port)
  })
  return { values, ports, error }
}

export function advanceCircuit(nodes: CircuitNode[], edges: Edge[], inputs: Record<string, Bit>, state: Record<string, Bit>, previousClocks: Record<string, Signal>): { state: Record<string, Bit>; clocks: Record<string, Signal>; result: CircuitResult } {
  const before = evaluateCircuit(nodes, edges, inputs, state)
  const nextState = { ...state }
  const clocks = { ...previousClocks }
  for (const node of nodes.filter(item => item.type === 'dff')) {
    const clk = before.ports[`${node.id}:clk`]
    const rst = before.ports[`${node.id}:rst`]
    const d = before.ports[`${node.id}:d`]
    if (rst === 1) nextState[node.id] = 0
    else if ((previousClocks[node.id] ?? 0) === 0 && clk === 1 && d !== 'X') nextState[node.id] = d
    clocks[node.id] = clk
  }
  return { state: nextState, clocks, result: evaluateCircuit(nodes, edges, inputs, nextState) }
}

export function expectedCircuitOutput(goal: CircuitGoal, inputs: Record<string, Bit>): Record<string, Bit> {
  const { A = 0, B = 0, C = 0, CI = 0, SEL = 0 } = inputs
  switch (goal) {
    case 'and': return { Y: (A & B) as Bit }
    case 'or': return { Y: (A | B) as Bit }
    case 'xor': return { Y: (A ^ B) as Bit }
    case 'nand-not': return { Y: (1 - A) as Bit }
    case 'demorgan-nand': return { Y: (1 - (A & B)) as Bit }
    case 'xor-sop':
    case 'xor-nand': return { Y: (A ^ B) as Bit }
    case 'half-adder': return halfAdder(A, B)
    case 'mux': return { Y: SEL ? B : A }
    case 'parity3': return { Y: (A ^ B ^ C) as Bit }
    case 'full-adder': return fullAdder(A, B, CI)
    case 'majority': return { Y: ((A & B) | (A & C) | (B & C)) as Bit }
    default: return {}
  }
}

export function getInputVectors(names: string[]): Record<string, Bit>[] {
  return Array.from({ length: 2 ** names.length }, (_, value) => Object.fromEntries(names.map((name, index) => [name, ((value >> (names.length - index - 1)) & 1) as Bit])))
}

export function getTruthTable(nodes: CircuitNode[], edges: Edge[], inputs: string[], outputs: string[]): Array<{ inputs: Record<string, Bit>; outputs: Record<string, Signal> }> {
  return getInputVectors(inputs).map(vector => {
    const result = evaluateCircuit(nodes, edges, vector)
    return { inputs: vector, outputs: Object.fromEntries(outputs.map(output => [output, result.values[output] ?? 'X'])) }
  })
}

export function checkCircuit(nodes: CircuitNode[], edges: Edge[], spec: CircuitSpec): CheckResult {
  const components = nodes.filter(node => node.type === 'gate' || node.type === 'dff')
  if (!components.length) return { ok: false, message: '先把元件加入工作台，並完成輸入與輸出的連線。' }
  const invalid = components.find(node => !spec.allowed.includes(node.type === 'dff' ? 'DFF' : node.data.gate!))
  if (invalid) return { ok: false, message: `本關不能使用 ${invalid.type === 'dff' ? 'D 正反器' : invalid.data.gate}。請查看可用元件。` }
  if (spec.steps) {
    const dffs = nodes.filter(node => node.type === 'dff')
    if (!dffs.length) return { ok: false, message: '這一關需要 D 正反器。' }
    let state: Record<string, Bit> = {}
    let clocks: Record<string, Signal> = Object.fromEntries(dffs.map(node => [node.id, 0]))
    for (let index = 0; index < spec.steps.length; index++) {
      const step = spec.steps[index]
      const updated = advanceCircuit(nodes, edges, step.inputs, state, clocks)
      if (updated.result.error) return { ok: false, message: updated.result.error }
      state = updated.state
      clocks = updated.clocks
      for (const output of spec.outputs) {
        const actual = updated.result.values[output] ?? 'X'
        if (actual !== step.expected[output]) return { ok: false, message: `時序第 ${index + 1} 步：${output} 應為 ${step.expected[output]}，目前為 ${actual}。請檢查 ${spec.inputs.includes('RST') ? 'D、CLK 與 RST' : 'D 與 CLK'} 的接線。`, diagnostic: { inputs: step.inputs, output, expected: step.expected[output], actual, step: index + 1, state: updated.state, clocks: updated.clocks } }
      }
    }
    return { ok: true, message: `時序測試全數通過！共驗證 ${spec.steps.length} 個時間點。` }
  }
  const vectors = getInputVectors(spec.inputs)
  for (const vector of vectors) {
    const result = evaluateCircuit(nodes, edges, vector)
    if (result.error) return { ok: false, message: result.error }
    const expected = expectedCircuitOutput(spec.goal, vector)
    for (const output of spec.outputs) {
      const actual = result.values[output] ?? 'X'
      if (actual !== expected[output]) return { ok: false, message: `輸入 ${spec.inputs.map(name => `${name}=${vector[name]}`).join('、')} 時，${output} 應為 ${expected[output]}，目前為 ${actual}。`, diagnostic: { inputs: vector, output, expected: expected[output], actual } }
    }
  }
  return { ok: true, message: `全部 ${vectors.length} 組輸入通過！電路功能正確。` }
}
