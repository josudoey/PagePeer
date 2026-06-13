import React from 'react'
import { getAvatarInfo } from './utils/avatar'

interface AvatarProps {
  seed: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showTooltip?: boolean
}

export default function Avatar({
  seed,
  size = 'md',
  className = '',
  showTooltip = false
}: AvatarProps) {
  const info = getAvatarInfo(seed)

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size]

  const iconClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5.5 h-5.5',
    md: 'w-7 h-7',
    lg: 'w-8.5 h-8.5',
    xl: 'w-11 h-11'
  }[size]

  return (
    <div
      style={{ backgroundColor: info.bgColor }}
      className={`rounded-full flex items-center justify-center shadow-inner select-none transition-all duration-300 hover:scale-105 relative group/avatar ${sizeClasses} ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.15)] ${iconClasses}`}
      >
        {info.icon}
      </svg>

      {showTooltip && (
        <div className='absolute top-full mt-1.5 hidden group-hover/avatar:flex flex-col items-center z-50 pointer-events-none animate-fade-in'>
          {/* Arrow */}
          <div className='w-1.5 h-1.5 bg-slate-800 rotate-45 -mb-[3.5px] z-10'></div>
          <div className='bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-md font-bold whitespace-nowrap'>
            {info.name}
          </div>
        </div>
      )}
    </div>
  )
}
