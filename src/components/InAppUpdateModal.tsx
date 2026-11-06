import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Mascot } from './Mascot'
import { Sparkles, Download, X } from 'lucide-react'
import { APP_VERSION_CODE, APP_VERSION_NAME } from '../lib/appVersion'

export const InAppUpdateModal: React.FC = () => {
  const [updateInfo, setUpdateInfo] = useState<{
    versionName: string
    versionCode: number
    downloadUrl: string
    releaseNotes: string
    isMandatory: boolean
  } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Checa apenas uma vez ao montar o app
    checkForUpdate()

    // Ao voltar para o foreground (ex: minimizar e reabrir), checa apenas se não foi dispensado
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !sessionStorage.getItem('pp_update_dismissed_session')) {
        checkForUpdate()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const checkForUpdate = async () => {
    try {
      // Se o usuário já dispensou nesta sessão, não incomoda mais
      if (sessionStorage.getItem('pp_update_dismissed_session')) {
        return
      }

      const { data, error } = await supabase
        .from('app_releases')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error || !data) return

      // Só notifica se a versão do banco for estritamente maior que a versão instalada
      if (data.version_code > APP_VERSION_CODE) {
        // Se a atualização não for obrigatória, checa se está no período de snooze (24h)
        const snoozeKey = `pp_snooze_update_${data.version_code}`
        const snoozedUntil = Number(localStorage.getItem(snoozeKey) || 0)
        const isSnoozed = Date.now() < snoozedUntil

        if (!data.is_mandatory && isSnoozed) {
          return
        }

        setUpdateInfo({
          versionName: data.version_name,
          versionCode: data.version_code,
          downloadUrl: data.download_url,
          releaseNotes: data.release_notes,
          isMandatory: data.is_mandatory,
        })
        setIsOpen(true)
      }
    } catch {
      // Silencioso se offline
    }
  }

  if (!isOpen || !updateInfo) return null

  const handleDismiss = () => {
    if (!updateInfo.isMandatory) {
      // Snooze por 24 horas no localStorage
      localStorage.setItem(
        `pp_snooze_update_${updateInfo.versionCode}`,
        String(Date.now() + 24 * 60 * 60 * 1000)
      )
      // E silencia durante toda esta sessão
      sessionStorage.setItem('pp_update_dismissed_session', 'true')
      setIsOpen(false)
    }
  }

  const handleDownload = () => {
    // Ao clicar em baixar, fecha imediatamente a modal e ativa o snooze de 24h
    // para não reaparecer quando o usuário retornar do navegador
    localStorage.setItem(
      `pp_snooze_update_${updateInfo.versionCode}`,
      String(Date.now() + 24 * 60 * 60 * 1000)
    )
    sessionStorage.setItem('pp_update_dismissed_session', 'true')
    setIsOpen(false)

    try {
      window.open(updateInfo.downloadUrl, '_system')
    } catch {
      window.location.href = updateInfo.downloadUrl
    }
  }

  return (
    <div
      onClick={(e) => {
        // Permite fechar clicando no fundo escuro
        if (e.target === e.currentTarget && !updateInfo.isMandatory) {
          handleDismiss()
        }
      }}
      className="fixed inset-0 z-50 bg-[#230B42]/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-[28px] p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center relative border-2 border-[#E9D5FF]">
        {!updateInfo.isMandatory && (
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#432171] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="-mt-14 mb-2">
          <Mascot size="lg" pose="idea" floating={true} />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3E8FF] text-[#7D2BD6] text-[11px] font-black mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          Nova versão {updateInfo.versionName} disponível!
        </div>

        <h2 className="text-[20px] font-extrabold text-[#33105D] leading-tight mb-1">
          Atualização do PurplePiggy
        </h2>

        <p className="text-[12px] font-bold text-[#6B5A8E] mb-4">
          Uma versão mais recente do aplicativo está pronta para você.
        </p>

        {/* Novidades */}
        <div className="w-full bg-[#FAF5FF] border border-[#E9D5FF] rounded-2xl p-3.5 text-left mb-4">
          <span className="block text-[11px] font-black text-[#7D2BD6] uppercase tracking-wider mb-1">
            Novidades da versão:
          </span>
          <p className="text-[12px] font-bold text-[#432171] leading-relaxed whitespace-pre-line">
            {updateInfo.releaseNotes}
          </p>
        </div>

        <div className="w-full flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full h-12 rounded-full bg-gradient-to-r from-[#7D2BD6] to-[#B037F8] text-white font-extrabold text-[14px] shadow-[0_8px_20px_rgba(125,43,214,0.3)] hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Baixar atualização agora
          </button>

          {!updateInfo.isMandatory && (
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-2 text-[12px] font-extrabold text-[#7D6A9C] hover:text-[#432171] cursor-pointer"
            >
              Lembrar depois
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
