import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Lock,
  RotateCcw,
  Plus,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type BankConnection = Database['public']['Tables']['bank_connections']['Row']
type OpenFinanceConsent = Database['public']['Tables']['open_finance_consents']['Row']

export const OpenFinancePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, isDemo } = useAuth()

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [consents, setConsents] = useState<OpenFinanceConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [isManaging, setIsManaging] = useState(false)
  const [isConnectingNew, setIsConnectingNew] = useState(false)
  const [newBankName, setNewBankName] = useState('Banco Exemplo')

  useEffect(() => {
    if (user) {
      loadOpenFinanceData()
    }
  }, [user])

  const loadOpenFinanceData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: conns } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', user.id)

      setConnections(conns || [])

      const { data: consentData } = await supabase
        .from('open_finance_consents')
        .select('*')
        .eq('user_id', user.id)

      setConsents(consentData || [])
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (connId: string) => {
    if (!user) return
    try {
      await supabase
        .from('bank_connections')
        .update({ status: 'revoked' })
        .eq('id', connId)
        .eq('user_id', user.id)

      await supabase
        .from('open_finance_consents')
        .update({ status: 'revoked', revoked_at: new Date().toISOString() })
        .eq('connection_id', connId)
        .eq('user_id', user.id)

      toast.success('Consentimento revogado com sucesso.')
      loadOpenFinanceData()
    } catch (err) {
      toast.error('Erro ao revogar consentimento.')
    }
  }

  const handleConnectDemo = async () => {
    if (!user) return
    try {
      const { data: conn, error: connErr } = await supabase
        .from('bank_connections')
        .insert({
          user_id: user.id,
          institution_name: newBankName,
          account_label: 'Conta corrente · Conectada',
          provider: 'demo',
          status: 'active',
          is_demo: true,
        })
        .select()
        .single()

      if (connErr) throw connErr

      const expires = new Date()
      expires.setFullYear(expires.getFullYear() + 1)

      await supabase.from('open_finance_consents').insert({
        user_id: user.id,
        connection_id: conn.id,
        scopes: ['accounts', 'transactions', 'cards'],
        status: 'authorized',
        expires_at: expires.toISOString(),
      })

      toast.success('Instituição conectada em modo demonstrativo! 🏦')
      setIsConnectingNew(false)
      loadOpenFinanceData()
    } catch (err) {
      toast.error('Erro ao conectar instituição.')
    }
  }

  const activeConnection = connections.find((c) => c.status === 'active') || connections[0]

  return (
    <AppShell showNav={true} className="px-5 py-6 flex flex-col justify-between">
      <div className="flex flex-col gap-4">
        {/* Header com botão voltar e mascote escudo de segurança */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/perfil')}
              className="p-2 -ml-2 rounded-full hover:bg-lilac/10 text-deep transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-deep font-sans">
                Open Finance
              </h1>
              <p className="text-xs font-semibold text-textSec">
                Suas contas em um só lugar, com transparência e controle.
              </p>
            </div>
          </div>
          <div className="shrink-0 -mr-1">
            <Mascot size="sm" pose="shield" />
          </div>
        </div>

        {/* Card da Instituição Conectada (fiel ao layout oficial) */}
        {activeConnection ? (
          <div className="bg-white rounded-[24px] p-5 border border-lilac/15 shadow-card flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-baby text-primary flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-deep font-sans">
                  {activeConnection.institution_name}
                </h2>
                <p className="text-xs font-semibold text-textSec">
                  {activeConnection.account_label || 'Conta corrente'}
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full ${
                activeConnection.status === 'active'
                  ? 'bg-success/15 text-success'
                  : 'bg-danger/15 text-danger'
              }`}
            >
              {activeConnection.status === 'active' ? 'Ativa' : 'Revogada'}
            </span>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] p-6 text-center border border-lilac/15 shadow-card">
            <p className="text-xs font-bold text-textSec mb-3">
              Nenhuma instituição bancária conectada.
            </p>
            <Button size="sm" onClick={() => setIsConnectingNew(true)}>
              Conectar instituição demo
            </Button>
          </div>
        )}

        {/* Dados Compartilhados (Layout oficial) */}
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-extrabold text-deep font-sans">
              Dados compartilhados
            </h3>
            <p className="text-[11px] font-semibold text-textSec mt-0.5">
              Você controla o que compartilhar e por quanto tempo.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-bg border border-lilac/15">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <div className="text-xs font-bold text-deep">Saldo e extrato</div>
                <div className="text-[10px] text-textSec font-semibold">
                  Compartilhamento autorizado
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-bg border border-lilac/15">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <div className="text-xs font-bold text-deep">Dados de cartão</div>
                <div className="text-[10px] text-textSec font-semibold">
                  Compartilhamento autorizado
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consentimento (Layout oficial) */}
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-extrabold text-deep font-sans">
              Consentimento
            </h3>
            <p className="text-[11px] font-semibold text-textSec mt-0.5">
              A autorização pode ser revogada a qualquer momento com efeito imediato.
            </p>
          </div>

          {activeConnection && (
            <div className="flex flex-col gap-2.5 pt-1">
              <Button
                size="md"
                fullWidth
                onClick={() => setIsManaging(true)}
              >
                Gerenciar consentimento
              </Button>

              <Button
                size="md"
                variant="outline"
                fullWidth
                onClick={() => handleRevoke(activeConnection.id)}
              >
                Revogar acesso
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Rodapé com aviso de transparência (Regra 10) */}
      <div className="pt-4 pb-2 text-center flex items-center justify-center gap-1.5 text-xs font-bold text-textSec">
        <Lock className="w-3.5 h-3.5" />
        <span>Dados demonstrativos.</span>
      </div>

      {/* Modal: Gerenciar Consentimento */}
      {isManaging && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <h3 className="text-base font-extrabold text-deep font-sans mb-2">
              Gerenciar escopos de dados
            </h3>
            <p className="text-xs text-textSec font-semibold mb-4 leading-relaxed">
              O compartilhamento de dados via Open Finance tem validade máxima de 12 meses pela regulamentação do Banco Central do Brasil.
            </p>

            <div className="bg-bg rounded-2xl p-3 mb-4 text-xs font-bold text-deep flex flex-col gap-1.5">
              <div>• Status: Ativo e seguro</div>
              <div>• Prazo: Válido até Novembro/2027</div>
              <div>• Finalidade: Apenas visualização de saldo e extrato</div>
            </div>

            <Button size="md" fullWidth onClick={() => setIsManaging(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* Modal: Conectar Nova Instituição Demo */}
      {isConnectingNew && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <h3 className="text-base font-extrabold text-deep font-sans mb-1">
              Conectar conta (demonstração)
            </h3>
            <p className="text-xs text-textSec font-semibold mb-4">
              Escolha um nome fictício de banco para simular a conexão:
            </p>

            <input
              type="text"
              value={newBankName}
              onChange={(e) => setNewBankName(e.target.value)}
              className="w-full h-11 px-4 bg-bg border border-lilac/30 rounded-2xl text-deep font-bold text-sm mb-4 focus:outline-none focus:border-primary"
            />

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="md"
                className="flex-1"
                onClick={() => setIsConnectingNew(false)}
              >
                Cancelar
              </Button>
              <Button
                size="md"
                className="flex-1"
                onClick={handleConnectDemo}
              >
                Conectar
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
