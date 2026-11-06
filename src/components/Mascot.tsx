import React from 'react'

export type MascotPose =
  | 'head'
  | 'welcome'
  | 'peek'
  | 'graduate'
  | 'diploma'
  | 'idea'
  | 'empty'
  | 'medal'
  | 'trophy'
  | 'deposit'
  | 'retry'
  | 'shield'
  | 'connect'
  | 'loading'
  | 'success'
  | 'search'
  | 'wink'

export const MASCOT_SIZES = {
  xs: { width: 40, height: 40, className: 'w-10 h-10' },
  sm: { width: 56, height: 56, className: 'w-14 h-14' },
  md: { width: 80, height: 80, className: 'w-20 h-20' },
  lg: { width: 128, height: 128, className: 'w-32 h-32' },
  xl: { width: 192, height: 192, className: 'w-48 h-48' },
  hero: { width: 256, height: 256, className: 'w-64 h-64' },
} as const

export type MascotSize = keyof typeof MASCOT_SIZES

export interface MascotProps {
  pose?: MascotPose
  size?: MascotSize
  float?: boolean
  floating?: boolean // alias retrocompatível
  priority?: boolean // acima da dobra: loading="eager" + fetchPriority="high"
  className?: string
  alt?: string
  /** Quando true, aplica o posicionamento absoluto onde anchor_y (79.6%) apoia na borda do card pai */
  cardAnchor?: boolean
  onClick?: () => void
}

interface PoseMeta {
  src: string
  src2x?: string
  alt: string
  anchorY?: number
}

export const POSE_MANIFEST: Record<MascotPose, PoseMeta> = {
  head: {
    src: '/assets/mascot/pig-head.png',
    alt: 'Mascote PurplePiggy — Cabeça oficial com moeda no topo',
  },
  welcome: {
    src: '/assets/mascot/pig-welcome.png',
    alt: 'Mascote PurplePiggy — Acenando alegremente',
  },
  peek: {
    src: '/assets/mascot/pig-peek.png',
    alt: 'Mascote PurplePiggy — Espiando curioso sobre a borda',
    anchorY: 0.796,
  },
  graduate: {
    src: '/assets/mascot/pig-graduate.png',
    alt: 'Mascote PurplePiggy — Com capelo de formatura',
  },
  diploma: {
    src: '/assets/mascot/pig-diploma.png',
    src2x: '/assets/mascot/pig-diploma@2x.png',
    alt: 'Mascote PurplePiggy — Comemorando com diploma',
  },
  idea: {
    src: '/assets/mascot/pig-idea.png',
    alt: 'Mascote PurplePiggy — Com lâmpada de ideia acesa',
  },
  empty: {
    src: '/assets/mascot/pig-empty.png',
    src2x: '/assets/mascot/pig-empty@2x.png',
    alt: 'Mascote PurplePiggy — Olhando cofrinho vazio',
  },
  medal: {
    src: '/assets/mascot/pig-medal.png',
    src2x: '/assets/mascot/pig-medal@2x.png',
    alt: 'Mascote PurplePiggy — Com medalha de ouro no peito',
  },
  trophy: {
    src: '/assets/mascot/pig-trophy.png',
    src2x: '/assets/mascot/pig-trophy@2x.png',
    alt: 'Mascote PurplePiggy — Erguendo troféu dourado',
  },
  deposit: {
    src: '/assets/mascot/pig-deposit.png',
    src2x: '/assets/mascot/pig-deposit@2x.png',
    alt: 'Mascote PurplePiggy — Depositando moeda dourada',
  },
  retry: {
    src: '/assets/mascot/pig-retry.png',
    src2x: '/assets/mascot/pig-retry@2x.png',
    alt: 'Mascote PurplePiggy — Encorajando para tentar de novo',
  },
  shield: {
    src: '/assets/mascot/pig-shield.png',
    src2x: '/assets/mascot/pig-shield@2x.png',
    alt: 'Mascote PurplePiggy — Com escudo de proteção e segurança',
  },
  connect: {
    src: '/assets/mascot/pig-connect.png',
    src2x: '/assets/mascot/pig-connect@2x.png',
    alt: 'Mascote PurplePiggy — Conectando cabos com faísca em coração',
  },
  loading: {
    src: '/assets/mascot/pig-loading.png',
    src2x: '/assets/mascot/pig-loading@2x.png',
    alt: 'Mascote PurplePiggy — Quicando e observando moeda girar',
  },
  success: {
    src: '/assets/mascot/pig-success.png',
    src2x: '/assets/mascot/pig-success@2x.png',
    alt: 'Mascote PurplePiggy — Carimbando recibo com check de coração',
  },
  search: {
    src: '/assets/mascot/pig-search.png',
    src2x: '/assets/mascot/pig-search@2x.png',
    alt: 'Mascote PurplePiggy — Observando com lupa curiosa',
  },
  wink: {
    src: '/assets/mascot/pig-head.png',
    alt: 'Mascote PurplePiggy — Cabeça oficial',
  },
}

/**
 * Pré-carrega no navegador o asset de uma pose para navegações subsequentes.
 */
export const preloadMascot = (pose: MascotPose): void => {
  if (typeof document === 'undefined') return
  const meta = POSE_MANIFEST[pose]
  if (!meta) return
  const linkId = `preload-mascot-${pose}`
  if (document.getElementById(linkId)) return

  const link = document.createElement('link')
  link.id = linkId
  link.rel = 'preload'
  link.as = 'image'
  link.href = meta.src
  if (meta.src2x) {
    link.imageSrcset = `${meta.src} 1x, ${meta.src2x} 2x`
  }
  document.head.appendChild(link)
}

/**
 * Pré-carrega uma lista de poses.
 */
export const preloadMascots = (poses: MascotPose[]): void => {
  poses.forEach(preloadMascot)
}

export const Mascot: React.FC<MascotProps> = ({
  pose = 'head',
  size = 'md',
  float = false,
  floating = false,
  priority = false,
  className = '',
  alt,
  cardAnchor = false,
  onClick,
}) => {
  // Validação estrita da pose: em dev lança erro visível, em prod não renderiza e loga
  const isValidPose = typeof pose === 'string' && pose in POSE_MANIFEST
  if (!isValidPose) {
    const errorMsg = `[Mascot] Pose inválida ou inexistente no manifest: "${pose}". Poses válidas: ${Object.keys(
      POSE_MANIFEST
    ).join(', ')}`
    if (process.env.NODE_ENV !== 'production') {
      throw new Error(errorMsg)
    } else {
      console.error(errorMsg)
      return null
    }
  }

  const meta = POSE_MANIFEST[pose]
  const sizeConfig = MASCOT_SIZES[size] || MASCOT_SIZES.md
  const isFloating = float || floating
  const resolvedAlt = alt || meta.alt

  // srcSet se existir @2x
  const srcSet = meta.src2x ? `${meta.src} 1x, ${meta.src2x} 2x` : undefined

  // Se pose for 'peek' e cardAnchor estiver ativo, posiciona exatamente sobre a borda superior do card
  if (pose === 'peek' && cardAnchor) {
    const anchorPercent = ((meta.anchorY ?? 0.796) * 100).toFixed(1) // 79.6%
    return (
      <div
        className={`absolute left-1/2 -translate-x-1/2 z-20 pointer-events-none select-none ${className}`}
        style={{ top: 0, transform: `translate(-50%, -${anchorPercent}%)` }}
        onClick={onClick}
      >
        <img
          src={meta.src}
          srcSet={srcSet}
          alt={resolvedAlt}
          width={sizeConfig.width}
          height={sizeConfig.height}
          style={{ aspectRatio: '1 / 1' }}
          className={`${sizeConfig.className} object-contain`}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          draggable={false}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      onClick={onClick}
    >
      <img
        src={meta.src}
        srcSet={srcSet}
        alt={resolvedAlt}
        width={sizeConfig.width}
        height={sizeConfig.height}
        style={{ aspectRatio: '1 / 1' }}
        className={`${sizeConfig.className} object-contain ${
          isFloating ? 'animate-mascot-float' : ''
        }`}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        draggable={false}
      />
    </div>
  )
}

export default Mascot
