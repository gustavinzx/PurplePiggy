import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Mascot } from '../components/Mascot'
import { Button } from '../components/Button'
import { AppShell } from '../components/AppShell'
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { signIn, signInDemo } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDemoLoading, setIsDemoLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true)
    const { error } = await signIn(data.email, data.password)
    setIsSubmitting(false)

    if (error) {
      toast.error('E-mail ou senha incorretos. Confira e tente de novo.')
    } else {
      toast.success('Que bom ter você de volta!')
      navigate('/inicio')
    }
  }

  const handleDemo = async () => {
    setIsDemoLoading(true)
    const { error } = await signInDemo()
    setIsDemoLoading(false)
    if (error) {
      toast.error('Não foi possível iniciar o modo demonstração. Tente de novo.')
    } else {
      toast.success('Entrando como Ana Oliveira (modo demonstração)!')
      navigate('/inicio')
    }
  }

  return (
    <AppShell showNav={false} className="px-6 py-6 justify-between bg-white">
      <div>
        {/* Header com mascote no canto superior direito */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="-mr-2 -mt-2">
            <Mascot size="sm" pose="welcome" />
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-deep font-sans mb-1">
            Que bom ter você de volta!
          </h1>
          <p className="text-sm font-semibold text-textSec">
            Entre para acompanhar sua evolução.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* E-mail */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary">
                <Mail className="w-5 h-5" />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="E-mail"
                className="w-full h-13 pl-12 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep placeholder:text-textSec/60 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-danger font-bold mt-1 ml-2">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary">
                <Lock className="w-5 h-5" />
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                className="w-full h-13 pl-12 pr-12 bg-bg border border-lilac/30 rounded-2xl text-deep placeholder:text-textSec/60 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-textSec hover:text-deep"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger font-bold mt-1 ml-2">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Esqueci minha senha ? */}
          <div className="text-right">
            <Link
              to="/redefinir-senha"
              className="text-xs font-bold text-deep/80 hover:text-primary transition-colors"
            >
              Esqueci minha senha ?
            </Link>
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
            >
              Entrar
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => navigate('/cadastrar')}
            >
              Criar uma conta
            </Button>
          </div>
        </form>
      </div>

      {/* Botão extra discreto de demonstração */}
      <div className="pt-6 pb-2 text-center border-t border-lilac/10">
        <button
          onClick={handleDemo}
          disabled={isDemoLoading}
          className="text-xs font-bold text-textSec hover:text-primary transition-colors inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-lilac/10"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          {isDemoLoading ? 'Preparando...' : 'Ver modo demonstração (Ana Oliveira)'}
        </button>
      </div>
    </AppShell>
  )
}
