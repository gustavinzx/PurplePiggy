import React, { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Mascot } from '../components/Mascot'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

type Step = 'request' | 'verify_code' | 'link_recovery' | 'success'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [userName, setUserName] = useState('')
  const [code, setCode] = useState('')
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null)
  const [emailSentStatus, setEmailSentStatus] = useState(false)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Detectar se o usuário abriu a tela pelo link de recuperação do e-mail (#type=recovery ou PASSWORD_RECOVERY)
  useEffect(() => {
    const hash = window.location.hash || ''
    const mode = searchParams.get('mode')
    if (hash.includes('type=recovery') || mode === 'recovery') {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session?.user) {
          setEmail(data.session.user.email || '')
          setStep('link_recovery')
        }
      })
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setEmail(session.user.email || '')
        setStep('link_recovery')
      }
    })

    return () => subscription.unsubscribe()
  }, [searchParams])

  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = email.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      toast.error('Informe seu e-mail cadastrado válido.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('recover-password', {
        body: {
          action: 'request',
          email: cleanEmail,
          redirectTo: `${window.location.origin}/redefinir-senha?mode=recovery`,
        },
      })

      if (error || data?.error) {
        toast.error(data?.error || 'Não encontramos uma conta com este e-mail.')
        return
      }

      setUserName(data?.fullName || 'Usuária')
      setEmailSentStatus(Boolean(data?.emailSent))
      if (data?.recoveryCode) {
        setGeneratedCodeHint(String(data.recoveryCode))
      }
      setStep('verify_code')
      toast.success('Solicitação enviada! Digite o código de 6 dígitos para criar sua nova senha.')
    } catch {
      toast.error('Ocorreu um erro ao solicitar a recuperação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code || code.trim().length < 6) {
      toast.error('Digite o código de 6 dígitos.')
      return
    }
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas digitadas não conferem.')
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('recover-password', {
        body: {
          action: 'verify_and_reset',
          email: email.trim().toLowerCase(),
          code: code.trim(),
          newPassword,
        },
      })

      if (error || data?.error) {
        toast.error(data?.error || 'Código inválido ou expirado.')
        return
      }

      setStep('success')
      toast.success('Senha redefinida com sucesso!')
    } catch {
      toast.error('Não foi possível redefinir a senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkRecoveryReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas digitadas não conferem.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        toast.error(error.message || 'Erro ao salvar a nova senha.')
        return
      }
      setStep('success')
      toast.success('Nova senha salva com sucesso!')
    } catch {
      toast.error('Erro inesperado ao atualizar senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell variant="app" showNav={false} className="relative px-6 py-7 flex flex-col select-none overflow-y-auto">
      <BackgroundBlobs showSparkles={true} />

      <div className="relative z-10 w-full flex flex-col pb-8">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => (step === 'verify_code' ? setStep('request') : navigate('/entrar'))}
            className="w-11 h-11 rounded-full bg-white/85 hover:bg-white text-deep shadow-xs flex items-center justify-center transition-all active:scale-95 border border-purple-100/60 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-[#581C87]" />
          </button>
          <h1 className="text-[20px] font-extrabold text-[#33105D] font-sans">
            Recuperar senha
          </h1>
        </div>

        {/* ETAPA 1: Solicitar código/link pelo e-mail cadastrado */}
        {step === 'request' && (
          <>
            <div className="text-center my-3">
              <div className="w-28 h-28 mx-auto drop-shadow-md">
                <Mascot pose="retry" floating priority className="w-full h-full object-contain" />
              </div>
              <h2 className="text-[24px] font-extrabold text-[#33105D] font-sans mt-3 mb-1.5">
                Esqueceu sua senha?
              </h2>
              <p className="text-[13px] font-bold text-[#581C87]/75 max-w-xs mx-auto leading-relaxed">
                Digite o e-mail que você cadastrou no PurplePiggy. Enviaremos um código de 6 dígitos e um link seguro para redefinir sua senha.
              </p>
            </div>

            <form onSubmit={handleRequestRecovery} className="flex flex-col gap-4 mt-3">
              <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
                <span className="absolute left-5 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                  <Mail className="w-5 h-5" strokeWidth={2.2} />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail cadastrado"
                  className="w-full h-14 pl-[58px] pr-5 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-1"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Receber código de redefinição'
                )}
              </button>
            </form>
          </>
        )}

        {/* ETAPA 2: Digitar código de 6 dígitos + Nova Senha */}
        {step === 'verify_code' && (
          <div className="flex flex-col gap-3.5 mt-1 animate-fadeIn">
            <div className="bg-white/95 rounded-[24px] p-4 border border-[#E9D5FF] shadow-card">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] flex items-center justify-center shrink-0">
                  <Mascot pose="idea" size="xs" alt="Mascote" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-extrabold text-[#33105D] leading-tight">
                    Olá, {userName}!
                  </h2>
                  <p className="text-[12px] font-bold text-[#7D6A9C] leading-snug mt-0.5">
                    {emailSentStatus
                      ? `Enviamos um e-mail para ${email} com o link e o código de segurança.`
                      : `Conta localizada para ${email}. Use o código de segurança abaixo para redefinir.`}
                  </p>
                </div>
              </div>

              {generatedCodeHint && (
                <div className="mt-3 p-3 rounded-2xl bg-[#F8F3FF] border border-[#D8B4FE] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#7D2BD6] block">
                      Código de verificação gerado
                    </span>
                    <span className="text-[18px] font-black tracking-[0.22em] text-[#33105D]">
                      {generatedCodeHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCode(generatedCodeHint)
                      toast.success('Código preenchido!')
                    }}
                    className="text-[11px] font-extrabold text-white bg-[#7D2BD6] hover:bg-[#6C22BD] px-3 py-1.5 rounded-full transition-all cursor-pointer shrink-0"
                  >
                    Usar código
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-3.5 mt-1">
              {/* Código de 6 dígitos */}
              <div>
                <label className="block text-xs font-extrabold text-[#432171] mb-1 ml-1">
                  Código de 6 dígitos
                </label>
                <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
                  <span className="absolute left-4 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                    <KeyRound className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full h-14 pl-14 pr-4 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep font-black tracking-[0.25em] text-[16px] focus:outline-none focus:border-[#8E32D8]"
                    required
                  />
                </div>
              </div>

              {/* Nova senha */}
              <div>
                <label className="block text-xs font-extrabold text-[#432171] mb-1 ml-1">
                  Nova senha (mínimo 6 caracteres)
                </label>
                <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
                  <span className="absolute left-4 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                    <Lock className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite sua nova senha"
                    className="w-full h-14 pl-14 pr-12 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep font-bold text-[14px] focus:outline-none focus:border-[#8E32D8]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 w-9 h-9 flex items-center justify-center rounded-full text-[#581C87]/60 hover:text-[#8E32D8] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar nova senha */}
              <div>
                <label className="block text-xs font-extrabold text-[#432171] mb-1 ml-1">
                  Confirmar nova senha
                </label>
                <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
                  <span className="absolute left-4 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                    <Lock className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full h-14 pl-14 pr-12 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep font-bold text-[14px] focus:outline-none focus:border-[#8E32D8]"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Salvar nova senha'
                )}
              </button>

              <button
                type="button"
                onClick={handleRequestRecovery}
                disabled={loading}
                className="text-xs font-extrabold text-[#7D2BD6] hover:underline flex items-center justify-center gap-1.5 py-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar código para {email}
              </button>
            </form>
          </div>
        )}

        {/* ETAPA LINK DIRETO: Caso a usuária tenha aberto pelo link de recuperação do e-mail */}
        {step === 'link_recovery' && (
          <form onSubmit={handleLinkRecoveryReset} className="flex flex-col gap-4 mt-2 animate-fadeIn">
            <div className="text-center mb-2">
              <div className="w-24 h-24 mx-auto">
                <Mascot pose="success" floating className="w-full h-full object-contain" />
              </div>
              <h2 className="text-[22px] font-extrabold text-[#33105D] mt-2">
                Defina sua nova senha
              </h2>
              <p className="text-xs font-bold text-[#7D6A9C] mt-1">
                Conta verificada ({email}). Escolha uma senha segura.
              </p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#432171] mb-1 ml-1">
                Nova senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full h-14 px-4 bg-white border border-[#E9D5FF] rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-[#8E32D8]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[#432171] mb-1 ml-1">
                Confirmar nova senha
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full h-14 px-4 bg-white border border-[#E9D5FF] rounded-2xl text-deep font-bold text-sm focus:outline-none focus:border-[#8E32D8]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2"
            >
              {loading ? 'Salvando...' : 'Atualizar senha'}
            </button>
          </form>
        )}

        {/* ETAPA 3: Sucesso */}
        {step === 'success' && (
          <div className="bg-white/95 p-6 rounded-[28px] border border-[#E9D5FF] text-center shadow-card mt-4 animate-fadeIn">
            <div className="w-28 h-28 mx-auto mb-2">
              <Mascot pose="trophy" floating className="w-full h-full object-contain" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DCFCE7] text-[#15803D] text-xs font-extrabold mb-2">
              <CheckCircle2 className="w-4 h-4" />
              Tudo pronto!
            </div>
            <h2 className="text-[22px] font-extrabold text-[#33105D] mb-2">
              Senha redefinida!
            </h2>
            <p className="text-[13px] font-bold text-[#7D6A9C] mb-6 leading-relaxed">
              Sua nova senha para <strong>{email}</strong> já está ativa. Você já pode entrar na sua conta normalmente.
            </p>
            <button
              onClick={() => navigate('/entrar')}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              Ir para o login
            </button>
          </div>
        )}

        {step !== 'success' && (
          <div className="mt-6 text-center">
            <Link
              to="/entrar"
              className="text-[13px] font-extrabold text-[#581C87] hover:text-[#8E32D8] transition-colors"
            >
              Lembrou a senha? Voltar ao login
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  )
}
export default ResetPasswordPage
