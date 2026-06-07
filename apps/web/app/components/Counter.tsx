import React, { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div className='flex flex-col items-center justify-center p-8 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-300 hover:shadow-cyan-500/10 hover:border-cyan-500/30 group'>
      <div className='text-sm font-medium tracking-widest text-cyan-400 uppercase mb-2'>
        React Component
      </div>
      <h3 className='text-2xl font-bold text-white mb-6'>Dynamic Counter</h3>

      <div className='flex items-center gap-8 mb-6'>
        <button
          onClick={() => setCount((prev) => Math.max(0, prev - 1))}
          className='w-12 h-12 flex items-center justify-center rounded-full bg-slate-800 text-slate-300 font-semibold text-xl border border-slate-700 hover:bg-slate-700 hover:text-white hover:border-cyan-500 active:scale-95 transition-all duration-200'
          aria-label='Decrease count'
        >
          -
        </button>

        <span className='text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 min-w-[3ch] text-center select-none drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]'>
          {count}
        </span>

        <button
          onClick={() => setCount((prev) => prev + 1)}
          className='w-12 h-12 flex items-center justify-center rounded-full bg-cyan-500 text-slate-950 font-bold text-xl hover:bg-cyan-400 active:scale-95 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-400/40 transition-all duration-200'
          aria-label='Increase count'
        >
          +
        </button>
      </div>

      <p className='text-xs text-slate-400'>
        Interactive React hydration with{' '}
        <code className='text-cyan-300'>client:load</code>
      </p>
    </div>
  )
}
