import React from 'react'
import type { TransferringFile } from './hooks/useFileTransfer'
import { formatBytes, formatSpeed } from './utils/p2pUtils'

interface FileTransferProgressProps {
  transferringFile: TransferringFile | null
}

export default function FileTransferProgress({
  transferringFile
}: FileTransferProgressProps) {
  if (!transferringFile) return null

  return (
    <div className='absolute bottom-[80px] left-6 right-6 p-4 rounded-xl bg-white border border-cyan-500/30 shadow-2xl flex flex-col gap-2 z-20 animate-fade-in'>
      <div className='flex justify-between items-center text-xs'>
        <span className='text-cyan-700 font-semibold flex items-center gap-2'>
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
  )
}
