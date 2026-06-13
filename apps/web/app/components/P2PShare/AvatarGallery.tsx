import React, { useState } from 'react'
import Avatar from './Avatar'
import {
  getAvatarInfo,
  getAvatarIcon,
  MACAROON_COLORS,
  ADJECTIVES,
  NOUNS,
  MYSTERY_AVATAR_ICON
} from './utils/avatar'

export default function AvatarGallery() {
  const [customSeed, setCustomSeed] = useState('hello')
  const [roomId, setRoomId] = useState('123456')

  // Generate Info for Custom Seed (with and without Room ID)
  const rawInfo = getAvatarInfo(customSeed)
  const combinedSeed = `${roomId}_${customSeed}`
  const roomInfo = getAvatarInfo(combinedSeed)

  // 12 default combinations (paired by index 0-11)
  const defaultCombinations = Array.from({ length: 12 }, (_, i) => {
    const name = `${ADJECTIVES[i]}${NOUNS[i]}`
    const bgColor = MACAROON_COLORS[i]
    const icon = getAvatarIcon(i)
    return { name, bgColor, icon, index: i }
  })

  return (
    <div className='w-full max-w-5xl mx-auto px-4 py-8 md:px-8 space-y-12 select-none'>
      {/* Header */}
      <div className='text-center space-y-3'>
        <h1 className='text-3xl md:text-5xl font-black font-title tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600'>
          PagePeer Avatar 角色面板
        </h1>
        <p className='text-slate-500 max-w-xl mx-auto text-xs md:text-sm font-medium'>
          在這裡預覽所有隨機產生的匿名角色、背景顏色、圖示以及互動式計算結果。
        </p>
      </div>

      {/* Interactive Preview Section */}
      <div className='bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6'>
        <h2 className='text-lg font-bold font-title text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
          <span className='h-4 w-1.5 bg-cyan-500 rounded-full'></span>
          互動計算與預覽
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Inputs */}
          <div className='space-y-4'>
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider'>
                個人瀏覽器種子 (User Seed)
              </label>
              <input
                type='text'
                value={customSeed}
                onChange={(e) => setCustomSeed(e.target.value)}
                placeholder='輸入任意文字...'
                className='w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all font-mono'
              />
            </div>
            <div>
              <label className='block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider'>
                房間 ID (Room ID)
              </label>
              <input
                type='text'
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder='輸入房號...'
                className='w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-cyan-500 transition-all font-mono'
              />
            </div>
          </div>

          {/* Result Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            {/* Raw Seed Result */}
            <div className='bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center justify-between text-center gap-3 relative overflow-hidden group hover:shadow-md transition-all'>
              <div className='absolute top-0 left-0 w-full h-[3px] bg-slate-300'></div>
              <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>
                原始個人角色
              </span>
              <Avatar seed={customSeed} size='lg' />
              <div>
                <h3 className='font-bold text-sm text-slate-800'>
                  {rawInfo.name}
                </h3>
                <code className='text-[10px] text-slate-400 font-mono block mt-0.5'>
                  {rawInfo.bgColor}
                </code>
              </div>
            </div>

            {/* Room-Specific Result */}
            <div className='bg-cyan-50/20 border border-cyan-100 p-4 rounded-xl flex flex-col items-center justify-between text-center gap-3 relative overflow-hidden group hover:shadow-md transition-all'>
              <div className='absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500'></div>
              <span className='text-[10px] font-bold text-cyan-600 uppercase tracking-widest'>
                房間專屬角色
              </span>
              <Avatar seed={combinedSeed} size='lg' />
              <div>
                <h3 className='font-bold text-sm text-slate-800'>
                  {roomInfo.name}
                </h3>
                <code className='text-[10px] text-slate-400 font-mono block mt-0.5'>
                  {roomInfo.bgColor}
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of All 12 Default Combinations */}
      <div className='bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xl space-y-6'>
        <h2 className='text-lg font-bold font-title text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
          <span className='h-4 w-1.5 bg-cyan-500 rounded-full'></span>
          12 種預設角色組合 (動物/水果名稱與色彩配對)
        </h2>

        <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
          {defaultCombinations.map((item) => (
            <div
              key={item.index}
              className='bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex flex-col items-center gap-3 hover:scale-105 hover:shadow-md hover:border-slate-300 transition-all duration-300'
            >
              <div
                style={{ backgroundColor: item.bgColor }}
                className='w-12 h-12 rounded-full flex items-center justify-center shadow-inner text-white'
              >
                <svg viewBox='0 0 24 24' className='w-8 h-8 text-white'>
                  {item.icon}
                </svg>
              </div>
              <div className='text-center'>
                <p className='font-bold text-xs text-slate-700'>{item.name}</p>
                <span className='text-[9px] font-bold text-slate-400 block mt-0.5 font-mono'>
                  Index {item.index}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sizes and Special Characters */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Sizes */}
        <div className='bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl space-y-4'>
          <h2 className='text-lg font-bold font-title text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
            <span className='h-4 w-1.5 bg-cyan-500 rounded-full'></span>
            尺寸規格展示
          </h2>
          <div className='flex items-end justify-around py-4 bg-slate-50 rounded-xl border border-slate-150'>
            <div className='flex flex-col items-center gap-1.5'>
              <Avatar seed='size-xs' size='xs' />
              <span className='text-[9px] font-bold text-slate-400 uppercase'>
                XS (24px)
              </span>
            </div>
            <div className='flex flex-col items-center gap-1.5'>
              <Avatar seed='size-sm' size='sm' />
              <span className='text-[9px] font-bold text-slate-400 uppercase'>
                SM (32px)
              </span>
            </div>
            <div className='flex flex-col items-center gap-1.5'>
              <Avatar seed='size-md' size='md' />
              <span className='text-[9px] font-bold text-slate-400 uppercase'>
                MD (40px)
              </span>
            </div>
            <div className='flex flex-col items-center gap-1.5'>
              <Avatar seed='size-lg' size='lg' />
              <span className='text-[9px] font-bold text-slate-400 uppercase'>
                LG (48px)
              </span>
            </div>
            <div className='flex flex-col items-center gap-1.5'>
              <Avatar seed='size-xl' size='xl' />
              <span className='text-[9px] font-bold text-slate-400 uppercase'>
                XL (64px)
              </span>
            </div>
          </div>
        </div>

        {/* Special Character */}
        <div className='bg-white/80 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-6 shadow-xl space-y-4'>
          <h2 className='text-lg font-bold font-title text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2'>
            <span className='h-4 w-1.5 bg-cyan-500 rounded-full'></span>
            特殊角色
          </h2>
          <div className='flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-150'>
            <Avatar seed='' size='lg' />
            <div>
              <h3 className='font-bold text-sm text-slate-800'>
                神秘訪客 (Mystery Visitor)
              </h3>
              <p className='text-xs text-slate-500 leading-normal mt-0.5'>
                當 `seed`
                為空或未初始化時顯示的預設頭像。使用柔和的灰色調與專屬表情符號圖示。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className='text-center pt-4'>
        <a
          href='/'
          className='inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs md:text-sm shadow-md transition-all active:scale-[0.98]'
        >
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2.5'
              d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
          </svg>
          返回 PagePeer 主頁面
        </a>
      </div>
    </div>
  )
}
