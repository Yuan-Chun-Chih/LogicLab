import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, CircleHelp, CircuitBoard, Home, Lightbulb, Menu, Trophy, Volume2, VolumeX } from 'lucide-react'
import GateSymbol from './GateSymbol'
import HomePage from './HomePage'
import RouteDrawer from './RouteDrawer'
import Workbench, { type WorkbenchHandle } from './Workbench'
import { challenges, getChallenges, modules, wiringGuides, type Challenge, type ModuleId } from './content'
import type { CircuitSpec } from './logic'
import { soundManager } from './sound'

type Answers = Record<string, number | number[]>
type Progress = Record<string, { attempts: number; completed: boolean; updatedAt: string }>
type Feedback = { ok: boolean; message: string } | null

const STORAGE_KEY = 'logiclab-progress-v1'
const SOUND_STORAGE_KEY = 'logiclab-sound-enabled-v1'
const freeSpec: CircuitSpec = { goal: 'and', inputs: ['A', 'B'], outputs: ['Y'], allowed: ['AND', 'OR', 'XOR', 'NAND', 'NOT'] }

function loadSoundPreference() {
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  } catch { return true }
}

function loadProgress(): Progress {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return raw && typeof raw === 'object' ? raw as Progress : {}
  } catch { return {} }
}

function TaskBoard({ challenge, answer, setAnswer }: { challenge: Challenge; answer: number | number[] | undefined; setAnswer: (value: number | number[]) => void }) {
  const bits = Array.isArray(answer) ? answer : Array(challenge.expected?.length ?? 0).fill(0)
  const toggleBit = (index: number) => setAnswer(bits.map((value, i) => i === index ? 1 - value : value))
  const options = challenge.options

  return <div className="task-board">
    {challenge.id === 'g1' && <div className="gate-question"><div className="given-bits"><span>A <b>1</b></span><span>B <b>0</b></span></div><GateSymbol type="XOR" /><div className="unknown-output">Y <strong>?</strong></div></div>}
    {challenge.id === 'g2' && <div className="table-showcase"><strong>這個邏輯閘是誰？</strong><table><thead><tr><th>A</th><th>B</th><th>Y</th></tr></thead><tbody>{[[0,0,1],[0,1,1],[1,0,1],[1,1,0]].map((row, index) => <tr key={index}>{row.map((value, i) => <td key={i}>{value}</td>)}</tr>)}</tbody></table></div>}
    {(challenge.id === 'b1' || challenge.id === 'b2') && <div className="kmap-showcase"><div className="kmap-heading"><span>F = A ⊕ B</span><small>列與欄分別代表 A、B</small></div><div className="kmap-large"><span>A＼B</span><span>0</span><span>1</span><span>0</span>{[0, 1].map(index => challenge.kind === 'kmap' ? <button key={index} className={bits[index] ? 'active' : ''} onClick={() => toggleBit(index)} aria-label={`A=0、B=${index}，目前 ${bits[index]}`}>{bits[index]}</button> : <strong key={index}>{index}</strong>)}<span>1</span>{[2, 3].map(index => challenge.kind === 'kmap' ? <button key={index} className={bits[index] ? 'active' : ''} onClick={() => toggleBit(index)} aria-label={`A=1、B=${index-2}，目前 ${bits[index]}`}>{bits[index]}</button> : <strong key={index}>{index === 2 ? 1 : 0}</strong>)}</div>{challenge.kind === 'kmap' && <p>點選方格，在 0 和 1 之間切換。</p>}</div>}
    {challenge.id === 'c2' && <div className="formula-showcase"><div className="formula-path"><span>SEL = 0</span><strong>A · B</strong></div><div className="formula-divider">或</div><div className="formula-path"><span>SEL = 1</span><strong>A ⊕ B ⊕ CI</strong></div><div className="formula-output">輸出 O = ?</div></div>}
    {challenge.id === 'c1' && <div className="answer-table"><div className="answer-table-label">半加器真值表 <small>點選藍色方格填寫 S 和 C</small></div><table><thead><tr><th>A</th><th>B</th><th>S</th><th>C</th></tr></thead><tbody>{[[0,0],[0,1],[1,0],[1,1]].map(([a,b], row) => <tr key={row}><td>{a}</td><td>{b}</td>{[0,1].map(column => <td key={column}><button className={bits[row*2+column] ? 'active' : ''} onClick={() => toggleBit(row*2+column)} aria-label={`A=${a} B=${b}，${column ? '進位' : '和'}目前 ${bits[row*2+column]}`}>{bits[row*2+column]}</button></td>)}</tr>)}</tbody></table></div>}
    {(challenge.id === 's1' || challenge.id === 's2') && <div className="sequence-showcase"><div className="sequence-heading"><span>{challenge.id === 's1' ? 'D 正反器時序' : '奇偶狀態機'}</span><small>從左到右逐步推演</small></div><div className="sequence-row"><span>步驟</span>{[1,2,3,4].map(number => <b key={number}>{number}</b>)}</div><div className="sequence-row"><span>{challenge.id === 's1' ? 'D' : '輸入'}</span>{[1,0,1,1].map((bit,index) => <b key={index}>{bit}</b>)}</div><div className="sequence-row output"><span>{challenge.id === 's1' ? 'Q' : '狀態'}</span>{bits.map((bit,index) => <button key={index} className={bit ? 'active' : ''} onClick={() => toggleBit(index)} aria-label={`第 ${index+1} 步目前 ${bit}`}>{bit}</button>)}</div><p>點選最後一列的數值作答。</p></div>}
    {options && <div className="answer-options" role="group" aria-label="選擇答案">{options.map((option, index) => <button key={option} className={answer === index ? 'chosen' : ''} onClick={() => setAnswer(index)}><span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong><i>{answer === index && <Check size={16} />}</i></button>)}</div>}
  </div>
}

function App() {
  const [screen, setScreen] = useState<'home' | 'play'>('home')
  const [selectedId, setSelectedId] = useState('g1')
  const [freeMode, setFreeMode] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [answers, setAnswers] = useState<Answers>({})
  const [progress, setProgress] = useState<Progress>(loadProgress)
  const [soundEnabled, setSoundEnabled] = useState(loadSoundPreference)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [needsRetest, setNeedsRetest] = useState(false)
  const [hintOpen, setHintOpen] = useState(false)
  const [explanationOpen, setExplanationOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const workbenchRef = useRef<WorkbenchHandle>(null)
  const challenge = challenges.find(item => item.id === selectedId) ?? challenges[0]
  const module = modules.find(item => item.id === challenge.module)!
  const moduleTasks = getChallenges(challenge.module)
  const currentIndex = challenges.findIndex(item => item.id === selectedId)
  const completedCount = challenges.filter(item => progress[item.id]?.completed).length
  const shownSpec = freeMode ? freeSpec : challenge.circuit

  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)) } catch { /* progress remains usable this session */ } }, [progress])
  useEffect(() => { soundManager.setEnabled(soundEnabled) }, [soundEnabled])
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setDrawerOpen(false) }
    window.addEventListener('keydown', escape)
    return () => window.removeEventListener('keydown', escape)
  }, [])

  function openChallenge(id: string) {
    setSelectedId(id); setFreeMode(false); setScreen('play'); setDrawerOpen(false)
    setFeedback(null); setNeedsRetest(false); setHintOpen(false); setExplanationOpen(false)
  }

  function openModule(id: ModuleId) {
    const tasks = getChallenges(id)
    openChallenge(tasks.find(item => !progress[item.id]?.completed)?.id ?? tasks[0].id)
  }

  function openFreeMode() {
    setSelectedId('sb1'); setFreeMode(true); setScreen('play'); setDrawerOpen(false)
    setFeedback(null); setNeedsRetest(false); setHintOpen(false); setExplanationOpen(false)
  }

  function setAnswer(value: number | number[]) {
    setAnswers(current => ({ ...current, [challenge.id]: value }))
    if (feedback?.ok) setNeedsRetest(true)
    setFeedback(null)
  }

  function toggleSound() {
    const next = !soundEnabled
    setSoundEnabled(next)
    soundManager.setEnabled(next)
    try { localStorage.setItem(SOUND_STORAGE_KEY, String(next)) } catch { /* sound can still be controlled this session */ }
  }

  function markCircuitEdited() {
    if (feedback?.ok && !freeMode) setNeedsRetest(true)
    setFeedback(null)
  }

  function check() {
    setNeedsRetest(false)
    if (freeMode) {
      const result = workbenchRef.current?.test() ?? { ok: false, message: '工作台尚未準備好。' }
      setFeedback(result)
      if (result.ok) soundManager.playSuccess()
      else soundManager.playError()
      return
    }
    let result: Feedback
    const answer = answers[challenge.id]
    if (challenge.kind === 'circuit') result = workbenchRef.current?.test() ?? { ok: false, message: '工作台尚未準備好。' }
    else if (challenge.kind === 'choice') result = typeof answer !== 'number' ? { ok: false, message: '先選擇一個答案，再進行檢查。' } : answer === challenge.answer ? { ok: true, message: '答對了！你已掌握這個概念。' } : { ok: false, message: '目前答案與題目條件不符。可以查看提示後再試一次。' }
    else {
      const values = Array.isArray(answer) ? answer : Array(challenge.expected?.length ?? 0).fill(0)
      const mismatch = challenge.expected?.findIndex((expected, index) => expected !== values[index]) ?? -1
      const detail = challenge.id === 'c1' ? `第 ${Math.floor(mismatch / 2) + 1} 列的${mismatch % 2 ? '進位 C' : '和 S'}` : challenge.id === 'b2' ? `A=${Math.floor(mismatch / 2)}、B=${mismatch % 2} 的格子` : `第 ${mismatch + 1} 步的狀態`
      result = mismatch === -1 ? { ok: true, message: '全部正確！每一格都符合目標邏輯。' } : { ok: false, message: `${detail}需要再檢查。` }
    }
    if (result?.ok) soundManager.playSuccess()
    else soundManager.playError()
    setFeedback(result)
    if (result.ok) setExplanationOpen(true)
    setProgress(current => ({ ...current, [challenge.id]: { attempts: (current[challenge.id]?.attempts ?? 0) + 1, completed: Boolean(current[challenge.id]?.completed || result.ok), updatedAt: new Date().toISOString() } }))
  }

  const next = challenges[currentIndex + 1]
  const previous = challenges[currentIndex - 1]
  const passed = !freeMode && feedback?.ok === true
  const moduleFinished = moduleTasks.at(-1)?.id === challenge.id
  const badgeEarned = passed && moduleTasks.every(task => progress[task.id]?.completed)
  const actionLabel = freeMode ? '產生真值表' : passed ? !next ? '查看學習成果' : moduleFinished ? '下一個模組' : '下一關' : needsRetest ? '重新測試' : challenge.kind === 'circuit' ? '測試電路' : '檢查答案'

  function primaryAction() {
    if (passed) {
      if (next) openChallenge(next.id)
      else setScreen('home')
      return
    }
    check()
  }

  return <div className={`app ${screen === 'play' ? 'in-play' : ''}`}>
    <header className="app-header"><div className="header-start"><button className="nav-trigger" onClick={() => setDrawerOpen(true)} aria-label="開啟學習路線"><Menu size={21} /></button><button className="logo-button" onClick={() => { setScreen('home'); setDrawerOpen(false) }}><span className="logo-mark"><CircuitBoard size={23} /></span><span className="logo-text"><strong>邏輯工坊</strong></span></button></div><div className="header-end"><div className="header-progress"><span>學習進度</span><strong>{completedCount} <small>/ {challenges.length}</small></strong><i><b style={{ width: `${completedCount / challenges.length * 100}%` }} /></i></div><button type="button" className="sound-toggle" onClick={toggleSound} aria-pressed={soundEnabled} aria-label={soundEnabled ? '關閉音效' : '開啟音效'} title={soundEnabled ? '關閉音效' : '開啟音效'}>{soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>{screen === 'play' && <button className="home-link" onClick={() => setScreen('home')}><Home size={17} /> 首頁</button>}</div></header>

    {drawerOpen && <RouteDrawer progress={progress} selectedId={selectedId} inPlay={screen === 'play'} freeMode={freeMode} onClose={() => setDrawerOpen(false)} onHome={() => { setScreen('home'); setDrawerOpen(false) }} onChallenge={openChallenge} onFreeMode={openFreeMode} />}

    {screen === 'home' ? <HomePage progress={progress} onOpenChallenge={openChallenge} onOpenModule={openModule} onOpenFreeMode={openFreeMode} /> : <main className="play-page">
      <div className="play-heading">
        <h1>{freeMode ? '自由探索' : challenge.title}</h1>
        {!freeMode && <div className="level-indicators" aria-label="本模組關卡">
          {moduleTasks.map((item, index) => <button key={item.id} type="button" className={`${item.id === selectedId ? 'current' : ''} ${progress[item.id]?.completed ? 'complete' : ''}`} onClick={() => openChallenge(item.id)} aria-label={`前往第 ${index + 1} 關：${item.title}`} aria-current={item.id === selectedId ? 'step' : undefined}>
            {item.id === selectedId && <motion.span className="level-active-pill" layoutId="active-level" transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }} />}
            <span className="level-indicator-label">{progress[item.id]?.completed ? <Check size={14} /> : index + 1}</span>
          </button>)}
        </div>}
      </div>
      <div className="play-layout"><section className="play-workspace" aria-label="互動工作台">{shownSpec ? <Workbench key={freeMode ? 'free' : challenge.id} ref={workbenchRef} spec={shownSpec} freeMode={freeMode} onEdit={markCircuitEdited} /> : <TaskBoard challenge={challenge} answer={answers[challenge.id]} setAnswer={setAnswer} />}</section><aside className="mission-panel"><div className="mission-panel-top"><h2>{freeMode ? '設計自己的電路' : '本關目標'}</h2><p>{freeMode ? '使用左側元件列自由接線。切換 A、B 觀察輸出，按下按鈕可列出四組輸入的結果。' : challenge.prompt}</p>{shownSpec && <div className="mission-tags"><span>輸入 {shownSpec.inputs.join(' · ')}</span><span>輸出 {shownSpec.outputs.join(' · ')}</span></div>}</div><div className="mission-panel-help">{shownSpec && <div className="connection-tip"><CircleHelp size={17} /><span>從來源接點拖到目的接點，或依序點選兩端；點 INPUT 開關切換 0／1。</span></div>}{!freeMode && <div className="help-links"><button onClick={() => setHintOpen(!hintOpen)}><Lightbulb size={16} /> {hintOpen ? '收起提示' : '查看提示'}</button><button onClick={() => setExplanationOpen(!explanationOpen)}><BookOpen size={16} /> {explanationOpen ? '收起詳解' : '查看詳解'}</button></div>}<AnimatePresence initial={false}>{hintOpen && !freeMode && <motion.div className="help-card hint" initial={reduceMotion ? false : { opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : .22 }} style={{ overflow: 'hidden' }}><strong>提示</strong><p>{challenge.hint}</p></motion.div>}</AnimatePresence><AnimatePresence initial={false}>{explanationOpen && !freeMode && <motion.div className="help-card explanation" initial={reduceMotion ? false : { opacity: 0, height: 0, y: -6 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={reduceMotion ? { opacity: 0, height: 0 } : { opacity: 0, height: 0, y: -6 }} transition={{ duration: reduceMotion ? 0 : .22 }} style={{ overflow: 'hidden' }}><strong>完整詳解</strong><p>{challenge.explanation}</p>{wiringGuides[challenge.id] && <ol className="wiring-steps">{wiringGuides[challenge.id].map((step, index) => <li key={index}>{step}</li>)}</ol>}</motion.div>}</AnimatePresence></div><div className="mission-panel-actions"><button className={`primary-test ${passed ? 'is-next' : ''}`} onClick={primaryAction}>{passed ? <Check size={20} /> : <CheckCircle2 size={20} />} {actionLabel} <ArrowRight size={19} /></button>{passed && <button className="secondary-retest" onClick={check}>再次測試</button>}{badgeEarned && <div className="badge-earned"><Trophy size={16} /> {module.badge}</div>}{feedback && <div className={`test-feedback ${feedback.ok ? 'pass' : 'fail'}`} role="status"><span>{feedback.ok ? <Check size={17} /> : <CircleHelp size={17} />}</span>{feedback.message}</div>}<div className="level-nav"><button disabled={!previous || freeMode} onClick={() => previous && openChallenge(previous.id)}><ArrowLeft size={16} /> 上一關</button><button disabled={!next || freeMode} onClick={() => next && openChallenge(next.id)}>下一關 <ArrowRight size={16} /></button></div></div></aside></div><div className="mobile-action-bar">{feedback && <div className={`mobile-action-feedback ${feedback.ok ? 'pass' : 'fail'}`} role="status">{feedback.message}</div>}<button className={passed ? 'is-next' : ''} onClick={primaryAction}>{passed ? <Check size={18} /> : <CheckCircle2 size={18} />} {actionLabel} <ArrowRight size={17} /></button></div>
    </main>}
  </div>
}

export default App
