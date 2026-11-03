import React from 'react'
import { Mascot, MascotPose } from '../components/Mascot'
import { Logo } from '../components/Logo'
import { TopIcon, TopIconName } from '../components/TopIcon'
import { CategoryIcon, CategoryIconName } from '../components/CategoryIcon'
import { Decor, DecorName } from '../components/Decor'

const LAYOUT_POSES: { pose: MascotPose; label: string; desc: string }[] = [
  { pose: 'head', label: 'pig-head', desc: 'Cabeça oficial com moeda no topo' },
  { pose: 'welcome', label: 'pig-welcome', desc: 'Acenando alegremente' },
  { pose: 'peek', label: 'pig-peek', desc: 'Espiando curioso' },
  { pose: 'graduate', label: 'pig-graduate', desc: 'Com capelo de formatura' },
  { pose: 'diploma', label: 'pig-diploma', desc: 'Comemorando com diploma' },
  { pose: 'idea', label: 'pig-idea', desc: 'Com lâmpada acesa' },
  { pose: 'empty', label: 'pig-empty', desc: 'Olhando cofrinho vazio' },
  { pose: 'medal', label: 'pig-medal', desc: 'Com medalha de ouro' },
  { pose: 'trophy', label: 'pig-trophy', desc: 'Erguendo troféu dourado' },
  { pose: 'deposit', label: 'pig-deposit', desc: 'Depositando moeda' },
  { pose: 'retry', label: 'pig-retry', desc: 'Encorajador (tente de novo)' },
  { pose: 'shield', label: 'pig-shield', desc: 'Com escudo de segurança' },
]

const EXTRA_POSES: { pose: MascotPose; label: string; desc: string }[] = [
  { pose: 'connect', label: 'pig-connect', desc: 'Cabos e faísca em coração' },
  { pose: 'loading', label: 'pig-loading', desc: 'Observando moeda girar' },
  { pose: 'success', label: 'pig-success', desc: 'Carimbo e recibo com check' },
  { pose: 'search', label: 'pig-search', desc: 'Pesquisando com lupa' },
]

const TOP_ICONS: { name: TopIconName; label: string }[] = [
  { name: 'icon-controle', label: 'Controle' },
  { name: 'icon-metas', label: 'Metas' },
  { name: 'icon-educacao', label: 'Educação' },
  { name: 'icon-tranquilidade', label: 'Tranquilidade' },
]

const CATEGORY_ICONS: { name: CategoryIconName; label: string }[] = [
  { name: 'cat-moradia', label: 'Moradia' },
  { name: 'cat-alimentacao', label: 'Alimentação' },
  { name: 'cat-transporte', label: 'Transporte' },
  { name: 'cat-saude', label: 'Saúde' },
  { name: 'cat-educacao', label: 'Educação' },
  { name: 'cat-lazer', label: 'Lazer' },
  { name: 'cat-compras', label: 'Compras' },
  { name: 'cat-cuidados-familia', label: 'Cuidados Família' },
  { name: 'cat-outros', label: 'Outros' },
]

const DECOR_ICONS: { name: DecorName; label: string }[] = [
  { name: 'coin-1', label: 'Moeda 3D' },
  { name: 'heart-filled', label: 'Coração Rosa' },
  { name: 'sparkle', label: 'Estrela Lilás' },
  { name: 'confetti', label: 'Confetes' },
]

export const DesignSystemMascotPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F8F5FD] p-6 pb-24 font-sans text-[#2B1B4D]">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="border-b border-[#E8DEF8] pb-6">
          <span className="text-xs font-bold tracking-wider uppercase text-[#7D2BD6]">
            Design System
          </span>
          <h1 className="text-3xl font-extrabold text-[#2B1B4D] mt-1">
            Mascote, Logos e Ícones
          </h1>
          <p className="text-sm text-[#6C5B8B] mt-1">
            Assets aprovados, componentes reutilizáveis e validação visual de alinhamento.
          </p>
        </div>

        {/* 1. Logos */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#2B1B4D]">1. Wordmark & Logos Oficiais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DEF8] flex flex-col items-center justify-center gap-3">
              <span className="text-xs font-semibold text-[#8B7BA5] uppercase">
                Variante Inline
              </span>
              <Logo variant="inline" size="lg" />
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#E8DEF8] flex flex-col items-center justify-center gap-3">
              <span className="text-xs font-semibold text-[#8B7BA5] uppercase">
                Variante Stacked
              </span>
              <Logo variant="stacked" size="lg" />
            </div>
          </div>
        </section>

        {/* 2. Demonstração do Peek sobre Card */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#2B1B4D]">
            2. Demonstração: Pose "Peek" sobre Card
          </h2>
          <p className="text-sm text-[#6C5B8B]">
            O ponto <code className="bg-[#EEDEFB] text-[#7D2BD6] px-1.5 py-0.5 rounded font-mono text-xs">anchor_y: 0.796</code> apoia exatamente as patinhas sobre a borda superior do card, com z-index sobreposto.
          </p>

          <div className="pt-16 pb-4 flex justify-center">
            {/* Card com o Mascot Peek ancorado no topo */}
            <div className="relative w-full max-w-sm bg-gradient-to-br from-[#7D2BD6] to-[#521D83] text-white rounded-3xl p-6 shadow-xl pt-10">
              {/* Mascote Peek apoiado na borda superior */}
              <Mascot pose="peek" size="lg" cardAnchor />

              <div className="flex items-center justify-between opacity-80 text-xs">
                <span>Saldo Oculto</span>
                <span>Toque para ver</span>
              </div>
              <div className="text-3xl font-extrabold mt-1 tracking-tight">
                ••••••••
              </div>
              <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs opacity-75">
                <span>Reserva de Emergência</span>
                <span>100% Protegido</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Mascotes do Layout */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B1B4D]">3. Poses do Layout (12)</h2>
            <span className="text-xs bg-[#EEDEFB] text-[#7D2BD6] font-bold px-2.5 py-1 rounded-full">
              Do Layout
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {LAYOUT_POSES.map((item) => (
              <div
                key={item.pose}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DEF8] flex flex-col items-center text-center gap-2 group hover:shadow-md transition-shadow"
              >
                <div className="h-28 w-28 flex items-center justify-center">
                  <Mascot pose={item.pose} size="md" float={item.pose === 'head'} />
                </div>
                <code className="text-xs font-bold text-[#7D2BD6] bg-[#F3EAFD] px-2 py-0.5 rounded">
                  {item.label}
                </code>
                <span className="text-[11px] text-[#6C5B8B] leading-tight">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Poses de Estados Extras */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2B1B4D]">4. Poses de Estados Extras (4)</h2>
            <span className="text-xs bg-[#D6F4DE] text-[#127A38] font-bold px-2.5 py-1 rounded-full">
              Estados Gerados
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {EXTRA_POSES.map((item) => (
              <div
                key={item.pose}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DEF8] flex flex-col items-center text-center gap-2 group hover:shadow-md transition-shadow"
              >
                <div className="h-28 w-28 flex items-center justify-center">
                  <Mascot pose={item.pose} size="md" float />
                </div>
                <code className="text-xs font-bold text-[#127A38] bg-[#E8F8ED] px-2 py-0.5 rounded">
                  {item.label}
                </code>
                <span className="text-[11px] text-[#6C5B8B] leading-tight">
                  {item.desc}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Ícones de Topo */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#2B1B4D]">5. Ícones de Topo (Sem Quadrado)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TOP_ICONS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DEF8] flex flex-col items-center text-center gap-2"
              >
                <div className="h-16 w-16 flex items-center justify-center">
                  <TopIcon name={item.name} size="lg" />
                </div>
                <code className="text-xs font-bold text-[#7D2BD6]">{item.name}</code>
                <span className="text-xs text-[#6C5B8B]">{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Ícones de Categorias */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#2B1B4D]">6. Ícones de Categorias (Grade 3x3)</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 gap-4 max-w-lg mx-auto">
            {CATEGORY_ICONS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-3 shadow-sm border border-[#E8DEF8] flex flex-col items-center text-center gap-1.5"
              >
                <CategoryIcon name={item.name} size="lg" />
                <span className="text-[11px] font-bold text-[#2B1B4D]">{item.label}</span>
                <code className="text-[10px] text-[#8B7BA5]">{item.name}</code>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Decorações e Moedas */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#2B1B4D]">7. Decorações & Moedas Soltas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {DECOR_ICONS.map((item) => (
              <div
                key={item.name}
                className="bg-white rounded-2xl p-4 shadow-sm border border-[#E8DEF8] flex flex-col items-center text-center gap-2"
              >
                <div className="h-16 w-16 flex items-center justify-center">
                  <Decor name={item.name} size="lg" />
                </div>
                <code className="text-xs font-bold text-[#7D2BD6]">{item.name}</code>
                <span className="text-xs text-[#6C5B8B]">{item.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

export default DesignSystemMascotPage
