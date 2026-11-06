import React, { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  const handleRetry = () => {
    setRetrying(true)
    setTimeout(() => {
      setIsOffline(!navigator.onLine)
      setRetrying(false)
    }, 600)
  }

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[999] bg-[#3B0764] text-white px-4 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs font-nunito animate-fadeIn"
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 text-pink-300 shrink-0" />
        <span className="font-bold truncate">
          Sem conexão no momento. Seus dados continuam visíveis.
        </span>
      </div>
      <button
        type="button"
        onClick={handleRetry}
        disabled={retrying}
        className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-black shrink-0 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
      >
        <RefreshCw className={`w-3 h-3 ${retrying ? 'animate-spin' : ''}`} />
        <span>Tentar de novo</span>
      </button>
    </div>
  )
}
export default OfflineBanner
