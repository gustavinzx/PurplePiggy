import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mascot } from './Mascot'
import { X, AlertTriangle, AlertCircle, Info, CheckCheck, ChevronRight, Settings } from 'lucide-react'
import type { AlertNotification } from '../lib/alerts'

export interface NotificationBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  alerts: AlertNotification[]
  onDismissCountChange?: (unreadCount: number) => void
}

const DISMISSED_STORAGE_KEY = 'pp_dismissed_alert_ids'

export const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  isOpen,
  onClose,
  alerts,
  onDismissCountChange,
}) => {
  const navigate = useNavigate()
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(DISMISSED_STORAGE_KEY)
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  const visibleAlerts = alerts.filter((a) => !dismissedIds.includes(a.id))

  useEffect(() => {
    onDismissCountChange?.(visibleAlerts.length)
  }, [visibleAlerts.length, onDismissCountChange])

  if (!isOpen) return null

  const handleDismissOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = Array.from(new Set([...dismissedIds, id]))
    setDismissedIds(next)
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next))
  }

  const handleMarkAllRead = () => {
    const next = Array.from(new Set([...dismissedIds, ...alerts.map((a) => a.id)]))
    setDismissedIds(next)
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next))
  }

  const handleRestoreAll = () => {
    setDismissedIds([])
    localStorage.removeItem(DISMISSED_STORAGE_KEY)
  }

  const handleNavigate = (path?: string) => {
    onClose()
    if (path) {
      navigate(path)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-[#3B1A78]/50 backdrop-blur-xs flex items-end justify-center animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] bg-white rounded-t-[32px] p-6 shadow-2xl flex flex-col relative max-h-[85vh] animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Puxador decorativo */}
        <div className="w-12 h-1.5 bg-[#E2D4F0] rounded-full mx-auto mb-4 shrink-0" />

        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBF8] mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-extrabold text-[#432171] font-nunito">
              Notificações
            </h2>
            {visibleAlerts.length > 0 && (
              <span className="bg-[#7D2BD6] text-white text-[11px] font-black px-2.5 py-0.5 rounded-full">
                {visibleAlerts.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {visibleAlerts.length > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-extrabold text-[#7D2BD6] bg-[#F3E8FF] hover:bg-[#E9D5FF] px-2.5 py-1.5 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                title="Marcar todas como lidas"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Fechar notificações"
              className="w-8 h-8 rounded-full bg-[#F5EEFF] hover:bg-[#EBDCFE] flex items-center justify-center text-[#432171] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto space-y-2.5 pb-3">
          {visibleAlerts.length > 0 ? (
            visibleAlerts.map((alert) => {
              const isDanger = alert.severity === 'danger'
              const isWarning = alert.severity === 'warning'

              const bgClass = isDanger
                ? 'bg-[#FEF2F2] border-[#FCA5A5]'
                : isWarning
                ? 'bg-[#FFFBEB] border-[#FCD34D]'
                : 'bg-[#FAF5FF] border-[#E9D5FF]'

              const iconColor = isDanger
                ? 'text-[#DC2626]'
                : isWarning
                ? 'text-[#D97706]'
                : 'text-[#7D2BD6]'

              return (
                <div
                  key={alert.id}
                  onClick={() => handleNavigate(alert.actionPath)}
                  className={`p-3.5 rounded-2xl border ${bgClass} flex items-start gap-3 transition-all ${
                    alert.actionPath ? 'cursor-pointer hover:brightness-98 active:scale-[0.99]' : ''
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDanger ? (
                      <AlertCircle className={`w-5 h-5 ${iconColor}`} strokeWidth={2.2} />
                    ) : isWarning ? (
                      <AlertTriangle className={`w-5 h-5 ${iconColor}`} strokeWidth={2.2} />
                    ) : (
                      <Info className={`w-5 h-5 ${iconColor}`} strokeWidth={2.2} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[13px] font-extrabold text-[#432171] leading-tight">
                        {alert.title}
                      </h3>
                      <button
                        type="button"
                        onClick={(e) => handleDismissOne(alert.id, e)}
                        className="text-[10px] font-bold text-[#7D6A9C] hover:text-[#432171] px-1.5 py-0.5 rounded-md cursor-pointer shrink-0"
                        title="Marcar como lida"
                      >
                        Lida
                      </button>
                    </div>
                    <p className="text-[12px] font-semibold text-[#7D6A9C] leading-snug mt-0.5">
                      {alert.message}
                    </p>
                    {alert.actionPath && (
                      <div className="mt-2 inline-flex items-center gap-1 text-[11px] font-extrabold text-[#7D2BD6]">
                        <span>{alert.actionLabel || 'Ver detalhes'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-7 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-16 h-16 rounded-full bg-[#FAF5FF] flex items-center justify-center">
                <Mascot pose="head" size="sm" alt="Mascote PurplePiggy" />
              </div>
              <div>
                <h3 className="text-[16px] font-extrabold text-[#432171] font-nunito">
                  Tudo tranquilo por aqui.
                </h3>
                <p className="text-[13px] font-semibold text-[#7D6A9C] mt-1">
                  Seus limites de orçamento e metas estão no controle!
                </p>
                {dismissedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRestoreAll}
                    className="mt-3 text-xs font-extrabold text-[#7D2BD6] bg-[#F3E8FF] hover:bg-[#E9D5FF] px-3.5 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    Reexibir alertas anteriores ({alerts.length})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé para configurar preferências de alertas no Perfil */}
        <div className="pt-2.5 border-t border-[#F0EBF8] flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#7D6A9C]">
            Alertas ativos conforme suas preferências
          </span>
          <button
            type="button"
            onClick={() => handleNavigate('/perfil?open=notifications')}
            className="text-[11px] font-extrabold text-[#7D2BD6] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            Configurar
          </button>
        </div>
      </div>
    </div>
  )
}
export default NotificationBottomSheet
