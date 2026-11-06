// src/components/AvatarCropperModal.tsx
// Editor e Cortador de Foto de Perfil 100% In-App (sem abrir aplicativos externos do sistema)
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react'

interface AvatarCropperModalProps {
  imageSrc: string
  isOpen: boolean
  onClose: () => void
  onSaveCropped: (croppedDataUrl: string, blob: Blob) => Promise<void> | void
}

const CROP_BOX_SIZE = 240 // Diâmetro do círculo de pré-visualização em px
const OUTPUT_SIZE = 512   // Resolução final nítida para o avatar

export const AvatarCropperModal: React.FC<AvatarCropperModalProps> = ({
  imageSrc,
  isOpen,
  onClose,
  onSaveCropped,
}) => {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const [baseSize, setBaseSize] = useState<{ width: number; height: number } | null>(null)

  const imageRef = useRef<HTMLImageElement>(null)

  // Medir proporções naturais da foto para ajustar ao tamanho base de 240px (sem ultrazoom)
  useEffect(() => {
    if (!isOpen || !imageSrc) return

    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
    setSaving(false)

    const img = new Image()
    img.onload = () => {
      const naturalWidth = img.naturalWidth || CROP_BOX_SIZE
      const naturalHeight = img.naturalHeight || CROP_BOX_SIZE
      const aspect = naturalWidth / naturalHeight

      let width = CROP_BOX_SIZE
      let height = CROP_BOX_SIZE

      if (aspect >= 1) {
        // Paisagem: altura preenche o círculo, largura proporcional
        height = CROP_BOX_SIZE
        width = CROP_BOX_SIZE * aspect
      } else {
        // Retrato: largura preenche o círculo, altura proporcional
        width = CROP_BOX_SIZE
        height = CROP_BOX_SIZE / aspect
      }

      setBaseSize({ width, height })
    }
    img.src = imageSrc
  }, [isOpen, imageSrc])

  // Manipulação de toque / mouse para arrastar (Pan)
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    try {
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    try {
      ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
    } catch {
      // ignore
    }
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleConfirmCrop = useCallback(async () => {
    if (!imageRef.current || !baseSize) return
    setSaving(true)

    try {
      const img = imageRef.current
      const canvas = document.createElement('canvas')
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('Falha ao inicializar contexto 2D')
      }

      // 1. Preencher com fundo branco (evita que áreas vazias fiquem pretas no JPEG)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

      // 2. Centralizar e rotacionar
      ctx.save()
      ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2)
      ctx.rotate((rotation * Math.PI) / 180)

      // Proporção de escala entre o container visual (240px) e o canvas de saída (512px)
      const ratio = OUTPUT_SIZE / CROP_BOX_SIZE

      const drawW = baseSize.width * scale * ratio
      const drawH = baseSize.height * scale * ratio
      const drawX = position.x * ratio
      const drawY = position.y * ratio

      // Desenhar a imagem centralizada com o deslocamento e zoom
      ctx.drawImage(
        img,
        -drawW / 2 + drawX,
        -drawH / 2 + drawY,
        drawW,
        drawH
      )
      ctx.restore()

      const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92)

      canvas.toBlob(
        async (blob) => {
          if (blob) {
            await onSaveCropped(croppedDataUrl, blob)
            onClose()
          }
          setSaving(false)
        },
        'image/jpeg',
        0.92
      )
    } catch (err) {
      console.error('Erro ao recortar imagem:', err)
      setSaving(false)
    }
  }, [position, scale, rotation, baseSize, onSaveCropped, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[120] bg-[#1F0F38]/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-[32px] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center relative border border-purple-100">
        {/* Cabeçalho */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="text-left">
            <h3 className="font-nunito font-black text-lg text-[#33105D] leading-tight">
              Ajustar foto de perfil
            </h3>
            <p className="font-nunito text-xs text-[#7D6A9C] font-semibold">
              Arraste para posicionar e use o zoom
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-8 h-8 rounded-full bg-[#FAF5FF] flex items-center justify-center text-[#7D6A9C] hover:text-[#432171] active:scale-95 transition-transform cursor-pointer"
            aria-label="Cancelar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewport de corte circular (240x240px) */}
        <div
          className="relative w-[240px] h-[240px] rounded-full overflow-hidden border-4 border-[#7D2BD6] shadow-[0_8px_30px_rgba(125,43,214,0.3)] bg-[#F8F4FD] flex items-center justify-center cursor-grab active:cursor-grabbing select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {baseSize && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Pré-visualização"
              draggable={false}
              className="select-none pointer-events-none transition-transform duration-75"
              style={{
                width: `${baseSize.width}px`,
                height: `${baseSize.height}px`,
                maxWidth: 'none',
                maxHeight: 'none',
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                transformOrigin: 'center center',
              }}
            />
          )}

          {/* Guia de grade circular translúcida */}
          <div className="absolute inset-0 rounded-full border border-purple-300/40 pointer-events-none" />
          <div className="absolute inset-[30px] rounded-full border border-purple-300/20 pointer-events-none" />
        </div>

        {/* Controles de Zoom e Rotação */}
        <div className="w-full flex items-center justify-between gap-3 mt-5 px-1">
          <button
            type="button"
            onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.15).toFixed(2))))}
            className="w-9 h-9 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7D2BD6] active:scale-95 transition-transform cursor-pointer"
            title="Reduzir zoom"
            aria-label="Reduzir zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="flex-1 accent-[#7D2BD6] h-2 bg-[#F3E8FF] rounded-lg cursor-pointer"
            aria-label="Controle de zoom"
          />

          <button
            type="button"
            onClick={() => setScale((s) => Math.min(3, Number((s + 0.15).toFixed(2))))}
            className="w-9 h-9 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7D2BD6] active:scale-95 transition-transform cursor-pointer"
            title="Aumentar zoom"
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="w-9 h-9 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#7D2BD6] active:scale-95 transition-transform cursor-pointer"
            title="Girar 90 graus"
            aria-label="Girar 90 graus"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Botões de Ação */}
        <div className="w-full flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 h-12 rounded-full bg-[#FAF5FF] border border-[#E9D5FF] text-[#7D6A9C] font-extrabold text-sm active:scale-95 transition-transform cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirmCrop}
            disabled={saving || !baseSize}
            className="flex-1 h-12 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white font-extrabold text-sm shadow-[0_6px_20px_rgba(125,43,214,0.3)] hover:opacity-95 active:scale-95 transition-transform flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{saving ? 'Salvando...' : 'Confirmar'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
