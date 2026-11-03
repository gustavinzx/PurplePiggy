import React from 'react'
import { Decor } from './Decor'

export type AtmosphereVariant = 'splash' | 'auth' | 'app'

export interface AtmosphereProps {
  variant?: AtmosphereVariant
  children?: React.ReactNode
  className?: string
  /** Oculta decorações mantendo apenas degradê e manchas orgânicas */
  plain?: boolean
}

/**
 * Componente Atmosphere: camada de ambiência visual de fundo do PurplePiggy.
 * Reproduz fielmente o degradê lilás, as manchas orgânicas (blobs) nos cantos,
 * estrelas de 4 pontas (sparkle), corações (heart-filled) e moedas douradas (coin-1) cortadas na borda.
 *
 * Variantes:
 * - 'splash': Tela de splash e boas-vindas (mais lúdica, moedas cortadas na borda, corações e sparkles).
 * - 'auth': Telas de cadastro e login (acolhedora, equilibrada para foco nos inputs).
 * - 'app': Telas internas do app (mais calma, degradê suave e blobs, brilhos discretos sem interferir na leitura).
 */
export const Atmosphere: React.FC<AtmosphereProps> = ({
  variant = 'app',
  children,
  className = '',
  plain = false,
}) => {
  const backgroundContent = (
    <div
      className="fixed inset-0 pointer-events-none select-none overflow-hidden -z-10 bg-gradient-to-b from-[#F6EEFF] via-[#F8F5FC] to-[#E9D8FF]"
      aria-hidden="true"
    >
      {/* 1. Mancha orgânica grande lilás no canto superior esquerdo */}
      <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-[#EEDEFB]/70 blur-3xl pointer-events-none" />

      {/* 2. Mancha orgânica grande azul-bebê no canto superior direito */}
      <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#DEEEFC]/60 blur-3xl pointer-events-none" />

      {/* 3. Mancha suave lilás intermediária na lateral inferior */}
      <div className="absolute top-1/2 -right-24 w-88 h-88 rounded-full bg-[#F5E6FC]/50 blur-3xl pointer-events-none" />

      {/* Decorações por variante (utilizando estritamente os PNGs aprovados via <Decor>) */}
      {!plain && (
        <>
          {/* VARIANTE SPLASH (Telas 01 e 02) */}
          {variant === 'splash' && (
            <>
              {/* Moeda dourada parcialmente cortada no canto superior direito */}
              <div className="absolute -top-4 -right-5 opacity-90 drop-shadow-sm">
                <Decor name="coin-1" size="lg" className="rotate-12" />
              </div>

              {/* Moeda dourada menor parcialmente cortada na lateral inferior esquerda */}
              <div className="absolute bottom-28 -left-5 opacity-75 drop-shadow-xs">
                <Decor name="coin-1" size="md" className="-rotate-12" />
              </div>

              {/* Estrelas de 4 pontas (sparkles) espalhadas */}
              <div className="absolute top-12 left-7 opacity-85">
                <Decor name="sparkle" size="sm" />
              </div>
              <div className="absolute top-28 right-8 opacity-75">
                <Decor name="sparkle" size="xs" />
              </div>
              <div className="absolute top-64 right-5 opacity-80">
                <Decor name="sparkle" size="sm" />
              </div>
              <div className="absolute bottom-36 left-10 opacity-70">
                <Decor name="sparkle" size="xs" />
              </div>

              {/* Corações espalhados de forma discreta */}
              <div className="absolute top-48 right-7 opacity-80">
                <Decor name="heart-filled" size="xs" className="rotate-12" />
              </div>
              <div className="absolute bottom-48 left-7 opacity-75">
                <Decor name="heart-filled" size="xs" className="-rotate-6" />
              </div>
            </>
          )}

          {/* VARIANTE AUTH (Telas 03, 04, 05) */}
          {variant === 'auth' && (
            <>
              {/* Moeda cortada sutilmente na borda superior direita */}
              <div className="absolute -top-3 -right-4 opacity-75 drop-shadow-xs">
                <Decor name="coin-1" size="md" className="rotate-6" />
              </div>

              {/* Estrelas de 4 pontas (sparkles) discretas */}
              <div className="absolute top-14 left-8 opacity-80">
                <Decor name="sparkle" size="sm" />
              </div>
              <div className="absolute top-24 right-10 opacity-75">
                <Decor name="sparkle" size="xs" />
              </div>
              <div className="absolute bottom-24 right-6 opacity-60">
                <Decor name="sparkle" size="xs" />
              </div>

              {/* Coração sutil */}
              <div className="absolute top-60 left-6 opacity-65">
                <Decor name="heart-filled" size="xs" className="-rotate-12" />
              </div>
            </>
          )}

          {/* VARIANTE APP (Telas internas como 06-home) - Mais calma, sem moedas cortadas */}
          {variant === 'app' && (
            <>
              {/* Brilhos discretos sem poluição visual */}
              <div className="absolute top-12 right-8 opacity-45">
                <Decor name="sparkle" size="xs" />
              </div>
              <div className="absolute top-52 left-6 opacity-35">
                <Decor name="sparkle" size="xs" />
              </div>
            </>
          )}
        </>
      )}
    </div>
  )

  // Se houver children, envolve num container com a atmosfera aplicada como plano de fundo
  if (children) {
    return (
      <div className={`relative min-h-screen w-full overflow-x-hidden ${className}`}>
        {backgroundContent}
        {children}
      </div>
    )
  }

  return backgroundContent
}

export default Atmosphere
