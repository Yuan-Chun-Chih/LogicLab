import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Home, Sparkles, X } from 'lucide-react'
import { challenges, getChallenges, modules, type ModuleId } from './content'

type RouteDrawerProps = {
  progress: Record<string, { completed: boolean }>
  selectedId: string
  inPlay: boolean
  freeMode: boolean
  onClose: () => void
  onHome: () => void
  onChallenge: (id: string) => void
  onFreeMode: () => void
}

export default function RouteDrawer({ progress, selectedId, inPlay, freeMode, onClose, onHome, onChallenge, onFreeMode }: RouteDrawerProps) {
  const currentModule = challenges.find(item => item.id === selectedId)?.module
  const nextModule = challenges.find(item => !progress[item.id]?.completed)?.module
  const [expandedId, setExpandedId] = useState<ModuleId | null>(inPlay && !freeMode ? currentModule ?? 'gates' : nextModule ?? 'gates')
  const closeRef = useRef<HTMLButtonElement>(null)
  const completedCount = challenges.filter(item => progress[item.id]?.completed).length
  const completionPercent = Math.round(completedCount / challenges.length * 100)

  useEffect(() => { closeRef.current?.focus() }, [])

  return <>
    <button className="drawer-scrim" aria-label="關閉選擇關卡" onClick={onClose} />
    <nav className="route-drawer quest-drawer" aria-label="選擇關卡">
      <div className="drawer-head">
        <div><span>MISSION SELECT</span><strong>選擇關卡</strong></div>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="關閉選單"><X size={19} /></button>
      </div>

      <div className="drawer-overview">
        <div><span>探索進度</span><strong>{completedCount} <small>/ {challenges.length} 關</small></strong></div>
        <i><b style={{ width: `${completionPercent}%` }} /></i>
      </div>
      <button className="drawer-home" onClick={onHome}><Home size={17} /> 返回首頁 <ArrowRight size={15} /></button>

      <div className="drawer-scroll">
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
                  {active ? <small className="drawer-level-current">目前</small> : <ArrowRight className="drawer-level-arrow" size={14} />}
                </button>
              })}
            </div>
          </details>
        })}
      </div>

      <div className="drawer-footer"><button className={`drawer-free ${inPlay && freeMode ? 'active' : ''}`} onClick={onFreeMode}><Sparkles size={17} /><span>自由接線沙盒<small>設計自己的電路</small></span><ArrowRight size={17} /></button></div>
    </nav>
  </>
}
