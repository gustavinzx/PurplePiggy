import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot, MascotPose } from '../components/Mascot'
import { AvatarCropperModal } from '../components/AvatarCropperModal'
import { learnService } from '../features/learn/services/learnService'
import { APP_VERSION_CODE, APP_VERSION_NAME, APP_RELEASE_YEAR } from '../lib/appVersion'
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import {
  initNotificationsChannel,
  requestNotificationPermissions,
  sendLocalNotification,
} from '../lib/nativeNotifications'
import {
  User,
  Bell,
  Shield,
  Info,
  ChevronRight,
  LogOut,
  Sparkles,
  Camera,
  RotateCcw,
  X,
  Landmark,
  SlidersHorizontal,
  Settings,
  Flame,
  Trophy,
  Star,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  BellRing,
  Image as ImageIcon,
  Trash2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

export const compressImageFile = (file: File, maxSize = 512): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height
        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width)
            width = maxSize
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height)
            height = maxSize
          }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(e.target?.result as string)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const AVATAR_PRESETS: { id: string; pose: MascotPose; label: string }[] = [
  { id: 'preset:head', pose: 'head', label: 'Clássico' },
  { id: 'preset:wink', pose: 'wink', label: 'Piscadinha' },
  { id: 'preset:welcome', pose: 'welcome', label: 'Acolhedora' },
  { id: 'preset:trophy', pose: 'trophy', label: 'Campeã' },
  { id: 'preset:graduate', pose: 'graduate', label: 'Estudiosa' },
  { id: 'preset:deposit', pose: 'deposit', label: 'Poupadora' },
]

function formatPhoneBr(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, profile, isDemo, signOut, resetDemoData, refreshProfile } = useAuth()
  const [xpTotal, setXpTotal] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isEvolutionModalOpen, setIsEvolutionModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false)
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false)
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false)
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const [isResettingDemo, setIsResettingDemo] = useState(false)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [croppingImage, setCroppingImage] = useState<string | null>(null)
  const [isCropperOpen, setIsCropperOpen] = useState(false)

  // Conexão Open Finance real
  const [openFinanceActive, setOpenFinanceActive] = useState(true)
  const [openFinanceInstitution, setOpenFinanceInstitution] = useState<string>('Contas e consentimentos')

  // Estados de preferências persistidos em localStorage
  const [prefCurrency, setPrefCurrency] = useState(() => localStorage.getItem('pp_pref_currency') || 'BRL')
  const [prefHideDecimals, setPrefHideDecimals] = useState(() => localStorage.getItem('pp_pref_hide_decimals') === 'true')
  const [prefSoundAlerts, setPrefSoundAlerts] = useState(() => localStorage.getItem('pp_pref_sound') !== 'false')
  const [hideBalance, setHideBalance] = useState<boolean>(profile?.hide_balance ?? false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => localStorage.getItem('pp_pref_sound') !== 'false')
  const [leaderboardOptIn, setLeaderboardOptIn] = useState<boolean>(profile?.leaderboard_opt_in ?? false)
  const [leaderboardNickname, setLeaderboardNickname] = useState<string>(profile?.leaderboard_nickname || '')
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false)

  // Form states para edição abrangente do perfil
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editEmail, setEmail] = useState(profile?.email || '')
  const [editPhone, setEditPhone] = useState(profile?.phone || '')
  const [editBirthDate, setEditBirthDate] = useState(profile?.birth_date || '')
  const [editInitialBalance, setEditInitialBalance] = useState(profile?.initial_balance?.toString() || '0')
  const [editAvatarPreset, setEditAvatarPreset] = useState(profile?.avatar_url || 'preset:head')

  // Alteração de senha dentro do perfil / privacidade
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Notification toggles & limite de alerta do cartão
  const [notifyBudget, setNotifyBudget] = useState(profile?.notify_budget ?? true)
  const [notifyGoals, setNotifyGoals] = useState(profile?.notify_goals ?? true)
  const [notifyLearning, setNotifyLearning] = useState(profile?.notify_learning ?? false)
  const [cardAlertLimit, setCardAlertLimit] = useState(
    profile?.card_alert_limit ? String(profile.card_alert_limit) : '1500'
  )
  const [isSavingNotifications, setIsSavingNotifications] = useState(false)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar campos quando o profile carregar
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '')
      setEmail(profile.email || '')
      setEditPhone(profile.phone || '')
      setEditBirthDate(profile.birth_date || '')
      setEditInitialBalance(String(profile.initial_balance ?? 0))
      setEditAvatarPreset(profile.avatar_url || 'preset:head')
      setNotifyBudget(profile.notify_budget ?? true)
      setNotifyGoals(profile.notify_goals ?? true)
      setNotifyLearning(profile.notify_learning ?? false)
      setCardAlertLimit(profile.card_alert_limit ? String(profile.card_alert_limit) : '1500')
      if (typeof profile.hide_balance === 'boolean') setHideBalance(profile.hide_balance)
    }
  }, [profile])

  // Abrir modal via query param (ex: /perfil?open=notifications vindo do sino da Home)
  useEffect(() => {
    const openParam = searchParams.get('open')
    if (openParam === 'notifications') {
      setIsNotificationsModalOpen(true)
      setSearchParams({}, { replace: true })
    } else if (openParam === 'edit') {
      setIsEditModalOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    if (!user) return
    learnService.getStats().then((s) => {
      if (s) {
        setXpTotal(s.xp_points || 0)
        setCurrentStreak(s.streak_count || 0)
      }
    }).catch(() => {})
    supabase
      .from('bank_connections')
      .select('institution_name, status, provider')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const pluggyConn = data.find((c) => c.provider === 'pluggy') || data[0]
          setOpenFinanceActive(true)
          setOpenFinanceInstitution(`${pluggyConn.institution_name} · Contas e consentimentos`)
        } else {
          setOpenFinanceActive(false)
          setOpenFinanceInstitution('Contas e consentimentos')
        }
      })
  }, [user])

  const userCalculatedLevel = Math.max(1, Math.floor((xpTotal || 0) / 30) + 1)
  const xpInCurrentLevel = (xpTotal || 0) % 30
  const levelProgressPct = Math.min(100, Math.round((xpInCurrentLevel / 30) * 100))

  const openEditModal = () => {
    setEditName(profile?.full_name || '')
    setEmail(profile?.email || user?.email || '')
    setEditPhone(profile?.phone || '')
    setEditBirthDate(profile?.birth_date || '')
    setEditInitialBalance(profile?.initial_balance?.toString() || '0')
    setEditAvatarPreset(profile?.avatar_url || 'preset:head')
    setIsEditModalOpen(true)
  }

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
    if (!editName.trim()) {
      toast.error('O nome não pode ficar em branco.')
      return
    }
    setIsSavingProfile(true)

    try {
      const parsedBalance = parseFloat(editInitialBalance.replace(/\./g, '').replace(',', '.')) || 0

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName.trim(),
          email: editEmail.trim() || profile?.email,
          phone: editPhone.trim() || null,
          birth_date: editBirthDate || null,
          initial_balance: parsedBalance,
          avatar_url: editAvatarPreset || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Se a pessoa também digitou uma nova senha no modal de edição, atualizar
      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          toast.error('A nova senha deve ter pelo menos 6 caracteres.')
          setIsSavingProfile(false)
          return
        }
        if (newPassword !== confirmNewPassword) {
          toast.error('A confirmação da nova senha não confere.')
          setIsSavingProfile(false)
          return
        }
        const { error: pwdErr } = await supabase.auth.updateUser({ password: newPassword })
        if (pwdErr) throw pwdErr
        setNewPassword('')
        setConfirmNewPassword('')
      }

      toast.success('Dados do perfil atualizados com sucesso!')
      setIsEditModalOpen(false)
      await refreshProfile()
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível salvar o perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  useEffect(() => {
    if (profile) {
      setLeaderboardOptIn(profile.leaderboard_opt_in ?? false)
      setLeaderboardNickname(profile.leaderboard_nickname || '')
    }
  }, [profile])

  const handleSaveLeaderboardPrivacy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const sanitized = leaderboardNickname.trim().replace(/@/g, '')
    if (leaderboardOptIn && (sanitized.length < 3 || sanitized.length > 20)) {
      toast.error('O apelido no ranking deve ter entre 3 e 20 caracteres.')
      return
    }

    setIsSavingPrivacy(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          leaderboard_opt_in: leaderboardOptIn,
          leaderboard_nickname: sanitized || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error
      toast.success('Privacidade do ranking atualizada com sucesso!')
      await refreshProfile()
    } catch {
      toast.error('Erro ao atualizar privacidade do ranking.')
    } finally {
      setIsSavingPrivacy(false)
    }
  }

  const handleUpdatePasswordOnly = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('A nova senha precisa ter no mínimo 6 caracteres.')
      return
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('As senhas digitadas não conferem.')
      return
    }

    setIsChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmNewPassword('')
      toast.success('Sua senha foi alterada com sucesso!')
      setIsPrivacyModalOpen(false)
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao alterar a senha.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSaveNotifications = async () => {
    if (!user) return
    setIsSavingNotifications(true)
    try {
      // Solicita permissões nativas se o usuário estiver habilitando notificações
      if (notifyBudget || notifyGoals || notifyLearning) {
        await requestNotificationPermissions()
      }

      const parsedCardLimit = parseFloat(cardAlertLimit.replace(/\./g, '').replace(',', '.')) || 0
      const { error } = await supabase
        .from('profiles')
        .update({
          notify_budget: notifyBudget,
          notify_goals: notifyGoals,
          notify_learning: notifyLearning,
          card_alert_limit: parsedCardLimit,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      // Limpar alertas dispensados anteriormente para que as novas regras apareçam imediatamente
      localStorage.removeItem('pp_dismissed_alert_ids')

      toast.success('Preferências de notificação salvas e ativadas!')
      setIsNotificationsModalOpen(false)
      await refreshProfile()
    } catch {
      toast.error('Erro ao salvar preferências.')
    } finally {
      setIsSavingNotifications(false)
    }
  }

  const handleTestNotificationNow = async () => {
    try {
      const success = await sendLocalNotification(
        'PurplePiggy · Alerta Financeiro',
        `Seus alertas estão ativos! Ofensiva atual: ${currentStreak} dias · Nível ${userCalculatedLevel}.`,
        101
      )
      if (success) {
        toast.success('Notificação nativa enviada com sucesso!')
      } else {
        toast.info('Permissão para notificações não concedida no celular.')
      }
    } catch (err) {
      console.error('Erro ao testar notificação:', err)
      toast.error('Falha ao disparar notificação de teste.')
    }
  }

  // Função nativa do Capacitor para abrir galeria ou câmera (sem editor externo do Android)
  const pickProfilePhoto = async () => {
    if (!user) return
    try {
      // 1. Solicitar permissões explícitas no Android antes de abrir a câmera/galeria
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await CapCamera.checkPermissions()
          if (perm.camera !== 'granted' || perm.photos !== 'granted') {
            await CapCamera.requestPermissions({ permissions: ['camera', 'photos'] })
          }
        } catch (permErr) {
          console.warn('Erro ao solicitar permissões de câmera/fotos:', permErr)
        }
      }

      // 2. Abrir o seletor nativo sem disparar editor externo (allowEditing: false)
      const image = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false, // Não abre app externo do sistema!
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de perfil',
        promptLabelPhoto: 'Escolher da galeria',
        promptLabelPicture: 'Tirar foto',
      })

      if (image?.dataUrl) {
        setCroppingImage(image.dataUrl)
        setIsCropperOpen(true)
      }
    } catch (err: any) {
      if (err?.message?.includes('cancelled') || err?.message?.includes('User cancelled')) {
        return
      }
      console.warn('Fallback para input de arquivo da galeria:', err)
      galleryInputRef.current?.click()
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result) {
        setCroppingImage(event.target.result as string)
        setIsCropperOpen(true)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveCroppedAvatar = async (croppedDataUrl: string, blob: Blob) => {
    if (!user) return
    const toastId = toast.loading('Salvando foto de perfil...')
    try {
      const filePath = `${user.id}/avatar-${Date.now()}.jpg`
      let finalAvatarUrl = croppedDataUrl

      try {
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, blob, { upsert: true, contentType: 'image/jpeg' })

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath)
          if (publicUrlData?.publicUrl) {
            finalAvatarUrl = publicUrlData.publicUrl
          }
        }
      } catch (storageErr) {
        console.warn('Salvando foto cropped diretamente no perfil:', storageErr)
      }

      await supabase
        .from('profiles')
        .update({ avatar_url: finalAvatarUrl })
        .eq('id', user.id)

      setEditAvatarPreset(finalAvatarUrl)
      toast.dismiss(toastId)
      toast.success('Foto de perfil atualizada com sucesso!')
      await refreshProfile()
    } catch {
      toast.dismiss(toastId)
      toast.error('Erro ao salvar foto de perfil.')
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR') {
      toast.error('Digite a palavra EXCLUIR para confirmar.')
      return
    }
    setIsDeletingAccount(true)
    try {
      const { data, error } = await supabase.functions.invoke('recover-password', {
        body: { action: 'delete_account' },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)

      toast.success('Sua conta e todos os seus dados foram excluídos com sucesso.')
      setIsDeleteAccountModalOpen(false)
      await signOut()
      navigate('/boas-vindas')
    } catch (err: any) {
      toast.error(err?.message || 'Não foi possível excluir sua conta agora.')
    } finally {
      setIsDeletingAccount(false)
    }
  }

  const handleCheckUpdate = async () => {
    setIsCheckingUpdate(true)
    try {
      const { data, error } = await supabase
        .from('app_releases')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) {
        toast.info('Seu aplicativo está na versão mais recente disponível!')
        return
      }

      if (data.version_code > APP_VERSION_CODE) {
        toast.success(`Nova versão ${data.version_name} disponível! Iniciando download...`)
        window.open(data.download_url, '_system')
      } else {
        toast.success(`Você já está usando a versão mais recente do PurplePiggy (v${APP_VERSION_NAME})!`)
      }
    } catch {
      toast.error('Não foi possível verificar atualizações no momento.')
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  const renderAvatarContent = (avatarUrl?: string | null) => {
    if (avatarUrl && avatarUrl.startsWith('preset:')) {
      const presetPose = (avatarUrl.replace('preset:', '') as MascotPose) || 'head'
      return <Mascot pose={presetPose} size="xs" alt="Avatar" />
    }
    if (avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'))) {
      return (
        <img
          src={avatarUrl}
          alt={profile?.full_name || 'Avatar'}
          className="w-full h-full object-cover"
        />
      )
    }
    return <Mascot pose="head" size="xs" alt="Avatar" />
  }

  const activeNotificationsCount = [notifyBudget, notifyGoals, notifyLearning].filter(Boolean).length

  return (
    <AppShell
      showNav={true}
      className="py-5 flex flex-col gap-3.5 font-nunito overflow-y-auto"
      contentStyle={{ paddingBottom: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px) + 28px)' }}
    >
      {/* Título da tela */}
      <div className="w-full min-w-0 pt-1">
        <h1 className="text-[22px] font-extrabold text-[#432171] font-nunito tracking-tight mb-0.5">
          Seu perfil
        </h1>
        <p className="text-[13px] font-bold text-[#7D6A9C]">
          Personalize sua experiência PurplePiggy.
        </p>
      </div>

      {/* Card de Perfil da Usuária com espaçamento harmônico e confortável */}
      <div className="w-full bg-white rounded-[26px] p-4.5 pr-5 border border-lilac/15 shadow-card flex items-center justify-between min-w-0">
        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7D2BD6] via-[#B037F8] to-[#CF91F6] p-0.5 flex items-center justify-center shadow-xs">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                {renderAvatarContent(profile?.avatar_url)}
              </div>
            </div>
            <button
              type="button"
              onClick={pickProfilePhoto}
              className="absolute -bottom-1 -right-1 bg-[#7D2BD6] text-white p-1.5 rounded-full cursor-pointer hover:bg-[#6D28C9] shadow-xs transition-transform active:scale-90"
              title="Trocar foto de perfil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-base font-extrabold text-[#432171] font-nunito leading-tight truncate">
              {profile?.full_name || 'Ana Oliveira'}
            </h2>
            <p className="text-xs font-semibold text-[#7D6A9C] mt-0.5 truncate">
              {profile?.email || user?.email || (isDemo ? 'Modo Demonstração' : '')}
            </p>
            {profile?.phone && (
              <p className="text-[11px] font-bold text-[#7D2BD6]/80 mt-0.5 truncate">
                {profile.phone}
              </p>
            )}
          </div>
        </div>

        {/* Botão Editar: pílula com margem interna bem definida, longe do limite da borda */}
        <button
          onClick={openEditModal}
          className="text-xs font-black text-[#7D2BD6] bg-[#F3E8FF] hover:bg-[#E9D5FF] active:scale-95 px-4 py-2 rounded-full shadow-xs transition-all shrink-0 cursor-pointer mr-0.5"
        >
          Editar
        </button>
      </div>

      {/* Card de Conquistas & Evolução (MAIS VISÍVEL, com destaque visual, barra de progresso e métricas claras) */}
      <div
        onClick={() => setIsEvolutionModalOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setIsEvolutionModalOpen(true)}
        className="w-full rounded-[26px] p-4 border-2 border-[#D8B4FE] shadow-[0_10px_26px_rgba(125,43,214,0.12)] flex flex-col gap-3 text-left hover:border-[#7D2BD6] active:scale-[0.99] transition-all cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 55%, #F3E8FF 100%)',
        }}
      >
        <div className="flex items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#F3E8FF] to-[#E9D5FF] border border-[#D8B4FE] flex items-center justify-center shrink-0 shadow-xs">
              <Mascot size="sm" pose="trophy" alt="Mascote conquistas" />
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-black text-[#33105D] leading-tight">
                Conquistas & Evolução
              </h3>
              <p className="text-[12px] font-bold text-[#581C87]/85 mt-0.5">
                Ofensiva ativa e metas em progresso.
              </p>
            </div>
          </div>
          <span className="text-[12px] font-black text-white bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] px-3.5 py-1.5 rounded-full whitespace-nowrap shrink-0 shadow-xs">
            Nível {userCalculatedLevel}
          </span>
        </div>

        {/* Barra de progresso do nível e pílulas de métricas */}
        <div className="bg-white/90 rounded-2xl p-3 border border-[#E9D5FF] flex flex-col gap-2">
          <div className="flex items-center justify-between text-[11px] font-extrabold">
            <span className="text-[#432171] flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Ofensiva: {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
            </span>
            <span className="text-[#7D2BD6]">
              {xpTotal} XP · Faltam {30 - xpInCurrentLevel} XP p/ Nível {userCalculatedLevel + 1}
            </span>
          </div>
          <div className="w-full h-2.5 bg-[#F3E8FF] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#7D2BD6] via-[#9333EA] to-[#F59E0B] transition-all duration-300"
              style={{ width: `${Math.max(12, levelProgressPct)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Seção Minha Conta (5 itens dentro de 1 card com divisores) */}
      <div className="bg-white rounded-[24px] p-3 border border-lilac/15 shadow-card flex flex-col divide-y divide-[#F0EBF8]">
        <div className="text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider px-2 pt-1 pb-2">
          Minha conta
        </div>

        {/* 1. Dados pessoais */}
        <button
          onClick={openEditModal}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DEEEFC] text-[#7D2BD6] flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#432171] block">Dados pessoais</span>
              <span className="text-[10px] font-semibold text-[#7D6A9C]">
                Nome, avatar, telefone e saldo base
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        {/* 2. Preferências */}
        <button
          onClick={() => setIsPreferencesModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#F3E8FF] text-[#7D2BD6] flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#432171] block">Preferências</span>
              <span className="text-[10px] font-semibold text-[#7D6A9C]">
                Moeda ({prefCurrency}), exibição e sons
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        {/* 3. Notificações */}
        <button
          onClick={() => setIsPreferencesModalOpen(true)}
          className="py-3 px-2 flex items-center justify-between text-left hover:bg-bg/50 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-deep">Preferências</span>
          </div>
          <ChevronRight className="w-4 h-4 text-textSec" />
        </button>

        <button
          onClick={() => setIsNotificationsModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#EEDEFB] text-[#B037F8] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#432171] block">Notificações</span>
              <span className="text-[10px] font-semibold text-[#7D6A9C]">
                {activeNotificationsCount} {activeNotificationsCount === 1 ? 'alerta ativo' : 'alertas ativos'} · Teto R$ {cardAlertLimit}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        {/* 4. Privacidade e segurança */}
        <button
          onClick={() => setIsPrivacyModalOpen(true)}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#432171] block">Privacidade e segurança</span>
              <span className="text-[10px] font-semibold text-[#7D6A9C]">
                Alterar senha, recuperação e LGPD
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
        </button>

        {/* 5. Sobre o PurplePiggy */}
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
      <div className="bg-white rounded-[24px] p-3 border border-lilac/15 shadow-card flex flex-col">
        <div className="text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider px-2 pt-1 pb-2">
          Conexões financeiras
        </div>

        <button
          onClick={() => navigate('/open-finance')}
          className="py-2.5 px-2 flex items-center justify-between text-left hover:bg-[#F8F5FC] rounded-xl transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-amber-600 flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#432171]">Open Finance</div>
              <div className="text-[10px] text-[#7D6A9C] font-semibold truncate">
                {openFinanceInstitution}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                openFinanceActive
                  ? 'text-[#15803D] bg-[#DCFCE7]'
                  : 'text-[#7D2BD6] bg-[#F3E8FF]'
              }`}
            >
              {openFinanceActive ? 'Ativa' : 'Conectar'}
            </span>
            <ChevronRight className="w-4 h-4 text-[#7D6A9C]" />
          </div>
        </button>
      </div>

      {/* Restaurar dados se estiver no modo demo */}
      {isDemo && (
        <div className="bg-[#FEF3C7]/60 border border-[#FEDA70] rounded-[24px] p-3.5 flex items-center justify-between">
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

      {/* Botões de Conta */}
      <div className="pt-2 pb-4 flex flex-col gap-2">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 rounded-full border border-rose-300 text-rose-600 hover:bg-rose-50/80 active:scale-95 font-nunito font-extrabold text-sm flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>

        <button
          type="button"
          onClick={() => setIsDeleteAccountModalOpen(true)}
          className="w-full py-2 px-4 text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir minha conta
        </button>
      </div>

      {/* Modal: Detalhes de Conquistas & Evolução */}
      {isEvolutionModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-[#33105D]">
                Conquistas & Evolução
              </h3>
              <button
                onClick={() => setIsEvolutionModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-b from-[#F3E8FF] to-[#E9D5FF] flex items-center justify-center mb-2 shadow-inner">
                <Mascot pose="trophy" size="md" alt="Troféu" />
              </div>
              <span className="text-xs font-black text-white bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] px-4 py-1 rounded-full">
                Nível {userCalculatedLevel}
              </span>
              <p className="text-xs font-bold text-[#7D6A9C] mt-2">
                Você já acumulou <strong>{xpTotal} XP</strong> e está com ofensiva de{' '}
                <strong>{currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}</strong>!
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] flex flex-col items-center text-center">
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500 mb-1" />
                <span className="text-[15px] font-black text-[#33105D]">{currentStreak} dias</span>
                <span className="text-[10px] font-bold text-[#7D6A9C]">Ofensiva Piggy</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF] flex flex-col items-center text-center">
                <Star className="w-5 h-5 text-[#7D2BD6] fill-[#7D2BD6] mb-1" />
                <span className="text-[15px] font-black text-[#33105D]">{xpTotal} XP</span>
                <span className="text-[10px] font-bold text-[#7D6A9C]">Experiência total</span>
              </div>
            </div>

            <div className="space-y-2 mb-5">
              <div className="text-xs font-extrabold text-[#432171]">Medalhas da jornada</div>
              <div className="p-3 rounded-2xl bg-[#F8F5FC] border border-[#E9D5FF] flex items-center gap-3">
                <Trophy className="w-5 h-5 text-[#7D2BD6] shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-extrabold text-[#33105D]">Primeiros Passos</div>
                  <div className="text-[11px] font-semibold text-[#7D6A9C]">
                    Iniciou a organização financeira e a trilha educativa
                  </div>
                </div>
              </div>
            </div>

            <Button
              size="md"
              fullWidth
              onClick={() => {
                setIsEvolutionModalOpen(false)
                navigate('/aprender')
              }}
            >
              Continuar trilha em Aprender
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Editar Perfil Abrangente */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-5 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-3">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Editar dados pessoais
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
              {/* Escolha de Foto da Galeria ou Avatar do Mascote */}
              <div>
                <label className="block text-xs font-bold text-textSec mb-2">
                  Foto de perfil / Avatar
                </label>

                {/* Botão de foto da galeria bem destacado com suporte nativo */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={pickProfilePhoto}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7D2BD6] font-extrabold text-xs transition-colors cursor-pointer border border-[#D8B4FE] shadow-2xs active:scale-98"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>Escolher foto da galeria</span>
                  </button>
                  {editAvatarPreset && (editAvatarPreset.startsWith('http') || editAvatarPreset.startsWith('data:')) && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarPreset('preset:head')}
                      className="py-2.5 px-3 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold cursor-pointer"
                    >
                      Remover foto
                    </button>
                  )}
                </div>

                <span className="block text-[11px] font-bold text-textSec mb-1.5">
                  Ou escolha um dos avatares oficiais:
                </span>
                <div className="grid grid-cols-6 gap-1.5 mb-2">
                  {AVATAR_PRESETS.map((preset) => {
                    const selected = editAvatarPreset === preset.id
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditAvatarPreset(preset.id)}
                        className={`p-1.5 rounded-2xl border flex flex-col items-center justify-center transition-all cursor-pointer ${
                          selected
                            ? 'bg-[#F3E8FF] border-[#7D2BD6] ring-2 ring-[#7D2BD6]/20'
                            : 'bg-[#FAF8FC] border-[#E9D5FF] hover:bg-[#F3E8FF]/50'
                        }`}
                        title={preset.label}
                      >
                        <Mascot pose={preset.pose} size="xs" alt={preset.label} />
                      </button>
                    )
                  })}
                </div>
              </div>

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
                <label className="block text-xs font-bold text-textSec mb-1">E-mail cadastrado</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-textSec mb-1">Telefone / WhatsApp</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(formatPhoneBr(e.target.value))}
                    placeholder="(11) 99999-9999"
                    className="w-full h-11 px-3.5 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-textSec mb-1">Nascimento</label>
                  <input
                    type="date"
                    value={editBirthDate}
                    onChange={(e) => setEditBirthDate(e.target.value)}
                    className="w-full h-11 px-3 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-textSec mb-1">
                  Saldo inicial / Ajuste de conta (R$)
                </label>
                <input
                  type="text"
                  value={editInitialBalance}
                  onChange={(e) => setEditInitialBalance(e.target.value)}
                  placeholder="0,00"
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                />
              </div>

              {/* Opcional: Alterar senha direto na edição */}
              <div className="pt-2 border-t border-lilac/15">
                <label className="block text-xs font-extrabold text-[#432171] mb-1">
                  Alterar senha (deixe em branco para manter a atual)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    className="w-full h-10 px-3 bg-bg border border-lilac/30 rounded-xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Confirmar"
                    className="w-full h-10 px-3 bg-bg border border-lilac/30 rounded-xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                  />
                </div>
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

      {/* Modal: Notificações Funcionais */}
      {isNotificationsModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Preferências de alertas
              </h3>
              <button
                onClick={() => setIsNotificationsModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                <div className="pr-2">
                  <div className="text-xs font-extrabold text-deep">Alertas de orçamento</div>
                  <div className="text-[11px] font-semibold text-textSec">
                    Avisar no sino e ao lançar gastos em 80% e 100% dos limites
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyBudget}
                  onChange={(e) => setNotifyBudget(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                <div className="pr-2">
                  <div className="text-xs font-extrabold text-deep">Conquistas e metas</div>
                  <div className="text-[11px] font-semibold text-textSec">
                    Lembrar de guardar nas metas ativas do mês
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyGoals}
                  onChange={(e) => setNotifyGoals(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer p-2.5 rounded-2xl bg-[#FAF5FF] border border-[#E9D5FF]">
                <div className="pr-2">
                  <div className="text-xs font-extrabold text-deep">Dicas e ofensiva diária</div>
                  <div className="text-[11px] font-semibold text-textSec">
                    Alerta diário para praticar na aba Aprender
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notifyLearning}
                  onChange={(e) => setNotifyLearning(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer shrink-0"
                />
              </label>

              <div>
                <label className="block text-xs font-extrabold text-deep mb-1">
                  Limite de alerta para gastos no cartão (R$)
                </label>
                <input
                  type="text"
                  value={cardAlertLimit}
                  onChange={(e) => setCardAlertLimit(e.target.value)}
                  placeholder="1500"
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-primary"
                />
                <span className="text-[10px] font-semibold text-textSec mt-1 block">
                  Você receberá um alerta quando seus gastos no cartão passarem de 80% deste valor.
                </span>
              </div>

              <button
                type="button"
                onClick={handleTestNotificationNow}
                className="w-full py-2.5 px-4 rounded-2xl bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7D2BD6] font-extrabold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <BellRing className="w-4 h-4" />
                Testar notificação agora
              </button>
            </div>

            <Button size="md" fullWidth loading={isSavingNotifications} onClick={handleSaveNotifications}>
              Salvar preferências
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Preferências do App */}
      {isPreferencesModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Preferências do app
              </h3>
              <button
                onClick={() => setIsPreferencesModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-6">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-deep">Ocultar saldo no início</div>
                  <div className="text-[10px] text-textSec">Privacidade ao abrir o app em público</div>
                </div>
                <input
                  type="checkbox"
                  checked={hideBalance}
                  onChange={(e) => setHideBalance(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-deep">Sons e feedback háptico</div>
                  <div className="text-[10px] text-textSec">Sons suaves ao concluir lições e metas</div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-deep">Moeda padrão</div>
                  <div className="text-[10px] text-textSec">Formatação monetária oficial</div>
                </div>
                <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  BRL (R$)
                </span>
              </div>
            </div>

            <Button
              size="md"
              fullWidth
              onClick={async () => {
                if (user) {
                  await supabase
                    .from('profiles')
                    .update({ hide_balance: hideBalance })
                    .eq('id', user.id)
                  refreshProfile()
                }
                localStorage.setItem('pp_pref_sound', String(soundEnabled))
                toast.success('Preferências salvas com sucesso!')
                setIsPreferencesModalOpen(false)
              }}
            >
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
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
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

              <div className="pt-3 border-t border-lilac/10 flex flex-col items-center gap-2">
                <span className="text-[11px] text-textSec font-bold">
                  PurplePiggy Versão {APP_VERSION_NAME} · {APP_RELEASE_YEAR}
                </span>
                <button
                  type="button"
                  onClick={handleCheckUpdate}
                  disabled={isCheckingUpdate}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7D2BD6] text-[11px] font-black transition-colors cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                  <span>{isCheckingUpdate ? 'Verificando...' : 'Verificar atualizações do app'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Privacidade e Segurança (Alteração de senha + Recuperação + LGPD + Excluir Conta) */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-3">
              <h3 className="text-base font-extrabold text-deep font-sans">
                Privacidade & Segurança
              </h3>
              <button
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulário de redefinição/alteração de senha direto no Perfil */}
            <form onSubmit={handleUpdatePasswordOnly} className="flex flex-col gap-3 mb-4 pb-4 border-b border-lilac/15">
              <div className="text-xs font-extrabold text-[#33105D] flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#7D2BD6]" />
                Alterar senha de acesso
              </div>

              <div className="relative flex items-center">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nova senha (mín. 6 caracteres)"
                  className="w-full h-11 pl-3.5 pr-10 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 text-textSec hover:text-deep cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <input
                type={showNewPassword ? 'text' : 'password'}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full h-11 px-3.5 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                required
              />

              <Button type="submit" size="sm" fullWidth loading={isChangingPassword}>
                Atualizar minha senha
              </Button>

              <button
                type="button"
                onClick={() => {
                  setIsPrivacyModalOpen(false)
                  navigate('/redefinir-senha')
                }}
                className="text-[11px] font-extrabold text-[#7D2BD6] hover:underline text-center pt-1 cursor-pointer"
              >
                Esqueceu a senha atual? Redefinir com código por e-mail
              </button>
            </form>

            {/* Ranking Semanal & Privacidade LGPD (Prompt 3) */}
            <form onSubmit={handleSaveLeaderboardPrivacy} className="flex flex-col gap-3 mb-4 pb-4 border-b border-lilac/15">
              <div className="text-xs font-extrabold text-[#33105D] flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-[#7D2BD6]" />
                Ranking de Estudos e Privacidade
              </div>

              <label className="flex items-center justify-between cursor-pointer p-3 bg-lilac/10 rounded-2xl border border-lilac/20">
                <div>
                  <div className="text-xs font-bold text-[#432171]">Aparecer no ranking semanal</div>
                  <div className="text-[10px] text-textSec">Desativado por padrão para sua privacidade</div>
                </div>
                <input
                  type="checkbox"
                  checked={leaderboardOptIn}
                  onChange={(e) => setLeaderboardOptIn(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              {leaderboardOptIn && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-textSec">
                    Apelido no ranking (3 a 20 caracteres, sem e-mail)
                  </label>
                  <input
                    type="text"
                    value={leaderboardNickname}
                    onChange={(e) => setLeaderboardNickname(e.target.value.replace(/@/g, ''))}
                    placeholder="Ex: PoupadorNinja"
                    maxLength={20}
                    className="w-full h-11 px-3.5 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-xs focus:outline-none focus:border-primary"
                    required={leaderboardOptIn}
                  />
                </div>
              )}

              <p className="text-[10px] text-textSec leading-relaxed">
                <strong>Privacidade garantida (LGPD):</strong> Seu nome real, e-mail e foto nunca são compartilhados. Apenas seu apelido e XP semanal aparecem para outros participantes.
              </p>

              <Button type="submit" size="sm" variant="secondary" fullWidth loading={isSavingPrivacy}>
                Salvar preferências de ranking
              </Button>
            </form>

            <div className="flex flex-col gap-2.5 text-xs text-deep/85 leading-relaxed font-semibold mb-4">
              <div className="flex items-center gap-1.5 text-[#15803D] font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                Proteção LGPD Ativa
              </div>
              <p>
                <strong>Seus dados são seus:</strong> Não vendemos suas informações e todas as conexões são protegidas por Row Level Security (RLS).
              </p>
            </div>

            {/* Zona de Perigo: Excluir conta */}
            <div className="pt-3 border-t border-rose-100 flex flex-col gap-2">
              <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" />
                Excluir conta
              </span>
              <p className="text-[11px] text-textSec font-semibold leading-relaxed">
                Deseja apagar definitivamente seu cadastro, orçamentos, metas e transações do PurplePiggy?
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsPrivacyModalOpen(false)
                  setIsDeleteAccountModalOpen(true)
                }}
                className="py-2 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-extrabold text-xs transition-colors cursor-pointer text-center"
              >
                Solicitar exclusão da conta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Preferências */}
      {isPreferencesModalOpen && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15 mb-4">
              <h3 className="text-base font-extrabold text-[#432171] font-nunito">
                Preferências
              </h3>
              <button
                onClick={() => setIsPreferencesModalOpen(false)}
                className="p-1 rounded-full text-[#7D6A9C] hover:text-[#432171] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-[#7D6A9C] mb-1">Moeda padrão</label>
                <select
                  value={prefCurrency}
                  onChange={(e) => setPrefCurrency(e.target.value)}
                  className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-[#432171] font-bold text-sm focus:outline-none focus:border-primary"
                >
                  <option value="BRL">Real brasileiro (R$ - BRL)</option>
                  <option value="USD">Dólar americano ($ - USD)</option>
                  <option value="EUR">Euro (€ - EUR)</option>
                </select>
              </div>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#432171]">Ocultar centavos</div>
                  <div className="text-[10px] text-[#7D6A9C]">Arredondar valores no dashboard</div>
                </div>
                <input
                  type="checkbox"
                  checked={prefHideDecimals}
                  onChange={(e) => setPrefHideDecimals(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-[#432171]">Alertas com som</div>
                  <div className="text-[10px] text-[#7D6A9C]">Efeitos sonoros ao registrar transação</div>
                </div>
                <input
                  type="checkbox"
                  checked={prefSoundAlerts}
                  onChange={(e) => setPrefSoundAlerts(e.target.checked)}
                  className="w-5 h-5 accent-primary cursor-pointer"
                />
              </label>

              <div>
                <div className="text-xs font-bold text-[#432171] mb-1">Tema visual</div>
                <div className="w-full h-11 px-4 bg-[#F8F5FC] border border-lilac/30 rounded-2xl text-[#7D6A9C] font-bold text-xs flex items-center justify-between">
                  <span>Lilás Claro (V2 Padrão)</span>
                  <span className="text-[10px] bg-[#DCFCE7] text-[#15803D] px-2 py-0.5 rounded-full font-bold">Ativo</span>
                </div>
              </div>
            </div>

            <Button
              size="md"
              fullWidth
              onClick={() => {
                localStorage.setItem('pp_pref_currency', prefCurrency)
                localStorage.setItem('pp_pref_hide_decimals', String(prefHideDecimals))
                localStorage.setItem('pp_pref_sound', String(prefSoundAlerts))
                toast.success('Preferências salvas com sucesso!')
                setIsPreferencesModalOpen(false)
              }}
            >
              Salvar preferências
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Excluir Conta com confirmação de segurança */}
      {isDeleteAccountModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#230B42]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl border-2 border-rose-200 flex flex-col text-left">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 mb-3">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Excluir conta
              </div>
              <button
                onClick={() => {
                  setIsDeleteAccountModalOpen(false)
                  setDeleteConfirmText('')
                }}
                className="p-1 rounded-full text-textSec hover:text-deep cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-bold text-[#432171] leading-relaxed mb-3">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados, transações, metas, orçamentos e conexões serão excluídos permanentemente.
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-4">
              <label className="block text-[11px] font-extrabold text-rose-800 mb-1.5">
                Digite <span className="underline font-black">EXCLUIR</span> no campo abaixo para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="w-full h-11 px-3.5 bg-white border border-rose-300 rounded-xl text-rose-900 font-black text-sm uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteAccountModalOpen(false)
                  setDeleteConfirmText('')
                }}
                className="flex-1 py-3 rounded-full border border-gray-300 text-gray-700 font-extrabold text-xs hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteConfirmText.trim().toUpperCase() !== 'EXCLUIR' || isDeletingAccount}
                onClick={handleDeleteAccount}
                className="flex-1 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isDeletingAccount ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Excluir conta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input de arquivo oculto para fallback em navegadores web */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />

      {/* Editor e Cortador In-App de Foto de Perfil */}
      <AvatarCropperModal
        imageSrc={croppingImage || ''}
        isOpen={isCropperOpen}
        onClose={() => {
          setIsCropperOpen(false)
          setCroppingImage(null)
        }}
        onSaveCropped={handleSaveCroppedAvatar}
      />
    </AppShell>
  )
}
export default ProfilePage
