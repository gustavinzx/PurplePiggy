import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
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
    } catch (err: any) {
      toast.error('Não conseguimos enviar o e-mail. Confira o endereço informado.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell showNav={false} className="px-6 py-6 justify-between bg-white">
      <div>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate('/entrar')}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-extrabold text-deep font-sans">
            Recuperar senha
          </h1>
        </div>

        <div className="text-center my-6">
          <Mascot size="lg" pose="retry" floating={true} />
          <h2 className="text-2xl font-extrabold text-deep font-sans mt-3 mb-1">
            Esqueceu sua senha?
          </h2>
          <p className="text-xs font-semibold text-textSec max-w-xs mx-auto">
            Sem problemas! Digite seu e-mail e enviaremos um link seguro para você criar uma nova senha.
          </p>
        </div>

        {sent ? (
          <div className="bg-baby/50 p-5 rounded-[22px] border border-blue-100 text-center">
            <p className="text-xs font-bold text-deep mb-4">
              Enviamos um link de recuperação para <strong>{email}</strong>. Confira sua caixa de entrada e spam.
            </p>
            <Button
              size="md"
              fullWidth
              onClick={() => navigate('/entrar')}
            >
              Voltar ao login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <div className="relative flex items-center">
                <span className="absolute left-4 text-primary">
                  <Mail className="w-5 h-5" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Seu e-mail cadastrado"
                  className="w-full h-13 pl-12 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-semibold text-sm focus:outline-none focus:border-primary"
                  required
                />
              </div>
            </div>

            <Button type="submit" size="lg" fullWidth loading={loading}>
              Enviar link de recuperação
            </Button>
          </form>
        )}
      </div>

      <div className="text-center py-4">
        <Link to="/entrar" className="text-xs font-bold text-primary hover:underline">
          Lembrou a senha? Voltar ao login
        </Link>
      </div>
    </AppShell>
  )
}
