// src/features/learn/components/LearnMap.tsx
// Mapa Sinuoso de Níveis (Desafio Piggy - Dimensões e Espaçamento Dinâmico)
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

// Deslocamento lateral com amplitude de até 28% (aprox 40px) para não cortar nas bordas
const HORIZONTAL_OFFSETS = [0, 42, 0, -42, 0, 42, 0, -42]

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

  // Rolagem inicial suave e imediata focando no nó atual para o usuário nunca precisar rolar procurando onde está
  useLayoutEffect(() => {
    if (currentNodeRef.current) {
      currentNodeRef.current.scrollIntoView({
        behavior: 'auto',
        block: 'center',
      })
    }
  }, [trackSlug, levels])

  useEffect(() => {
    const handleScroll = () => {
      if (!currentNodeRef.current) return
      const rect = currentNodeRef.current.getBoundingClientRect()
      const isVisible = rect.top >= 80 && rect.bottom <= window.innerHeight - 80
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

    // Abre o bottom sheet de detalhes do nível
    setSelectedNode(level)
  }

  // Se tiver até 5 nós, usa espaçamento vertical proporcional para caber na tela sem rolar
  const gapClass = levels.length <= 5 ? 'space-y-6 sm:space-y-8' : 'space-y-7'

  return (
    <div
      ref={containerRef}
      className={`relative w-full max-w-md mx-auto py-3 px-4 flex flex-col items-center select-none flex-1 justify-center ${className}`}
    >
      {/* Botão flutuante "Voltar ao nó atual" se rolado para longe */}
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

      {/* Lista de Nós em Zigue-zague (da base para o topo: Nível 1 embaixo, Troféu em cima) */}
      <div className={`w-full flex flex-col-reverse items-center space-y-reverse ${gapClass} relative py-2`}>
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

          // Inverte mascote para a esquerda se o nó estiver deslocado para a direita
          const flipMascot = offsetPx > 20

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
                flipMascot={flipMascot}
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
