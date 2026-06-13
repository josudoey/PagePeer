import React, { useRef, useEffect } from 'react'

interface ChatFormProps {
  inputText: string
  onChangeInputText: (text: string) => void
  onSubmit: (e: React.FormEvent) => void
  onSendFile: (files: FileList | null) => void
  connectionStatus: 'initializing' | 'waiting' | 'connecting' | 'connected' | 'error' | 'disconnected'
}

export default function ChatForm({
  inputText,
  onChangeInputText,
  onSubmit,
  onSendFile,
  connectionStatus
}: ChatFormProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const isConnected = connectionStatus === 'connected'

  // Auto-resize height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputText.trim()) {
        const fakeEvent = {
          preventDefault: () => {}
        } as React.FormEvent
        onSubmit(fakeEvent)
      }
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className='flex items-end gap-2 mt-4 pt-4 border-t border-slate-200'
    >
      {/* Hidden File Input */}
      <input
        type='file'
        ref={fileInputRef}
        onChange={(e) => onSendFile(e.target.files)}
        disabled={!isConnected}
        className='hidden'
      />
      {/* File selection button */}
      <button
        type='button'
        onClick={() => fileInputRef.current?.click()}
        disabled={!isConnected}
        title='選擇並發送檔案'
        className='p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 active:scale-95 transition-all flex items-center justify-center flex-shrink-0 mb-0.5'
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
      <textarea
        ref={textareaRef}
        rows={1}
        value={inputText}
        onChange={(e) => onChangeInputText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isConnected
            ? '輸入訊息...'
            : '尚未連線，無法傳送訊息'
        }
        disabled={!isConnected}
        className='flex-grow min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-cyan-500/50 disabled:opacity-50 transition-all resize-none overflow-y-auto min-h-[46px] max-h-[120px] leading-normal'
      />
      <button
        type='submit'
        disabled={!isConnected || !inputText.trim()}
        title='發送訊息'
        className='p-3 rounded-xl bg-cyan-500 text-white hover:bg-cyan-600 disabled:opacity-30 disabled:hover:bg-cyan-500 active:scale-95 transition-all shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center justify-center flex-shrink-0 mb-0.5'
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
  )
}
