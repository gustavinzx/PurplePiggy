import React from 'react'

export interface ProgressBarSegment {
  value: number // percentage 0 to 100
  color: string // hex or tailwind class
  label?: string
}

export interface ProgressBarProps {
  progress?: number // 0 to 100 for single progress
  segments?: ProgressBarSegment[] // for stacked multi-segment bar
  height?: number | string
  className?: string
  trackColor?: string
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  segments,
  height = 11,
  className = '',
  trackColor = '#F0E7FA',
}) => {
  const isMultiSegment = segments && segments.length > 0
  const clampedProgress = progress !== undefined ? Math.min(Math.max(progress, 0), 100) : 0

  return (
    <div
      className={`w-full overflow-hidden rounded-full flex ${className}`}
      style={{ height, backgroundColor: trackColor }}
    >
      {isMultiSegment ? (
        segments.map((seg, idx) => (
          <div
            key={idx}
            style={{
              width: `${Math.max(seg.value, 0)}%`,
              backgroundColor: seg.color,
            }}
            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            title={seg.label}
          />
        ))
      ) : (
        <div
          className="h-full bg-gradient-to-r from-primary-dark to-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      )}
    </div>
  )
}
