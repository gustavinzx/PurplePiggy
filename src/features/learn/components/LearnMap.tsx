// src/features/learn/components/LearnMap.tsx
// Mapa Sinuoso de Níveis (Desafio Piggy - Prompt N9B)
import React, { useLayoutEffect, useRef, useState, useEffect } from 'react'
import { LevelNode, LevelNodeStatus } from './LevelNode'
import { NodeSheet } from './NodeSheet'
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

// Deslocamento lateral senoidal para formar o zigue-zague do Duolingo
// offsets em porcentagem horizontal a partir do centro (0px, +60px, 0px, -60px, etc.)
const HORIZONTAL_OFFSETS = [0, 56, 0, -56, 0, 56, 0, -56]

export const LearnMap: React.FC<LearnMapProps> = ({
  trackSlug,
  levels,
  onSelectLevel,
  onReadGuide,
  onClaimChest,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const currentNodeRef = useRef<HTMLDivElement>(null)
  const [selectedNode, setSelectedNode] = useState<LevelItem | null>(null)
  const [showScrollToCurrent, setShowScrollToCurrent] = useState(false)

  // Rolagem inicial direta para o nó atual sem animação (sem piscada)
  useLayoutEffect(() => {
    if (currentNodeRef.current && containerRef.current) {
      currentNodeRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      })
    }
  }, [trackSlug, levels])

  // Observador para exibir o botão flutuante "Voltar ao nó atual"
  useEffect(() => {
    const handleScroll = () => {
      if (!currentNodeRef.current) return
      const rect = currentNodeRef.current.getBoundingClientRect()
      const isVisible = rect.top >= 100 && rect.bottom <= window.innerHeight - 80
      setShowScrollToCurrent(!isVisible)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToCurrentNode = () => {
    if (currentNodeRef.current) {
      currentNodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }
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
        toast('Você já resgatou este baú de moedas!', {
          description: '+50 moedas Piggy adicionadas ao seu saldo.',
        })
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

    // Abre a gaveta de início do nível
    setSelectedNode(level)
  }

  // Ordenação de baixo para cima (Nível 1 na base, Nível 5 / Troféu no topo)
  // levels já vem na ordem crescente (1, 2, 3...)
  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md mx-auto py-8 px-4 flex flex-col items-center select-none ${className}`}
    >
      {/* Botão flutuante "Voltar ao nó atual" */}
      {showScrollToCurrent && (
        <button
          type="button"
          onClick={scrollToCurrentNode}
          className="fixed bottom-24 right-5 z-40 bg-[#7D2BD6] text-white px-3.5 py-2 rounded-full shadow-lg border-2 border-purple-300 font-nunito font-extrabold text-xs flex items-center gap-1.5 active:scale-95 transition-all animate-bounce-subtle"
        >
          <ArrowDown className="w-4 h-4 text-amber-300" />
          Nó Atual
        </button>
      )}

      {/* Lista de Nós em Zigue-zague */}
      <div className="w-full flex flex-col-reverse items-center space-y-reverse space-y-8 relative">
        {levels.map((level, idx) => {
          const offsetPx = HORIZONTAL_OFFSETS[idx % HORIZONTAL_OFFSETS.length]
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
            <div
              key={level.id}
              ref={level.isCurrent ? currentNodeRef : undefined}
              className="relative transition-transform duration-300"
              style={{
                transform: `translateX(${offsetPx}px)`,
              }}
            >
              <LevelNode
                levelNumber={level.levelNumber}
                title={level.title}
                status={status}
                onClick={() => handleNodeClick(level)}
              />
            </div>
          )
        })}
      </div>

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
