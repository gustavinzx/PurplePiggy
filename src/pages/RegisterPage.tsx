import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import { AppShell } from '../components/AppShell'
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
      toast.error(
        error.message.includes('already registered')
          ? 'Este e-mail já possui cadastro. Que tal entrar na sua conta?'
          : 'Não conseguimos criar a conta agora. Confira sua conexão e tente de novo.'
      )
    } else {
      toast.success('Conta criada com sucesso! Vamos começar seu diagnóstico.')
      navigate('/diagnostico')
    }
  }

  return (
    <AppShell showNav={false} className="px-6 py-6 justify-between bg-white">
      <div>
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="-mr-2 -mt-2">
            <Mascot size="sm" pose="welcome" />
          </div>
        </div>

        {/* Título */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-deep font-sans mb-1">
            Crie sua conta
          </h1>
          <p className="text-sm font-semibold text-textSec">
            Um novo começo para sua vida financeira.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3.5">
          {/* Nome completo */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary">
                <User className="w-5 h-5" />
              </span>
              <input
                {...register('fullName')}
                type="text"
                placeholder="Nome completo"
                className="w-full h-13 pl-12 pr-4 bg-bg border border-lilac/30 rounded-2xl text-deep placeholder:text-textSec/60 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>
            {errors.fullName && (
              <p className="text-xs text-danger font-bold mt-1 ml-2">
                {errors.fullName.message}
              </p>
            )}
          </div>

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

          {/* Confirmar senha */}
          <div>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-primary">
                <Lock className="w-5 h-5" />
              </span>
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirmar senha"
                className="w-full h-13 pl-12 pr-12 bg-bg border border-lilac/30 rounded-2xl text-deep placeholder:text-textSec/60 font-semibold focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 text-textSec hover:text-deep"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-danger font-bold mt-1 ml-2">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>

          {/* Aviso com cadeado do layout */}
          <div className="bg-gold/20 border border-gold/40 rounded-xl py-2 px-3 flex items-center gap-2 mt-1">
            <span className="text-amber-600 bg-white p-1 rounded-full shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-deep/80">
              Seus dados são tratados com cuidado.
            </span>
          </div>

          <div className="mt-4">
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
            >
              Criar minha conta
            </Button>
          </div>
        </form>
      </div>

      {/* Rodapé */}
      <div className="text-center pt-4 pb-2">
        <p className="text-sm font-semibold text-textSec">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-primary font-bold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </AppShell>
  )
}
