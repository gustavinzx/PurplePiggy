import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { formatCurrency } from '../lib/format'
import {
  User,
  Settings,
  Bell,
  Shield,
  Info,
  ChevronRight,
  LogOut,
  Sparkles,
  Camera,
  RotateCcw,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, profile, isDemo, signOut, resetDemoData, refreshProfile } = useAuth()

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)
  const [isResettingDemo, setIsResettingDemo] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Form states para edição
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editPhone, setEditPhone] = useState(profile?.phone || '')
  const [editInitialBalance, setEditInitialBalance] = useState(profile?.initial_balance?.toString() || '0')

  // Notification toggles
  const [notifyBudget, setNotifyBudget] = useState(profile?.notify_budget ?? true)
  const [notifyGoals, setNotifyGoals] = useState(profile?.notify_goals ?? true)
  const [notifyLearning, setNotifyLearning] = useState(profile?.notify_learning ?? false)

  const handleSignOut = async () => {
    await signOut()
    toast.success('Você saiu da sua conta. Até breve!')
    navigate('/')
  }

  const handleResetDemo = async () => {
    setIsResettingDemo(true)
    const { error } = await resetDemoData()
    setIsResettingDemo(false)
    if (error) {
      toast.error('Erro ao restaurar dados demonstrativos.')
    } else {
      toast.success('Dados demonstrativos de Ana Oliveira restaurados!')
      navigate('/inicio')
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSavingProfile(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          phone: editPhone.trim() || null,
          initial_balance: parseFloat(editInitialBalance.replace(',', '.')) || 0,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Perfil atualizado com sucesso!')
      setIsEditModalOpen(false)
      refreshProfile()
    } catch (err) {
      toast.error('Não foi possível salvar o perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    try {
      await supabase
        .from('profiles')
        .update({
          notify_budget: notifyBudget,
          notify_goals: notifyGoals,
          notify_learning: notifyLearning,
        })
        .eq('id', user.id)

      toast.success('Preferências de notificação salvas!')
      setIsNotificationsModalOpen(false)
      refreshProfile()
    } catch (err) {
      toast.error('Erro ao salvar preferências.')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 2 MB.')
      return
    }

    try {
      const ext = file.name.split('.').pop()
      const filePath = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq('id', user.id)

      toast.success('Foto de perfil atualizada!')
      refreshProfile()
    } catch (err) {
      toast.error('Erro ao enviar imagem.')
    }
  }

  return (
    <AppShell showNav={true} className="py-5 flex flex-col gap-4 font-nunito">
      {/* Título da tela */}
      <div className="w-full min-w-0 pt-1">
        <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight mb-0.5">
          Seu perfil
        </h1>
        <p className="text-[13px] font-bold text-[#7D6A9C]">
          Personalize sua experiência PurplePiggy.
        </p>
      </div>

      {/* Card de Perfil da Usuária (Layout oficial) */}
      <div className="w-full bg-white rounded-[24px] p-4.5 border border-lilac/15 shadow-card flex items-center justify-between min-w-0">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7D2BD6] via-[#B037F8] to-[#CF91F6] p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Mascot pose="head" size="xs" alt="Avatar" />
                )}
              </div>
            </div>
            <label className="absolute -bottom-1 -right-1 bg-[#7D2BD6] text-white p-1 rounded-full cursor-pointer hover:bg-[#6D28C9] shadow-xs transition-colors">
              <Camera className="w-3 h-3" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-[#432171] font-nunito leading-tight truncate">
              {profile?.full_name || 'Ana Oliveira'}
            </h2>
            <p className="text-xs font-semibold text-[#7D6A9C] mt-0.5 truncate">
              {profile?.email || 'ana@email.com'}
            </p>
          </div>
        </div>

        {/* Botão Secundário na cor rosa oficial da marca (#FF79A8) */}
        <button
          onClick={() => {
            setEditName(profile?.full_name || '')
            setEditPhone(profile?.phone || '')
            setEditInitialBalance(profile?.initial_balance?.toString() || '0')
            setIsEditModalOpen(true)
          }}
          className="text-xs font-bold text-white bg-[#FF79A8] hover:bg-[#FF6096] active:scale-95 px-3.5 py-1.5 rounded-full shadow-xs transition-all shrink-0 cursor-pointer"
        >
          Editar
        </button>
      </div>

      {/* Card de Conquistas & Medalhas do Usuário */}
      <div className="bg-white rounded-[22px] p-3.5 border border-lilac/15 shadow-card flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#FEDA70]/25 flex items-center justify-center shrink-0">
            <Mascot size="xs" pose="medal" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-extrabold text-[#432171] leading-tight">Conquistas & Evolução</h3>
            <p className="text-[11px] font-semibold text-[#7D6A9C] truncate">
              Ofensiva ativa e metas em progresso contínuo.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-black text-[#432171] bg-gradient-to-r from-[#FEDA70]/30 to-[#CF91F6]/25 border border-[#FEDA70]/70 px-2.5 py-1 rounded-full shrink-0">
          Nível 3
        </span>
      </div>

      {/* Seção Minha Conta */}
      <div className="bg-white rounded-[22px] p-3 border border-lilac/15 shadow-card flex flex-col divide-y divide-lilac/10">
        <div className="text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider px-2 pt-1 pb-2">
          Minha conta
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DEEEFC] text-[#7D2BD6] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#432171]">Dados pessoais</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        <button
          onClick={() => setIsNotificationsModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#EEDEFB] text-[#B037F8] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#432171]">Notificações</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#432171]">Privacidade e segurança</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        <button
          onClick={() => setIsAboutModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#FCE7F3] text-[#BE185D] flex items-center justify-center">
              <Info className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-[#432171]">Sobre o PurplePiggy</span>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>
      </div>

      {/* Seção Conexões Financeiras */}
      <div className="bg-white rounded-[22px] p-3 border border-lilac/15 shadow-card flex flex-col">
        <div className="text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider px-2 pt-1 pb-2">
          Conexões financeiras
        </div>

        <button
          onClick={() => navigate('/open-finance')}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#F3E8FF] text-[#7D2BD6] flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#432171]">Open Finance</div>
              <div className="text-[10px] text-[#7D6A9C] font-semibold">Contas bancárias e consentimentos</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
              Ativa
            </span>
            <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
          </div>
        </button>
      </div>

      {/* Restaurar dados se estiver no modo demo */}
      {isDemo && (
        <div className="bg-[#FEF3C7]/60 border border-[#FEDA70] rounded-[22px] p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FEDA70] text-[#78350F] flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#432171]">Dados demonstrativos</div>
              <div className="text-[10px] text-[#7D6A9C] font-semibold truncate">
                Restaura o conjunto fictício de Ana Oliveira
              </div>
            </div>
          </div>
          <button
            onClick={handleResetDemo}
            disabled={isResettingDemo}
            className="text-xs font-bold text-[#78350F] bg-[#FEDA70] hover:bg-[#FBBF24] active:scale-95 py-1.5 px-3 rounded-full flex items-center gap-1 shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {isResettingDemo ? 'Restaurando...' : 'Restaurar'}
          </button>
        </div>
      )}

      {/* Botão Sair da conta (Layout oficial) */}
      <div className="pt-1">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50/80 active:scale-95 font-nunito font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>

      {/* Modal: Editar Perfil */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Editar dados pessoais
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Nome completo</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Telefone (opcional)</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">Saldo inicial (R$)</label>
                <input
                  type="text"
                  value={editInitialBalance}
                  onChange={(e) => setEditInitialBalance(e.target.value)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" size="md" fullWidth loading={isSavingProfile}>
                  Salvar alterações
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Notificações */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Preferências de alertas
              </h3>
              <button
                onClick={() => setIsNotificationsModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-deep">Alertas de orçamento</div>
                  <div className="text-[10px] text-textSec">Ao atingir 80% e 100% dos limites</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBudget}
                  onChange={(e) => setNotifyBudget(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-deep">Conquistas de metas</div>
                  <div className="text-[10px] text-textSec">Avisar ao alcançar marcos importantes</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyGoals}
                  onChange={(e) => setNotifyGoals(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-deep">Dicas de educação</div>
                  <div className="text-[10px] text-textSec">Lembrete amigável para novas lições</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLearning}
                  onChange={(e) => setNotifyLearning(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>
            </div>

            <Button size="md" fullWidth onClick={handleSaveNotifications}>
              Salvar preferências
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Sobre o PurplePiggy (MVV Oficial) */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-3">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Sobre o PurplePiggy
              </h3>
              <button
                onClick={() => setIsAboutModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-deep/85 leading-relaxed font-semibold">
              <div>
                <strong className="text-primary block font-extrabold">Missão:</strong>
                Ajudar mulheres a entender e controlar o próprio dinheiro, com planejamento personalizado e educação financeira acessível, para que saiam do endividamento ou nunca entrem nele.
              </div>

              <div>
                <strong className="text-primary block font-extrabold">Visão:</strong>
                Ser a principal referência em educação e controle financeiro para mulheres no Brasil, promovendo autonomia e segurança para cada usuária.
              </div>

              <div>
                <strong className="text-primary block font-extrabold">Valores:</strong>
                Autonomia (o app orienta, não impõe), Educação, Acolhimento, Transparência, Privacidade e segurança (LGPD), Inclusão.
              </div>

              <div className="pt-2 text-center text-[10px] text-textSec font-bold border-t border-lilac/10">
                PurplePiggy Versão 1.0.0 · 2026
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Privacidade e Segurança (LGPD) */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-3">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Privacidade & Segurança
              </h3>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-deep/85 leading-relaxed font-semibold">
              <p>
                <strong>Seus dados são seus:</strong> Nós não vendemos suas informações, não exibimos anúncios comerciais e não oferecemos crédito rotativo.
              </p>
              <p>
                <strong>Segurança em primeiro lugar:</strong> Todas as informações financeiras são protegidas por criptografia de ponta a ponta e políticas de Row Level Security (RLS) no banco de dados.
              </p>
              <p>
                <strong>Conformidade LGPD:</strong> Você tem total autonomia para visualizar, editar ou solicitar a exclusão definitiva dos seus dados a qualquer momento.
              </p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
