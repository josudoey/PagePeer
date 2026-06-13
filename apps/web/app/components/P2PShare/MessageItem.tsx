import React from 'react'
import MessageCopyButton from './MessageCopyButton'
import { formatBytes } from './utils/p2pUtils'
import Avatar from './Avatar'
import { getAvatarInfo } from './utils/avatar'

export interface Message {
  id: string
  sender: 'me' | 'peer' | 'system'
  senderId?: string
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
  isSmallScreen: boolean
  mySeed: string
  peerIdToSeedMap: Record<string, string>
}

const renderMessageText = (text: string, isMe: boolean) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)

  return parts.map((part, index) => {
    if (part.startsWith('http://') || part.startsWith('https://')) {
      return (
        <a
          key={index}
          href={part}
          target='_blank'
          rel='noopener noreferrer'
          className={`underline break-all transition-all ${
            isMe
              ? 'text-blue-700 hover:text-blue-900 font-semibold'
              : 'text-cyan-600 hover:text-cyan-800 font-medium'
          }`}
        >
          {part}
        </a>
      )
    }
    return part
  })
}

export default function MessageItem({
  msg,
  isSmallScreen,
  mySeed,
  peerIdToSeedMap
}: MessageItemProps) {
  const isMe = msg.sender === 'me'
  const isSystem = msg.sender === 'system'

  if (isSystem) {
    const seed = msg.senderId
      ? peerIdToSeedMap[msg.senderId] || msg.senderId
      : null
    const isRealSeed = seed ? !seed.startsWith('pagepeer-') : false
    const avatarInfo = isRealSeed && seed ? getAvatarInfo(seed) : null
    const displayText =
      avatarInfo && msg.text.startsWith('裝置') ? msg.text.slice(2) : msg.text

    const timeString = new Date(msg.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })

    return (
      <div className='text-center my-3'>
        {avatarInfo && seed ? (
          <span className='inline-flex flex-col items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-500 tracking-wide font-medium shadow-sm whitespace-pre-wrap align-middle'>
            {/* Line 1: Message + Time */}
            <div className='flex items-center gap-1.5 text-[11px] text-slate-500'>
              <span>{renderMessageText(displayText, false)}</span>
              <span className='text-[10px] text-slate-500 font-bold ml-1 border-l border-slate-200 pl-1.5 select-none'>
                {timeString}
              </span>
            </div>
            {/* Line 2: Avatar + Name */}
            <div className='flex items-center gap-1.5'>
              <Avatar seed={seed} size='xs' className='flex-shrink-0' />
              <span className='font-bold text-slate-500'>
                {avatarInfo.name}
              </span>
            </div>
          </span>
        ) : (
          <span className='inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500 tracking-wide font-medium shadow-sm whitespace-pre-wrap align-middle'>
            <span>{renderMessageText(msg.text, false)}</span>
            <span className='text-[10px] text-slate-500 font-bold ml-1 border-l border-slate-200 pl-1.5 select-none'>
              {timeString}
            </span>
          </span>
        )}
      </div>
    )
  }

  // Resolve the seed for this sender
  const seed = isMe
    ? mySeed
    : msg.senderId
      ? peerIdToSeedMap[msg.senderId] || msg.senderId
      : 'peer'

  const avatarInfo = getAvatarInfo(seed)

  return (
    <div
      className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} group/msg`}
    >
      <div
        className={`flex gap-2.5 max-w-[85%] text-left ${
          isMe ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <Avatar
          seed={seed}
          size='sm'
          className='flex-shrink-0 mt-0.5 shadow-sm'
        />

        {/* Content Area */}
        <div
          className={`flex flex-col min-w-0 ${isMe ? 'items-end' : 'items-start'}`}
        >
          {/* Identity Name & Time */}
          <div className='text-[10px] text-slate-500 font-bold mb-1 px-1.5 whitespace-nowrap select-none'>
            {isMe ? `${avatarInfo.name} (我)` : avatarInfo.name} •{' '}
            {new Date(msg.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>

          {/* Message bubble content */}
          {msg.type === 'text' ? (
            <div
              className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-sm flex flex-col max-w-full ${
                isMe
                  ? 'bg-[#b2f896] text-slate-900 rounded-tr-none font-normal'
                  : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200/60'
              }`}
            >
              <div className='w-full break-words'>
                {renderMessageText(msg.text, isMe)}
              </div>
              <MessageCopyButton
                text={msg.text}
                isSmallScreen={isSmallScreen}
                isMe={isMe}
              />
            </div>
          ) : (
            // File card message
            <div
              className={`max-w-full px-4 py-2.5 rounded-2xl border flex flex-col gap-3 shadow-md ${
                isMe
                  ? 'bg-[#b2f896]/20 border-[#b2f896]/50 text-left rounded-tr-none'
                  : 'bg-gradient-to-b from-slate-50 to-slate-100/50 border-slate-200/60 text-left rounded-tl-none'
              }`}
            >
              <div className='flex items-center gap-3'>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center border text-cyan-700 flex-shrink-0 ${
                    isMe
                      ? 'bg-[#b2f896]/40 border-[#b2f896]/60 text-slate-800'
                      : 'bg-cyan-50 border-cyan-200/60 text-cyan-700'
                  }`}
                >
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
                  <p className='text-xs font-bold text-slate-800 truncate'>
                    {msg.file?.name}
                  </p>
                  <p className='text-xs text-slate-500 mt-0.5'>
                    {formatBytes(msg.file?.size || 0)}
                  </p>
                </div>
              </div>

              {/* File Action button */}
              {msg.file?.url && (
                <div className='flex flex-col gap-2 mt-0.5'>
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
                    className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg font-bold text-xs active:scale-[0.97] transition-all shadow-sm ${
                      isMe
                        ? 'bg-[#b2f896] hover:bg-[#a2e886] text-slate-900'
                        : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                    }`}
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
                      className='block rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity active:scale-[0.98]'
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
      </div>
    </div>
  )
}
