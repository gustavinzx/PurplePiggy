export const MAP = {
  island: { w: 112, h: 88 },
  current: { w: 140, h: 108 },
  label: 28,
  gap: 16,
  edge: 12,
  padTop: 24,
  padBottom: 24,
  balloon: { w: 176, h: 76, gap: 8 },
  minStep: 210,
  maxStep: 240,
  amp: 74,
} as const

export type MapDirection = 'up' | 'down'

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface MapNodePos {
  index: number
  cx: number
  cy: number
  size_w: number
  size_h: number
  box: Box
}

export interface MapLayout {
  nodes: MapNodePos[]
  balloon: Box
  contentHeight: number
  scrolls: boolean
  step: number
  scrollTop: number
  currentCy: number
}

export const clamp = (v: number, a: number, b: number): number =>
  Math.min(b, Math.max(a, v))

export function boxesIntersect(b1: Box, b2: Box): boolean {
  return !(
    b1.x + b1.w <= b2.x ||
    b2.x + b2.w <= b1.x ||
    b1.y + b1.h <= b2.y ||
    b2.y + b2.h <= b1.y
  )
}

/**
 * Computa o layout geométrico puro do Mapa de Ilhas do Aprender V2.
 * @param width Área útil em largura (px)
 * @param height Área útil em altura (px)
 * @param count Número total de nós da trilha (>= 1)
 * @param currentIndex Índice do nó atual
 * @param direction 'up' (padrão) ou 'down' (mockup V2: nível concluído no topo)
 */
export function computeMapLayout(
  width: number,
  height: number,
  count: number,
  currentIndex: number,
  direction: MapDirection = 'up'
): MapLayout {
  if (count < 1) throw new Error('count precisa ser >= 1')
  const c = MAP
  const cur = clamp(currentIndex, 0, count - 1)

  // Se o nó atual for o do topo, soma a altura do balão e gap ao padTop
  const isTop = direction === 'up' ? cur === count - 1 : cur === 0
  const padTop = isTop ? c.padTop + c.balloon.h + c.balloon.gap : c.padTop
  // O nó da base possui rótulo abaixo, portanto padBottom precisa cobrir a altura do rótulo
  const padBottom = c.padBottom + c.label

  const slot_h = c.current.h
  const slot_w = c.current.w
  const amp = Math.min(c.amp, Math.max(0, (width - slot_w - 2 * c.edge) / 2))

  const free = height - padTop - padBottom - slot_h
  const ideal = count > 1 ? free / (count - 1) : 0
  const step = clamp(ideal, c.minStep, c.maxStep)

  const needed = padTop + padBottom + slot_h + step * (count - 1)
  const scrolls = needed > height
  const offset = scrolls ? 0 : (height - needed) / 2
  const contentHeight = scrolls ? needed : height

  const nodes: MapNodePos[] = Array.from({ length: count }, (_, i) => {
    let cy: number
    if (direction === 'up') {
      cy = Math.round(offset + needed - padBottom - slot_h / 2 - i * step)
    } else {
      cy = Math.round(offset + padTop + slot_h / 2 + i * step)
    }

    const cx = Math.round(width / 2 + amp * Math.sin((i * Math.PI) / 2))
    const isCur = i === cur
    const node_w = isCur ? c.current.w : c.island.w
    const node_h = isCur ? c.current.h : c.island.h

    const box: Box = {
      x: Math.round(cx - node_w / 2),
      y: Math.round(cy - node_h / 2),
      w: node_w,
      h: node_h + c.label,
    }

    return {
      index: i,
      cx,
      cy,
      size_w: node_w,
      size_h: node_h,
      box,
    }
  })

  const n = nodes[cur]

  // Posicionamento do balão "Vamos começar?"
  // Se for nó do topo, fica acima do nó atual centralizado
  // Se houver nó acima que colida, busca o lado livre para não colidir
  let bx = clamp(Math.round(n.cx - c.balloon.w / 2), c.edge, width - c.edge - c.balloon.w)
  let by = Math.round(n.cy - slot_h / 2 - c.balloon.gap - c.balloon.h)

  // Testar se colide com algum nó
  let candidateBalloon: Box = {
    x: bx,
    y: by,
    w: c.balloon.w,
    h: c.balloon.h,
  }

  const collidesWithAnyNode = (b: Box) =>
    nodes.some((node) => boxesIntersect(b, node.box))

  if (collidesWithAnyNode(candidateBalloon)) {
    // Tenta posicionar para o lado oposto ao nó colidente
    const collidingNodes = nodes.filter(
      (node) => node.index !== cur && boxesIntersect(candidateBalloon, node.box)
    )
    const targetNode = collidingNodes[0]

    if (targetNode) {
      const shiftLeft = Math.max(0, targetNode.box.x - c.balloon.w - 1)
      const shiftRight = Math.min(width - c.balloon.w, targetNode.box.x + targetNode.box.w + 1)
      const shiftPrimary = targetNode.cx >= width / 2 ? shiftLeft : shiftRight
      const shiftSecondary = targetNode.cx >= width / 2 ? shiftRight : shiftLeft

      const alt1: Box = {
        x: shiftPrimary,
        y: by,
        w: c.balloon.w,
        h: c.balloon.h,
      }

      if (!collidesWithAnyNode(alt1)) {
        candidateBalloon = alt1
      } else {
        const alt2: Box = {
          x: shiftSecondary,
          y: by,
          w: c.balloon.w,
          h: c.balloon.h,
        }
        if (!collidesWithAnyNode(alt2)) {
          candidateBalloon = alt2
        }
      }
    }
  }

  // ScrollTop inicial: nó atual centralizado com balão 100% visível
  const visTop = Math.min(candidateBalloon.y, n.box.y)
  const visBottom = Math.max(candidateBalloon.y + candidateBalloon.h, n.box.y + n.box.h)
  const visCenter = (visTop + visBottom) / 2
  const rawScroll = visCenter - height / 2
  const maxScroll = Math.max(0, contentHeight - height)
  const scrollTop = clamp(Math.round(rawScroll), 0, maxScroll)

  return {
    nodes,
    balloon: candidateBalloon,
    contentHeight,
    scrolls,
    step,
    scrollTop,
    currentCy: n.cy,
  }
}
