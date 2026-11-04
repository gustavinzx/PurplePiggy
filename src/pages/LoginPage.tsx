import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Mascot } from '../components/Mascot'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
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
    <AppShell variant="app" showNav={false} className="relative px-6 py-8 flex flex-col select-none">
      <BackgroundBlobs showSparkles={true} />

      <div className="relative z-10 w-full flex flex-col">
        {/* Header com botão voltar e Mascote grande no canto superior direito */}
        <div className="relative flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/')}
            className="w-11 h-11 rounded-full bg-white/85 hover:bg-white text-deep shadow-xs flex items-center justify-center transition-all active:scale-95 border border-purple-100/60 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-[#581C87]" />
          </button>

          {/* Mascote pig-head grande no canto superior direito */}
          <div className="absolute -top-2 -right-3 w-28 h-28 pointer-events-none drop-shadow-md select-none">
            <Mascot pose="head" priority className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Título e Subtítulo */}
        <div className="mb-8 max-w-[230px]">
          <h1 className="text-[28px] font-extrabold text-[#33105D] font-sans leading-tight tracking-tight mb-2">
            Que bom ter você de volta!
          </h1>
          <p className="text-[15px] font-bold text-[#581C87]/75 leading-relaxed">
            Entre para acompanhar sua evolução.
          </p>
        </div>

        {/* Formulário com Caixas Altas, Espaçosas e Confortáveis */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* E-mail */}
          <div>
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-full">
              <span className="absolute left-4.5 text-[#8E32D8] pointer-events-none">
                <Mail className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="E-mail"
                className="w-full h-14 pl-14 pr-5 bg-white border border-[#E9D5FF]/80 rounded-full text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
              />
            </div>
            {errors.email && (
              <p className="text-xs text-danger font-extrabold mt-1.5 ml-4">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Senha */}
          <div>
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-full">
              <span className="absolute left-4.5 text-[#8E32D8] pointer-events-none">
                <Lock className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                className="w-full h-14 pl-14 pr-12 bg-white border border-[#E9D5FF]/80 rounded-full text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 p-1.5 rounded-full text-[#581C87]/60 hover:text-[#8E32D8] hover:bg-purple-50 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger font-extrabold mt-1.5 ml-4">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Esqueci minha senha ? */}
          <div className="text-right pt-0.5">
            <Link
              to="/redefinir-senha"
              className="text-[13px] font-extrabold text-[#581C87] hover:text-[#8E32D8] transition-colors"
            >
              Esqueci minha senha ?
            </Link>
          </div>

          {/* Botões Principais */}
          <div className="flex flex-col gap-3.5 mt-5">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[16px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Entrar'
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/cadastrar')}
              className="w-full h-14 rounded-full bg-white border-2 border-[#8E32D8] text-[#581C87] font-extrabold text-[15px] hover:bg-purple-50/60 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center cursor-pointer"
            >
              Criar uma conta
            </button>
          </div>
        </form>

        {/* Botão de demonstração integrado no fluxo logo abaixo dos botões */}
        <div className="mt-8 text-center">
          <button
            onClick={handleDemo}
            disabled={isDemoLoading}
            className="text-xs font-bold text-[#581C87]/70 hover:text-[#8E32D8] transition-colors inline-flex items-center gap-1.5 py-2 px-4 rounded-full hover:bg-white/80 backdrop-blur-xs cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            {isDemoLoading ? 'Preparando...' : 'Ver modo demonstração (Ana Oliveira)'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
export default LoginPage
