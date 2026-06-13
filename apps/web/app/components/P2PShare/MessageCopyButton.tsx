import React from 'react'
import toast from 'react-hot-toast'
import { copyToClipboard } from './utils/p2pUtils'

interface MessageCopyButtonProps {
  text: string
  isSmallScreen: boolean
  isMe: boolean
}

export default function MessageCopyButton({
  text,
  isSmallScreen,
  isMe
}: MessageCopyButtonProps) {
  const handleCopy = async () => {
    const success = await copyToClipboard(text)
    if (success) {
      toast.success('已複製訊息！', {
        id: Date.now().toString(),
        duration: 2000,
        style: {
          background: '#f0fdf4',
          border: '1px solid rgba(187, 247, 208, 0.8)',
          color: '#15803d',
          fontSize: '0.875rem',
          borderRadius: '1rem',
          boxShadow:
            '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
        }
      })
    }
  }

  const alignmentClass = isMe ? 'self-end' : 'self-start'

  return (
    <div
      className={`relative flex items-center transition-all duration-200 ${alignmentClass} ${
        isSmallScreen
          ? 'h-7 opacity-100 mt-1.5'
          : 'h-0 opacity-0 scale-75 overflow-hidden mt-0 group-hover/msg:h-7 group-hover/msg:opacity-100 group-hover/msg:scale-100 group-hover/msg:mt-1.5'
      }`}
    >
      <button
        type='button'
        onClick={handleCopy}
        className={`w-7 h-7 rounded-lg bg-black/5 hover:bg-black/10 ${
          isMe
            ? 'text-slate-600 hover:text-slate-800'
            : 'text-slate-500 hover:text-slate-800'
        } transition-all active:scale-90 flex items-center justify-center flex-shrink-0`}
        title='複製訊息'
      >
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
      </button>
    </div>
  )
}
