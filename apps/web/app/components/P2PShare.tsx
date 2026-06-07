import React, { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import QRCode from 'qrcode'

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

function P2PShare({ roomId, role }: P2PShareProps) {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'initializing' | 'waiting' | 'connecting' | 'connected' | 'error'>('initializing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [transferringFile, setTransferringFile] = useState<TransferringFile | null>(null)
  const [peerList, setPeerList] = useState<string[]>([])

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

  const receivingFilesRef = useRef<Map<string, {
    fileId: string
    name: string
    size: number
    mimeType: string
    totalChunks: number
    chunks: ArrayBuffer[]
    chunksReceived: number
    startTime: number
  }>>(new Map())

  // Force component render when needed (for messages list to scroll or just state sync)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Generate QR Code URL
  useEffect(() => {
    if (role === 'desktop') {
      const shareUrl = `${window.location.origin}${window.location.pathname}?r=${roomId}&role=mobile`
      QRCode.toDataURL(shareUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#22d3ee', // Cyan 400
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

    const { file, chunkSize, currentChunkIndex, totalChunks, conn, fileId, startTime } = state
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
      setTransferringFile((prev) => prev ? { ...prev, status: 'error' } : null)
    }
    reader.readAsArrayBuffer(blobSlice)
  }

  // Handle incoming PeerJS messages
  const handleIncomingData = useCallback((conn: DataConnection, data: any) => {
    if (typeof data !== 'object' || data === null) return

    const remotePeerName = conn.peer.includes('mobile') ? '行動裝置' : '電腦網頁'

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
        const progress = Math.round((state.chunksReceived / state.totalChunks) * 100)

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
        const blob = new Blob(state.chunks, { type: state.mimeType || 'application/octet-stream' })
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
  }, [handleChunkAck])

  // Setup connection event listeners
  const setupConnectionListeners = useCallback((conn: DataConnection) => {
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
  }, [role, handleIncomingData])

  // Initialize PeerJS client
  useEffect(() => {
    const hostPeerId = `pagepeer-room-${roomId}`
    const myId = role === 'desktop' ? hostPeerId : `pagepeer-client-${roomId}-${Math.random().toString(36).substring(2, 6)}`

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
    <div className='w-full max-w-4xl mx-auto px-4 py-6 flex flex-col md:grid md:grid-cols-12 gap-6 items-stretch min-h-[600px]'>
      
      {/* Sidebar: Connection & Status Panel */}
      <div className='md:col-span-4 flex flex-col gap-6'>
        
        {/* Connection status card */}
        <div className='p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex flex-col items-center text-center shadow-lg relative overflow-hidden group'>
          <div className='absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-blue-500'></div>
          
          <h3 className='text-sm font-semibold tracking-wider uppercase text-cyan-400 font-title mb-4'>
            連線狀態
          </h3>

          {/* Glowing Indicator light */}
          <div className='flex items-center gap-3 mb-6 bg-white/5 px-4 py-2 rounded-full border border-white/5'>
            <span className='flex h-3 w-3 relative'>
              {connectionStatus === 'connected' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-emerald-500'></span>
                </>
              )}
              {connectionStatus === 'waiting' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-cyan-500'></span>
                </>
              )}
              {connectionStatus === 'connecting' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-amber-500'></span>
                </>
              )}
              {connectionStatus === 'initializing' && (
                <span className='relative inline-flex rounded-full h-3 w-3 bg-slate-600 animate-pulse'></span>
              )}
              {connectionStatus === 'error' && (
                <span className='relative inline-flex rounded-full h-3 w-3 bg-rose-500'></span>
              )}
            </span>
            <span className='text-xs font-semibold uppercase tracking-wide text-slate-200'>
              {connectionStatus === 'initializing' && '正在啟動服務'}
              {connectionStatus === 'waiting' && '等待掃描配對'}
              {connectionStatus === 'connecting' && '正在建立 P2P 連線'}
              {connectionStatus === 'connected' && '已建立加密連線'}
              {connectionStatus === 'error' && '連線失敗'}
            </span>
          </div>

          {/* Info & Code */}
          <div className='w-full space-y-4 text-xs text-slate-400'>
            <div>
              <p className='text-slate-500 uppercase tracking-widest text-[10px] mb-1 font-bold'>房號 (Room ID)</p>
              <p className='text-lg font-mono font-bold text-white tracking-widest'>{roomId}</p>
            </div>

            {role === 'desktop' && qrCodeUrl && (
              <div className='flex flex-col items-center gap-3 p-3 bg-slate-950/40 rounded-xl border border-white/5'>
                <p className='text-slate-400'>用手機掃描下方 QR Code 加入連線：</p>
                <div className='bg-white/5 p-2 rounded-lg border border-cyan-500/20'>
                  <img src={qrCodeUrl} alt='Connection QR Code' className='w-40 h-40 max-w-full' />
                </div>
              </div>
            )}

            {role === 'mobile' && connectionStatus !== 'connected' && (
              <div className='p-4 bg-cyan-950/20 border border-cyan-800/30 rounded-xl text-left'>
                <p className='text-cyan-300 leading-relaxed'>
                  正在嘗試連接您的電腦網頁...請確保電腦瀏覽器上的 PagePeer 網頁維持開啟狀態。
                </p>
              </div>
            )}

            {errorMsg && (
              <div className='p-3 bg-rose-950/30 border border-rose-800/30 text-rose-300 rounded-xl text-left'>
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        {/* Device Info / Stats card */}
        {connectionStatus === 'connected' && (
          <div className='p-5 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 text-xs shadow-lg space-y-4'>
            <h4 className='font-bold uppercase tracking-wider text-slate-400 mb-2'>已連線裝置</h4>
            <div className='space-y-2'>
              {peerList.map((peerId) => (
                <div key={peerId} className='flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/50 border border-white/5'>
                  <div className='w-2 h-2 rounded-full bg-emerald-400'></div>
                  <span className='font-mono font-semibold text-slate-300 truncate w-full'>
                    {peerId.includes('mobile') ? '📱 行動裝置' : '💻 電腦網頁'} ({peerId.substring(peerId.lastIndexOf('-') + 1)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Panel: Sharing Interface */}
      <div className='md:col-span-8 flex flex-col gap-6 justify-between'>
        
        {/* Transfer History & Chat Window */}
        <div className='flex-grow flex flex-col p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-lg min-h-[400px] max-h-[500px] overflow-hidden relative'>
          
          <h3 className='text-sm font-semibold tracking-wider uppercase text-slate-300 font-title border-b border-white/10 pb-3 mb-4 flex justify-between items-center'>
            <span>傳輸紀錄與聊天</span>
            <span className='text-[10px] text-slate-500 font-mono'>P2P Encrypted</span>
          </h3>

          {/* Messages list */}
          <div className='flex-grow overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent'>
            {messages.length === 0 ? (
              <div className='h-full flex flex-col items-center justify-center text-slate-500 text-center py-12'>
                <svg className='w-12 h-12 mb-3 opacity-30 text-cyan-400 animate-pulse' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='1.5' d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'></path>
                </svg>
                <p className='text-sm'>尚未連線或未傳送任何資料。</p>
                <p className='text-xs text-slate-600 mt-1'>連線成功後，在此處拖放檔案或發送訊息即可傳輸。</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'me'
                const isSystem = msg.sender === 'system'

                if (isSystem) {
                  return (
                    <div key={msg.id} className='text-center my-3'>
                      <span className='px-3 py-1 rounded-full bg-slate-900/80 border border-white/5 text-[10px] text-slate-400 tracking-wide font-medium'>
                        {msg.text}
                      </span>
                    </div>
                  )
                }

                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className='text-[10px] text-slate-500 mb-1 font-semibold px-2'>
                      {isMe ? '我' : (msg.sender === 'peer' && '對端裝置')} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    
                    {msg.type === 'text' ? (
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow ${
                        isMe 
                          ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 rounded-tr-none font-medium' 
                          : 'bg-white/10 text-white rounded-tl-none border border-white/5'
                      }`}>
                        {msg.text}
                      </div>
                    ) : (
                      // File card message
                      <div className={`max-w-[85%] p-3.5 rounded-2xl border flex flex-col gap-3 shadow-lg ${
                        isMe
                          ? 'bg-gradient-to-b from-cyan-950/40 to-blue-950/40 border-cyan-500/20 text-right rounded-tr-none'
                          : 'bg-gradient-to-b from-slate-900/60 to-slate-950/60 border-white/10 text-left rounded-tl-none'
                      }`}>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400 flex-shrink-0'>
                            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'></path>
                            </svg>
                          </div>
                          <div className='min-w-0 flex-grow text-left'>
                            <p className='text-sm font-semibold text-white truncate'>{msg.file?.name}</p>
                            <p className='text-xs text-slate-400'>{formatBytes(msg.file?.size || 0)}</p>
                          </div>
                        </div>

                        {/* File Action button */}
                        {msg.file?.url && (
                          <div className='flex items-center gap-2 mt-1'>
                            <a
                              href={msg.file.url}
                              download={msg.file.name}
                              className='flex-grow flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-semibold text-xs hover:bg-cyan-400 active:scale-[0.98] transition-all'
                            >
                              <svg className='w-3.5 h-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2.5' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4'></path>
                              </svg>
                              下載檔案
                            </a>
                            
                            {/* Simple preview if it's an image */}
                            {msg.file.type.startsWith('image/') && (
                              <a
                                href={msg.file.url}
                                target='_blank'
                                rel='noreferrer'
                                className='px-3 py-1.5 rounded-lg bg-white/10 text-white border border-white/10 font-semibold text-xs hover:bg-white/20 active:scale-[0.98] transition-all'
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
            <div ref={messagesEndRef} />
          </div>

          {/* Active file transfer progress overlays */}
          {transferringFile && (
            <div className='absolute bottom-[72px] left-6 right-6 p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 backdrop-blur shadow-2xl flex flex-col gap-2 z-20 animate-fade-in'>
              <div className='flex justify-between items-center text-xs'>
                <span className='text-cyan-400 font-semibold flex items-center gap-2'>
                  <span className='animate-spin h-3.5 w-3.5 border-2 border-cyan-400 border-t-transparent rounded-full'></span>
                  {transferringFile.type === 'send' ? '正在發送檔案...' : '正在接收檔案...'}
                </span>
                <span className='text-slate-400 font-mono'>{transferringFile.progress}%</span>
              </div>
              <div className='text-sm font-semibold text-white truncate'>{transferringFile.name}</div>
              
              <div className='w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/5'>
                <div 
                  className='bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300' 
                  style={{ width: `${transferringFile.progress}%` }}
                ></div>
              </div>

              <div className='flex justify-between items-center text-[10px] text-slate-500 font-mono'>
                <span>大小：{formatBytes(transferringFile.size)}</span>
                <span>速度：{formatSpeed(transferringFile.speed)}</span>
              </div>
            </div>
          )}

          {/* Message input bar */}
          <form onSubmit={handleSendMessage} className='flex items-center gap-2 mt-4 pt-3 border-t border-white/10'>
            <input
              type='text'
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={connectionStatus === 'connected' ? '輸入訊息...' : '尚未連線，無法傳送訊息'}
              disabled={connectionStatus !== 'connected'}
              className='flex-grow bg-slate-950/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 disabled:opacity-50 transition-colors'
            />
            <button
              type='submit'
              disabled={connectionStatus !== 'connected' || !inputText.trim()}
              className='px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-sm hover:bg-cyan-400 disabled:opacity-40 active:scale-95 transition-all shadow shadow-cyan-500/20'
            >
              發送
            </button>
          </form>
        </div>

        {/* File Drop and Selection Area */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative p-8 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            connectionStatus !== 'connected'
              ? 'border-white/5 bg-white/[0.01] cursor-not-allowed opacity-50'
              : dragOver
                ? 'border-cyan-400 bg-cyan-950/20 shadow-lg shadow-cyan-500/5'
                : 'border-white/15 bg-white/5 hover:border-cyan-500/40 hover:bg-white/[0.07]'
          }`}
        >
          {/* File input */}
          <input
            type='file'
            onChange={(e) => handleSendFile(e.target.files)}
            disabled={connectionStatus !== 'connected'}
            className='absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed'
            title=''
          />

          <div className='w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-500/20'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'></path>
            </svg>
          </div>

          <p className='text-sm font-semibold text-white mb-1'>
            {connectionStatus === 'connected' ? '點擊選擇檔案，或將檔案拖放到此處' : '請先掃碼配對連線'}
          </p>
          <p className='text-xs text-slate-400'>
            支援照片、影片、文件、音檔等任意檔案傳送 (P2P 直連，不經伺服器)
          </p>
        </div>

      </div>

    </div>
  )
}

export default function P2PShareWrapper() {
  const [params, setParams] = useState<{ roomId: string; role: 'desktop' | 'mobile' } | null>(null)

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    let r = urlParams.get('r')
    const roleParam = urlParams.get('role') === 'mobile' ? 'mobile' : 'desktop'

    if (!r) {
      r = Math.random().toString(36).substring(2, 8)
      urlParams.set('r', r)
      window.location.replace(window.location.pathname + '?' + urlParams.toString())
    } else {
      setParams({ roomId: r, role: roleParam })
    }
  }, [])

  if (!params) {
    return (
      <div className='flex items-center justify-center min-h-[600px] text-slate-400'>
        <div className='flex flex-col items-center gap-3'>
          <span className='animate-spin h-8 w-8 border-4 border-cyan-400 border-t-transparent rounded-full'></span>
          <span>正在載入傳輸房...</span>
        </div>
      </div>
    )
  }

  return <P2PShare roomId={params.roomId} role={params.role} />
}
