// src/features/learn/components/LearnMap.tsx
// Mapa Sinuoso de Níveis com Geometria Pura (computeMapLayout)
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { LevelNode, LevelNodeStatus } from './LevelNode'
import { NodeSheet } from './NodeSheet'
import { computeMapLayout, MapLayout } from '../map/layout'
import { Mascot } from '../../../components/Mascot'
import { toast } from 'sonner'
import { ArrowDown, Sparkles } from 'lucide-react'
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
}

interface LearnMapProps {
  trackSlug: string
  levels: LevelItem[]
  onSelectLevel: (level: LevelItem) => void
  onReadGuide?: (level: LevelItem) => void
  onClaimChest?: (level: LevelItem) => Promise<void>
  className?: string
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))

export const LearnMap: React.FC<LearnMapProps> = ({
  trackSlug,
  levels,
  onSelectLevel,
  onReadGuide,
  onClaimChest,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null)
  const [selectedNode, setSelectedNode] = useState<LevelItem | null>(null)
  const [showScrollToCurrent, setShowScrollToCurrent] = useState(false)

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

  // Identificar o índice do nó atual (0 = base / início da trilha)
  const currentIndex = Math.max(0, levels.findIndex((l) => l.isCurrent))

  // Calcular layout puro a partir das dimensões
  let layout: MapLayout | null = null
  if (dimensions && levels.length > 0) {
    try {
      layout = computeMapLayout(dimensions.width, dimensions.height, levels.length, currentIndex)
    } catch (err) {
      console.error('Erro ao computar layout do mapa:', err)
    }
  }

  // 2. Rolagem inicial focando no nó atual antes do primeiro paint se o mapa rolar
  useLayoutEffect(() => {
    if (!layout || !layout.scrolls || !containerRef.current || !dimensions) return
    const targetScroll = clamp(
      layout.currentCy - dimensions.height / 2,
      0,
      layout.contentHeight - dimensions.height
    )
    containerRef.current.scrollTop = targetScroll

    // Reforço via rAF e timer curto para garantir no Android WebView
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
  }, [trackSlug, layout?.scrolls, layout?.contentHeight, dimensions?.height, layout?.currentCy])

  // Observador para exibir botão flutuante se o usuário rolar para longe do nó atual
  useEffect(() => {
    const el = containerRef.current
    if (!el || !layout || !layout.scrolls) return

    const handleScroll = () => {
      if (!dimensions) return
      const currentScroll = el.scrollTop
      const targetScroll = clamp(
        layout.currentCy - dimensions.height / 2,
        0,
        layout.contentHeight - dimensions.height
      )
      const diff = Math.abs(currentScroll - targetScroll)
      setShowScrollToCurrent(diff > 120)
    }

    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [layout, dimensions])

  const scrollToCurrentNode = () => {
    if (!containerRef.current || !layout || !dimensions) return
    const targetScroll = clamp(
      layout.currentCy - dimensions.height / 2,
      0,
      layout.contentHeight - dimensions.height
    )
    containerRef.current.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    })
  }

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
      {/* Botão flutuante "Voltar ao nó atual" */}
      {showScrollToCurrent && (
        <button
          type="button"
          onClick={scrollToCurrentNode}
          className="fixed bottom-24 right-5 z-40 bg-[#7D2BD6] text-white px-3 py-1.5 rounded-full shadow-lg border-2 border-purple-300 font-nunito font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all animate-bounce-subtle"
        >
          <ArrowDown className="w-3.5 h-3.5 text-amber-300" />
          Nó Atual
        </button>
      )}

      {/* Placeholder silencioso enquanto o ResizeObserver mede as dimensões */}
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
          {/* Fundo Ambiência Temática PurplePiggy: Blobs orgânicos e Trilha Sinuosa */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-0" aria-hidden="true">
            {/* Mancha suave lilás próxima ao nó atual */}
            <div
              className="absolute w-64 h-64 rounded-full bg-[#EEDEFB]/65 blur-3xl"
              style={{
                left: `${(layout.nodes[currentIndex]?.cx || dimensions?.width || 360) / 2 - 128}px`,
                top: `${layout.currentCy - 128}px`,
              }}
            />
            {/* Mancha dourada suave próxima ao Baú e Troféu no topo */}
            <div
              className="absolute w-56 h-56 rounded-full bg-[#FEDA70]/20 blur-3xl"
              style={{
                left: '20%',
                top: '60px',
              }}
            />
            {/* Mancha azul bebê suave na base */}
            <div
              className="absolute w-60 h-60 rounded-full bg-[#DEEEFC]/70 blur-3xl"
              style={{
                right: '-40px',
                bottom: '40px',
              }}
            />

            {/* Trilha/Caminho Sinuoso em SVG conectando os centros dos nós */}
            {layout.nodes.length > 1 && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: `${dimensions?.width || 360}px`, height: `${layout.contentHeight}px` }}
              >
                {/* 1. Trilha de fundo larga (halo suave azul-bebê / lilás) */}
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
                  stroke="#DEEEFC"
                  strokeWidth="12"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                {/* 2. Linha da trilha pontilhada estilizada roxa/lilás */}
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
                  strokeWidth="4"
                  strokeDasharray="8 8"
                  strokeLinecap="round"
                  opacity="0.45"
                />
              </svg>
            )}
          </div>
          {/* Balão "Começar!" com caixa exata devolvida pela geometria pura */}
          <div
            className="absolute z-20 flex flex-col items-center justify-center animate-bounce-subtle pointer-events-none"
            style={{
              left: `${layout.balloon.x}px`,
              top: `${layout.balloon.y}px`,
              width: `${layout.balloon.w}px`,
              height: `${layout.balloon.h}px`,
            }}
          >
            <div className="w-full h-full bg-[#7D2BD6] text-white text-[11px] font-black rounded-full shadow-md tracking-wider uppercase border border-purple-400 flex items-center justify-center leading-none">
              Começar!
            </div>
            {/* Triângulo apontador */}
            <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-[#7D2BD6] -mb-1 shrink-0" />
          </div>

          {/* Mascote oficial na caixa exata devolvida pela geometria */}
          <div
            className="absolute z-10 pointer-events-none drop-shadow"
            style={{
              left: `${layout.mascot.x}px`,
              top: `${layout.mascot.y}px`,
              width: `${layout.mascot.w}px`,
              height: `${layout.mascot.h}px`,
            }}
          >
            <Mascot pose="head" className="w-full h-full object-contain" priority />
          </div>

          {/* Nós posicionados exatamente pelas coordenadas (left = cx - size/2, top = cy - size/2) */}
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

            return (
              <LevelNode
                key={level.id}
                levelNumber={level.levelNumber}
                title={level.title}
                status={status}
                size={pos.size}
                onClick={() => handleNodeClick(level)}
                style={{
                  left: `${pos.cx - pos.size / 2}px`,
                  top: `${pos.cy - pos.size / 2}px`,
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
