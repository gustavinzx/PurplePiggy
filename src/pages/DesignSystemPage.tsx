import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { Radio } from '../components/Radio'
import { Card } from '../components/Card'
import { ProgressBar } from '../components/ProgressBar'
import { ProgressRing } from '../components/ProgressRing'
import { Chip } from '../components/Chip'
import { BottomNav, FloatingActionButton } from '../components/BottomNav'
import { Atmosphere } from '../components/Atmosphere'
import { CategoryTile } from '../components/CategoryIcon'
import { TopIconChip } from '../components/TopIcon'
import { Mascot, type MascotPose } from '../components/Mascot'
import {
  IconUser,
  IconMail,
  IconLock,
  IconPlus,
  IconTrash,
  IconArrowRight,
  IconEye,
} from '../components/AppIcons'
import ref06 from '../../design/telas/06-home.png'
import ref07 from '../../design/telas/07-gastos.png'
import ref09 from '../../design/telas/09-orcamento.png'
import ref10 from '../../design/telas/10-metas.png'

export const DesignSystemPage: React.FC = () => {
  const [testPassword, setTestPassword] = useState('12345678')
  const [inputError, setInputError] = useState('E-mail inválido ou não cadastrado.')
  const [selectedRadio, setSelectedRadio] = useState('opcao1')
  const [selectedCardRadio, setSelectedCardRadio] = useState('diag2')
  const [selectedMonth, setSelectedMonth] = useState('current')
  const [selectedCategory, setSelectedCategory] = useState('moradia')

  return (
    <div className="relative min-h-screen bg-bg text-deep font-sans pb-28 pt-8 px-4 max-w-[480px] mx-auto select-none overflow-x-hidden">
      {/* Fundo com atmosfera oficial (variante app, calma) */}
      <Atmosphere variant="app" />

      {/* Cabeçalho */}
      <header className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            PurplePiggy DS
          </span>
          <span className="text-xs font-bold text-textSec">Nunito · 390px Viewport</span>
        </div>
        <h1 className="text-2xl font-extrabold text-deep">Design System</h1>
        <p className="text-xs font-semibold text-textSec mt-0.5">
          Cards, progresso, navegação, botões e tokens canônicos fiéis ao layout oficial.
        </p>

        {/* Links de navegação interna do Design System */}
        <div className="flex flex-wrap gap-2 mt-3">
          <Link
            to="/design-system/atmosphere"
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors"
          >
            <span>🌌 Fundo & Atmosfera (Prompt 09)</span>
          </Link>
          <Link
            to="/design-system/mascot"
            className="text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 transition-colors"
          >
            <span>🐷 Mascotes Oficiais (Prompt 07)</span>
          </Link>
          <Link
            to="/design-system/learn"
            className="text-xs font-bold text-white bg-gradient-to-r from-[#7D2BD6] to-[#8E2DE2] hover:brightness-105 px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Desafio Piggy (Chunky)
          </Link>
        </div>
      </header>

      {/* SEÇÃO 1: CARDS E CARD DE SALDO */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>1. Cards (Prompt 11)</span>
          <span className="text-[10px] text-primary lowercase font-mono">raio 24px · vidro suave</span>
        </h2>

        <div className="flex flex-col gap-3.5">
          {/* Card de Saldo (Degradê Roxo Escuro Oficial) */}
          <Card variant="saldo">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[13px] text-white/90 font-medium">Saldo disponível</span>
              <button
                type="button"
                className="text-white/90 hover:text-white p-1 rounded-full transition-opacity"
                aria-label="Ocultar saldo"
              >
                <IconEye size={18} />
              </button>
            </div>
            <div className="text-[28px] font-extrabold text-white mb-3 tracking-tight leading-tight">
              R$ 2.540,00
            </div>
            <div className="flex justify-between items-center text-[11px] font-bold">
              <Chip variant="positive">+ 12%</Chip>
              <span className="text-white/80 font-medium">Atualizado hoje</span>
            </div>
          </Card>

          {/* Card Padrão (Vidro Claro, Raio 24px, Borda Lilás Suave) */}
          <Card variant="white">
            <div className="flex justify-between items-center mb-2">
              <span className="font-extrabold text-deep text-[15px]">Card Padrão (Vidro Claro)</span>
              <span className="text-xs font-bold text-primary">R$ 1.420,00</span>
            </div>
            <p className="text-xs font-semibold text-textSec leading-relaxed">
              Fundo translúcido com leve desfoque (backdrop-blur-md), borda lilás fina a 50% e sombra difusa sem corte duro.
            </p>
          </Card>

          {/* Cards Suaves: Baby e Lilás */}
          <div className="grid grid-cols-2 gap-3">
            <Card variant="baby" size="sm">
              <span className="text-xs font-extrabold text-deep block mb-1">Informativo</span>
              <span className="text-[11px] font-semibold text-textSec leading-tight">
                Card azul-bebê (#DEEEFC) para dicas.
              </span>
            </Card>
            <Card variant="lilac" size="sm">
              <span className="text-xs font-extrabold text-deep block mb-1">Reserva</span>
              <span className="text-[11px] font-semibold text-textSec leading-tight">
                Card lilás (#F8E9FE) para incentivo.
              </span>
            </Card>
          </div>
        </div>
      </section>

      {/* SEÇÃO 2: PROGRESSO (BARRAS E ANÉIS) */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>2. Progresso (Prompt 11)</span>
          <span className="text-[10px] text-primary lowercase font-mono">degradê dourado · anéis</span>
        </h2>

        <div className="bg-white/90 backdrop-blur rounded-[22px] p-5 border border-lilac/20 shadow-card flex flex-col gap-4">
          {/* Barra Simples */}
          <div>
            <div className="flex justify-between text-xs font-extrabold mb-1.5 text-deep">
              <span>Barra de Progresso Simples (Pílula, Degradê Roxo)</span>
              <span className="text-primary-dark">75%</span>
            </div>
            <ProgressBar progress={75} height={12} />
          </div>

          {/* Barra Empilhada por Categoria */}
          <div className="pt-2 border-t border-lilac/10">
            <div className="flex justify-between text-xs font-extrabold mb-1.5 text-deep">
              <span>Barra Empilhada por Categoria (Painel de Gastos)</span>
              <span className="text-textSec font-bold">R$ 1.420,00</span>
            </div>
            <ProgressBar
              segments={[
                { value: 42, color: '#7D2BD6', label: 'Moradia (42%)' },
                { value: 26, color: '#FF79A8', label: 'Alimentação (26%)' },
                { value: 18, color: '#FEDA70', label: 'Lazer (18%)' },
                { value: 14, color: '#2FBF71', label: 'Transporte (14%)' },
              ]}
              height={12}
            />
            {/* Legenda das categorias */}
            <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-bold">
              <span className="inline-flex items-center gap-1 text-deep">
                <span className="w-2 h-2 rounded-full bg-[#7D2BD6]" /> Moradia
              </span>
              <span className="inline-flex items-center gap-1 text-deep">
                <span className="w-2 h-2 rounded-full bg-[#FF79A8]" /> Alimentação
              </span>
              <span className="inline-flex items-center gap-1 text-deep">
                <span className="w-2 h-2 rounded-full bg-[#FEDA70]" /> Lazer
              </span>
              <span className="inline-flex items-center gap-1 text-deep">
                <span className="w-2 h-2 rounded-full bg-[#2FBF71]" /> Transporte
              </span>
            </div>
          </div>

          {/* Anéis de Progresso SVG das Metas */}
          <div className="pt-2 border-t border-lilac/10">
            <span className="text-xs font-extrabold text-deep block mb-3">
              Anéis das Metas (SVG, Traço Arredondado, Degradê Dourado-Laranja #F5B83D → #F08A3C):
            </span>
            <div className="flex justify-around items-center">
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing progress={60} size={54} strokeWidth={5.5} variant="gold" />
                <span className="text-[11px] font-extrabold text-deep">Reserva</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing progress={35} size={54} strokeWidth={5.5} variant="gold" />
                <span className="text-[11px] font-extrabold text-deep">Viagem</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing progress={20} size={54} strokeWidth={5.5} variant="gold" />
                <span className="text-[11px] font-extrabold text-deep">Notebook</span>
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <ProgressRing progress={85} size={54} strokeWidth={5.5} variant="purple" />
                <span className="text-[11px] font-extrabold text-deep">Meta Roxo</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 3: TILES DE CATEGORIAS */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>3. Tiles de Categorias (Prompt 11)</span>
          <span className="text-[10px] text-primary lowercase font-mono">rounded-2xl · lilás claro</span>
        </h2>

        <div className="bg-white/90 backdrop-blur rounded-[22px] p-5 border border-lilac/20 shadow-card">
          <div className="grid grid-cols-4 gap-3">
            {[
              { id: 'moradia', label: 'Moradia' },
              { id: 'alimentacao', label: 'Alimentação' },
              { id: 'transporte', label: 'Transporte' },
              { id: 'saude', label: 'Saúde' },
              { id: 'educacao', label: 'Educação' },
              { id: 'lazer', label: 'Lazer' },
              { id: 'compras', label: 'Compras' },
              { id: 'cuidados-familia', label: 'Família' },
            ].map((cat) => (
              <CategoryTile
                key={cat.id}
                name={cat.id as any}
                label={cat.label}
                selected={selectedCategory === cat.id}
                onClick={() => setSelectedCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* SEÇÃO 4: CHIPS DOS 4 ÍCONES DE TOPO */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>4. Chips dos 4 Ícones de Topo (Prompt 11)</span>
          <span className="text-[10px] text-primary lowercase font-mono">cabeçalho oficial</span>
        </h2>

        <div className="grid grid-cols-4 gap-2">
          <TopIconChip name="icon-controle" label="Controle total" />
          <TopIconChip name="icon-metas" label="Metas fáceis" />
          <TopIconChip name="icon-educacao" label="Educação" />
          <TopIconChip name="icon-tranquilidade" label="Tranquilidade" />
        </div>
      </section>

      {/* SEÇÃO 5: NAVEGAÇÃO E BOTÃO FLUTUANTE */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>5. Navegação & Botão Flutuante (Prompt 11)</span>
          <span className="text-[10px] text-primary lowercase font-mono">bottom nav · FAB</span>
        </h2>

        <div className="flex flex-col gap-4">
          {/* Botão Flutuante de Exemplo (renderizado inline para visualização) */}
          <div className="bg-white/90 backdrop-blur rounded-[22px] p-5 border border-lilac/20 shadow-card">
            <span className="text-xs font-extrabold text-deep block mb-3">
              Botão Flutuante de Ação Rápida (fixado acima da barra nas telas 07, 09 e 10):
            </span>
            <FloatingActionButton isFixed={false} icon={<IconPlus size={18} />}>
              + Adicionar gasto
            </FloatingActionButton>
          </div>

          {/* Bottom Navigation com 5 Itens */}
          <div>
            <span className="text-xs font-extrabold text-deep block mb-2">
              Bottom Navigation (Início, Gastos, Metas, Aprender, Perfil):
            </span>
            <div className="rounded-t-nav overflow-hidden border border-lilac/20 shadow-nav bg-white">
              <BottomNav isFixed={false} />
            </div>
          </div>
        </div>
      </section>

      {/* SEÇÃO 6: BOTÕES E INPUTS (PROMPT 10) */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3">
          6. Botões, Inputs, Rádio e Chips (Prompt 10)
        </h2>
        <div className="bg-white/90 backdrop-blur rounded-[22px] p-5 border border-lilac/20 shadow-card flex flex-col gap-4">
          <div className="flex flex-col gap-2.5">
            <Button variant="primary" fullWidth icon={<IconArrowRight className="w-5 h-5" />}>
              Botão Primário
            </Button>
            <Button variant="secondary" fullWidth>
              Botão Secundário Contorno
            </Button>
            <Button variant="destructive" fullWidth icon={<IconTrash className="w-4 h-4" />}>
              Botão Destrutivo
            </Button>
          </div>

          <Input
            label="Input com Ícone Roxo"
            placeholder="Nome completo"
            icon={<IconUser size={20} />}
            defaultValue="Ana Oliveira"
          />

          <div className="flex flex-wrap gap-2 items-center">
            <Chip variant="filter" hasDropdown>
              Este mês
            </Chip>
            <Chip variant="filter" hasDropdown>
              Todas
            </Chip>
            <Chip variant="positive">+ 12%</Chip>
            <Chip variant="negative">Despesa</Chip>
          </div>
        </div>
      </section>

      {/* SEÇÃO 7: COMPARAÇÃO COM AS TELAS 06, 07, 09 E 10 */}
      <section className="mb-8">
        <h2 className="text-xs uppercase tracking-wider font-extrabold text-textSec mb-3 flex items-center justify-between">
          <span>7. Comparação Visual com o Layout Oficial</span>
          <span className="text-[10px] text-primary lowercase font-mono">telas 06, 07, 09, 10</span>
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Tela 06 - Home */}
          <div className="bg-white/80 rounded-2xl p-2.5 border border-lilac/20 shadow-xs flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-deep mb-1">06. Início (Home)</span>
            <div className="w-full aspect-[9/13] rounded-lg overflow-hidden border border-lilac/20 bg-bg mb-1.5">
              <img
                src={ref06}
                alt="Tela 06 Home"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[9px] font-semibold text-textSec leading-tight">
              Card de saldo escuro, anéis e bottom nav
            </span>
          </div>

          {/* Tela 07 - Gastos */}
          <div className="bg-white/80 rounded-2xl p-2.5 border border-lilac/20 shadow-xs flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-deep mb-1">07. Gastos</span>
            <div className="w-full aspect-[9/13] rounded-lg overflow-hidden border border-lilac/20 bg-bg mb-1.5">
              <img
                src={ref07}
                alt="Tela 07 Gastos"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[9px] font-semibold text-textSec leading-tight">
              Filtro pílula e botão flutuante "+ Adicionar gasto"
            </span>
          </div>

          {/* Tela 09 - Orçamento */}
          <div className="bg-white/80 rounded-2xl p-2.5 border border-lilac/20 shadow-xs flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-deep mb-1">09. Orçamento</span>
            <div className="w-full aspect-[9/13] rounded-lg overflow-hidden border border-lilac/20 bg-bg mb-1.5">
              <img
                src={ref09}
                alt="Tela 09 Orçamento"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[9px] font-semibold text-textSec leading-tight">
              Barras de progresso e "+ Ajustar orçamento"
            </span>
          </div>

          {/* Tela 10 - Metas */}
          <div className="bg-white/80 rounded-2xl p-2.5 border border-lilac/20 shadow-xs flex flex-col items-center text-center">
            <span className="text-[11px] font-extrabold text-deep mb-1">10. Metas</span>
            <div className="w-full aspect-[9/13] rounded-lg overflow-hidden border border-lilac/20 bg-bg mb-1.5">
              <img
                src={ref10}
                alt="Tela 10 Metas"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-[9px] font-semibold text-textSec leading-tight">
              Anéis de progresso circulares e "+ Criar meta"
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default DesignSystemPage
