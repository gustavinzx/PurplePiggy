import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { Mascot } from '../components/Mascot'
import { ArrowLeft, Mail } from 'lucide-react'
import { toast } from 'sonner'

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Informe seu e-mail cadastrado.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })

      if (error) throw error

      setSent(true)
      toast.success('Instruções enviadas para o seu e-mail!')
    } catch {
      toast.error('Não conseguimos enviar o e-mail. Confira o endereço informado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell variant="app" showNav={false} className="relative px-6 py-8 flex flex-col select-none">
      <BackgroundBlobs showSparkles={true} />

      <div className="relative z-10 w-full flex flex-col">
        {/* Header com botão voltar */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/entrar')}
            className="w-11 h-11 rounded-full bg-white/85 hover:bg-white text-deep shadow-xs flex items-center justify-center transition-all active:scale-95 border border-purple-100/60 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-[#581C87]" />
          </button>
          <h1 className="text-[20px] font-extrabold text-[#33105D] font-sans">
            Recuperar senha
          </h1>
        </div>

        {/* Mascote centralizado com texto */}
        <div className="text-center my-4">
          <div className="w-32 h-32 mx-auto drop-shadow-md">
            <Mascot pose="retry" floating priority className="w-full h-full object-contain" />
          </div>
          <h2 className="text-[26px] font-extrabold text-[#33105D] font-sans mt-4 mb-2">
            Esqueceu sua senha?
          </h2>
          <p className="text-[14px] font-bold text-[#581C87]/75 max-w-xs mx-auto leading-relaxed">
            Sem problemas! Digite seu e-mail e enviaremos um link seguro para você criar uma nova senha.
          </p>
        </div>

        {sent ? (
          <div className="bg-white/90 p-6 rounded-[24px] border border-purple-100 text-center shadow-card mt-4">
            <p className="text-[14px] font-bold text-[#33105D] mb-5 leading-relaxed">
              Enviamos um link de recuperação para <strong>{email}</strong>. Confira sua caixa de entrada e spam.
            </p>
            <button
              onClick={() => navigate('/entrar')}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[15px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              Voltar ao login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-full">
              <span className="absolute left-4.5 text-[#8E32D8] pointer-events-none">
                <Mail className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail cadastrado"
                className="w-full h-14 pl-14 pr-5 bg-white border border-[#E9D5FF]/80 rounded-full text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[16px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Enviar link de recuperação'
              )}
            </button>
          </form>
        )}

        {/* Rodapé integrado logo abaixo */}
        <div className="mt-8 text-center">
          <Link
            to="/entrar"
            className="text-[14px] font-extrabold text-[#8E32D8] hover:underline"
          >
            Lembrou a senha? Voltar ao login
          </Link>
        </div>
      </div>
    </AppShell>
  )
}
export default ResetPasswordPage
