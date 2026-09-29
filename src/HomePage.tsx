import { useState } from 'react'
import { ArrowRight, ArrowUpRight, ChevronDown, Github } from 'lucide-react'
import GateSymbol from './GateSymbol'
import { challenges, getChallenges, modules, type ModuleId } from './content'
import { soundManager } from './sound'

type HomePageProps = {
  progress: Record<string, { completed: boolean }>
  onOpenChallenge: (id: string) => void
  onOpenModule: (id: ModuleId) => void
  onOpenFreeMode: () => void
}

export default function HomePage({ progress, onOpenChallenge, onOpenModule, onOpenFreeMode }: HomePageProps) {
  const completedCount = challenges.filter(item => progress[item.id]?.completed).length
  const nextChallenge = challenges.find(item => !progress[item.id]?.completed) ?? challenges[0]
  const [demoA, setDemoA] = useState<0 | 1>(1)
  const [demoB, setDemoB] = useState<0 | 1>(1)
  const demoOutput = demoA && demoB ? 1 : 0
  const toggleDemo = (input: 'A' | 'B') => {
    if (input === 'A') setDemoA(value => value ? 0 : 1)
    else setDemoB(value => value ? 0 : 1)
    soundManager.playSwitch()
  }

  return <main className="home-page">
    <section className="home-stage home-intro" aria-labelledby="home-title">
      <div className="home-intro-main">
        <div className="home-hero-copy">
          <span className="home-chapter"><i /> 01 / 數位邏輯冒險</span>
          <h1 id="home-title">把 0 和 1，<br /><em>接成看得見的邏輯。</em></h1>
          <p>親手放上邏輯閘、接通導線，讓每一次推理都亮起來。</p>
          <div className="hero-actions">
            <button className="hero-start" onClick={() => onOpenChallenge(nextChallenge.id)}>{completedCount ? '繼續闖關' : '開始闖關'} <ArrowRight size={19} /></button>
            <button className="hero-sandbox" onClick={onOpenFreeMode}>自由接線</button>
          </div>
          <div className="hero-progress" aria-label={`已完成 ${completedCount} / ${challenges.length} 關`}>
            <div><span>你的探索進度</span><strong>{completedCount} <small>/ {challenges.length} 關</small></strong></div>
            <i><b style={{ width: `${completedCount / challenges.length * 100}%` }} /></i>
          </div>
        </div>

        <div className="home-hero-art" role="group" aria-label="試玩 AND 邏輯閘">
          <div className="hero-art-label"><span><i /> LIVE CIRCUIT</span><strong>AND / {demoOutput}</strong></div>
          <div className="hero-circuit">
            <svg className="hero-circuit-wires" viewBox="0 0 520 320" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
              <path className={`hero-wire-base ${demoA ? 'high' : 'low'}`} d="M 118 105 H 174 Q 194 105 221 141" />
              <path className={`hero-wire-base ${demoB ? 'high' : 'low'}`} d="M 118 216 H 174 Q 194 216 221 190" />
              <path className={`hero-wire-base ${demoOutput ? 'high' : 'low'}`} d="M 375 166 H 420" />
              {demoA === 1 && <path className="hero-wire-pulse" d="M 118 105 H 174 Q 194 105 221 141" />}
              {demoB === 1 && <path className="hero-wire-pulse" d="M 118 216 H 174 Q 194 216 221 190" />}
              {demoOutput === 1 && <path className="hero-wire-pulse" d="M 375 166 H 420" />}
            </svg>
            <button type="button" className={`hero-circuit-input input-a ${demoA ? 'high' : 'low'}`} onClick={() => toggleDemo('A')} aria-label={`輸入 A 目前為 ${demoA}，點擊切換為 ${1 - demoA}`} aria-pressed={demoA === 1}><small>INPUT A</small><strong>{demoA}</strong></button>
            <button type="button" className={`hero-circuit-input input-b ${demoB ? 'high' : 'low'}`} onClick={() => toggleDemo('B')} aria-label={`輸入 B 目前為 ${demoB}，點擊切換為 ${1 - demoB}`} aria-pressed={demoB === 1}><small>INPUT B</small><strong>{demoB}</strong></button>
            <span className={`hero-circuit-gate ${demoOutput ? 'high' : 'low'}`}><GateSymbol type="AND" /><small>AND</small></span>
            <span className={`hero-circuit-output ${demoOutput ? 'high' : 'low'}`} aria-live="polite"><small>OUTPUT Y</small><strong>{demoOutput}</strong></span>
          </div>
          <div className="hero-art-foot"><span>點擊 A、B 切換訊號</span><span>{demoA} AND {demoB} = {demoOutput}</span></div>
        </div>
      </div>
      <a className="home-scroll-cue" href="#learning-route">探索學習路線 <ChevronDown size={17} /></a>
    </section>

    <section className="home-stage home-route" id="learning-route" aria-labelledby="route-title">
      <div className="home-route-inner">
        <div className="home-route-intro">
          <span className="home-chapter"><i /> 02 / 學習路線</span>
          <h2 id="route-title">每一關，<br /><em>都是下一條導線。</em></h2>
          <p>從單一邏輯閘開始，逐步走到組合電路、時序狀態與自由設計。選一個模組開始挑戰。</p>
          <span className="route-count">{modules.length} 個模組 · {challenges.length} 道關卡</span>
        </div>
        <div className="home-route-list" aria-label="選擇學習模組">
          {modules.map(item => {
            const tasks = getChallenges(item.id)
            const done = tasks.filter(task => progress[task.id]?.completed).length
            return <button key={item.id} className={`module-card route-module tone-${item.accent}`} onClick={() => onOpenModule(item.id)}>
              <span className="route-module-number">{item.number}</span>
              <span className="route-module-copy"><strong>{item.title}</strong><small>{item.short}</small></span>
              <span className="route-module-progress"><span>{done} / {tasks.length} 關</span><i><b style={{ width: `${done / tasks.length * 100}%` }} /></i></span>
              <ArrowRight className="route-module-arrow" size={19} />
            </button>
          })}
        </div>
      </div>
    </section>

    <section className="home-stage home-about" aria-labelledby="about-title">
      <div className="home-about-inner">
        <span className="home-chapter"><i /> 03 / 專案介紹</span>
        <h2 id="about-title">一起把邏輯，<br /><em>接成更好的作品。</em></h2>
        <p>「邏輯工坊」是以數位邏輯為主題的互動網頁教具。從觀察 0／1 的變化到親手接線闖關，希望讓抽象的電路概念變得能看、能試，也能分享。</p>
        <div className="home-about-action">
          <a href="https://github.com/Yuan-Chun-Chih/LogicLab" target="_blank" rel="noopener noreferrer" aria-label="在新分頁開啟邏輯工坊的 GitHub 專案"><Github size={20} /> 查看 GitHub 專案 <ArrowUpRight size={18} /></a>
          <span>歡迎點亮我們的專案</span>
        </div>
        <small className="home-repo-address">github.com/Yuan-Chun-Chih/LogicLab</small>
      </div>
    </section>
  </main>
}
