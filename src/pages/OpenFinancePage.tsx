import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import {
  openPluggyConnect,
  syncPluggyTransactions,
  createPluggyOAuthItem,
  getBankLogo,
} from '../lib/openFinance'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'

type BankConnection = Database['public']['Tables']['bank_connections']['Row']
type OpenFinanceConsent = Database['public']['Tables']['open_finance_consents']['Row']

interface SupportedBank {
  id: number
  name: string
  color: string
}

const BRAZIL_OPEN_FINANCE_BANKS: SupportedBank[] = [
  { id: 612, name: 'Nubank', color: '#8A0FBE' },
  { id: 823, name: 'Banco Inter', color: '#FB6910' },
  { id: 601, name: 'Itaú', color: '#EC7000' },
  { id: 603, name: 'Bradesco', color: '#E5173F' },
  { id: 608, name: 'Santander', color: '#CC0000' },
  { id: 611, name: 'Banco do Brasil', color: '#1194F6' },
  { id: 619, name: 'Caixa Econômica', color: '#296FA7' },
  { id: 626, name: 'C6 Bank', color: '#242424' },
  { id: 651, name: 'PicPay', color: '#238662' },
  { id: 606, name: 'Mercado Pago', color: '#009EE3' },
  { id: 692, name: 'PagBank', color: '#1BB99A' },
  { id: 675, name: 'BTG Pactual', color: '#193B68' },
  { id: 689, name: 'Neon', color: '#00A5F0' },
  { id: 656, name: 'Next', color: '#00B84C' },
  { id: 661, name: 'Sicredi', color: '#3FA110' },
  { id: 658, name: 'Sicoob', color: '#00AE9D' },
]

function formatCpfInput(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`
}

export const OpenFinancePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [_consents, setConsents] = useState<OpenFinanceConsent[]>([])
  const [_loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null)
  const [isSyncingAll, setIsSyncingAll] = useState(false)
  const [isManaging, setIsManaging] = useState(false)

  // Modal nativo de conexão direta via Open Finance (sem depender de iframe bloqueado no Android)
  const [showDirectModal, setShowDirectModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState<SupportedBank>(BRAZIL_OPEN_FINANCE_BANKS[0])
  const [cpf, setCpf] = useState('')
  const [creatingOAuth, setCreatingOAuth] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [pendingOAuthUrl, setPendingOAuthUrl] = useState<string | null>(null)
  const [pendingBankName, setPendingBankName] = useState<string>('')

  const isPluggy = (import.meta.env.VITE_OPEN_FINANCE_PROVIDER || 'pluggy') === 'pluggy'

  // Priorizar conexões reais da Pluggy ativas sobre a conexão demo
  const activeConnection =
    connections.find((c) => c.provider === 'pluggy' && c.status === 'active') ||
    connections.find((c) => c.status === 'active') ||
    connections[0]

  useEffect(() => {
    if (user) {
      loadOpenFinanceData()
    }
  }, [user])

  // Quando o usuário volta do aplicativo do banco para o PurplePiggy após autorizar OAuth
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user && pendingItemId && !syncingItemId) {
        handleSyncByItemId(pendingItemId, true)
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [user, pendingItemId, syncingItemId])

  const loadOpenFinanceData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const { data: conns } = await supabase
        .from('bank_connections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setConnections(conns || [])

      const { data: consentData } = await supabase
        .from('open_finance_consents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setConsents(consentData || [])
    } finally {
      setLoading(false)
    }
  }

  const handleSyncByItemId = async (itemId: string, silentIfPending = false, instName?: string) => {
    if (!user || !itemId) return
    setSyncingItemId(itemId)
    try {
      const res = await syncPluggyTransactions(user.id, itemId)
      if (res.oauthUrl) {
        setPendingOAuthUrl(res.oauthUrl)
      }
      if (res.success && !res.pendingAuth) {
        toast.success(res.message || `${instName || 'Conta'}: saldo e extrato sincronizados com sucesso!`)
        setShowDirectModal(false)
        setPendingItemId(null)
        setPendingOAuthUrl(null)
        await refreshProfile()
        await loadOpenFinanceData()
      } else if (!silentIfPending) {
        toast.info(
          res.message ||
            'Aguardando confirmação no aplicativo do seu banco. Abra o app do banco, confirme o Open Finance e toque em Sincronizar!'
        )
        await loadOpenFinanceData()
      }
    } catch (err: any) {
      if (!silentIfPending) {
        toast.error(err.message || 'Erro ao sincronizar extrato da instituição.')
      }
    } finally {
      setSyncingItemId(null)
    }
  }

  const handleManualSync = async (conn?: BankConnection) => {
    const target = conn || activeConnection
    if (!user || !target?.provider_ref) return
    await handleSyncByItemId(target.provider_ref, false, target.institution_name)
  }

  const handleSyncAll = async () => {
    if (!user) return
    setIsSyncingAll(true)
    try {
      const res = await syncPluggyTransactions(user.id)
      if (res.success && !res.pendingAuth) {
        toast.success(res.message || 'Todas as contas conectadas foram sincronizadas!')
        await refreshProfile()
        await loadOpenFinanceData()
      } else {
        toast.info(res.message || 'Sincronização concluída.')
        await loadOpenFinanceData()
      }
    } catch (err: any) {
      toast.error(err.message || 'Erro ao sincronizar contas.')
    } finally {
      setIsSyncingAll(false)
    }
  }

  const handleCreateDirectOAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    const cleanCpf = cpf.replace(/\D/g, '')
    if (cleanCpf.length !== 11) {
      toast.error('Digite os 11 números do seu CPF.')
      return
    }

    setCreatingOAuth(true)
    try {
      const res = await createPluggyOAuthItem(user.id, selectedBank.id, cleanCpf)
      setPendingItemId(res.itemId)
      setPendingOAuthUrl(res.oauthUrl)
      setPendingBankName(res.institutionName || selectedBank.name)
      await loadOpenFinanceData()

      if (res.oauthUrl) {
        toast.success(`Link oficial do ${res.institutionName || selectedBank.name} pronto! Toque no botão para abrir seu banco.`)
      } else {
        toast.info('Solicitação criada! Toque em Sincronizar após autorizar no banco.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Não foi possível iniciar a conexão com este banco.')
    } finally {
      setCreatingOAuth(false)
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
    } catch {
      toast.error('Erro ao revogar consentimento.')
    }
  }

  // Abertura do widget completo da Pluggy para outros bancos fora da lista rápida
  const handleOpenFullCatalogWidget = async () => {
    if (!user) return
    setShowDirectModal(false)
    setConnecting(true)
    try {
      await openPluggyConnect(user.id, {
        onSuccess: async (item, syncResult) => {
          setConnecting(false)
          const syncedCount = syncResult?.syncedTransactions ?? syncResult?.transactionsCount ?? 0
          const syncedMsg =
            syncedCount > 0
              ? ` (${syncedCount} lançamentos importados!)`
              : ''
          toast.success(
            `Conta ${item.connector?.name || 'bancária'} conectada via Open Finance!${syncedMsg}`
          )
          await refreshProfile()
          loadOpenFinanceData()
        },
        onError: (error) => {
          setConnecting(false)
          console.warn('[OpenFinance] Erro Pluggy:', error)
          toast.error('Não foi possível concluir pelo widget. Use a conexão direta escolhendo seu banco e CPF!')
        },
        onClose: () => {
          setConnecting(false)
        },
      })
    } catch (err: any) {
      setConnecting(false)
      toast.error(err?.message || 'Erro ao abrir catálogo.')
    }
  }

  const openBankSelectorModal = () => {
    setPendingItemId(null)
    setPendingOAuthUrl(null)
    setShowDirectModal(true)
  }

  return (
    <AppShell showNav={true} className="px-4 sm:px-5 py-5 flex flex-col justify-between pb-24 overflow-y-auto">
      <div className="flex flex-col gap-3.5 w-full max-w-full">
        {/* Header com botão voltar e mascote escudo de segurança */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              onClick={() => navigate('/perfil')}
              className="p-1.5 -ml-1 rounded-full hover:bg-lilac/10 text-deep transition-colors cursor-pointer shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-extrabold text-deep font-sans truncate">
                Open Finance
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-textSec leading-tight line-clamp-2">
                Suas contas em um só lugar, com transparência e controle.
              </p>
            </div>
          </div>
          <div className="shrink-0 -mr-1">
            <Mascot size="sm" pose="shield" />
          </div>
        </div>

        {/* Lista de Instituições Conectadas (Suporte oficial a múltiplos bancos) */}
        {connections.filter((c) => c.status === 'active').length > 0 ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-[#7D6A9C] uppercase tracking-wider">
                Suas contas conectadas ({connections.filter((c) => c.status === 'active').length})
              </span>
              <div className="flex items-center gap-2.5">
                {connections.filter((c) => c.status === 'active').length > 1 && (
                  <button
                    type="button"
                    onClick={handleSyncAll}
                    disabled={isSyncingAll || syncingItemId !== null}
                    className="text-xs font-extrabold text-[#7D2BD6] hover:underline flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                    title="Sincronizar todas as contas de uma vez"
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncingAll ? 'animate-spin' : ''}`} />
                    <span>Sincronizar todas</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={openBankSelectorModal}
                  disabled={connecting}
                  className="text-xs font-extrabold text-[#7D2BD6] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar banco</span>
                </button>
              </div>
            </div>

            {connections
              .filter((c) => c.status === 'active')
              .map((conn) => {
                return (
                  <div
                    key={conn.id}
                    className="bg-white rounded-[22px] p-3.5 sm:p-4 border border-lilac/15 shadow-card flex flex-col gap-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs overflow-hidden bg-white border border-gray-100 p-1">
                          {getBankLogo(conn.institution_name) ? (
                            <img
                              src={getBankLogo(conn.institution_name)!}
                              alt={conn.institution_name}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <div className="w-full h-full rounded-xl bg-[#7D2BD6] flex items-center justify-center font-black text-xs text-white">
                              {conn.institution_name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-xs sm:text-sm font-extrabold text-deep font-sans truncate">
                            {conn.institution_name}
                          </h2>
                          <p className="text-[11px] font-semibold text-textSec truncate">
                            {conn.account_label || 'Conta corrente'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-success/15 text-success whitespace-nowrap">
                          Ativa
                        </span>

                        <button
                          type="button"
                          onClick={() => handleManualSync(conn)}
                          disabled={syncingItemId === conn.provider_ref || isSyncingAll}
                          className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-deep transition-colors bg-baby/60 hover:bg-baby px-2.5 py-1 rounded-full cursor-pointer disabled:opacity-50 whitespace-nowrap"
                          title="Sincronizar extrato bancário desta conta"
                        >
                          <RefreshCw className={`w-3 h-3 ${(syncingItemId === conn.provider_ref || isSyncingAll) ? 'animate-spin' : ''} shrink-0`} />
                          <span>{(syncingItemId === conn.provider_ref || isSyncingAll) ? 'Sincronizando...' : 'Sincronizar'}</span>
                        </button>
                      </div>
                    </div>

                    {conn.balance != null && (
                      <div className="pt-2 border-t border-lilac/10 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-textSec">Saldo em conta</span>
                        <span className="text-xs font-black text-[#7D2BD6]">
                          R${' '}
                          {Number(conn.balance).toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}

            <div className="pt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => navigate('/gastos')}
                className="w-full py-2.5 px-3 rounded-full bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7D2BD6] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Ver extrato unificado em Gastos</span>
              </button>

              <button
                type="button"
                onClick={openBankSelectorModal}
                disabled={connecting}
                className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 text-center"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Conectar outro banco ou carteira</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[24px] p-5 text-center border border-lilac/15 shadow-card flex flex-col gap-3">
            <p className="text-xs font-bold text-textSec">
              Nenhuma instituição bancária conectada ainda.
            </p>
            <button
              type="button"
              onClick={openBankSelectorModal}
              disabled={connecting}
              className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Conectar minha conta bancária</span>
            </button>
          </div>
        )}

        {/* Passo a passo para conectar banco real via Open Finance */}
        <div className="bg-[#FAF5FF] rounded-[20px] p-3.5 border border-[#E9D5FF] flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#7D2BD6] shrink-0 mt-0.5" />
          <div className="text-[11px] font-semibold text-[#581C87] leading-relaxed break-words min-w-0 flex-1">
            <strong className="font-extrabold text-[#33105D] block mb-1">
              Como funciona a conexão com seu banco:
            </strong>
            <p className="mb-0.5">
              1. Toque em <strong>Conectar conta</strong>, escolha seu banco e informe seu CPF.
            </p>
            <p className="mb-0.5">
              2. Toque no botão para abrir o app do banco e confirmar a autorização.
            </p>
            <p>
              3. Volte aqui e toque em <strong>Sincronizar</strong>!
            </p>
          </div>
        </div>

        {/* Dados Compartilhados */}
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
                  Sincronização automática com seu painel e orçamento
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-2xl bg-bg border border-lilac/15">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <div className="text-xs font-bold text-deep">Dados de cartão</div>
                <div className="text-[10px] text-textSec font-semibold">
                  Categorização inteligente de despesas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Consentimento */}
        <div className="bg-white rounded-[22px] p-5 border border-lilac/15 shadow-card flex flex-col gap-3">
          <div>
            <h3 className="text-xs font-extrabold text-deep font-sans">
              Consentimento
            </h3>
            <p className="text-[11px] font-semibold text-textSec mt-0.5">
              A autorização pode ser revogada a qualquer momento com efeito imediato.
            </p>
          </div>

          {activeConnection && activeConnection.status === 'active' && (
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

      {/* Rodapé com aviso de transparência */}
      <div className="pt-4 pb-2 text-center flex items-center justify-center gap-1.5 text-[11px] font-bold text-textSec px-2">
        <Lock className="w-3.5 h-3.5 shrink-0" />
        <span className="leading-snug break-words">
          {isPluggy
            ? 'Ambiente Open Finance regulado pelo Banco Central.'
            : 'Dados demonstrativos.'}
        </span>
      </div>

      {/* Modal Nativo: Conectar Banco Real via Open Finance Direto */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-[28px] sm:rounded-[28px] p-4 sm:p-5 w-full max-w-[430px] max-h-[90vh] overflow-y-auto shadow-2xl border border-lilac/20 flex flex-col gap-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="shrink-0">
                  <Mascot size="sm" pose="connect" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-deep font-sans truncate">
                    Conectar Conta Bancária
                  </h3>
                  <p className="text-[11px] font-semibold text-textSec truncate">
                    Open Finance Brasil oficial
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDirectModal(false)}
                className="p-1.5 rounded-full bg-bg text-textSec hover:text-deep cursor-pointer shrink-0"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!pendingItemId ? (
              <form onSubmit={handleCreateDirectOAuth} className="flex flex-col gap-3.5">
                <div>
                  <label className="text-xs font-extrabold text-deep block mb-1.5">
                    1. Escolha a sua instituição bancária:
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-[210px] overflow-y-auto pr-1">
                    {BRAZIL_OPEN_FINANCE_BANKS.map((bank) => {
                      const isSel = selectedBank.id === bank.id
                      return (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBank(bank)}
                          className={`flex items-center gap-2 p-2 rounded-2xl border text-left transition-all cursor-pointer min-w-0 ${
                            isSel
                              ? 'border-[#7D2BD6] bg-[#F3E8FF] text-[#33105D] shadow-2xs'
                              : 'border-lilac/20 bg-bg text-deep hover:border-lilac/40'
                          }`}
                        >
                          <div className="w-5 h-5 rounded-md shrink-0 flex items-center justify-center overflow-hidden bg-white shadow-2xs p-0.5">
                            {getBankLogo(bank.name) ? (
                              <img src={getBankLogo(bank.name)!} alt="" className="w-full h-full object-contain" />
                            ) : (
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: bank.color }}
                              />
                            )}
                          </div>
                          <span className="text-xs font-extrabold truncate min-w-0 flex-1">{bank.name}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-deep block mb-1">
                    2. Digite o CPF titular da conta no {selectedBank.name}:
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    className="w-full h-11 px-3.5 bg-bg border border-lilac/30 rounded-2xl text-deep font-extrabold text-sm focus:outline-none focus:border-primary"
                    required
                  />
                  <p className="text-[10px] font-semibold text-textSec mt-1 leading-snug break-words">
                    O CPF é usado exclusivamente pelo {selectedBank.name} para gerar sua autorização segura.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={creatingOAuth}
                  className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
                >
                  {creatingOAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span className="truncate">Conectando ao {selectedBank.name}...</span>
                    </>
                  ) : (
                    <span className="truncate">Continuar para o {selectedBank.name}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullCatalogWidget}
                  className="text-[11px] font-bold text-[#7D2BD6] hover:underline text-center py-0.5 cursor-pointer truncate"
                >
                  Outro banco? Abrir catálogo completo Pluggy
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 py-1">
                <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3 text-xs font-semibold text-[#33105D] leading-relaxed break-words">
                  <strong className="font-extrabold block mb-1 text-sm">
                    Quase lá! Falta autorizar no {pendingBankName}:
                  </strong>
                  Toque no botão verde abaixo para abrir o app do <strong>{pendingBankName}</strong> no celular, confirme o compartilhamento e depois volte aqui para sincronizar.
                </div>

                {pendingOAuthUrl && (
                  <a
                    href={pendingOAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-3 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span className="truncate">1. Abrir app do {pendingBankName} e autorizar</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => handleSyncByItemId(pendingItemId, false, pendingBankName)}
                  disabled={syncingItemId !== null || isSyncingAll}
                  className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
                >
                  <RefreshCw className={`w-4 h-4 ${syncingItemId === pendingItemId ? 'animate-spin' : ''} shrink-0`} />
                  <span className="truncate">
                    {syncingItemId === pendingItemId
                      ? 'Sincronizando extrato...'
                      : '2. Já autorizei · Sincronizar agora'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingItemId(null)
                    setPendingOAuthUrl(null)
                  }}
                  className="text-xs font-bold text-textSec hover:text-deep text-center py-1 cursor-pointer"
                >
                  Voltar e escolher outro banco
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Gerenciar Consentimento */}
      {isManaging && (
        <div className="fixed inset-0 z-50 bg-deep/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-6 w-full max-w-sm shadow-2xl border border-lilac/20">
            <Mascot size="md" pose="shield" floating={true} className="mx-auto mb-2" />
            <h3 className="text-base font-extrabold text-deep font-sans mb-2">
              Gerenciar escopos de dados
            </h3>
            <p className="text-xs text-textSec font-semibold mb-4 leading-relaxed">
              O compartilhamento de dados via Open Finance tem validade máxima de 12 meses pela regulamentação do Banco Central do Brasil.
            </p>

            <div className="bg-bg rounded-2xl p-3 mb-4 text-xs font-bold text-deep flex flex-col gap-1.5">
              <div>• Provedor: {activeConnection?.provider === 'pluggy' ? 'Pluggy (API Oficial v2)' : 'Demonstrativo'}</div>
              <div>• Status: Ativo e criptografado de ponta a ponta</div>
              <div>• Finalidade: Leitura e categorização automática de saldo e extratos</div>
            </div>

            <Button size="md" fullWidth onClick={() => setIsManaging(false)}>
              Fechar
            </Button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default OpenFinancePage
