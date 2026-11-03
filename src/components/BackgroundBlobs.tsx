import React from 'react'
import { Atmosphere } from './Atmosphere'

export interface BackgroundBlobsProps {
  className?: string
  showSparkles?: boolean
}

/**
 * Componente BackgroundBlobs (mantido para retrocompatibilidade).
 * Delega diretamente para o Atmosphere variant="app".
 */
export const BackgroundBlobs: React.FC<BackgroundBlobsProps> = ({
  className = '',
  showSparkles = true,
}) => {
  return <Atmosphere variant="app" plain={!showSparkles} className={className} />
}

export default BackgroundBlobs
