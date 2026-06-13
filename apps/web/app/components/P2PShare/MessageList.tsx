import React, { useEffect, useRef } from 'react'
import MessageItem, { type Message } from './MessageItem'

interface MessageListProps {
  messages: Message[]
  connectionStatus:
    | 'initializing'
    | 'waiting'
    | 'connecting'
    | 'connected'
    | 'error'
    | 'disconnected'
  roomRole: 'host' | 'client'
  qrCodeUrl: string
  roomId: string
  isSmallScreen: boolean
  mySeed: string
  peerIdToSeedMap: Record<string, string>
}

export default function MessageList({
  messages,
  connectionStatus,
  roomRole,
  qrCodeUrl,
  roomId,
  isSmallScreen,
  mySeed,
  peerIdToSeedMap
}: MessageListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  if (messages.length === 0) {
    if (connectionStatus === 'waiting' && roomRole === 'host') {
      return (
        <div className='flex-grow flex flex-col items-center justify-center text-center py-6 px-4'>
          <p className='text-sm text-cyan-700 font-semibold mb-3'>
            用手機掃描下方 QR Code 加入連線：
          </p>
          {qrCodeUrl && (
            <div className='bg-slate-50 p-3 rounded-lg border border-cyan-200 mb-3'>
              <img
                src={qrCodeUrl}
                alt='Connection QR Code'
                className='w-36 h-36 mx-auto'
              />
            </div>
          )}
          <p className='text-sm text-slate-500'>
            房號 (Room ID):{' '}
            <span className='font-mono font-bold text-slate-800'>{roomId}</span>
          </p>
        </div>
      )
    }

    if (
      connectionStatus === 'connecting' &&
      roomRole === 'client' &&
      isSmallScreen
    ) {
      return (
        <div className='flex-grow flex flex-col items-center justify-center text-center py-6 px-4'>
          <span className='animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4'></span>
          <p className='text-sm text-cyan-700 font-semibold mb-2'>
            正在建立 P2P 連線...
          </p>
          <p className='text-xs text-slate-500 max-w-xs leading-relaxed'>
            請確保您的電腦瀏覽器上的 PagePeer 網頁維持開啟狀態。
          </p>
        </div>
      )
    }

    return (
      <div className='flex-grow flex flex-col items-center justify-center text-slate-500 text-center py-12'>
        <svg
          className='w-12 h-12 mb-3 opacity-30 text-cyan-500 animate-pulse'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth='1.5'
            d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
          ></path>
        </svg>
        <p className='text-sm text-slate-500'>尚未連線或未傳送任何資料。</p>
        <p className='text-xs text-slate-500 mt-1.5'>
          連線成功後，在此處拖放檔案或發送訊息即可傳輸。
        </p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className='flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-250 scrollbar-track-transparent'
    >
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          msg={msg}
          isSmallScreen={isSmallScreen}
          mySeed={mySeed}
          peerIdToSeedMap={peerIdToSeedMap}
        />
      ))}
    </div>
  )
}
