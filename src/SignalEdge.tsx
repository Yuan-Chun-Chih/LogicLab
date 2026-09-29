import { BaseEdge, EdgeToolbar, getBezierPath, getSmoothStepPath, type Edge, type EdgeProps } from '@xyflow/react'
import { Trash2 } from 'lucide-react'
import type { Signal } from './logic'

export type WorkbenchEdge = Edge<{ backwards?: boolean; signal?: Signal; onDelete?: () => void }>

export default function SignalEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, data, style, selected }: EdgeProps<WorkbenchEdge>) {
  const points = { sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }
  const [path, labelX, labelY] = data?.backwards
    ? getSmoothStepPath({ ...points, borderRadius: 16, offset: 38 })
    : getBezierPath(points)

  return <>
    <BaseEdge id={id} path={path} style={style} interactionWidth={32} />
    {data?.signal === 1 && <path d={path} className="signal-photon" fill="none" stroke="#a1ffdc" strokeWidth="2.4" strokeDasharray="2 17" strokeLinecap="round" pointerEvents="none" />}
    <EdgeToolbar edgeId={id} x={labelX} y={labelY - 28} isVisible={selected && Boolean(data?.onDelete)}>
      <button type="button" className="edge-remove nodrag nopan" onClick={event => { event.stopPropagation(); data?.onDelete?.() }} aria-label="刪除此線路"><Trash2 size={15} /><span>刪除線路</span></button>
    </EdgeToolbar>
  </>
}
