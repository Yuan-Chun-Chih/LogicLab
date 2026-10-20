import type { Challenge } from './content'

const gray = ['00', '01', '11', '10']

export default function AdvancedTaskBoard({ challenge, values, onChange }: { challenge: Challenge; values: number[]; onChange: (values: number[]) => void }) {
  const setValue = (index: number, value: number) => {
    const length = challenge.kmap ? 16 : challenge.expected?.length ?? 0
    onChange(Array.from({ length }, (_, i) => i === index ? value : values[i] ?? 0))
  }

  if (challenge.kmap) {
    const { variables, dontCares } = challenge.kmap
    return <div className="advanced-board">
      <div className="advanced-board-heading"><strong>四變數卡諾圖</strong><small>格雷碼排列 · 點格子切換 0／1</small></div>
      <div className="kmap-four" role="group" aria-label="四變數卡諾圖作答">
        <span className="kmap-axis">{variables.slice(0, 2).join('')}＼{variables.slice(2).join('')}</span>
        {gray.map(column => <strong className="kmap-axis" key={column}>{column}</strong>)}
        {gray.map(row => <div className="kmap-row" key={row}><strong className="kmap-axis">{row}</strong>{gray.map(column => {
          const vector = row + column
          const index = parseInt(vector, 2)
          const isDontCare = dontCares.includes(index)
          return <button type="button" key={column} data-minterm={index} disabled={isDontCare} className={isDontCare ? 'dont-care' : values[index] ? 'active' : ''} onClick={() => setValue(index, 1 - (values[index] ?? 0))} aria-label={`${variables.map((name, i) => `${name}=${vector[i]}`).join('、')}，${isDontCare ? '無關項 X' : `目前 ${values[index] ?? 0}`}`} aria-pressed={isDontCare ? undefined : Boolean(values[index])}><small>m{index}</small><b>{isDontCare ? 'X' : values[index] ?? 0}</b></button>
        })}</div>)}
      </div>
      <p className="advanced-board-note"><i className="legend-high" /> 1 為點亮 · X 為規格無關項，已固定<br />最上、最下與最左、最右也互相相鄰。電路上的 X 則表示訊號未知，意義不同。</p>
    </div>
  }

  if (challenge.table) {
    const { givenColumns, answerColumns, rows, answerOptions } = challenge.table
    return <div className="advanced-board">
      <div className="advanced-board-heading"><strong>{answerOptions ? '依事件推演暫存器' : '完整狀態轉換表'}</strong><small>{answerOptions ? '選擇每個事件後的十六進位值' : '點選下一狀態的 0／1'}</small></div>
      <div className="advanced-table-scroll"><table className="advanced-answer-table"><thead><tr>{[...givenColumns, ...answerColumns].map((column, index) => <th key={index}>{column}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((value, i) => <td key={i}>{value}</td>)}{answerColumns.map((column, columnIndex) => {
        const index = rowIndex * answerColumns.length + columnIndex
        const label = `第 ${rowIndex + 1} 列 ${column}`
        return <td key={column}>{answerOptions ? <select aria-label={label} value={values[index] ?? 0} onChange={event => setValue(index, Number(event.target.value))}>{answerOptions.map((option, i) => <option key={option} value={i}>{option}</option>)}</select> : <button type="button" className={values[index] ? 'active' : ''} aria-label={`${label}，目前 ${values[index] ?? 0}`} aria-pressed={Boolean(values[index])} onClick={() => setValue(index, 1 - (values[index] ?? 0))}>{values[index] ?? 0}</button>}</td>
      })}</tr>)}</tbody></table></div>
      <p className="advanced-board-note">{answerOptions ? '同時發生的時脈邊緣，都使用更新前的狀態計算。' : '先讀取整列舊狀態，再一起更新 A⁺、B⁺、C⁺。'}</p>
    </div>
  }
  return null
}
