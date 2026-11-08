// src/pages/OpenFinancePage.tsx
// Página de Gestão Completa de Conexões Open Finance (Pluggy API v2)
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { AppShell } from '../components/AppShell'
import { Button } from '../components/Button'
import { Mascot } from '../components/Mascot'
import {
  openPluggyConnect,
  syncPluggyConnection,
  pollSyncUntilDone,
  createPluggyOAuthItem,
  fetchBankAccounts,
  toggleAccountInBalance,
  fetchLatestSyncRun,
  revokePluggyConnection,
  fetchPluggyConnectors,
  importBankStatement,
  parseOfx,
  parseCsv,
  getBankLogo,
  BankAccountRecord,
  SyncRunRecord,
  ConnectorInfo,
  ImportedRow,
} from '../lib/openFinance'
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Plus,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  X,
  AlertCircle,
  Copy,
  Check,
  Search,
  UploadCloud,
  FileText,
  BadgeCheck,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '../types/database.types'
import { formatCurrency } from '../lib/format'

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

function formatHour(iso?: string | null): string {
  if (!iso) return '--:--'
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '--:--'
  }
}

function formatTimeAgo(iso?: string | null): string {
  if (!iso) return 'nunca'
  try {
    const diffMs = Date.now() - new Date(iso).getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'agora'
    if (diffMins === 1) return 'há 1 min'
    if (diffMins < 60) return `há ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours === 1) return 'há 1 hora'
    if (diffHours < 24) return `há ${diffHours} horas`
    return `há ${Math.floor(diffHours / 24)} dias`
  } catch {
    return 'recentemente'
  }
}

function formatAccountDisplayName(acc: BankAccountRecord, institutionName: string): string {
  const raw = (acc.name || '').trim()
  const isCredit = acc.type === 'CREDIT'

  if (isCredit) {
    const lower = raw.toLowerCase()
    if (!raw || lower === institutionName.toLowerCase()) {
      return `Cartão ${institutionName}`
    }
    const formatted = raw.charAt(0).toUpperCase() + raw.slice(1)
    return lower.startsWith('cartão') || lower.startsWith('cartao')
      ? formatted
      : `Cartão ${formatted}`
  }

  // Limpa razões sociais extensas (ex: "Nu Pagamentos S.A. - Instituição de Pagamento")
  if (
    !raw ||
    raw.length > 22 ||
    /pagamentos|institui[cç][aã]o|s\.?a\.?|ltda|banco/i.test(raw)
  ) {
    return `Conta ${institutionName}`
  }

  return raw
}

export const OpenFinancePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()

  const [connections, setConnections] = useState<BankConnection[]>([])
  const [bankAccounts, setBankAccounts] = useState<BankAccountRecord[]>([])
  const [_consents, setConsents] = useState<OpenFinanceConsent[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [syncingConnId, setSyncingConnId] = useState<string | null>(null)

  // Fila de sincronização no frontend
  const [syncQueueStatus, setSyncQueueStatus] = useState<{
    current: number
    total: number
    bankName: string
    running: boolean
  } | null>(null)

  // Modal de relatório da última sincronização
  const [selectedReportConn, setSelectedReportConn] = useState<BankConnection | null>(null)
  const [reportData, setReportData] = useState<SyncRunRecord | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [copiedReport, setCopiedReport] = useState(false)

  // Modal nativo de conexão direta via Open Finance
  const [showDirectModal, setShowDirectModal] = useState(false)
  const [selectedBank, setSelectedBank] = useState<SupportedBank>(BRAZIL_OPEN_FINANCE_BANKS[0])
  const [cpf, setCpf] = useState('')
  const [creatingOAuth, setCreatingOAuth] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<string | null>(null)
  const [pendingOAuthUrl, setPendingOAuthUrl] = useState<string | null>(null)
  const [pendingBankName, setPendingBankName] = useState<string>('')
  const [connectorsList, setConnectorsList] = useState<ConnectorInfo[]>([])
  const [bankSearchTerm, setBankSearchTerm] = useState('')

  // Lista visual de bancos prioritários + busca rápida
  const displayBanks = useMemo(() => {
    const query = bankSearchTerm.trim().toLowerCase()
    if (!query) {
      return BRAZIL_OPEN_FINANCE_BANKS
    }
    const pool = connectorsList.length > 0 ? connectorsList : BRAZIL_OPEN_FINANCE_BANKS
    return pool.filter((b) => b.name.toLowerCase().includes(query)).slice(0, 10)
  }, [bankSearchTerm, connectorsList])

  // Modal de importação universal OFX / CSV (Plano B)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importAccountName, setImportAccountName] = useState('Meu Banco')
  const [parsedRows, setParsedRows] = useState<ImportedRow[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  // Map de contas agrupadas por connection_id
  const accountsByConnection = useMemo(() => {
    const map: Record<string, BankAccountRecord[]> = {}
    bankAccounts.forEach((acc) => {
      if (!map[acc.connection_id]) map[acc.connection_id] = []
      map[acc.connection_id].push(acc)
    })
    return map
  }, [bankAccounts])

  useEffect(() => {
    if (user) {
      loadOpenFinanceData()
    }
  }, [user])

  // Carregar lista de conectores da API Pluggy
  useEffect(() => {
    fetchPluggyConnectors()
      .then((list) => {
        if (list && list.length > 0) {
          setConnectorsList(list)
        }
      })
      .catch((err) => {
        console.warn('[OpenFinance] Aviso ao carregar conectores:', err)
      })
  }, [])

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

      const accounts = await fetchBankAccounts(user.id)
      setBankAccounts(accounts)

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

  // Sincronização individual por connectionId
  const handleSyncConnection = async (conn: BankConnection, silent = false) => {
    if (!user || !conn.id) return
    setSyncingConnId(conn.id)

    try {
      const res = await syncPluggyConnection(conn.id)

      if (res.state === 'updating') {
        if (!silent) {
          toast.info(res.message || `${conn.institution_name} está atualizando. Concluindo em segundo plano...`)
        }
        // Polling suave em background
        pollSyncUntilDone(conn.id, async (update) => {
          if (update.state === 'ok') {
            await refreshProfile()
            await loadOpenFinanceData()
          }
        })
      } else if (res.state === 'needs_user_action') {
        if (!silent) {
          toast.error(res.message || `${conn.institution_name} requer autorização. Toque em Reconectar.`)
        }
      } else if (res.state === 'partial') {
        if (!silent) {
          toast.info(res.message || `Saldo atualizado. Extrato ainda aguarda liberação do ${conn.institution_name}.`)
        }
      } else if (res.state === 'ok') {
        const totalInserted = res.accounts?.reduce((sum, a) => sum + (a.inserted || 0), 0) || 0
        if (!silent) {
          if (totalInserted > 0) {
            toast.success(`${conn.institution_name}: ${totalInserted} novos lançamentos sincronizados!`)
          } else {
            toast.success(`${conn.institution_name}: saldo e lançamentos em dia!`)
          }
        }
      } else if (res.state === 'already_running') {
        if (!silent) {
          toast.info(`Uma sincronização já está em andamento para o ${conn.institution_name}.`)
        }
      } else {
        if (!silent) {
          toast.error(res.message || res.error || 'Erro ao sincronizar dados da instituição.')
        }
      }

      await refreshProfile()
      await loadOpenFinanceData()
    } catch (err: any) {
      if (!silent) {
        toast.error(err.message || 'Erro ao sincronizar conexão bancária.')
      }
    } finally {
      setSyncingConnId(null)
    }
  }

  // Sincronizar todas as contas ativas usando fila serializada no front com progresso
  const handleSyncAllQueue = async () => {
    if (!user) return
    const activeConns = connections.filter((c) => c.status === 'active')
    if (activeConns.length === 0) return

    setSyncQueueStatus({
      current: 1,
      total: activeConns.length,
      bankName: activeConns[0].institution_name,
      running: true,
    })

    let syncedCountTotal = 0
    let anyPartial = false

    for (let i = 0; i < activeConns.length; i++) {
      const conn = activeConns[i]
      setSyncQueueStatus({
        current: i + 1,
        total: activeConns.length,
        bankName: conn.institution_name,
        running: true,
      })

      try {
        const res = await syncPluggyConnection(conn.id)
        if (res.state === 'partial') anyPartial = true
        if (res.accounts) {
          syncedCountTotal += res.accounts.reduce((sum, a) => sum + (a.inserted || 0), 0)
        }
      } catch (err) {
        console.warn(`[SyncQueue] Falha ao sincronizar ${conn.institution_name}:`, err)
      }
    }

    setSyncQueueStatus(null)
    await refreshProfile()
    await loadOpenFinanceData()

    if (anyPartial) {
      toast.info('Saldos atualizados. O extrato de alguns bancos ainda está sendo processado.')
    } else if (syncedCountTotal > 0) {
      toast.success(`Sincronização concluída: ${syncedCountTotal} novos lançamentos importados!`)
    } else {
      toast.success('Todas as contas foram verificadas e estão em dia!')
    }
  }

  const handleToggleIncludeInBalance = async (accId: string, currentInclude: boolean) => {
    const nextVal = !currentInclude
    // Otimista
    setBankAccounts((prev) =>
      prev.map((a) => (a.id === accId ? { ...a, include_in_balance: nextVal } : a))
    )
    const ok = await toggleAccountInBalance(accId, nextVal)
    if (!ok) {
      // Rollback
      setBankAccounts((prev) =>
        prev.map((a) => (a.id === accId ? { ...a, include_in_balance: currentInclude } : a))
      )
      toast.error('Não foi possível alterar a inclusão no saldo.')
    } else {
      toast.success(nextVal ? 'Conta incluída no saldo disponível.' : 'Conta removida do saldo disponível.')
      await refreshProfile()
    }
  }

  const handleOpenReportModal = async (conn: BankConnection) => {
    if (!user) return
    setSelectedReportConn(conn)
    setLoadingReport(true)
    setCopiedReport(false)
    try {
      const report = await fetchLatestSyncRun(user.id, conn.id)
      setReportData(report)
    } finally {
      setLoadingReport(false)
    }
  }

  const handleCopyReport = () => {
    if (!selectedReportConn) return
    const text = [
      `--- Relatório de Sincronização Open Finance ---`,
      `Instituição: ${selectedReportConn.institution_name}`,
      `ID da Conexão: ${selectedReportConn.id.slice(0, 8)}...`,
      `Status do Run: ${reportData?.status || 'Nenhum run registrado'}`,
      `Iniciado em: ${reportData?.started_at ? new Date(reportData.started_at).toLocaleString('pt-BR') : 'N/A'}`,
      `Finalizado em: ${reportData?.finished_at ? new Date(reportData.finished_at).toLocaleString('pt-BR') : 'N/A'}`,
      `Estatísticas: ${JSON.stringify(reportData?.stats || selectedReportConn.status_detail || {}, null, 2)}`,
      `Erros acumulados: ${JSON.stringify(reportData?.errors || [], null, 2)}`,
    ].join('\n')

    navigator.clipboard.writeText(text)
    setCopiedReport(true)
    toast.success('Relatório copiado para a área de transferência!')
    setTimeout(() => setCopiedReport(false), 2500)
  }

  const handleRevokeConnection = async (conn: BankConnection) => {
    if (!user || !conn.id) return
    if (!confirm(`Deseja realmente revogar o compartilhamento com o ${conn.institution_name}?`)) {
      return
    }

    const ok = await revokePluggyConnection(conn.id)
    if (ok) {
      toast.success(`Conexão com ${conn.institution_name} revogada e dados arquivados.`)
      await refreshProfile()
      await loadOpenFinanceData()
    } else {
      toast.error('Erro ao revogar conexão.')
    }
  }

  const handleReconnectBank = async (conn: BankConnection) => {
    if (!user || connecting) return
    setConnecting(true)
    try {
      await openPluggyConnect(user.id, {
        itemId: conn.provider_ref || undefined,
        onSuccess: async () => {
          setConnecting(false)
          toast.success(`Conexão com ${conn.institution_name} restabelecida!`)
          await refreshProfile()
          await loadOpenFinanceData()
          await handleSyncConnection(conn)
        },
        onError: () => {
          setConnecting(false)
          toast.error('Falha ao reconectar. Tente novamente mais tarde.')
        },
        onClose: () => {
          setConnecting(false)
        },
      })
    } catch (err: any) {
      setConnecting(false)
      toast.error(err?.message || 'Não foi possível abrir o módulo de reconexão.')
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

  const handleOpenFullCatalogWidget = async () => {
    if (!user) return
    setConnecting(true)
    try {
      await openPluggyConnect(user.id, {
        onSuccess: async (item) => {
          setConnecting(false)
          toast.success(`Conta ${item.connector?.name || 'bancária'} conectada via Open Finance!`)
          await refreshProfile()
          loadOpenFinanceData()
        },
        onError: () => {
          setConnecting(false)
          toast.error('Não foi possível concluir pelo catálogo. Tente a conexão direta.')
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

  // Manipulador de upload de arquivo OFX ou CSV
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportFileName(file.name)
    try {
      const text = await file.text()
      const isOfx = file.name.toLowerCase().endsWith('.ofx') || text.includes('<OFX>')
      const rows = isOfx ? parseOfx(text) : parseCsv(text)

      if (rows.length === 0) {
        toast.error('Nenhuma transação válida identificada neste arquivo.')
        setParsedRows([])
        return
      }

      setParsedRows(rows)
      toast.success(`${rows.length} lançamentos identificados no arquivo!`)
    } catch (err: any) {
      toast.error('Erro ao ler arquivo: ' + (err.message || 'Formato inválido.'))
    }
  }

  const handleConfirmImport = async () => {
    if (!user || parsedRows.length === 0) return
    setIsImporting(true)
    try {
      const res = await importBankStatement(user.id, importAccountName, parsedRows)
      toast.success(`${res.inserted} de ${res.total} lançamentos importados com sucesso!`)
      setShowImportModal(false)
      setParsedRows([])
      setImportFileName('')
      await refreshProfile()
      await loadOpenFinanceData()
    } catch (err: any) {
      toast.error('Falha ao gravar transações importadas: ' + (err.message || 'Erro inesperado'))
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <AppShell showNav={true} className="px-4 sm:px-5 pt-4 pb-28 flex flex-col overflow-y-auto">
      <div className="flex flex-col gap-4 w-full max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-white/70 backdrop-blur-sm rounded-[22px] px-3.5 py-2.5 border border-[#EFE6FA] shadow-card">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              onClick={() => navigate('/perfil')}
              className="w-9 h-9 rounded-full bg-[#F5EEFF] hover:bg-[#E9D5FF] text-[#432171] flex items-center justify-center transition-colors cursor-pointer shrink-0"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="text-[17px] font-extrabold text-[#33105D] font-sans leading-tight truncate">
                Open Finance
              </h1>
              <p className="text-[11px] font-semibold text-[#7D6A9C] leading-snug line-clamp-2">
                Suas contas e lançamentos integrados com segurança oficial.
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <Mascot size="sm" pose="shield" />
          </div>
        </div>

        {/* Barra de Progresso da Fila de Sincronização */}
        {syncQueueStatus && (
          <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3.5 flex flex-col gap-2 shadow-sm animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-black text-[#5B21B6]">
              <span className="flex items-center gap-1.5 truncate">
                <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
                <span className="truncate">
                  Sincronizando {syncQueueStatus.current}/{syncQueueStatus.total}: {syncQueueStatus.bankName}
                </span>
              </span>
              <span className="shrink-0">{Math.round((syncQueueStatus.current / syncQueueStatus.total) * 100)}%</span>
            </div>
            <div className="w-full bg-[#E9D5FF]/60 h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#7D2BD6] h-full transition-all duration-300"
                style={{ width: `${(syncQueueStatus.current / syncQueueStatus.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Lista de Instituições Conectadas */}
        {connections.filter((c) => c.status === 'active').length > 0 ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[11px] font-black text-[#7D6A9C] uppercase tracking-wider truncate">
                  Bancos Conectados
                </span>
                <span className="text-[11px] font-black text-[#7D2BD6] bg-[#F3E8FF] border border-[#E9D5FF] px-2.5 py-0.5 rounded-full shrink-0">
                  {connections.filter((c) => c.status === 'active').length}
                </span>
              </div>
              {connections.filter((c) => c.status === 'active').length > 1 && (
                <button
                  type="button"
                  onClick={handleSyncAllQueue}
                  disabled={syncQueueStatus !== null || syncingConnId !== null}
                  className="text-[11px] font-extrabold text-[#7D2BD6] bg-white hover:bg-[#F3E8FF] border border-[#E9D5FF] px-3 py-1 rounded-full flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50 transition-colors shadow-sm"
                >
                  <RefreshCw className={`w-3 h-3 ${syncQueueStatus ? 'animate-spin' : ''}`} />
                  <span>Sincronizar todas</span>
                </button>
              )}
            </div>

            {connections
              .filter((c) => c.status === 'active')
              .map((conn) => {
                const sDetail = (conn.status_detail as any) || {}
                const isAccountsOk = sDetail.accounts?.isUpdated !== false || conn.execution_status === 'SUCCESS'
                const isTxOk = conn.execution_status === 'SUCCESS' || sDetail.transactions?.isUpdated === true
                const hasCards = Boolean(sDetail.creditCards)
                const isCardsOk = sDetail.creditCards?.isUpdated === true
                const isPartial = conn.execution_status === 'PARTIAL_SUCCESS' || (!isTxOk && conn.execution_status !== 'SUCCESS')
                const needsUserAction = conn.needs_user_action || conn.pluggy_status === 'LOGIN_ERROR' || conn.pluggy_status === 'WAITING_USER_INPUT'

                const connAccounts = accountsByConnection[conn.id] || []

                return (
                  <div
                    key={conn.id}
                    className="bg-white rounded-[24px] p-4 sm:p-5 border border-[#EFE6FA] shadow-card flex flex-col gap-3.5 w-full box-border overflow-hidden transition-all"
                  >
                    {/* Topo do Card do Banco */}
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm overflow-hidden bg-white border border-[#E9D5FF] p-1.5">
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
                          <h2 className="text-[15px] font-extrabold text-[#33105D] truncate leading-tight">
                            {conn.institution_name}
                          </h2>
                          <p className="text-[11px] font-bold text-[#7D6A9C] truncate mt-0.5">
                            Sincronizado {formatTimeAgo(conn.last_synced_at)}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {needsUserAction ? (
                          <button
                            type="button"
                            onClick={() => handleReconnectBank(conn)}
                            className="h-8 px-3.5 rounded-full text-[11px] font-extrabold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer transition-colors shadow-sm inline-flex items-center justify-center"
                          >
                            Reconectar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSyncConnection(conn)}
                            disabled={syncingConnId === conn.id || syncQueueStatus !== null}
                            className="h-8 px-3.5 rounded-full inline-flex items-center justify-center gap-1.5 text-[11px] font-black text-[#7D2BD6] hover:text-[#5B21B6] bg-[#F4EBFF] hover:bg-[#E9D5FF] cursor-pointer disabled:opacity-50 transition-colors"
                            title="Sincronizar dados deste banco"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${syncingConnId === conn.id ? 'animate-spin' : ''} shrink-0`} />
                            <span>
                              {syncingConnId === conn.id ? 'Atualizando...' : 'Sincronizar'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Status em Grid Uniforme (mesma dimensão e alinhamento) */}
                    <div className={`grid ${hasCards ? 'grid-cols-3' : 'grid-cols-2'} gap-1.5 w-full`}>
                      {isAccountsOk ? (
                        <span className="h-7 px-2 rounded-xl text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/70 inline-flex items-center justify-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{hasCards ? 'Saldo em dia' : 'Saldo atualizado'}</span>
                        </span>
                      ) : (
                        <span className="h-7 px-2 rounded-xl text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200/70 inline-flex items-center justify-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          <span className="truncate">Saldo pendente</span>
                        </span>
                      )}

                      {isTxOk ? (
                        <span className="h-7 px-2 rounded-xl text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200/70 inline-flex items-center justify-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span className="truncate">{hasCards ? 'Extrato em dia' : 'Extrato completo'}</span>
                        </span>
                      ) : (
                        <span className="h-7 px-2 rounded-xl text-[10px] font-extrabold text-violet-800 bg-violet-50 border border-violet-200/70 inline-flex items-center justify-center gap-1.5 truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shrink-0" />
                          <span className="truncate">{hasCards ? 'Processando' : 'Extrato em proc.'}</span>
                        </span>
                      )}

                      {hasCards && (
                        <span className={`h-7 px-2 rounded-xl text-[10px] font-extrabold inline-flex items-center justify-center gap-1.5 border truncate ${
                          isCardsOk
                            ? 'text-emerald-800 bg-emerald-50 border-emerald-200/70'
                            : 'text-amber-800 bg-amber-50 border-amber-200/70'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isCardsOk ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="truncate">Cartão {isCardsOk ? 'em dia' : 'pendente'}</span>
                        </span>
                      )}
                    </div>

                    {/* Aviso Suave quando Parcial (Nubank) */}
                    {isPartial && !needsUserAction && (
                      <div className="bg-[#FFFBEB] border border-amber-200/80 rounded-2xl p-3 flex flex-col gap-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold text-amber-950 leading-snug">
                            O saldo foi sincronizado! O extrato ainda está sendo gerado pelo banco e será baixado automaticamente assim que liberado.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleSyncConnection(conn)}
                            disabled={syncingConnId === conn.id}
                            className="h-8 px-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300/80 text-[11px] font-extrabold text-[#7D2BD6] flex items-center justify-center cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            {syncingConnId === conn.id ? 'Checando...' : 'Checar extrato'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReconnectBank(conn)}
                            className="h-8 px-2.5 rounded-xl bg-white hover:bg-amber-50 border border-amber-300/80 text-[11px] font-extrabold text-[#7D2BD6] flex items-center justify-center cursor-pointer transition-colors"
                          >
                            Revisar no banco
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Banner quando precisa de ação da usuária */}
                    {needsUserAction && (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between gap-2.5">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] font-bold text-rose-950 leading-snug">
                            A sessão com este banco expirou. Toque em Reconectar.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleReconnectBank(conn)}
                          className="h-8 px-3 rounded-xl bg-white border border-rose-200 text-[11px] font-black text-rose-700 shrink-0 cursor-pointer"
                        >
                          Reconectar
                        </button>
                      </div>
                    )}

                    {/* Lista de Contas e Cartões desta Conexão */}
                    {connAccounts.length > 0 && (
                      <div className="flex flex-col gap-2 pt-2.5 border-t border-[#F3E8FF]">
                        <span className="text-[10px] font-black uppercase text-[#7D6A9C] tracking-wider">
                          Contas e Cartões Vinculados
                        </span>
                        <div className="flex flex-col gap-2">
                          {connAccounts.map((acc) => {
                            const isCredit = acc.type === 'CREDIT'
                            const cleanTitle = formatAccountDisplayName(acc, conn.institution_name)
                            return (
                              <div
                                key={acc.id}
                                className="p-3 rounded-2xl bg-[#FAF7FF] border border-[#EFE6FA] flex items-center justify-between gap-2.5"
                              >
                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="text-xs font-extrabold text-[#33105D] truncate">
                                      {cleanTitle}
                                    </span>
                                    {acc.number_masked && (
                                      <span className="text-[10px] font-bold text-[#7D6A9C] bg-white px-1.5 py-0.5 rounded-md border border-[#E9D5FF] shrink-0">
                                        ••{acc.number_masked.slice(-4)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[#7D6A9C] mt-0.5">
                                    <span>
                                      {isCredit
                                        ? 'Cartão · Fatura atual'
                                        : acc.include_in_balance
                                        ? 'Conta Corrente · No saldo'
                                        : 'Conta Corrente · Oculta'}
                                    </span>
                                    <span>•</span>
                                    <span>{formatTimeAgo(acc.last_synced_at)}</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 shrink-0">
                                  <span className="text-[13px] font-black text-[#33105D] tabular-nums">
                                    {formatCurrency(acc.balance)}
                                  </span>

                                  {/* Interruptor "Incluir no meu saldo" para contas BANK ou badge fixo para Cartão */}
                                  {!isCredit ? (
                                    <button
                                      type="button"
                                      role="switch"
                                      aria-checked={acc.include_in_balance}
                                      onClick={() => handleToggleIncludeInBalance(acc.id, acc.include_in_balance)}
                                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                        acc.include_in_balance ? 'bg-[#7D2BD6]' : 'bg-gray-300'
                                      }`}
                                      title={acc.include_in_balance ? 'Conta inclusa no Saldo Disponível' : 'Conta ignorada no Saldo Disponível'}
                                    >
                                      <span
                                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                          acc.include_in_balance ? 'translate-x-4' : 'translate-x-0'
                                        }`}
                                      />
                                    </button>
                                  ) : (
                                    <span className="w-9 h-5 rounded-full bg-[#F3E8FF] border border-[#E9D5FF] text-[9px] font-extrabold text-[#7D2BD6] inline-flex items-center justify-center shrink-0">
                                      Fatura
                                    </span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rodapé do Card: Relatório e Revogar com dimensões idênticas */}
                    <div className="pt-2.5 border-t border-[#F3E8FF] grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReportModal(conn)}
                        className="h-8 px-3 rounded-xl bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#EFE6FA] font-extrabold text-[11px] text-[#7D2BD6] flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#7D2BD6] shrink-0" />
                        <span className="truncate">Relatório</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRevokeConnection(conn)}
                        className="h-8 px-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/60 font-extrabold text-[11px] text-rose-600 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">Desconectar</span>
                      </button>
                    </div>
                  </div>
                )
              })}

            <div className="pt-1 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={openBankSelectorModal}
                disabled={connecting}
                className="w-full h-12 px-4 rounded-2xl bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-black text-sm shadow-button hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <Plus className="w-4 h-4 stroke-[2.5] shrink-0" />
                <span>Conectar novo banco</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => navigate('/gastos')}
                  className="h-11 px-3 rounded-2xl bg-[#F3E8FF] hover:bg-[#E9D5FF] border border-[#E9D5FF] text-[#7D2BD6] font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Ver extrato</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="h-11 px-3 rounded-2xl bg-white border border-[#E9D5FF] text-[#7D2BD6] font-extrabold text-xs hover:bg-[#FAF5FF] transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-sm"
                >
                  <UploadCloud className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Importar extrato</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[28px] p-6 text-center border border-[#F3E8FF] shadow-[0_8px_30px_rgba(125,43,214,0.06)] flex flex-col items-center gap-3.5 my-auto">
            <Mascot size="lg" pose="empty" className="mx-auto" />
            <h3 className="text-lg font-extrabold text-[#33105D]">Nenhuma conta conectada</h3>
            <p className="text-xs text-[#7D6A9C] font-semibold leading-relaxed max-w-xs mx-auto">
              Conecte seu banco com Open Finance para acompanhar saldo e lançamentos automaticamente com segurança oficial.
            </p>
            <div className="flex flex-col gap-2.5 w-full max-w-xs mt-2">
              <button
                type="button"
                onClick={openBankSelectorModal}
                className="w-full py-3.5 px-4 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs hover:opacity-95 active:scale-[0.99] transition-all cursor-pointer"
              >
                Conectar meu primeiro banco
              </button>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="w-full py-3 px-4 rounded-full bg-[#FAF5FF] border border-[#7D2BD6]/30 text-[#7D2BD6] font-extrabold text-xs hover:bg-[#F3E8FF] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-4 h-4 shrink-0" />
                <span>Importar arquivo (OFX ou CSV)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Relatório da Última Sincronização */}
      {selectedReportConn && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-5 w-full max-w-md shadow-2xl border border-lilac/20 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-lilac/15">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#7D2BD6]" />
                <h3 className="text-sm font-extrabold text-[#432171]">
                  Relatório · {selectedReportConn.institution_name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportConn(null)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 text-xs font-semibold text-[#432171]">
              {loadingReport ? (
                <div className="py-8 text-center text-gray-400">Carregando relatório...</div>
              ) : reportData ? (
                <>
                  <div className="bg-[#FAF8FD] p-3 rounded-xl space-y-1.5 border border-lilac/10">
                    <div className="flex justify-between">
                      <span className="text-[#7D6A9C]">Status da Execução:</span>
                      <span className="font-extrabold uppercase text-[#7D2BD6]">{reportData.status}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7D6A9C]">Iniciado em:</span>
                      <span>{new Date(reportData.started_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#7D6A9C]">Finalizado em:</span>
                      <span>{reportData.finished_at ? new Date(reportData.finished_at).toLocaleString('pt-BR') : '--'}</span>
                    </div>
                  </div>

                  <div className="bg-[#FAF8FD] p-3 rounded-xl space-y-1.5 border border-lilac/10">
                    <span className="font-bold text-[#7D6A9C] block mb-1">Estatísticas do Lote:</span>
                    <pre className="text-[10px] font-mono bg-white p-2 rounded-lg border border-lilac/10 overflow-x-auto">
                      {JSON.stringify(reportData.stats || selectedReportConn.status_detail || {}, null, 2)}
                    </pre>
                  </div>

                  {reportData.errors && (
                    <div className="bg-rose-50 p-3 rounded-xl space-y-1.5 border border-rose-200">
                      <span className="font-bold text-rose-700 block mb-1">Erros Registrados:</span>
                      <pre className="text-[10px] font-mono bg-white p-2 rounded-lg border border-rose-200 overflow-x-auto text-rose-900">
                        {JSON.stringify(reportData.errors, null, 2)}
                      </pre>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-6 text-center text-[#7D6A9C]">
                  Nenhum registro de sync_runs encontrado para esta conexão.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-lilac/15 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyReport}
                className="py-2.5 px-4 rounded-full bg-lilac/15 hover:bg-lilac/25 text-[#7D2BD6] font-extrabold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedReport ? 'Copiado!' : 'Copiar relatório'}</span>
              </button>

              <Button size="sm" onClick={() => setSelectedReportConn(null)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Conexão Direta com Banco (CPF + OAuth) */}
      {showDirectModal && (
        <div className="fixed inset-0 z-50 bg-[#2D0D55]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[28px] p-5 w-full max-w-sm shadow-[0_20px_60px_rgba(45,13,85,0.25)] border border-lilac/20 relative">
            <button
              onClick={() => setShowDirectModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-lilac/15 text-deep transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-[#7D2BD6]" />
              <h3 className="text-sm font-extrabold text-[#432171]">
                Conectar via Open Finance
              </h3>
            </div>

            {!pendingItemId ? (
              <form onSubmit={handleCreateDirectOAuth} className="flex flex-col gap-3">
                <p className="text-xs text-[#7D6A9C] font-semibold leading-relaxed">
                  Escolha seu banco e confirme seu CPF para abrir o aplicativo do seu banco com segurança:
                </p>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-extrabold text-[#432171]">Selecione sua instituição</label>
                    <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Oficial Pluggy
                    </span>
                  </div>

                  {/* Campo de busca rápida de bancos (flex sem sobreposição de ícone) */}
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-lilac/25 bg-[#FAF5FF]/70 focus-within:border-[#7D2BD6] focus-within:bg-white transition-colors">
                    <Search className="w-4 h-4 text-[#7D6A9C]/70 shrink-0 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Buscar banco ou carteira..."
                      value={bankSearchTerm}
                      onChange={(e) => setBankSearchTerm(e.target.value)}
                      className="w-full bg-transparent text-xs font-bold text-[#432171] placeholder:text-[#7D6A9C]/60 focus:outline-hidden"
                    />
                  </div>

                  {/* Lista visual de cards de bancos com ícone colorido e seleção */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 py-1">
                    {displayBanks.map((b) => {
                      const isSelected = selectedBank.id === b.id
                      const isOnline = 'status' in b ? (b as any).status === 'ONLINE' : true
                      const color = 'color' in b ? (b as any).color : '#7D2BD6'

                      return (
                        <button
                          key={b.id}
                          type="button"
                          disabled={!isOnline}
                          onClick={() => setSelectedBank({ id: b.id, name: b.name, color })}
                          className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#7D2BD6] bg-[#F4EBFF] shadow-xs ring-1 ring-[#7D2BD6]'
                              : 'border-lilac/20 bg-white hover:bg-[#FAF5FF]/60'
                          } ${!isOnline ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-[11px] shrink-0 shadow-xs"
                              style={{ backgroundColor: color }}
                            >
                              {b.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <span className="block text-xs font-extrabold text-[#432171] truncate">
                                {b.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 inline shrink-0" />
                                Conexão Oficial {!isOnline ? '(Offline)' : ''}
                              </span>
                            </div>
                          </div>
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? 'border-[#7D2BD6] bg-[#7D2BD6] text-white'
                                : 'border-[#D8B4FE] bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-extrabold text-[#432171]">CPF do Titular</label>
                  <input
                    type="tel"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpfInput(e.target.value))}
                    maxLength={14}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-lilac/25 bg-white text-xs font-bold text-[#432171] placeholder:text-[#7D6A9C]/50 focus:outline-hidden focus:border-[#7D2BD6] transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingOAuth}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-black text-sm shadow-[0_4px_16px_rgba(125,43,214,0.2)] hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
                >
                  {creatingOAuth ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Conectando ao {selectedBank.name}...</span>
                    </>
                  ) : (
                    <span>Continuar para o {selectedBank.name}</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenFullCatalogWidget}
                  className="text-[11px] font-bold text-[#7D2BD6] hover:underline text-center py-0.5 cursor-pointer"
                >
                  Outro banco? Abrir catálogo completo Pluggy
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-3 py-1">
                <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3 text-xs font-semibold text-[#33105D] leading-relaxed">
                  <strong className="font-extrabold block mb-1 text-sm">
                    Quase lá! Autorize no {pendingBankName}:
                  </strong>
                  Toque no botão abaixo para abrir o app do <strong>{pendingBankName}</strong> no celular e confirme as permissões de saldo e extrato.
                </div>

                {pendingOAuthUrl && (
                  <a
                    href={pendingOAuthUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-3 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 text-center"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    <span>1. Abrir app do {pendingBankName}</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={async () => {
                    const conn = connections.find((c) => c.provider_ref === pendingItemId)
                    if (conn) {
                      await handleSyncConnection(conn)
                    } else {
                      await loadOpenFinanceData()
                    }
                    setShowDirectModal(false)
                  }}
                  disabled={syncingConnId !== null}
                  className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 text-center"
                >
                  <RefreshCw className="w-4 h-4 shrink-0" />
                  <span>2. Já autorizei · Sincronizar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPendingItemId(null)
                    setPendingOAuthUrl(null)
                  }}
                  className="text-xs font-bold text-[#7D6A9C] hover:text-[#432171] text-center py-1 cursor-pointer"
                >
                  Voltar e escolher outro banco
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Importação Universal de Extrato OFX ou CSV (Plano B) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-[26px] p-5 w-full max-w-sm shadow-2xl border border-lilac/20 relative flex flex-col gap-3">
            <button
              onClick={() => {
                setShowImportModal(false)
                setParsedRows([])
                setImportFileName('')
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-lilac/15 text-deep transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-[#7D2BD6]" />
              <h3 className="text-sm font-extrabold text-[#432171]">
                Importar Extrato Bancário
              </h3>
            </div>

            <p className="text-xs text-[#7D6A9C] font-semibold leading-relaxed">
              Exporte o extrato do seu banco em formato <strong>.OFX</strong> ou <strong>.CSV</strong> e envie aqui:
            </p>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-extrabold text-[#432171]">Nome da Instituição</label>
              <input
                type="text"
                placeholder="Ex: Nubank, Inter, Caixa..."
                value={importAccountName}
                onChange={(e) => setImportAccountName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-lilac/25 text-xs font-bold text-[#432171] focus:outline-hidden focus:border-[#7D2BD6]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-extrabold text-[#432171]">Selecione o Arquivo</label>
              <label className="border-2 border-dashed border-[#7D2BD6]/30 hover:border-[#7D2BD6] rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-[#FAF8FD] transition-colors">
                <FileText className="w-6 h-6 text-[#7D2BD6]" />
                <span className="text-xs font-extrabold text-[#432171]">
                  {importFileName ? importFileName : 'Toque para escolher arquivo'}
                </span>
                <span className="text-[10px] text-[#7D6A9C] font-semibold">
                  Formatos suportados: .ofx, .csv
                </span>
                <input
                  type="file"
                  accept=".ofx,.csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {parsedRows.length > 0 && (
              <div className="bg-[#FAF5FF] border border-[#E9D5FF] rounded-xl p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-black text-[#5B21B6]">
                  <span>Pré-visualização</span>
                  <span>{parsedRows.length} lançamentos</span>
                </div>
                <div className="flex flex-col divide-y divide-purple-100 max-h-32 overflow-y-auto">
                  {parsedRows.slice(0, 4).map((row, idx) => (
                    <div key={idx} className="py-1 flex items-center justify-between text-[11px]">
                      <div className="truncate max-w-[180px] font-bold text-[#432171]">
                        {row.description}
                      </div>
                      <span className={`font-black shrink-0 ${row.amount >= 0 ? 'text-emerald-600' : 'text-[#432171]'}`}>
                        {formatCurrency(row.amount)}
                      </span>
                    </div>
                  ))}
                  {parsedRows.length > 4 && (
                    <div className="text-[10px] text-center text-[#7D6A9C] pt-1">
                      + {parsedRows.length - 4} outros lançamentos
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={isImporting || parsedRows.length === 0}
              className="w-full py-3 px-3 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#9333EA] text-white font-extrabold text-xs shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 text-center"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Importando lançamentos...</span>
                </>
              ) : (
                <span>Confirmar importação de {parsedRows.length} linhas</span>
              )}
            </button>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default OpenFinancePage
