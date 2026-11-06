import { describe, it, expect } from 'vitest'
import { computeMapLayout, MAP, Box } from './layout'

function boxIntersectsCircle(box: Box, cx: number, cy: number, r: number): boolean {
  const closestX = Math.max(box.x, Math.min(cx, box.x + box.w))
  const closestY = Math.max(box.y, Math.min(cy, box.y + box.h))
  const dx = cx - closestX
  const dy = cy - closestY
  return dx * dx + dy * dy < r * r
}

describe('computeMapLayout - Testes Geométricos', () => {
  const widths = [300, 320, 360, 412, 480, 600]
  const heights = [400, 476, 560, 640, 780, 900]

  it('a) nenhum par de nós se sobrepõe (distância entre centros >= soma dos raios + 4)', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 1; count <= 12; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            for (let i = 0; i < layout.nodes.length; i++) {
              for (let j = i + 1; j < layout.nodes.length; j++) {
                const n1 = layout.nodes[i]
                const n2 = layout.nodes[j]
                const dist = Math.hypot(n1.cx - n2.cx, n1.cy - n2.cy)
                const minAllowed = n1.size / 2 + n2.size / 2 + 4
                expect(dist).toBeGreaterThanOrEqual(minAllowed - 0.001)
              }
            }
          }
        }
      }
    }
  })

  it('b) o balão e o mascote ficam 100% dentro de [0, width] e com y >= 0', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 1; count <= 12; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            expect(layout.balloon.x).toBeGreaterThanOrEqual(0)
            expect(layout.balloon.x + layout.balloon.w).toBeLessThanOrEqual(width)
            expect(layout.balloon.y).toBeGreaterThanOrEqual(0)

            expect(layout.mascot.x).toBeGreaterThanOrEqual(0)
            expect(layout.mascot.x + layout.mascot.w).toBeLessThanOrEqual(width)
            expect(layout.mascot.y).toBeGreaterThanOrEqual(0)
          }
        }
      }
    }
  })

  it('c) o balão e o mascote NÃO intersectam nenhum nó (o mascote também não intersecta o nó atual)', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 1; count <= 12; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            for (const node of layout.nodes) {
              const r = node.size / 2
              expect(boxIntersectsCircle(layout.balloon, node.cx, node.cy, r)).toBe(false)
              expect(boxIntersectsCircle(layout.mascot, node.cx, node.cy, r)).toBe(false)
            }
          }
        }
      }
    }
  })

  it('d) se scrolls é false, todos os nós ficam dentro de [0, height]', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 1; count <= 12; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            if (!layout.scrolls) {
              for (const node of layout.nodes) {
                expect(node.cy - node.size / 2).toBeGreaterThanOrEqual(0)
                expect(node.cy + node.size / 2).toBeLessThanOrEqual(height)
              }
            }
          }
        }
      }
    }
  })

  it('e) o passo entre nós é >= MAP.minStep', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 2; count <= 12; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            for (let i = 0; i < layout.nodes.length - 1; i++) {
              const stepY = layout.nodes[i].cy - layout.nodes[i + 1].cy
              expect(stepY).toBeGreaterThanOrEqual(MAP.minStep - 1)
            }
          }
        }
      }
    }
  })

  it('f) height >= 476 e count <= 7 implica scrolls === false', () => {
    for (const width of widths) {
      for (const height of heights) {
        for (let count = 1; count <= 7; count++) {
          for (let currentIndex = 0; currentIndex < count; currentIndex++) {
            const layout = computeMapLayout(width, height, count, currentIndex)
            if (height >= 476 && count <= 7) {
              expect(
                layout.scrolls,
                `Falha em w=${width}, h=${height}, count=${count}, currentIndex=${currentIndex} (contentHeight=${layout.contentHeight})`
              ).toBe(false)
            }
          }
        }
      }
    }
  })
})
