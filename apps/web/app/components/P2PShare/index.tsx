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
import { getAvatarSeed } from './utils/avatar'

interface P2PShareInnerProps {
  roomId: string
  roomRole: 'host' | 'client'
}

function P2PShareInner({ roomId, roomRole }: P2PShareInnerProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [showQrPopover, setShowQrPopover] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [isSmallScreen, setIsSmallScreen] = useState(false)

  const [mySeed] = useState(() => getAvatarSeed())
  const [peerIdToSeedMap, setPeerIdToSeedMap] = useState<Record<string, string>>({})

  const qrPopoverRef = useRef<HTMLDivElement | null>(null)

  // Track window size for mobile layout optimization
  useEffect(() => {
    const handleResize = () => {
      setIsSmallScreen(window.innerWidth < 768)
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
    if (roomRole === 'host') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?r=${roomId}&role=client`
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
  }, [roomId, roomRole])

  // Connection hook
  const {
    connectionStatus,
    errorMsg,
    peerList,
    activeConnection,
    sendMessage,
    peer
  } = useP2PConnection({
    roomId,
    roomRole,
    mySeed,
    onIncomingSystemMessage: (text, peerId) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'system',
          senderId: peerId,
          text,
          timestamp: new Date(),
          type: 'text'
        }
      ])
    },
    onIncomingData: (conn, data) => {
      const handled = handleFileTransferMessage(conn, data)
      if (!handled && data) {
        if (data.type === 'identity') {
          setPeerIdToSeedMap((prev) => ({
            ...prev,
            [conn.peer]: data.avatarSeed
          }))
        } else if (data.type === 'text') {
          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'peer',
              senderId: conn.peer,
              text: data.text,
              timestamp: new Date(),
              type: 'text'
            }
          ])
        }
      }
    }
  })

  // File transfer hook
  const { transferringFile, handleSendFile, handleFileTransferMessage } =
    useFileTransfer({
      activeConnection,
      onTransferComplete: (
        direction,
        fileName,
        fileSize,
        fileType,
        fileUrl
      ) => {
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: direction === 'send' ? 'me' : 'peer',
            senderId: direction === 'send' ? (peer?.id || 'me') : (activeConnection?.peer || 'peer'),
            text:
              direction === 'send'
                ? `已成功傳送檔案：${fileName}`
                : `已成功接收檔案：${fileName}`,
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
          senderId: peer?.id || 'me',
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
        roomRole={roomRole}
        qrCodeUrl={qrCodeUrl}
        shareLink={shareLink}
        shareLinkCopied={shareLinkCopied}
        onCopyShareLink={handleCopyShareLink}
        showQrPopover={showQrPopover}
        onToggleQrPopover={setShowQrPopover}
        qrPopoverRef={qrPopoverRef}
        mySeed={mySeed}
        peerIdToSeedMap={peerIdToSeedMap}
        peerList={peerList}
        hidePairingButton={messages.length === 0}
      />

      <div className='flex-grow flex flex-col min-h-0 overflow-hidden md:items-center md:pt-6 md:pb-6 md:px-6'>
        <div className='w-full h-full flex flex-col min-h-0 overflow-hidden md:w-[420px] md:rounded-2xl md:shadow-xl md:border md:border-slate-200/80'>
          <main className='flex-grow w-full h-full flex flex-col overflow-hidden min-h-0 relative z-10'>
            {roomRole === 'client' && connectionStatus !== 'connected' && (
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

              {isSmallScreen &&
                errorMsg &&
                connectionStatus !== 'connecting' && (
                  <div className='mb-4 p-3 bg-rose-50 border border-rose-200/30 text-rose-700 text-xs rounded-xl'>
                    {errorMsg}
                  </div>
                )}

              <h3 className='text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-500 font-title border-b border-slate-200 pb-1.5 mb-2.5 md:pb-3 md:mb-4 flex flex-row justify-between items-center gap-2'>
                <div className='flex items-center justify-between w-full sm:w-auto'>
                  <span className='text-slate-800 font-bold'>對話訊息</span>
                </div>

                <div className='flex items-center gap-2 text-xs flex-shrink-0'>
                  <span className='text-[10px] md:text-xs text-slate-500 font-mono whitespace-nowrap'>
                    P2P Encrypted
                  </span>
                </div>
              </h3>

              <MessageList
                messages={messages}
                connectionStatus={connectionStatus}
                roomRole={roomRole}
                qrCodeUrl={qrCodeUrl}
                roomId={roomId}
                isSmallScreen={isSmallScreen}
                mySeed={mySeed}
                peerIdToSeedMap={peerIdToSeedMap}
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
    roomRole: 'host' | 'client'
  } | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let r = urlParams.get('r')
    const roleParam = urlParams.get('role') === 'client' ? 'client' : 'host'

    if (!r) {
      r = Math.random().toString(36).substring(2, 8)
      urlParams.set('r', r)
      window.location.replace(
        window.location.pathname + '?' + urlParams.toString()
      )
    } else {
      setParams({ roomId: r, roomRole: roleParam })
    }
  }, [])

  if (!params) {
    return (
      <div className='flex-grow flex items-center justify-center h-24 text-slate-500'>
        <div className='flex flex-col items-center gap-2'>
          <span className='animate-spin h-6 w-6 border-4 border-cyan-400 border-t-transparent rounded-full'></span>
          <span>正在載入傳輸房...</span>
        </div>
      </div>
    )
  }

  return <P2PShareInner roomId={params.roomId} roomRole={params.roomRole} />
}
