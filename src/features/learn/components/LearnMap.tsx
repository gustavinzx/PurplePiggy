// src/features/learn/components/LearnMap.tsx
// Mapa Sinuoso de Níveis V2 com Ilhas Flutuantes e Cenário
import React, { useLayoutEffect, useRef, useState, useEffect, useMemo } from 'react'
import { LevelNode, LevelNodeStatus } from './LevelNode'
import { NodeSheet } from './NodeSheet'
import { computeMapLayout, MapLayout, MapDirection } from '../map/layout'
import { toast } from 'sonner'
import { Play, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

export interface LevelItem {
  id: string
  levelNumber: number
  title: string
  description?: string
  lessonSlug: string
  isChest?: boolean
  isTrophy?: boolean
  isCompleted: boolean
  isCurrent: boolean
  isLocked: boolean
  isChestClaimed?: boolean
  stars?: number
}

interface LearnMapProps {
  trackSlug: string
  levels: LevelItem[]
  onSelectLevel: (level: LevelItem) => void
  onReadGuide?: (level: LevelItem) => void
  onClaimChest?: (level: LevelItem) => Promise<void>
  direction?: MapDirection
  className?: string
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

// Gerador pseudo-aleatório determinístico baseado no hash do trackSlug
function createSeededRandom(seedStr: string) {
  let hash = 0
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i)
    hash |= 0
  }
  let s = Math.abs(hash) || 123456789
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export const LearnMap: React.FC<LearnMapProps> = ({
  trackSlug,
  levels,
  onSelectLevel,
  onReadGuide,
  onClaimChest,
  direction = 'down', // 'down' reproduz exatamente a ordem do mockup V2 (concluído em cima)
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selectedNode, setSelectedNode] = useState<LevelItem | null>(null)

  // 1. Medir a área útil do mapa via ResizeObserver
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setDimensions((prev) => {
            if (prev && prev.width === Math.round(width) && prev.height === Math.round(height)) {
              return prev
            }
            return { width: Math.round(width), height: Math.round(height) }
          })
        }
      }
    })

    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Identificar o índice do nó atual
  const currentIndex = Math.max(0, levels.findIndex((l) => l.isCurrent))

  // 2. Calcular layout puro a partir das dimensões
  let layout: MapLayout | null = null
  if (dimensions && levels.length > 0) {
    try {
      layout = computeMapLayout(
        dimensions.width,
        dimensions.height,
        levels.length,
        currentIndex,
        direction
      )
    } catch (err) {
      console.error('Erro ao computar layout do mapa:', err)
    }
  }

  // 3. Rolagem inicial focando no nó atual com o balão 100% visível
  useLayoutEffect(() => {
    if (!layout || !layout.scrolls || !containerRef.current || !dimensions) return
    const targetScroll = layout.scrollTop
    containerRef.current.scrollTop = targetScroll

    // Reforço para garantir em navegadores móveis / webviews
    const rafId = requestAnimationFrame(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = targetScroll
      }
    })
    const timerId = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollTop = targetScroll
      }
    }, 60)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(timerId)
    }
  }, [trackSlug, layout?.scrolls, layout?.contentHeight, dimensions?.height, layout?.scrollTop])

  // 4. Cenário determinístico: 4 a 6 nuvens e 2 a 4 pinheiros por tela de rolagem (~600px)
  const scenery = useMemo(() => {
    if (!dimensions || !layout) return { clouds: [], trees: [] }
    const totalHeight = layout.contentHeight
    const screens = Math.max(1, Math.ceil(totalHeight / 600))
    const rand = createSeededRandom(trackSlug)

    const clouds: Array<{ x: number; y: number; src: string; size: number; opacity: number }> = []
    const cloudAssets = [
      '/assets/learn/cloud-a.webp',
      '/assets/learn/cloud-b.webp',
      '/assets/learn/cloud-c.webp',
    ]

    const trees: Array<{ x: number; y: number; size: number }> = []

    for (let s = 0; s < screens; s++) {
      const screenBaseY = s * 600
      // 4 a 6 nuvens por tela
      const cloudCount = 4 + Math.floor(rand() * 3)
      for (let c = 0; c < cloudCount; c++) {
        const cloudY = screenBaseY + rand() * 560
        const isLeft = c % 2 === 0
        const cloudX = isLeft
          ? rand() * (dimensions.width * 0.3)
          : dimensions.width * 0.7 + rand() * (dimensions.width * 0.3) - 60
        const src = cloudAssets[Math.floor(rand() * cloudAssets.length)]
        clouds.push({
          x: Math.round(cloudX),
          y: Math.round(cloudY),
          src,
          size: Math.round(70 + rand() * 50),
          opacity: 0.65 + rand() * 0.25,
        })
      }

      // 2 a 4 pinheiros por tela
      const treeCount = 2 + Math.floor(rand() * 3)
      for (let t = 0; t < treeCount; t++) {
        const treeY = screenBaseY + rand() * 560
        const isLeft = t % 2 === 0
        const treeX = isLeft
          ? rand() * (dimensions.width * 0.22)
          : dimensions.width * 0.8 + rand() * (dimensions.width * 0.18) - 40
        trees.push({
          x: Math.round(treeX),
          y: Math.round(treeY),
          size: Math.round(36 + rand() * 20),
        })
      }
    }

    return { clouds, trees }
  }, [trackSlug, dimensions?.width, layout?.contentHeight])

  const handleNodeClick = async (level: LevelItem) => {
    if (level.isLocked) {
      toast('Conclua o nível anterior para liberar este!', {
        description: 'Um passo de cada vez no seu próprio ritmo.',
        icon: <Sparkles className="w-4 h-4 text-purple-600" />,
      })
      return
    }

    if (level.isChest) {
      if (level.isChestClaimed) {
        toast('Você já resgatou este baú!')
      } else if (onClaimChest) {
        await onClaimChest(level)
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F5B83D', '#7D2BD6', '#2FBF71'],
        })
      }
      return
    }

    setSelectedNode(level)
  }

  // Primeiro índice de nó bloqueado
  const firstLockedIndex = levels.findIndex((l) => l.isLocked)

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex-1 select-none ${
        layout?.scrolls ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'
      } ${className}`}
      style={{
        overscrollBehavior: 'contain',
      }}
    >
      {/* Placeholder enquanto mede */}
      {!layout ? (
        <div className="w-full h-full min-h-[360px]" />
      ) : (
        <div
          className="relative w-full"
          style={{
            height: `${layout.contentHeight}px`,
            minHeight: '100%',
          }}
        >
          {/* Cenário de Fundo: Nuvens e Pinheiros */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0" aria-hidden="true">
            {/* Nuvens decorativas */}
            {scenery.clouds.map((cloud, idx) => (
              <img
                key={`cloud-${idx}`}
                src={cloud.src}
                alt=""
                className="absolute object-contain pointer-events-none drop-shadow-sm"
                style={{
                  left: `${cloud.x}px`,
                  top: `${cloud.y}px`,
                  width: `${cloud.size}px`,
                  opacity: cloud.opacity,
                }}
                loading="lazy"
              />
            ))}

            {/* Pinheiros decorativos */}
            {scenery.trees.map((tree, idx) => (
              <img
                key={`tree-${idx}`}
                src="/assets/learn/tree-pine.webp"
                alt=""
                className="absolute object-contain pointer-events-none drop-shadow-xs opacity-90"
                style={{
                  left: `${tree.x}px`,
                  top: `${tree.y}px`,
                  width: `${tree.size}px`,
                }}
                loading="lazy"
              />
            ))}

            {/* Caminho Sinuoso Pontilhado em SVG conectando os centros dos nós */}
            {layout.nodes.length > 1 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: `${dimensions?.width || 360}px`, height: `${layout.contentHeight}px` }}
              >
                {/* Trilha de halo suave */}
                <path
                  d={(() => {
                    const sorted = [...layout.nodes].sort((a, b) => a.cy - b.cy)
                    let d = `M ${sorted[0].cx} ${sorted[0].cy}`
                    for (let i = 0; i < sorted.length - 1; i++) {
                      const c = sorted[i]
                      const n = sorted[i + 1]
                      const midY = (c.cy + n.cy) / 2
                      d += ` C ${c.cx} ${midY}, ${n.cx} ${midY}, ${n.cx} ${n.cy}`
                    }
                    return d
                  })()}
                  fill="none"
                  stroke="#E8DEFB"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                {/* Linha pontilhada violeta */}
                <path
                  d={(() => {
                    const sorted = [...layout.nodes].sort((a, b) => a.cy - b.cy)
                    let d = `M ${sorted[0].cx} ${sorted[0].cy}`
                    for (let i = 0; i < sorted.length - 1; i++) {
                      const c = sorted[i]
                      const n = sorted[i + 1]
                      const midY = (c.cy + n.cy) / 2
                      d += ` C ${c.cx} ${midY}, ${n.cx} ${midY}, ${n.cx} ${n.cy}`
                    }
                    return d
                  })()}
                  fill="none"
                  stroke="#B037F8"
                  strokeWidth="3.5"
                  strokeDasharray="6 6"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              </svg>
            )}
          </div>

          {/* Balão de Fala "Vamos começar?" com Botão "Começar" */}
          {levels[currentIndex] && (
            <div
              data-testid="balloon-current"
              onClick={() => handleNodeClick(levels[currentIndex])}
              role="button"
              tabIndex={0}
              className="absolute z-30 flex flex-col items-center cursor-pointer transition-transform active:scale-95 animate-bounce-subtle select-none filter drop-shadow-md"
              style={{
                left: `${layout.balloon.x}px`,
                top: `${layout.balloon.y}px`,
                width: `${layout.balloon.w}px`,
                height: `${layout.balloon.h}px`,
              }}
            >
              <div className="w-full h-full bg-white/95 backdrop-blur-xs border border-purple-200/80 rounded-[18px] p-2 flex flex-col items-center justify-between shadow-sm">
                <span className="font-nunito font-extrabold text-[12px] text-[#432171] leading-tight text-center">
                  Vamos começar?
                </span>
                <div className="w-full bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] text-white py-1.5 px-3 rounded-full flex items-center justify-center gap-1.5 shadow-xs">
                  <Play className="w-3 h-3 fill-white text-white" />
                  <span className="font-nunito font-black text-[11px] tracking-wide uppercase leading-none">
                    Começar
                  </span>
                </div>
              </div>
              {/* Pequena ponta do balão apontando para o nó */}
              <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white shrink-0 -mt-0.5" />
            </div>
          )}

          {/* Nós / Ilhas flutuantes */}
          {layout.nodes.map((pos) => {
            const level = levels[pos.index]
            if (!level) return null

            let status: LevelNodeStatus = 'locked'
            if (level.isChest) {
              status = level.isChestClaimed ? 'chest_claimed' : 'chest'
            } else if (level.isTrophy) {
              status = level.isCompleted ? 'trophy_completed' : 'trophy'
            } else if (level.isCompleted) {
              status = 'completed'
            } else if (level.isCurrent) {
              status = 'current'
            }

            const isCurrent = level.isCurrent
            const nodeW = isCurrent ? 140 : 112
            const nodeH = isCurrent ? 108 : 88

            return (
              <LevelNode
                key={level.id}
                levelNumber={level.levelNumber}
                title={level.title}
                status={status}
                size_w={nodeW}
                size_h={nodeH}
                stars={level.stars ?? 3}
                isFirstLocked={pos.index === firstLockedIndex}
                onClick={() => handleNodeClick(level)}
                style={{
                  left: `${pos.cx - nodeW / 2}px`,
                  top: `${pos.cy - nodeH / 2}px`,
                }}
              />
            )
          })}
        </div>
      )}

      {/* Gaveta do Nó selecionado */}
      {selectedNode && (
        <NodeSheet
          isOpen={Boolean(selectedNode)}
          onClose={() => setSelectedNode(null)}
          levelNumber={selectedNode.levelNumber}
          title={selectedNode.title}
          description={selectedNode.description}
          isCompleted={selectedNode.isCompleted}
          onStartLesson={() => {
            const node = selectedNode
            setSelectedNode(null)
            onSelectLevel(node)
          }}
          onReadGuide={
            onReadGuide
              ? () => {
                  const node = selectedNode
                  setSelectedNode(null)
                  onReadGuide(node)
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
export default LearnMap
