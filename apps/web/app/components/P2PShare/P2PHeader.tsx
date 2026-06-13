import React from 'react'
import type { ConnectionStatus } from './hooks/useP2PConnection'
import Avatar from './Avatar'
import { getAvatarInfo } from './utils/avatar'

interface P2PHeaderProps {
  connectionStatus: ConnectionStatus
  roomId: string
  roomRole: 'host' | 'client'
  qrCodeUrl: string
  shareLink: string
  shareLinkCopied: boolean
  onCopyShareLink: () => void
  showQrPopover: boolean
  onToggleQrPopover: (open: boolean) => void
  qrPopoverRef: React.RefObject<HTMLDivElement | null>
  peerIdToSeedMap: Record<string, string>
  peerList: string[]
  hidePairingButton?: boolean
}

export default function P2PHeader({
  connectionStatus,
  roomId,
  roomRole,
  qrCodeUrl,
  shareLinkCopied,
  onCopyShareLink,
  showQrPopover,
  onToggleQrPopover,
  qrPopoverRef,
  peerIdToSeedMap,
  peerList,
  hidePairingButton = false
}: P2PHeaderProps) {

  // Resolve peer seed if connected
  const peerId = peerList[0]
  const peerSeed = peerId ? peerIdToSeedMap[peerId] || peerId : ''
  const peerAvatarInfo = peerId ? getAvatarInfo(peerSeed) : null

  return (
    <header className='w-full border-b border-slate-200/80 bg-white/70 backdrop-blur-md flex-shrink-0 z-40'>
      <div className='max-w-7xl mx-auto px-4 py-2.5 md:px-6 md:py-4 flex items-center justify-between gap-2 md:gap-4'>
        {/* Logo & Version */}
        <div className='flex items-center gap-2 md:gap-3.5 flex-wrap'>
          <div className='flex items-center gap-1.5'>
            <span className='text-lg md:text-2xl font-black font-title tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600'>
              PagePeer
            </span>
            <span className='px-1.5 py-0.5 text-[9px] md:text-xs font-bold tracking-widest text-cyan-700 bg-cyan-50 rounded-full border border-cyan-200/85 shadow-[0_0_8px_rgba(8,145,178,0.03)]'>
              V3
            </span>
          </div>

          {/* Status indicator dot */}
          <div className='flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shadow-inner'>
            <span className='flex h-2 w-2 relative'>
              {connectionStatus === 'connected' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-emerald-500'></span>
                </>
              )}
              {connectionStatus === 'waiting' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-cyan-500'></span>
                </>
              )}
              {connectionStatus === 'connecting' && (
                <>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-amber-500'></span>
                </>
              )}
              {connectionStatus === 'initializing' && (
                <span className='relative inline-flex rounded-full h-2 w-2 bg-slate-400 animate-pulse'></span>
              )}
              {connectionStatus === 'disconnected' && (
                <span className='relative inline-flex rounded-full h-2 w-2 bg-slate-400'></span>
              )}
              {connectionStatus === 'error' && (
                <span className='relative inline-flex rounded-full h-2 w-2 bg-rose-500'></span>
              )}
            </span>
            <span className='hidden sm:inline text-[10px] font-bold uppercase tracking-wider text-slate-500'>
              {connectionStatus === 'initializing' && '啟動中'}
              {connectionStatus === 'waiting' && '待配對'}
              {connectionStatus === 'connecting' && '連線中'}
              {connectionStatus === 'connected' && '已加密'}
              {connectionStatus === 'disconnected' && '已斷線'}
              {connectionStatus === 'error' && '失敗'}
            </span>
          </div>



          {/* Connected Peer identity avatar pill */}
          {connectionStatus === 'connected' && peerAvatarInfo && (
            <div className='flex items-center bg-cyan-50/80 p-0.5 rounded-full border border-cyan-200/80 shadow-inner animate-fade-in'>
              <Avatar seed={peerSeed} size='xs' showTooltip={true} />
            </div>
          )}
        </div>

        {/* Right: Room ID + QR popover */}
        <div className='flex items-center gap-2 text-xs md:text-sm'>
          {/* Room ID and copy button */}
          <div className='flex items-center gap-1 bg-slate-100 px-2.5 h-8 rounded-lg border border-slate-200 text-slate-600 font-mono shadow-inner'>
            <span className='text-slate-500 text-[10px] select-none pl-0.5'>
              房號:
            </span>
            <span className='font-bold text-slate-800 tracking-wider text-[11px] md:text-sm'>
              {roomId}
            </span>
            <button
              type='button'
              onClick={onCopyShareLink}
              title='複製通訊連結'
              className='p-0.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60 transition-all active:scale-90 flex items-center justify-center'
            >
              {shareLinkCopied ? (
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
          </div>

          {/* Desktop QR Code Popover trigger */}
          {!hidePairingButton && roomRole === 'host' && qrCodeUrl && (
            <div className='relative' ref={qrPopoverRef}>
              <button
                type='button'
                onClick={() => onToggleQrPopover(!showQrPopover)}
                className={`flex items-center gap-1.5 px-2.5 h-8 rounded-lg border text-[11px] font-semibold transition-all active:scale-[0.98] ${
                  showQrPopover
                    ? 'bg-cyan-500 text-white border-cyan-400 shadow-[0_2px_8px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-200/60'
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
                    strokeWidth='2'
                    d='M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
                <span className='hidden sm:inline'>行動裝置配對</span>
              </button>

              {/* QR Popover */}
              {showQrPopover && (
                <div className='absolute right-0 mt-2 p-4 rounded-xl bg-white border border-slate-200 shadow-[0_10px_25px_rgba(0,0,0,0.08)] flex flex-col items-center gap-3 text-center z-50 w-64 animate-fade-in'>
                  <div className='absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-blue-500 rounded-t-xl'></div>
                  <p className='text-[11px] font-semibold text-slate-600 leading-normal'>
                    請使用行動裝置掃描 QR Code
                    <br />
                    加入安全連線傳輸：
                  </p>
                  <div className='bg-slate-50 p-2.5 rounded-lg border border-cyan-200 shadow-sm'>
                    <img
                      src={qrCodeUrl}
                      alt='QR Code'
                      className='w-36 h-36 max-w-full'
                    />
                  </div>

                  {/* Copy share link inside popover */}
                  <button
                    type='button'
                    onClick={onCopyShareLink}
                    className='w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 font-semibold text-[11px] hover:bg-slate-100 hover:text-slate-800 transition-all active:scale-[0.98]'
                  >
                    {shareLinkCopied ? (
                      <>
                        <svg
                          className='w-3 h-3 text-emerald-600'
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
                        <span className='text-emerald-600 font-semibold'>
                          已複製房號連結
                        </span>
                      </>
                    ) : (
                      <>
                        <svg
                          className='w-3 h-3'
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
                        <span>複製通訊連結</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
