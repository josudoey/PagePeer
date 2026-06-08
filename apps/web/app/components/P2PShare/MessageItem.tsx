import React from 'react'
import MessageCopyButton from './MessageCopyButton'
import { formatBytes } from './utils/p2pUtils'

export interface Message {
  id: string
  sender: 'me' | 'peer' | 'system'
  text: string
  timestamp: Date
  type: 'text' | 'file'
  file?: {
    name: string
    size: number
    type: string
    url: string
  }
}

interface MessageItemProps {
  msg: Message
  isMobileViewport: boolean
}

export default function MessageItem({ msg, isMobileViewport }: MessageItemProps) {
  const isMe = msg.sender === 'me'
  const isSystem = msg.sender === 'system'

  if (isSystem) {
    return (
      <div className='text-center my-4'>
        <span className='px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500 tracking-wide font-medium shadow-sm'>
          {msg.text}
        </span>
      </div>
    )
  }

  return (
    <div
      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg`}
    >
      <div className='text-xs text-slate-400 mb-1 font-semibold px-2'>
        {isMe ? '我' : msg.sender === 'peer' && '對端裝置'} •{' '}
        {new Date(msg.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </div>

      {msg.type === 'text' ? (
        <div
          className={`flex items-center max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
        >
          <div
            className={`px-4.5 py-3 rounded-2xl text-base leading-relaxed shadow-md ${
              isMe
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-tr-none font-semibold shadow-[0_4px_12px_rgba(6,182,212,0.15)]'
                : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
            }`}
          >
            {msg.text}
          </div>
          <MessageCopyButton
            text={msg.text}
            isMobileViewport={isMobileViewport}
            isMe={isMe}
          />
        </div>
      ) : (
        // File card message
        <div
          className={`max-w-[85%] p-4 rounded-2xl border flex flex-col gap-3.5 shadow-md ${
            isMe
              ? 'bg-gradient-to-b from-cyan-50/50 to-blue-50/50 border-cyan-200/60 text-right rounded-tr-none'
              : 'bg-gradient-to-b from-slate-50 to-slate-100/50 border-slate-200/60 text-left rounded-tl-none'
          }`}
        >
          <div className='flex items-center gap-3'>
            <div className='w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center border border-cyan-200/60 text-cyan-600 flex-shrink-0'>
              <svg
                className='w-5 h-5'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                ></path>
              </svg>
            </div>
            <div className='min-w-0 flex-grow text-left'>
              <p className='text-sm font-bold text-slate-800 truncate'>
                {msg.file?.name}
              </p>
              <p className='text-xs text-slate-500 mt-0.5'>
                {formatBytes(msg.file?.size || 0)}
              </p>
            </div>
          </div>

          {/* File Action button */}
          {msg.file?.url && (
            <div className='flex flex-col gap-2.5 mt-1'>
              <a
                href={msg.file.url}
                download={msg.file.name}
                onClick={(e) => {
                  e.preventDefault()
                  const link = document.createElement('a')
                  link.href = msg.file!.url
                  link.download = msg.file!.name
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                className='flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs active:scale-[0.97] transition-all shadow-sm'
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
                    strokeWidth='2.5'
                    d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'
                  ></path>
                </svg>
                下載檔案
              </a>

              {/* Inline image preview */}
              {msg.file.type.startsWith('image/') && (
                <a
                  href={msg.file.url}
                  target='_blank'
                  rel='noreferrer'
                  className='block mt-1 rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity active:scale-[0.98]'
                >
                  <img
                    src={msg.file.url}
                    alt={msg.file.name}
                    className='max-h-48 w-auto max-w-full object-contain bg-slate-50 mx-auto'
                  />
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
