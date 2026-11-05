import React from 'react'
import { Mascot } from './Mascot'
import { X, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import type { AlertNotification } from '../lib/alerts'

export interface NotificationBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  alerts: AlertNotification[]
}

export const NotificationBottomSheet: React.FC<NotificationBottomSheetProps> = ({
  isOpen,
  onClose,
  alerts,
}) => {
  if (!isOpen) return null

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
        <div className="flex items-center justify-between pb-3 border-b border-[#F0EBF8] mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[18px] font-extrabold text-[#432171] font-nunito">
              Notificações
            </h2>
            {alerts.length > 0 && (
              <span className="bg-[#7D2BD6] text-white text-[11px] font-black px-2 py-0.5 rounded-full">
                {alerts.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar notificações"
            className="w-8 h-8 rounded-full bg-[#F5EEFF] hover:bg-[#EBDCFE] flex items-center justify-center text-[#432171] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="overflow-y-auto space-y-3 pb-4">
          {alerts.length > 0 ? (
            alerts.map((alert) => {
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
                  className={`p-3.5 rounded-2xl border ${bgClass} flex items-start gap-3 transition-all`}
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
                    <h3 className="text-[13px] font-extrabold text-[#432171] leading-tight">
                      {alert.title}
                    </h3>
                    <p className="text-[12px] font-semibold text-[#7D6A9C] leading-snug mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default NotificationBottomSheet
