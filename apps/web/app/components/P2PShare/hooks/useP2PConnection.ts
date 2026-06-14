import { useState, useEffect, useRef, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'

export type ConnectionStatus =
  | 'initializing'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'disconnected'

interface UseP2PConnectionProps {
  roomId: string
  roomRole: 'host' | 'client'
  mySeed: string
  onIncomingSystemMessage: (text: string, peerId?: string) => void
  onIncomingData: (conn: DataConnection, data: any) => void
}

export function useP2PConnection({
  roomId,
  roomRole,
  mySeed,
  onIncomingSystemMessage,
  onIncomingData
}: UseP2PConnectionProps) {
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('initializing')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [peerList, setPeerList] = useState<string[]>([])
  const [reconnectTrigger, setReconnectTrigger] = useState(0)

  // State to trigger reactivity when active connection changes
  const [activeConnection, setActiveConnection] =
    useState<DataConnection | null>(null)

  // Map peerId -> DataConnection
  const connectionsRef = useRef<Map<string, DataConnection>>(new Map())
  const isConnectingRef = useRef(false)

  // Keep references to current callback handlers to prevent triggering reconnects
  const onIncomingSystemMessageRef = useRef(onIncomingSystemMessage)
  const onIncomingDataRef = useRef(onIncomingData)

  useEffect(() => {
    onIncomingSystemMessageRef.current = onIncomingSystemMessage
    onIncomingDataRef.current = onIncomingData
  })

  const updateActiveConnection = useCallback(() => {
    const conns = Array.from(connectionsRef.current.values())
    const active = conns.find((c) => c.open) || conns[0] || null
    setActiveConnection(active)
    setPeerList(Array.from(connectionsRef.current.keys()))
  }, [])

  // Setup connection event listeners
  const setupConnectionListeners = useCallback(
    (conn: DataConnection) => {
      conn.on('open', () => {
        console.log(`Connected to peer: ${conn.peer}`)
        connectionsRef.current.set(conn.peer, conn)
        updateActiveConnection()
        setConnectionStatus('connected')
        isConnectingRef.current = false

        // Send identity handshake immediately on connection open
        conn.send({
          type: 'identity',
          avatarSeed: mySeed
        })
        const deviceType = conn.peer.includes('client') ? '訪客端' : '主控端'
        onIncomingSystemMessageRef.current(
          `裝置已連線 (${deviceType})`,
          conn.peer
        )
      })

      conn.on('data', (data) => {
        onIncomingDataRef.current(conn, data)
      })

      conn.on('close', () => {
        console.log(`Connection closed with peer: ${conn.peer}`)
        connectionsRef.current.delete(conn.peer)
        updateActiveConnection()

        onIncomingSystemMessageRef.current('裝置已斷開連線', conn.peer)

        // If no connections left
        if (connectionsRef.current.size === 0) {
          setConnectionStatus(roomRole === 'host' ? 'waiting' : 'disconnected')
        }
        isConnectingRef.current = false
      })

      conn.on('error', (err) => {
        console.error('Connection error:', err)
        setErrorMsg(`連線錯誤: ${err.message}`)
        isConnectingRef.current = false
      })
    },
    [roomRole, updateActiveConnection, mySeed]
  )

  // Initialize PeerJS client
  useEffect(() => {
    const hostPeerId = `pagepeer-room-${roomId}`
    const myId =
      roomRole === 'host'
        ? hostPeerId
        : `pagepeer-client-${roomId}-${Math.random().toString(36).substring(2, 6)}`

    // Configure PeerJS to connect to public server
    const newPeer = new Peer(myId, {
      debug: 1
    })

    setPeer(newPeer)

    const connectToHost = () => {
      if (roomRole !== 'client') return

      const hasActiveConnection = Array.from(
        connectionsRef.current.values()
      ).some((c) => c.open)
      if (hasActiveConnection) {
        console.log(
          'Already have an active open connection, skipping reconnection.'
        )
        return
      }

      if (isConnectingRef.current) {
        console.log('Already attempting to connect, skipping.')
        return
      }

      console.log(`Attempting to connect to host: ${hostPeerId}`)
      setConnectionStatus('connecting')
      isConnectingRef.current = true

      if (newPeer.disconnected && !newPeer.destroyed) {
        console.log(
          'Peer is disconnected from signaling server, reconnecting...'
        )
        newPeer.reconnect()
      }

      const conn = newPeer.connect(hostPeerId, {
        reliable: true
      })
      setupConnectionListeners(conn)
    }

    newPeer.on('open', (id) => {
      console.log(`PeerJS initialized. My ID: ${id}`)
      setConnectionStatus(roomRole === 'host' ? 'waiting' : 'connecting')

      if (roomRole === 'client') {
        connectToHost()
      }
    })

    newPeer.on('connection', (conn) => {
      console.log(`Incoming connection from: ${conn.peer}`)
      setupConnectionListeners(conn)
    })

    newPeer.on('error', (err) => {
      console.error('PeerJS global error:', err)
      setConnectionStatus('error')
      isConnectingRef.current = false
      if (err.type === 'unavailable-id') {
        setErrorMsg('該房號已有人使用，請重新整理網頁以取得新房號。')
      } else {
        setErrorMsg(`通訊伺服器錯誤: ${err.message || err.type}`)
      }
    })

    const handleBeforeUnload = () => {
      console.log('Page unloading, closing peer connections...')
      connectionsRef.current.forEach((conn) => {
        if (conn.open) {
          conn.close()
        }
      })
    }

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' || document.hasFocus()) {
        if (roomRole === 'client') {
          const hasActiveConnection = Array.from(
            connectionsRef.current.values()
          ).some((c) => c.open)
          if (!hasActiveConnection && !isConnectingRef.current) {
            console.log(
              'Window focused/visible and client is disconnected. Triggering auto-reconnection.'
            )
            connectToHost()
          }
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('focus', handleVisibilityOrFocus)
    document.addEventListener('visibilitychange', handleVisibilityOrFocus)

    return () => {
      console.log('Destroying peer connections...')
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('focus', handleVisibilityOrFocus)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      connectionsRef.current.forEach((conn) => conn.close())
      connectionsRef.current.clear()
      newPeer.destroy()
    }
  }, [roomId, roomRole, setupConnectionListeners, reconnectTrigger])

  // Send message to all connected peers
  const sendMessage = useCallback((data: any) => {
    let sent = false
    connectionsRef.current.forEach((conn) => {
      if (conn.open) {
        conn.send(data)
        sent = true
      }
    })
    return sent
  }, [])

  const reconnect = useCallback(() => {
    if (roomRole !== 'client') return
    setErrorMsg(null)
    setConnectionStatus('initializing')
    setReconnectTrigger((prev) => prev + 1)
  }, [roomRole])

  return {
    connectionStatus,
    errorMsg,
    peerList,
    activeConnection,
    sendMessage,
    peer,
    reconnect
  }
}
