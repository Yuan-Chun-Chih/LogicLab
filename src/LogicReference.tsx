import { useState } from 'react'
import { Search } from 'lucide-react'
import GateSymbol from './GateSymbol'
import { gateValue, type Bit, type GateType } from './logic'
import { formulaGroups, gateReferences, type ReferenceGateType } from './reference'

function GateGuide({ type }: { type: ReferenceGateType }) {
  const gate = gateReferences.find(gate => gate.type === type)!
  const [a, setA] = useState<Bit>(0)
  const [b, setB] = useState<Bit>(0)
  const [clk, setClk] = useState<Bit>(0)
  const [rst, setRst] = useState<Bit>(0)
  const [q, setQ] = useState<Bit>(0)
  const output = (a: Bit, b: Bit) => type === 'XNOR' ? (a === b ? 1 : 0) : gateValue(type as GateType, a, b)
  const value = type === 'DFF' ? q : output(a, b)
  const toggleClock = () => { if (clk === 0 && rst === 0) setQ(a); setClk(clk === 0 ? 1 : 0) }
  const toggleReset = () => { if (rst === 0) setQ(0); setRst(rst === 0 ? 1 : 0) }
  const switchButton = (label: string, value: Bit, toggle: () => void) => <button type="button" className={value ? 'is-high' : ''} aria-label={`參考示範：切換 ${label}`} aria-pressed={Boolean(value)} onClick={toggle}><span>{label}</span><b>{value}</b></button>

  return <article className="reference-gate-guide" aria-label={`${type} 介紹`}>
    <div className="reference-gate-heading"><h3>{type}</h3><span>{gate.name}</span></div>
    <p>{gate.description}</p>
    <div className={`reference-demo ${value === 1 ? 'is-high' : ''}`}>
      <div className="reference-demo-inputs">
        {switchButton(type === 'DFF' ? 'D' : 'A', a, () => setA(a === 0 ? 1 : 0))}
        {type !== 'NOT' && type !== 'DFF' && switchButton('B', b, () => setB(b === 0 ? 1 : 0))}
        {type === 'DFF' && <>{switchButton('CLK', clk, toggleClock)}{switchButton('RST', rst, toggleReset)}</>}
      </div>
      <GateSymbol type={type} value={value} inputSignals={{ a, b, d: a, clk, rst }} />
      <div className="reference-demo-output" aria-live="polite"><span>{type === 'DFF' ? 'Q' : 'Y'}</span><strong>{value}</strong></div>
    </div>
    <p className="reference-demo-caption">點選上方輸入，觀察{type === 'DFF' ? '取樣、保持與清除' : '輸出與真值表'}。</p>
    <div className="reference-equation">{gate.formula}</div>
    <table className="reference-truth-table"><caption>{type === 'DFF' ? '狀態更新規則' : '真值表'}</caption>
      <thead><tr>{(type === 'DFF' ? ['RST', 'CLK', 'D', 'Q⁺'] : type === 'NOT' ? ['A', 'Y'] : ['A', 'B', 'Y']).map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
      <tbody>{type === 'DFF' ? [['1','任意','任意','0'], ['0','↑','0','0'], ['0','↑','1','1'], ['0','無上升緣','任意','舊 Q']].map((row, index) => <tr key={index}>{row.map((value, i) => <td key={i}>{value}</td>)}</tr>) : (type === 'NOT' ? [0,1] : [0,1,2,3]).map(index => {
        const x = (type === 'NOT' ? index : index >> 1) as Bit
        const y = (index & 1) as Bit
        const active = a === x && (type === 'NOT' || b === y)
        return <tr key={index} className={active ? 'current' : ''}><td>{x}</td>{type !== 'NOT' && <td>{y}</td>}<td>{output(x, y)}</td></tr>
      })}</tbody>
    </table>
    <p className="reference-tip">{gate.tip}</p>
  </article>
}

export function GateReference() {
  const [selected, setSelected] = useState<ReferenceGateType>('AND')
  return <div className="logic-reference">
    <div className="reference-gate-picker" role="group" aria-label="選擇要查閱的邏輯閘">{gateReferences.map(gate => <button type="button" key={gate.type} aria-pressed={selected === gate.type} onClick={() => setSelected(gate.type)}>{gate.type}</button>)}</div>
    <GateGuide key={selected} type={selected} />
  </div>
}

export function FormulaReference() {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(['notation', 'demorgan'])
  const search = query.trim().toLocaleLowerCase()
  const groups = formulaGroups.map(group => ({ ...group, entries: group.title.toLocaleLowerCase().includes(search) ? group.entries : group.entries.filter(entry => `${entry.title} ${entry.formulas.join(' ')} ${entry.note ?? ''}`.toLocaleLowerCase().includes(search)) })).filter(group => group.entries.length)

  return <div className="logic-reference">
    <label className="reference-search"><Search size={16} /><input type="search" aria-label="搜尋常見公式" placeholder="搜尋：德摩根、全加器、K-Map…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="reference-formula-groups">{groups.map(group => <details key={group.id} className="reference-formula-group" open={Boolean(search) || expanded.includes(group.id)}>
      <summary onClick={event => { event.preventDefault(); setExpanded(current => current.includes(group.id) ? current.filter(id => id !== group.id) : [...current, group.id]) }}>{group.title}</summary>
      <div>{group.entries.map(entry => <section key={entry.title} className="reference-formula-entry"><h3>{entry.title}</h3>{entry.formulas.map(formula => <p className="reference-equation" key={formula}>{formula}</p>)}{entry.note && <p className="reference-formula-note">{entry.note}</p>}</section>)}</div>
    </details>)}</div>
    {!groups.length && <p className="reference-empty" role="status">找不到符合的公式，請換個關鍵字。</p>}
  </div>
}
