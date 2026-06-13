import { useState, useRef, useCallback, useEffect } from 'react'
import type { DataConnection } from 'peerjs'

export interface TransferringFile {
  fileId: string
  name: string
  size: number
  type: 'send' | 'receive'
  progress: number
  speed: number // Bytes per second
  status: 'waiting' | 'transferring' | 'completed' | 'error'
}

export interface FileMessagePayload {
  name: string
  size: number
  type: string
  url: string
}

interface UseFileTransferProps {
  activeConnection: DataConnection | null
  onTransferComplete: (
    direction: 'send' | 'receive',
    fileName: string,
    fileSize: number,
    fileType: string,
    fileUrl: string
  ) => void
}

interface SendingFileState {
  file: File
  fileId: string
  chunkSize: number
  totalChunks: number
  currentChunkIndex: number
  conn: DataConnection
  startTime: number
  bytesSent: number
}

interface ReceivingFileState {
  fileId: string
  name: string
  size: number
  mimeType: string
  totalChunks: number
  chunks: ArrayBuffer[]
  chunksReceived: number
  startTime: number
  bytesReceived: number
}

export function useFileTransfer({
  activeConnection,
  onTransferComplete
}: UseFileTransferProps) {
  const [transferringFile, setTransferringFile] =
    useState<TransferringFile | null>(null)

  // Keep reference to the latest callback to avoid dependencies re-evaluation
  const onTransferCompleteRef = useRef(onTransferComplete)
  useEffect(() => {
    onTransferCompleteRef.current = onTransferComplete
  })

  // Keep track of current sending file state
  const sendingFileStateRef = useRef<SendingFileState | null>(null)

  // Keep track of incoming file transfers in progress
  const receivingFilesRef = useRef<Map<string, ReceivingFileState>>(new Map())

  // Send next file chunk (sender side)
  const sendNextChunk = useCallback(() => {
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
        const chunkData = e.target.result
        const chunkLength = chunkData.byteLength

        conn.send({
          type: 'file-chunk',
          fileId,
          chunkIndex: currentChunkIndex,
          data: chunkData
        })

        // Accumulate bytes sent
        state.bytesSent += chunkLength

        // Calculate progress and speed
        const elapsedSeconds = (Date.now() - startTime) / 1000
        const speed = elapsedSeconds > 0 ? state.bytesSent / elapsedSeconds : 0
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
  }, [])

  // Process chunk acknowledgment (sender side)
  const handleChunkAck = useCallback(
    (fileId: string, chunkIndex: number) => {
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

          const fileUrl = URL.createObjectURL(state.file)
          onTransferCompleteRef.current(
            'send',
            state.file.name,
            state.file.size,
            state.file.type,
            fileUrl
          )

          setTransferringFile(null)
          sendingFileStateRef.current = null
        } else {
          // Send next chunk
          sendNextChunk()
        }
      }
    },
    [sendNextChunk]
  )

  // Handle file sending initialization
  const handleSendFile = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return
      if (!activeConnection || !activeConnection.open) return

      const file = files[0]
      const fileId = `${file.name}-${file.size}-${Date.now()}`
      const chunkSize = 65536 // 64 KB
      const totalChunks = Math.ceil(file.size / chunkSize)

      sendingFileStateRef.current = {
        file,
        fileId,
        chunkSize,
        totalChunks,
        currentChunkIndex: 0,
        conn: activeConnection,
        startTime: Date.now(),
        bytesSent: 0
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

      // Start protocol by sending metadata
      activeConnection.send({
        type: 'file-start',
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        totalChunks
      })
    },
    [activeConnection]
  )

  // Process incoming file messages and route appropriately
  const handleFileTransferMessage = useCallback(
    (conn: DataConnection, data: any): boolean => {
      if (typeof data !== 'object' || data === null) return false

      switch (data.type) {
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
            startTime: Date.now(),
            bytesReceived: 0
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
          return true
        }

        case 'file-ready': {
          const state = sendingFileStateRef.current
          if (state && state.fileId === data.fileId) {
            state.startTime = Date.now()
            sendNextChunk()
          }
          return true
        }

        case 'file-chunk': {
          const { fileId, chunkIndex, data: chunkData } = data
          const state = receivingFilesRef.current.get(fileId)
          if (!state) return true

          const typedChunk = chunkData as ArrayBuffer
          state.chunks[chunkIndex] = typedChunk
          state.chunksReceived += 1
          state.bytesReceived += typedChunk.byteLength

          const elapsedSeconds = (Date.now() - state.startTime) / 1000
          const speed =
            elapsedSeconds > 0 ? state.bytesReceived / elapsedSeconds : 0
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
          return true
        }

        case 'file-ack':
          handleChunkAck(data.fileId, data.chunkIndex)
          return true

        case 'file-complete': {
          const { fileId } = data
          const state = receivingFilesRef.current.get(fileId)
          if (!state) return true

          // Assemble chunks
          const blob = new Blob(state.chunks, {
            type: state.mimeType || 'application/octet-stream'
          })
          const url = URL.createObjectURL(blob)

          onTransferCompleteRef.current(
            'receive',
            state.name,
            state.size,
            state.mimeType,
            url
          )

          setTransferringFile(null)
          receivingFilesRef.current.delete(fileId)
          return true
        }

        default:
          return false
      }
    },
    [sendNextChunk, handleChunkAck]
  )

  const cancelTransfer = useCallback(() => {
    setTransferringFile(null)
    sendingFileStateRef.current = null
    receivingFilesRef.current.clear()
  }, [])

  return {
    transferringFile,
    handleSendFile,
    handleFileTransferMessage,
    cancelTransfer
  }
}
