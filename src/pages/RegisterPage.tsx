import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Mascot } from '../components/Mascot'
import { AppShell } from '../components/AppShell'
import { BackgroundBlobs } from '../components/BackgroundBlobs'
import { ArrowLeft, User, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Informe seu nome completo (mínimo 2 letras)'),
    email: z.string().email('Informe um e-mail válido'),
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem. Confira e tente de novo.',
    path: ['confirmPassword'],
  })

type RegisterFormData = z.infer<typeof registerSchema>

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true)
    const { error } = await signUp(data.email, data.password, data.fullName)
    setIsSubmitting(false)

    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('already registered') || msg.includes('user already exists')) {
        toast.error('Este e-mail já possui cadastro. Que tal entrar na sua conta?')
      } else if (msg.includes('password') && (msg.includes('weak') || msg.includes('short') || msg.includes('least'))) {
        toast.error('Senha fraca. Use pelo menos 8 caracteres com letras e números.')
      } else {
        toast.error(error.message || 'Não conseguimos criar a conta agora. Tente de novo.')
      }
    } else {
      toast.success('Conta criada com sucesso! Vamos começar seu diagnóstico.')
      navigate('/diagnostico')
    }
  }

  return (
    <AppShell variant="app" showNav={false} className="relative px-6 py-8 flex flex-col select-none">
      <BackgroundBlobs showSparkles={true} />

      <div className="relative z-10 w-full flex flex-col">
        {/* Header com botão voltar e Mascote oficial */}
        <div className="relative flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-white/85 hover:bg-white text-deep shadow-xs flex items-center justify-center transition-all active:scale-95 border border-purple-100/60 cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5 text-[#581C87]" />
          </button>

          {/* Mascote pig-peek grande no canto superior direito */}
          <div className="absolute -top-2 -right-3 w-24 h-24 pointer-events-none drop-shadow-md select-none">
            <Mascot pose="peek" priority className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Título Centralizado com tipografia harmoniosa */}
        <div className="mb-6 text-center">
          <h1 className="text-[28px] font-extrabold text-[#33105D] font-sans leading-tight tracking-tight mb-1.5">
            Crie sua conta
          </h1>
          <p className="text-[14px] font-bold text-[#581C87]/75 leading-tight">
            Um novo começo para<br />sua vida financeira.
          </p>
        </div>

        {/* Formulário com Caixas Altas, Espaçosas e Confortáveis */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          {/* Nome completo */}
          <div>
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
              <span className="absolute left-5 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                <User className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('fullName')}
                type="text"
                placeholder="Nome completo"
                className="w-full h-14 pl-[58px] pr-5 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-danger font-extrabold mt-1.5 ml-4">
                {errors.fullName.message}
              </p>
            )}
          </div>

          {/* E-mail */}
          <div>
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
              <span className="absolute left-5 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                <Mail className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('email')}
                type="email"
                placeholder="E-mail"
                className="w-full h-14 pl-[58px] pr-5 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
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
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
              <span className="absolute left-5 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                <Lock className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Senha"
                className="w-full h-14 pl-[58px] pr-12 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 w-10 h-10 flex items-center justify-center rounded-full text-[#581C87]/60 hover:text-[#8E32D8] hover:bg-purple-50 transition-colors cursor-pointer"
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

          {/* Confirmar senha */}
          <div>
            <div className="relative flex items-center shadow-[0_4px_16px_rgba(125,43,214,0.06)] rounded-2xl">
              <span className="absolute left-5 w-6 h-6 flex items-center justify-center text-[#8E32D8] pointer-events-none">
                <Lock className="w-5 h-5" strokeWidth={2.2} />
              </span>
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmar senha"
                className="w-full h-14 pl-[58px] pr-12 bg-white border border-[#E9D5FF]/80 rounded-2xl text-deep placeholder:text-[#581C87]/45 font-bold text-[15px] focus:outline-none focus:border-[#8E32D8] focus:ring-4 focus:ring-[#8E32D8]/10 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 w-10 h-10 flex items-center justify-center rounded-full text-[#581C87]/60 hover:text-[#8E32D8] hover:bg-purple-50 transition-colors cursor-pointer"
                aria-label={showConfirm ? 'Ocultar senha' : 'Ver senha'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-danger font-extrabold mt-1.5 ml-4">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Aviso com cadeado elegante do layout */}
          <div className="bg-white/85 border border-purple-100/90 rounded-full py-3 px-4 flex items-center justify-center gap-2.5 shadow-xs mt-1 backdrop-blur-xs">
            <span className="text-[#8E32D8] bg-[#F3E8FF] p-1 rounded-full shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#8E32D8]" />
            </span>
            <span className="text-xs font-extrabold text-[#581C87]">
              Seus dados são tratados com cuidado.
            </span>
          </div>

          {/* Botão de envio */}
          <div className="mt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-14 rounded-full bg-gradient-to-r from-[#8E32D8] to-[#6C22BD] text-white font-extrabold text-[16px] shadow-btn-floating hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Criar minha conta'
              )}
            </button>
          </div>
        </form>

        {/* Rodapé integrado diretamente abaixo do botão */}
        <div className="mt-6 text-center">
          <p className="text-[14px] font-bold text-[#581C87]/75">
            Já tem conta?{' '}
            <Link to="/entrar" className="text-[#8E32D8] font-extrabold hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  )
}
export default RegisterPage
