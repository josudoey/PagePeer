import React, { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import QRCode from 'qrcode'
import P2PHeader from './P2PHeader'

interface Message {
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

interface TransferringFile {
  fileId: string
  name: string
  size: number
  type: 'send' | 'receive'
  progress: number
  speed: number // Bytes per second
  status: 'waiting' | 'transferring' | 'completed' | 'error'
}

interface P2PShareProps {
  roomId: string
  role: 'desktop' | 'mobile'
}

// Utility to format bytes into readable string
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

// Utility to format speed (e.g. MB/s)
const formatSpeed = (bytesPerSecond: number) => {
  return formatBytes(bytesPerSecond, 1) + '/s'
}

interface MessageCopyButtonProps {
  text: string
  isMobileViewport: boolean
  isMe: boolean
}

function MessageCopyButton({
  text,
  isMobileViewport,
  isMe
}: MessageCopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text)
      } else {
        // Fallback for non-secure contexts (e.g. HTTP over local network IP)
        const textArea = document.createElement('textarea')
        textArea.value = text
        // Position off-screen and set styling to prevent zoom/scrolling
        textArea.style.position = 'fixed'
        textArea.style.top = '-9999px'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!successful) {
          throw new Error('execCommand copy was unsuccessful')
        }
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
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

function P2PShare({ roomId, role }: P2PShareProps) {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<
    'initializing' | 'waiting' | 'connecting' | 'connected' | 'error'
  >('initializing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [transferringFile, setTransferringFile] =
    useState<TransferringFile | null>(null)
  const [peerList, setPeerList] = useState<string[]>([])
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [shareLink, setShareLink] = useState('')
  const [shareLinkCopied, setShareLinkCopied] = useState(false)
  const [showQrPopover, setShowQrPopover] = useState(false)
  const qrPopoverRef = useRef<HTMLDivElement | null>(null)

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

  // Track window size for mobile layout optimization
  useEffect(() => {
    const handleResize = () => {
      setIsMobileViewport(window.innerWidth < 768)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Connections list: Map peerId -> DataConnection
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map())

  // File transfer states
  const sendingFileStateRef = useRef<{
    file: File
    fileId: string
    chunkSize: number
    totalChunks: number
    currentChunkIndex: number
    conn: DataConnection
    startTime: number
  } | null>(null)

  const receivingFilesRef = useRef<
    Map<
      string,
      {
        fileId: string
        name: string
        size: number
        mimeType: string
        totalChunks: number
        chunks: ArrayBuffer[]
        chunksReceived: number
        startTime: number
      }
    >
  >(new Map())

  const messagesContainerRef = useRef<HTMLDivElement | null>(null)

  // Scroll to bottom on new messages (modifying scrollTop directly to prevent scrollIntoView from shifting the viewport/header)
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  // Generate QR Code URL
  useEffect(() => {
    if (role === 'desktop') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?r=${roomId}&role=mobile`
      setShareLink(shareUrl)
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0f172a', // Dark Slate for high contrast on light bg
          light: '#00000000' // transparent background
        }
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => {
          console.error('QR Code generation failed:', err)
        })
    }
  }, [roomId, role])

  // Process chunk acknowledgment (sender side)
  const handleChunkAck = useCallback((fileId: string, chunkIndex: number) => {
    const state = sendingFileStateRef.current
    if (!state || state.fileId !== fileId) return

    // Verify chunkIndex matches what we expect
    if (chunkIndex === state.currentChunkIndex) {
      state.currentChunkIndex += 1

      const totalChunks = state.totalChunks
      const current = state.currentChunkIndex

      if (current >= totalChunks) {
        // Complete transfer
        state.conn.send({
          type: 'file-complete',
          fileId
        })

        // Add completion message
        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'me',
            text: `已成功傳送檔案：${state.file.name}`,
            timestamp: new Date(),
            type: 'file',
            file: {
              name: state.file.name,
              size: state.file.size,
              type: state.file.type,
              url: URL.createObjectURL(state.file)
            }
          }
        ])

        setTransferringFile(null)
        sendingFileStateRef.current = null
      } else {
        // Send next chunk
        sendNextChunk()
      }
    }
  }, [])

  // Send next file chunk (sender side)
  const sendNextChunk = () => {
    const state = sendingFileStateRef.current
    if (!state) return

    const {
      file,
      chunkSize,
      currentChunkIndex,
      totalChunks,
      conn,
      fileId,
      startTime
    } = state
    const startByte = currentChunkIndex * chunkSize
    const endByte = Math.min(file.size, startByte + chunkSize)
    const blobSlice = file.slice(startByte, endByte)

    const reader = new FileReader()
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        conn.send({
          type: 'file-chunk',
          fileId,
          chunkIndex: currentChunkIndex,
          data: e.target.result
        })

        // Throttle progress UI updates
        const elapsedSeconds = (Date.now() - startTime) / 1000
        const bytesSent = endByte
        const speed = elapsedSeconds > 0 ? bytesSent / elapsedSeconds : 0
        const progress = Math.round((currentChunkIndex / totalChunks) * 100)

        setTransferringFile({
          fileId,
          name: file.name,
          size: file.size,
          type: 'send',
          progress,
          speed,
          status: 'transferring'
        })
      }
    }
    reader.onerror = () => {
      console.error('Error reading file chunk')
      setTransferringFile((prev) =>
        prev ? { ...prev, status: 'error' } : null
      )
    }
    reader.readAsArrayBuffer(blobSlice)
  }

  // Handle incoming PeerJS messages
  const handleIncomingData = useCallback(
    (conn: DataConnection, data: any) => {
      if (typeof data !== 'object' || data === null) return

      const remotePeerName = conn.peer.includes('mobile')
        ? '行動裝置'
        : '電腦網頁'

      switch (data.type) {
        case 'text':
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
          break

        case 'file-start': {
          const { fileId, fileName, fileSize, fileType, totalChunks } = data

          // Initialize receiver state
          receivingFilesRef.current.set(fileId, {
            fileId,
            name: fileName,
            size: fileSize,
            mimeType: fileType,
            totalChunks,
            chunks: new Array(totalChunks),
            chunksReceived: 0,
            startTime: Date.now()
          })

          // Send ready signals
          conn.send({
            type: 'file-ready',
            fileId
          })

          setTransferringFile({
            fileId,
            name: fileName,
            size: fileSize,
            type: 'receive',
            progress: 0,
            speed: 0,
            status: 'transferring'
          })
          break
        }

        case 'file-ready': {
          const state = sendingFileStateRef.current
          if (state && state.fileId === data.fileId) {
            state.startTime = Date.now()
            sendNextChunk()
          }
          break
        }

        case 'file-chunk': {
          const { fileId, chunkIndex, data: chunkData } = data
          const state = receivingFilesRef.current.get(fileId)
          if (!state) return

          state.chunks[chunkIndex] = chunkData
          state.chunksReceived += 1

          const elapsedSeconds = (Date.now() - state.startTime) / 1000
          const bytesReceived = state.chunksReceived * 65536 // rough estimate of chunk size
          const speed = elapsedSeconds > 0 ? bytesReceived / elapsedSeconds : 0
          const progress = Math.round(
            (state.chunksReceived / state.totalChunks) * 100
          )

          setTransferringFile({
            fileId,
            name: state.name,
            size: state.size,
            type: 'receive',
            progress,
            speed,
            status: 'transferring'
          })

          // Send Acknowledgment
          conn.send({
            type: 'file-ack',
            fileId,
            chunkIndex
          })
          break
        }

        case 'file-ack':
          handleChunkAck(data.fileId, data.chunkIndex)
          break

        case 'file-complete': {
          const { fileId } = data
          const state = receivingFilesRef.current.get(fileId)
          if (!state) return

          // Assemble chunks
          const blob = new Blob(state.chunks, {
            type: state.mimeType || 'application/octet-stream'
          })
          const url = URL.createObjectURL(blob)

          setMessages((prev) => [
            ...prev,
            {
              id: Math.random().toString(),
              sender: 'peer',
              text: `已成功接收檔案：${state.name}`,
              timestamp: new Date(),
              type: 'file',
              file: {
                name: state.name,
                size: state.size,
                type: state.mimeType,
                url
              }
            }
          ])

          setTransferringFile(null)
          receivingFilesRef.current.delete(fileId)
          break
        }

        default:
          console.warn('Unknown message type received:', data.type)
      }
    },
    [handleChunkAck]
  )

  // Setup connection event listeners
  const setupConnectionListeners = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        console.log(`Connected to peer: ${conn.peer}`)
        connectionsRef.current.set(conn.peer, conn)
        setPeerList(Array.from(connectionsRef.current.keys()))
        setConnectionStatus('connected')

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'system',
            text: `裝置已連線 (${conn.peer.includes('mobile') ? '行動裝置' : '電腦網頁'})`,
            timestamp: new Date(),
            type: 'text'
          }
        ])
      })

      conn.on('data', (data) => {
        handleIncomingData(conn, data)
      })

      conn.on('close', () => {
        console.log(`Connection closed with peer: ${conn.peer}`)
        connectionsRef.current.delete(conn.peer)
        setPeerList(Array.from(connectionsRef.current.keys()))

        setMessages((prev) => [
          ...prev,
          {
            id: Math.random().toString(),
            sender: 'system',
            text: `裝置已斷開連線`,
            timestamp: new Date(),
            type: 'text'
          }
        ])

        // If no connections left
        if (connectionsRef.current.size === 0) {
          setConnectionStatus(role === 'desktop' ? 'waiting' : 'disconnected')
        }
      })

      conn.on('error', (err) => {
        console.error('Connection error:', err)
        setErrorMsg(`連線錯誤: ${err.message}`)
      })
    },
    [role, handleIncomingData]
  )

  // Initialize PeerJS client
  useEffect(() => {
    const hostPeerId = `pagepeer-room-${roomId}`
    const myId =
      role === 'desktop'
        ? hostPeerId
        : `pagepeer-client-${roomId}-${Math.random().toString(36).substring(2, 6)}`

    // Configure PeerJS to connect to public server
    const newPeer = new Peer(myId, {
      debug: 1
    })

    setPeer(newPeer)

    newPeer.on('open', (id) => {
      console.log(`PeerJS initialized. My ID: ${id}`)
      setConnectionStatus(role === 'desktop' ? 'waiting' : 'connecting')

      if (role === 'mobile') {
        // Clients automatically connect to host
        console.log(`Attempting to connect to host: ${hostPeerId}`)
        const conn = newPeer.connect(hostPeerId, {
          reliable: true
        })
        setupConnectionListeners(conn)
      }
    })

    newPeer.on('connection', (conn) => {
      console.log(`Incoming connection from: ${conn.peer}`)
      setupConnectionListeners(conn)
    })

    newPeer.on('error', (err) => {
      console.error('PeerJS global error:', err)
      setConnectionStatus('error')
      if (err.type === 'unavailable-id') {
        setErrorMsg('該房號已有人使用，請重新整理網頁以取得新房號。')
      } else {
        setErrorMsg(`通訊伺服器錯誤: ${err.message || err.type}`)
      }
    })

    return () => {
      console.log('Destroying peer connections...')
      connectionsRef.current.forEach((conn) => conn.close())
      connectionsRef.current.clear()
      newPeer.destroy()
    }
  }, [roomId, role, setupConnectionListeners])

  const handleCopyShareLink = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareLink)
      } else {
        // Fallback for non-secure contexts (e.g. HTTP over local network IP)
        const textArea = document.createElement('textarea')
        textArea.value = shareLink
        // Position off-screen and set styling to prevent zoom/scrolling
        textArea.style.position = 'fixed'
        textArea.style.top = '-9999px'
        textArea.style.left = '-9999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        if (!successful) {
          throw new Error('execCommand copy was unsuccessful')
        }
      }
      setShareLinkCopied(true)
      setTimeout(() => setShareLinkCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy share link: ', err)
    }
  }

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    // Send text to all connected peers
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send({
          type: 'text',
          text: inputText
        })
      }
    })

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

  // Handle files sending
  const handleSendFile = (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (connectionsRef.current.size === 0) return

    // Currently we send one file at a time
    const file = files[0]

    // Choose the first active connection
    const conn = Array.from(connectionsRef.current.values())[0]
    if (!conn || !conn.open) return

    const fileId = `${file.name}-${file.size}-${Date.now()}`
    const chunkSize = 65536 // 64 KB
    const totalChunks = Math.ceil(file.size / chunkSize)

    sendingFileStateRef.current = {
      file,
      fileId,
      chunkSize,
      totalChunks,
      currentChunkIndex: 0,
      conn,
      startTime: Date.now()
    }

    setTransferringFile({
      fileId,
      name: file.name,
      size: file.size,
      type: 'send',
      progress: 0,
      speed: 0,
      status: 'waiting'
    })

    // Start protocol by sending meta data
    conn.send({
      type: 'file-start',
      fileId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      totalChunks
    })
  }

  // Drop zone drag events
  const [dragOver, setDragOver] = useState(false)
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
      {/* Header */}
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

      {/* Body: centered card on desktop */}
      <div className='flex-grow flex flex-col min-h-0 overflow-hidden md:items-center md:pt-6 md:pb-6 md:px-6'>
        <div className='w-full h-full flex flex-col min-h-0 overflow-hidden md:w-[420px] md:rounded-2xl md:shadow-xl md:border md:border-slate-200/80'>
          {/* Main chat & files layout */}
          <main className='flex-grow w-full h-full flex flex-col overflow-hidden min-h-0 relative z-10'>
        {/* Connection status notices for mobile / error states */}
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
          <div className='mb-4 p-4 bg-rose-55 border border-rose-200/80 text-sm text-rose-700 rounded-2xl text-left shadow-lg'>
            {errorMsg}
          </div>
        )}

        {/* Chat / file history panel */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className='flex-grow flex flex-col p-6 bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-xl min-h-0 overflow-hidden relative'
        >
          {dragOver && (
            <div
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className='absolute inset-0 bg-white/95 border-2 border-dashed border-cyan-500/50 rounded-2xl flex flex-col items-center justify-center text-cyan-600 z-30 animate-fade-in'
            >
              <div className='pointer-events-none w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-4 border border-cyan-200 text-cyan-600 animate-bounce'>
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
          )}

          {isMobileViewport &&
            errorMsg &&
            connectionStatus !== 'connecting' && (
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

          {/* Messages list */}
          <div
            ref={messagesContainerRef}
            className='flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-250 scrollbar-track-transparent'
          >
            {messages.length === 0 ? (
              connectionStatus === 'waiting' && role === 'desktop' ? (
                <div className='h-full flex flex-col items-center justify-center text-center py-6 px-4'>
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
                    <span className='font-mono font-bold text-slate-800'>
                      {roomId}
                    </span>
                  </p>
                </div>
              ) : connectionStatus !== 'connected' &&
                role === 'mobile' &&
                isMobileViewport ? (
                <div className='h-full flex flex-col items-center justify-center text-center py-6 px-4'>
                  <span className='animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full mb-4'></span>
                  <p className='text-sm text-cyan-700 font-semibold mb-2'>
                    正在建立 P2P 連線...
                  </p>
                  <p className='text-xs text-slate-500 max-w-xs leading-relaxed'>
                    請確保您的電腦瀏覽器上的 PagePeer 網頁維持開啟狀態。
                  </p>
                </div>
              ) : (
                <div className='h-full flex flex-col items-center justify-center text-slate-400 text-center py-12'>
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
                  <p className='text-sm text-slate-500'>
                    尚未連線或未傳送任何資料。
                  </p>
                  <p className='text-xs text-slate-400 mt-1.5'>
                    連線成功後，在此處拖放檔案或發送訊息即可傳輸。
                  </p>
                </div>
              )
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'me'
                const isSystem = msg.sender === 'system'

                if (isSystem) {
                  return (
                    <div key={msg.id} className='text-center my-4'>
                      <span className='px-3.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs text-slate-500 tracking-wide font-medium shadow-sm'>
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group/msg`}
                  >
                    <div className='text-xs text-slate-400 mb-1 font-semibold px-2'>
                      {isMe ? '我' : msg.sender === 'peer' && '對端裝置'} •{' '}
                      {msg.timestamp.toLocaleTimeString([], {
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
                          <div className='flex items-center gap-2.5 mt-1'>
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
                              className='flex-grow flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-bold text-xs active:scale-[0.97] transition-all shadow-sm'
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

                            {/* Simple preview if it's an image */}
                            {msg.file.type.startsWith('image/') && (
                              <a
                                href={msg.file.url}
                                target='_blank'
                                rel='noreferrer'
                                className='px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs active:scale-[0.97] transition-all'
                              >
                                預覽
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {/* Active file transfer progress overlays */}
          {transferringFile && (
            <div className='absolute bottom-[80px] left-6 right-6 p-4 rounded-xl bg-white border border-cyan-500/30 shadow-2xl flex flex-col gap-2 z-20 animate-fade-in'>
              <div className='flex justify-between items-center text-xs'>
                <span className='text-cyan-600 font-semibold flex items-center gap-2'>
                  <span className='animate-spin h-3.5 w-3.5 border-2 border-cyan-500 border-t-transparent rounded-full'></span>
                  {transferringFile.type === 'send'
                    ? '正在發送檔案...'
                    : '正在接收檔案...'}
                </span>
                <span className='text-slate-500 font-mono font-bold'>
                  {transferringFile.progress}%
                </span>
              </div>
              <div className='text-sm font-semibold text-slate-800 truncate'>
                {transferringFile.name}
              </div>

              <div className='w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200'>
                <div
                  className='bg-gradient-to-r from-cyan-500 to-blue-600 h-full transition-all duration-300'
                  style={{ width: `${transferringFile.progress}%` }}
                ></div>
              </div>

              <div className='flex justify-between items-center text-xs text-slate-500 font-mono'>
                <span>大小：{formatBytes(transferringFile.size)}</span>
                <span>速度：{formatSpeed(transferringFile.speed)}</span>
              </div>
            </div>
          )}

          {/* Message input bar */}
          <form
            onSubmit={handleSendMessage}
            className='flex items-center gap-2 mt-4 pt-4 border-t border-slate-200'
          >
            {/* Hidden File Input */}
            <input
              type='file'
              ref={fileInputRef}
              onChange={(e) => handleSendFile(e.target.files)}
              disabled={connectionStatus !== 'connected'}
              className='hidden'
            />
            {/* File selection button */}
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              disabled={connectionStatus !== 'connected'}
              title='選擇並發送檔案'
              className='p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 active:scale-95 transition-all flex items-center justify-center flex-shrink-0'
            >
              {/* Paperclip icon */}
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
                  d='M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13'
                ></path>
              </svg>
            </button>
            <input
              type='text'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                connectionStatus === 'connected'
                  ? '輸入訊息...'
                  : '尚未連線，無法傳送訊息'
              }
              disabled={connectionStatus !== 'connected'}
              className='flex-grow min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500/50 disabled:opacity-50 transition-all'
            />
            <button
              type='submit'
              disabled={connectionStatus !== 'connected' || !inputText.trim()}
              title='發送訊息'
              className='p-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-30 disabled:hover:bg-cyan-500 active:scale-95 transition-all shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center justify-center flex-shrink-0'
            >
              {/* Paper Plane icon */}
              <svg
                xmlns='http://www.w3.org/2000/svg'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth={2.5}
                stroke='currentColor'
                className='w-5 h-5'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5'
                />
              </svg>
            </button>
          </form>
        </div>
      </main>
        </div>
      </div>
    </div>
  )
}

export default function P2PShareWrapper() {
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

  return <P2PShare roomId={params.roomId} role={params.role} />
}
