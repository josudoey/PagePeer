import React, { useState } from 'react'
import { copyToClipboard } from './utils/p2pUtils'

interface MessageCopyButtonProps {
  text: string
  isMobileViewport: boolean
  isMe: boolean
}

export default function MessageCopyButton({
  text,
  isMobileViewport,
  isMe
}: MessageCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const spacingClass = isMe ? 'mr-2' : 'ml-2'

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${
        isMobileViewport
          ? `w-7 opacity-100 ${spacingClass}`
          : `w-0 opacity-0 scale-75 overflow-hidden group-hover/msg:w-7 group-hover/msg:opacity-100 group-hover/msg:scale-100 group-hover/msg:${spacingClass}`
      }`}
    >
      <button
        type='button'
        onClick={handleCopy}
        className='w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all active:scale-90 flex items-center justify-center flex-shrink-0'
        title='複製訊息'
      >
        {copied ? (
          <svg
            className='w-3.5 h-3.5 text-emerald-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.5'
              d='M5 13l4 4L19 7'
            />
          </svg>
        ) : (
          <svg
            className='w-3.5 h-3.5'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3'
            />
          </svg>
        )}
      </button>

      {copied && (
        <span
          className={`absolute bottom-full mb-1.5 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 bg-white border border-emerald-250/80 rounded shadow-md whitespace-nowrap z-30 animate-fade-in ${
            isMe ? 'right-0' : 'left-0'
          }`}
        >
          已複製
        </span>
      )}
    </div>
  )
}
