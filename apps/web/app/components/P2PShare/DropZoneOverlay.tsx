import React from 'react'

interface DropZoneOverlayProps {
  dragOver: boolean
  onDragLeave: () => void
  onDrop: (e: React.DragEvent) => void
}

export default function DropZoneOverlay({
  dragOver,
  onDragLeave,
  onDrop
}: DropZoneOverlayProps) {
  if (!dragOver) return null

  return (
    <div
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className='absolute inset-0 bg-white/95 border-2 border-dashed border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center text-cyan-700 z-30 animate-fade-in'
    >
      <div className='pointer-events-none w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4 border border-cyan-200 text-cyan-700 animate-bounce'>
        <svg
          className='w-8 h-8'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='2'
            d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
          ></path>
        </svg>
      </div>
      <p className='pointer-events-none text-base font-semibold text-slate-800 mb-1'>
        拖放到此發送檔案
      </p>
      <p className='pointer-events-none text-sm text-slate-500'>
        支援照片、影片、文件、音檔等任意檔案傳送
      </p>
    </div>
  )
}
