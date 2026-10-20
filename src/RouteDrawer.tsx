import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, BookOpen, Check, ChevronDown, CircuitBoard, Home, Map, Sparkles, X } from 'lucide-react'
import { challenges, getChallenges, modules, type ModuleId } from './content'
import { FormulaReference, GateReference } from './LogicReference'

export type DrawerView = 'route' | 'gates' | 'formulas'
const views = [
  { id: 'route', label: '選擇關卡', icon: Map },
  { id: 'gates', label: '邏輯閘', icon: CircuitBoard },
  { id: 'formulas', label: '常見公式', icon: BookOpen },
] as const

type RouteDrawerProps = {
  progress: Record<string, { completed: boolean }>
  selectedId: string
  inPlay: boolean
  freeMode: boolean
  view: DrawerView
  onViewChange: (view: DrawerView) => void
  onClose: () => void
  onHome: () => void
  onChallenge: (id: string) => void
  onFreeMode: () => void
}

export default function RouteDrawer({ progress, selectedId, inPlay, freeMode, view, onViewChange, onClose, onHome, onChallenge, onFreeMode }: RouteDrawerProps) {
  const currentModule = challenges.find(item => item.id === selectedId)?.module
  const nextModule = challenges.find(item => !progress[item.id]?.completed)?.module
  const [expandedId, setExpandedId] = useState<ModuleId | null>(inPlay && !freeMode ? currentModule ?? 'gates' : nextModule ?? 'gates')
  const closeRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const completedCount = challenges.filter(item => progress[item.id]?.completed).length
  const completionPercent = Math.round(completedCount / challenges.length * 100)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => { if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }) }, [view])

  function trapFocus(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== 'Tab') return
    const focusable = Array.from(drawerRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input, summary, [tabindex="0"]') ?? []).filter(element => element.getClientRects().length > 0)
    const first = focusable[0]
    const last = focusable.at(-1)
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
  }

  function moveTab(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const next = event.key === 'ArrowRight' ? (index + 1) % views.length : event.key === 'ArrowLeft' ? (index + views.length - 1) % views.length : event.key === 'Home' ? 0 : event.key === 'End' ? views.length - 1 : -1
    if (next < 0) return
    event.preventDefault()
    onViewChange(views[next].id)
    document.getElementById(`drawer-tab-${views[next].id}`)?.focus()
  }

  return <>
    <button className="drawer-scrim" aria-label="關閉側邊欄" tabIndex={-1} onClick={onClose} />
    <nav ref={drawerRef} className="route-drawer quest-drawer" role="dialog" aria-modal="true" aria-label="學習工具側邊欄" onKeyDown={trapFocus}>
      <div className="drawer-head">
        <div><span>LOGIC TOOLKIT</span><strong>學習工具</strong></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="關閉選單"><X size={19} /></button>
      </div>

      <div className="drawer-view-tabs" role="tablist" aria-label="側邊欄內容">{views.map(({ id, label, icon: Icon }, index) => <button type="button" role="tab" key={id} id={`drawer-tab-${id}`} aria-selected={view === id} aria-controls="drawer-content" tabIndex={view === id ? 0 : -1} onClick={() => onViewChange(id)} onKeyDown={event => moveTab(event, index)}><Icon size={15} />{label}</button>)}</div>

      {view === 'route' && <><div className="drawer-overview">
        <div><span>探索進度</span><strong>{completedCount} <small>/ {challenges.length} 關</small></strong></div>
        <i><b style={{ width: `${completionPercent}%` }} /></i>
      </div>
      <button className="drawer-home" onClick={onHome}><Home size={17} /> 返回首頁 <ArrowRight size={15} /></button></>}

      <div ref={scrollRef} id="drawer-content" className="drawer-scroll" role="tabpanel" aria-labelledby={`drawer-tab-${view}`} tabIndex={0}>
        {view === 'gates' ? <GateReference /> : view === 'formulas' ? <FormulaReference /> : <>
        <div className="drawer-route-label"><span>學習路線</span><small>{modules.length} 個模組</small></div>
        {modules.map(item => {
          const tasks = getChallenges(item.id)
          const done = tasks.filter(task => progress[task.id]?.completed).length
          return <details className={`drawer-module ${expandedId === item.id ? 'is-open' : ''}`} key={item.id} open={expandedId === item.id}>
            <summary className="drawer-module-summary" onClick={event => { event.preventDefault(); setExpandedId(current => current === item.id ? null : item.id) }}>
              <span className="drawer-stage-index">{item.number}</span>
              <span className="drawer-module-info"><strong>{item.title}</strong><small>{item.short}</small></span>
              <span className="drawer-module-count">{done}/{tasks.length}</span>
              <ChevronDown className="drawer-module-chevron" size={17} />
            </summary>
            <div className="drawer-levels">
              {tasks.map((task, index) => {
                const complete = Boolean(progress[task.id]?.completed)
                const active = inPlay && !freeMode && task.id === selectedId
                return <button key={task.id} className={`drawer-level ${active ? 'active' : ''}`} onClick={() => onChallenge(task.id)} aria-current={active ? 'step' : undefined}>
                  <span className={`drawer-level-index ${complete ? 'done' : ''}`}>{complete ? <Check size={13} /> : index + 1}</span>
                  <span className="drawer-level-title">{task.title}</span>
                  {task.difficulty && <small className={`difficulty-tag ${task.difficulty === '高階' ? 'hard' : ''}`}>{task.difficulty}</small>}
                  {active ? <small className="drawer-level-current">目前</small> : <ArrowRight className="drawer-level-arrow" size={14} />}
                </button>
              })}
            </div>
          </details>
        })}</>}
      </div>

      <div className="drawer-footer">{view === 'route' ? <button className={`drawer-free ${inPlay && freeMode ? 'active' : ''}`} onClick={onFreeMode}><Sparkles size={17} /><span>自由接線沙盒<small>設計自己的電路</small></span><ArrowRight size={17} /></button> : <button className="drawer-free drawer-return" onClick={onClose}><ArrowRight size={17} /><span>{inPlay ? '返回目前作答' : '返回首頁'}<small>隨時開啟側邊欄，再次查閱</small></span></button>}</div>
    </nav>
  </>
}
