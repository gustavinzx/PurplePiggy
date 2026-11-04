export const MAP = {
  node: 56, current: 64,
  balloonW: 84, balloonH: 24, balloonGap: 6,
  mascot: 48, gap: 10, edge: 12, padBottom: 16,
  minStep: 64, maxStep: 116, amp: 74,
} as const;

export interface Box { x: number; y: number; w: number; h: number }
export interface MapNodePos { index: number; cx: number; cy: number; size: number }
export interface MapLayout {
  nodes: MapNodePos[];
  balloon: Box;
  mascot: Box & { side: 'left' | 'right' };
  contentHeight: number;
  scrolls: boolean;
  currentCy: number;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// index 0 = nó mais baixo (começo da trilha). width/height = área útil do mapa em px.
export function computeMapLayout(
  width: number, height: number, count: number, currentIndex: number,
): MapLayout {
  if (count < 1) throw new Error('count precisa ser >= 1');
  const c = MAP;
  const cur = clamp(currentIndex, 0, count - 1);
  const padTop = cur === count - 1 ? c.edge + c.balloonH + c.balloonGap : c.edge;
  const slot = c.current;
  const amp = Math.min(c.amp, Math.max(0, (width - slot - 2 * c.edge) / 2));
  const free = height - padTop - c.padBottom - slot;
  const ideal = count > 1 ? free / (count - 1) : 0;
  const step = clamp(ideal, c.minStep, c.maxStep);
  const needed = padTop + c.padBottom + slot + step * (count - 1);
  const scrolls = needed > height;
  const offset = scrolls ? 0 : (height - needed) / 2;
  const contentHeight = scrolls ? needed : height;
  const bottomCy = offset + needed - c.padBottom - slot / 2;

  const nodes: MapNodePos[] = Array.from({ length: count }, (_, i) => ({
    index: i,
    cx: Math.round(width / 2 + amp * Math.sin((i * Math.PI) / 2)),
    cy: Math.round(bottomCy - i * step),
    size: i === cur ? c.current : c.node,
  }));
  const n = nodes[cur];
  const balloon: Box = {
    x: clamp(n.cx - c.balloonW / 2, c.edge, width - c.edge - c.balloonW),
    y: n.cy - slot / 2 - c.balloonGap - c.balloonH,
    w: c.balloonW, h: c.balloonH,
  };
  const side: 'left' | 'right' = n.cx > width / 2 + 1 ? 'left' : 'right';
  const raw = side === 'right' ? n.cx + slot / 2 + c.gap : n.cx - slot / 2 - c.gap - c.mascot;
  const mascot: MapLayout['mascot'] = {
    x: clamp(raw, c.edge, width - c.edge - c.mascot),
    y: n.cy - c.mascot / 2, w: c.mascot, h: c.mascot, side,
  };
  return { nodes, balloon, mascot, contentHeight, scrolls, currentCy: n.cy };
}
