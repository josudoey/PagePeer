import React, { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'
import P2PHeader from './P2PHeader'
import MessageList from './MessageList'
import ChatForm from './ChatForm'
import FileTransferProgress from './FileTransferProgress'
import DropZoneOverlay from './DropZoneOverlay'
import { useP2PConnection } from './hooks/useP2PConnection'
import { useFileTransfer } from './hooks/useFileTransfer'
import { copyToClipboard } from './utils/p2pUtils'
import type { Message } from './MessageItem'

interface P2PShareInnerProps {
  roomId: string
  role: 'desktop' | 'mobile'
}

function P2PShareInner({ roomId, role }: P2PShareInnerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [showQrPopover, setShowQrPopover] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  
  const qrPopoverRef = useRef<HTMLDivElement | null>(null)

  // Track window size for mobile layout optimization
  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close QR code popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        qrPopoverRef.current &&
        !qrPopoverRef.current.contains(event.target as Node)
      ) {
        setShowQrPopover(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate QR Code URL
  useEffect(() => {
    if (role === 'desktop') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?r=${roomId}&role=mobile`
      setShareLink(shareUrl)
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#00000000'
        }
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => {
          console.error('QR Code generation failed:', err)
        })
    }
  }, [roomId, role])

  // Connection hook
  const {
    connectionStatus,
    errorMsg,
    peerList,
    activeConnection,
    sendMessage
  } = useP2PConnection({
    roomId,
    role,
    onIncomingSystemMessage: (text) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'system',
          text,
          timestamp: new Date(),
          type: 'text'
        }
      ])
    },
    onIncomingData: (conn, data) => {
      const handled = handleFileTransferMessage(conn, data)
      if (!handled && data && data.type === 'text') {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'peer',
            text: data.text,
            timestamp: new Date(),
            type: 'text'
          }
        ])
      }
    }
  })

  // File transfer hook
  const {
    transferringFile,
    handleSendFile,
    handleFileTransferMessage
  } = useFileTransfer({
    activeConnection,
    onTransferComplete: (direction, fileName, fileSize, fileType, fileUrl) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: direction === 'send' ? 'me' : 'peer',
          text: direction === 'send' ? `已成功傳送檔案：${fileName}` : `已成功接收檔案：${fileName}`,
          timestamp: new Date(),
          type: 'file',
          file: {
            name: fileName,
            size: fileSize,
            type: fileType,
            url: fileUrl
          }
        }
      ])
    }
  })

  const handleCopyShareLink = async () => {
    const success = await copyToClipboard(shareLink)
    if (success) {
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 2000)
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const sent = sendMessage({
      type: 'text',
      text: inputText
    })

    if (sent) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'me',
          text: inputText,
          timestamp: new Date(),
          type: 'text'
        }
      ])
      setInputText('')
    }
  }

  // Drag and Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleSendFile(e.dataTransfer.files)
  }

  return (
    <div className='w-full h-full flex flex-col overflow-hidden bg-slate-100/40'>
      <P2PHeader
        connectionStatus={connectionStatus}
        roomId={roomId}
        role={role}
        qrCodeUrl={qrCodeUrl}
        shareLink={shareLink}
        shareLinkCopied={shareLinkCopied}
        onCopyShareLink={handleCopyShareLink}
        showQrPopover={showQrPopover}
        onToggleQrPopover={setShowQrPopover}
        qrPopoverRef={qrPopoverRef}
      />

      <div className='flex-grow flex flex-col min-h-0 overflow-hidden md:items-center md:pt-6 md:pb-6 md:px-6'>
        <div className='w-full h-full flex flex-col min-h-0 overflow-hidden md:w-[420px] md:rounded-2xl md:shadow-xl md:border md:border-slate-200/80'>
          <main className='flex-grow w-full h-full flex flex-col overflow-hidden min-h-0 relative z-10'>
            {role === 'mobile' && connectionStatus !== 'connected' && (
              <div className='mb-4 p-4 bg-cyan-50 border border-cyan-200/80 rounded-2xl text-left shadow-lg'>
                <p className='text-sm text-cyan-700 leading-relaxed font-semibold flex items-center gap-2'>
                  <span className='animate-pulse h-2.5 w-2.5 rounded-full bg-cyan-500 flex-shrink-0'></span>
                  正在嘗試連接您的電腦網頁...請確保電腦瀏覽器上的 PagePeer
                  網頁維持開啟狀態。
                </p>
              </div>
            )}

            {errorMsg && (
              <div className='mb-4 p-4 bg-rose-50 border border-rose-250/80 text-sm text-rose-700 rounded-2xl text-left shadow-lg'>
                {errorMsg}
              </div>
            )}

            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className='flex-grow flex flex-col p-6 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl min-h-0 overflow-hidden relative'
            >
              <DropZoneOverlay
                dragOver={dragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              />

              {isMobileViewport && errorMsg && connectionStatus !== 'connecting' && (
                <div className='mb-4 p-3 bg-rose-50 border border-rose-200/30 text-rose-700 text-xs rounded-xl'>
                  {errorMsg}
                </div>
              )}

              <h3 className='text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-500 font-title border-b border-slate-200 pb-1.5 mb-2.5 md:pb-3 md:mb-4 flex flex-row justify-between items-center gap-2'>
                <div className='flex items-center justify-between w-full sm:w-auto'>
                  <span className='text-slate-800 font-bold'>傳輸紀錄與聊天</span>
                </div>

                <div className='flex items-center gap-2 text-xs flex-shrink-0'>
                  {peerList.length > 0 ? (
                    <span className='text-[10px] md:text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 md:px-3 md:py-1 rounded-full font-semibold shadow-sm whitespace-nowrap'>
                      已連線裝置:{' '}
                      {peerList
                        .map((p) =>
                          p.includes('mobile') ? '📱 行動裝置' : '💻 電腦網頁'
                        )
                        .join(', ')}
                    </span>
                  ) : (
                    <span className='text-[10px] md:text-xs text-slate-400 font-mono whitespace-nowrap'>
                      P2P Encrypted
                    </span>
                  )}
                </div>
              </h3>

              <MessageList
                messages={messages}
                connectionStatus={connectionStatus}
                role={role}
                qrCodeUrl={qrCodeUrl}
                roomId={roomId}
                isMobileViewport={isMobileViewport}
              />

              <FileTransferProgress transferringFile={transferringFile} />

              <ChatForm
                inputText={inputText}
                onChangeInputText={setInputText}
                onSubmit={handleSendMessage}
                onSendFile={handleSendFile}
                connectionStatus={connectionStatus}
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default function P2PShare() {
  const [params, setParams] = useState<{
    roomId: string
    role: 'desktop' | 'mobile'
  } | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let r = urlParams.get('r')
    const roleParam = urlParams.get('role') === 'mobile' ? 'mobile' : 'desktop'

    if (!r) {
      r = Math.random().toString(36).substring(2, 8)
      urlParams.set('r', r)
      window.location.replace(
        window.location.pathname + '?' + urlParams.toString()
      )
    } else {
      setParams({ roomId: r, role: roleParam })
    }
  }, [])

  if (!params) {
    return (
      <div className='flex items-center justify-center h-24 text-slate-400'>
        <div className='flex flex-col items-center gap-2'>
          <span className='animate-spin h-6 w-6 border-4 border-cyan-400 border-t-transparent rounded-full'></span>
          <span>正在載入傳輸房...</span>
        </div>
      </div>
    )
  }

  return <P2PShareInner roomId={params.roomId} role={params.role} />
}
