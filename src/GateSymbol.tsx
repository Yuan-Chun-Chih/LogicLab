import type { ComponentType, GateType, Signal } from './logic'

type Props = { type: ComponentType | 'XNOR'; compact?: boolean; className?: string; inputSignals?: Record<string, Signal>; value?: Signal }
const portClass = (value?: Signal) => value === 1 ? 'signal-high' : value === 0 ? 'signal-low' : value === 'X' ? 'signal-unknown' : ''

export default function GateSymbol({ type, compact = false, className = '', inputSignals, value }: Props) {
  const gate = type as GateType
  const isNot = gate === 'NOT'
  const isNand = gate === 'NAND'
  const isNor = gate === 'NOR'
  const isXnor = type === 'XNOR'
  const isOr = gate === 'OR' || gate === 'XOR' || isNor || isXnor

  if (type === 'DFF') {
    return <svg className={`gate-svg ${compact ? 'compact' : ''} ${className}`} viewBox="0 0 140 100" role="img" aria-label="D 正反器">
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.d)}`} d="M0 24 H28" />
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.clk)}`} d="M0 50 H28" />
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.rst)}`} d="M0 76 H28" />
      <path className="symbol-wire output-wire" d="M111 50 H140" />
      <rect className="symbol-body" x="28" y="9" width="83" height="82" rx="4" />
      <path className="symbol-line" d="M28 43 L38 50 L28 57" />
      <text x="45" y="28">D</text><text x="44" y="56">CLK</text><text x="44" y="81">RST</text><text x="87" y="42">Q</text>
      {value !== undefined && <text className="symbol-value" x="92" y="72" textAnchor="middle">{value}</text>}
    </svg>
  }

  return <svg className={`gate-svg ${compact ? 'compact' : ''} ${className}`} viewBox="0 0 140 100" role="img" aria-label={`${type} 邏輯閘`}>
    {isNot ? <>
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.a)}`} d="M0 50 H24" />
      <path className="symbol-wire output-wire" d="M119 50 H140" />
      <path className="symbol-body" d="M24 13 L103 50 L24 87 Z" />
      <circle className="symbol-body" cx="111" cy="50" r="8" />
    </> : isOr ? <>
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.a)}`} d="M0 30 H31" />
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.b)}`} d="M0 70 H31" />
      <path className="symbol-wire output-wire" d={`M${isNor || isXnor ? 125 : 109} 50 H140`} />
      <path className="symbol-body" d="M25 13 C49 14 83 20 109 50 C83 80 49 86 25 87 C38 65 38 35 25 13 Z" />
      {(isNor || isXnor) && <circle className="symbol-body" cx="117" cy="50" r="8" />}
      {(gate === 'XOR' || isXnor) && <path className="symbol-line" d="M12 13 C25 35 25 65 12 87" />}
    </> : <>
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.a)}`} d="M0 30 H25" />
      <path className={`symbol-wire port-wire ${portClass(inputSignals?.b)}`} d="M0 70 H25" />
      <path className="symbol-wire output-wire" d={`M${isNand ? '121' : '106'} 50 H140`} />
      <path className="symbol-body" d="M25 13 H65 C90 13 106 29 106 50 C106 71 90 87 65 87 H25 Z" />
      {isNand && <circle className="symbol-body" cx="113" cy="50" r="8" />}
    </>}
    {value !== undefined && <text className="symbol-value" x={isNot ? 53 : isOr ? 67 : 60} y="58" textAnchor="middle">{value}</text>}
  </svg>
}
