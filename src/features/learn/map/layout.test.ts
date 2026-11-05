import { describe, it, expect } from 'vitest'
import {
  computeMapLayout,
  MAP,
  boxesIntersect,
  MapDirection,
} from './layout'

describe('computeMapLayout - Testes Geométricos V2 (Aprender)', () => {
  const widths = [320, 360, 390, 412, 480]
  const heights = [480, 560, 640, 780, 844, 900]
  const directions: MapDirection[] = ['up', 'down']

  it('a) nenhuma caixa de nó (ilha + rótulo) se sobrepõe a outra', () => {
    for (const direction of directions) {
      for (const width of widths) {
        for (const height of heights) {
          for (let count = 1; count <= 12; count++) {
            for (let currentIndex = 0; currentIndex < count; currentIndex++) {
              const layout = computeMapLayout(width, height, count, currentIndex, direction)
              for (let i = 0; i < layout.nodes.length; i++) {
                for (let j = i + 1; j < layout.nodes.length; j++) {
                  const n1 = layout.nodes[i]
                  const n2 = layout.nodes[j]
                  const intersects = boxesIntersect(n1.box, n2.box)
                  expect(
                    intersects,
                    `Sobreposição entre nó ${i} e nó ${j} em dir=${direction}, w=${width}, h=${height}, count=${count}, cur=${currentIndex}`
                  ).toBe(false)
                }
              }
            }
          }
        }
      }
    }
  })

  it('b) balão dentro de [0, largura] e sem intersectar nenhum nó', () => {
    for (const direction of directions) {
      for (const width of widths) {
        for (const height of heights) {
          for (let count = 1; count <= 12; count++) {
            for (let currentIndex = 0; currentIndex < count; currentIndex++) {
              const layout = computeMapLayout(width, height, count, currentIndex, direction)
              const b = layout.balloon

              // Dentro de [0, largura] e y >= 0
              expect(b.x, `Balão x < 0 em w=${width}`).toBeGreaterThanOrEqual(0)
              expect(b.x + b.w, `Balão x+w > width em w=${width}`).toBeLessThanOrEqual(width)
              expect(b.y, `Balão y < 0 em h=${height}`).toBeGreaterThanOrEqual(0)

              // Sem intersectar nenhum nó
              for (const node of layout.nodes) {
                const intersects = boxesIntersect(b, node.box)
                expect(
                  intersects,
                  `Balão colidiu com nó ${node.index} em dir=${direction}, w=${width}, h=${height}, count=${count}, cur=${currentIndex}. Balloon: ${JSON.stringify(b)}, Node: ${JSON.stringify(node.box)}`
                ).toBe(false)
              }
            }
          }
        }
      }
    }
  })

  it('c) passo entre nós >= minStep', () => {
    for (const direction of directions) {
      for (const width of widths) {
        for (const height of heights) {
          for (let count = 2; count <= 12; count++) {
            for (let currentIndex = 0; currentIndex < count; currentIndex++) {
              const layout = computeMapLayout(width, height, count, currentIndex, direction)
              expect(
                layout.step,
                `Passo ${layout.step} < minStep ${MAP.minStep} em w=${width}, h=${height}, count=${count}`
              ).toBeGreaterThanOrEqual(MAP.minStep - 0.001)

              for (let i = 0; i < layout.nodes.length - 1; i++) {
                const stepY = Math.abs(layout.nodes[i].cy - layout.nodes[i + 1].cy)
                expect(stepY).toBeGreaterThanOrEqual(MAP.minStep - 1)
              }
            }
          }
        }
      }
    }
  })

  it('d) scrollTop inicial dentro de [0, contentHeight - altura]', () => {
    for (const direction of directions) {
      for (const width of widths) {
        for (const height of heights) {
          for (let count = 1; count <= 12; count++) {
            for (let currentIndex = 0; currentIndex < count; currentIndex++) {
              const layout = computeMapLayout(width, height, count, currentIndex, direction)
              const maxScroll = Math.max(0, layout.contentHeight - height)
              expect(layout.scrollTop).toBeGreaterThanOrEqual(0)
              expect(layout.scrollTop).toBeLessThanOrEqual(maxScroll)
            }
          }
        }
      }
    }
  })

  it('e) o nó atual com o balão fica 100% visível no scroll inicial quando a altura útil >= 360', () => {
    for (const direction of directions) {
      for (const width of widths) {
        for (const height of heights) {
          if (height < 360) continue
          for (let count = 1; count <= 12; count++) {
            for (let currentIndex = 0; currentIndex < count; currentIndex++) {
              const layout = computeMapLayout(width, height, count, currentIndex, direction)
              const n = layout.nodes[currentIndex]
              const b = layout.balloon

              const visTop = Math.min(b.y, n.box.y)
              const visBottom = Math.max(b.y + b.h, n.box.y + n.box.h)

              const visibleMin = layout.scrollTop
              const visibleMax = layout.scrollTop + height

              expect(
                visTop,
                `visTop ${visTop} < visibleMin ${visibleMin} em dir=${direction}, w=${width}, h=${height}, count=${count}, cur=${currentIndex}`
              ).toBeGreaterThanOrEqual(visibleMin - 1)

              expect(
                visBottom,
                `visBottom ${visBottom} > visibleMax ${visibleMax} em dir=${direction}, w=${width}, h=${height}, count=${count}, cur=${currentIndex}`
              ).toBeLessThanOrEqual(visibleMax + 1)
            }
          }
        }
      }
    }
  })
})
