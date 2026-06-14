import React from 'react'

export interface AvatarInfo {
  name: string
  bgColor: string
  icon: React.ReactNode
}

// 12 beautiful, vibrant background colors with high contrast for white icons
export const MACAROON_COLORS = [
  '#FF5E62', // Coral Sunset
  '#FF9F43', // Warm Amber
  '#E5A93B', // Golden Honey
  '#10B981', // Emerald Green
  '#2EC4B6', // Tiffany Teal
  '#00B4D8', // Ocean Cyan
  '#4361EE', // Ultramarine Blue
  '#6366F1', // Indigo
  '#8338EC', // Electric Violet
  '#B5179E', // Plum Violet
  '#F72585', // Neon Pink
  '#F43F5E' // Rose Red
]

// 12 creative adjectives for anonymous profiles
export const ADJECTIVES = [
  '溫柔的',
  '搞笑的',
  '神秘的',
  '活潑的',
  '害羞的',
  '聰明的',
  '勇敢的',
  '快樂的',
  '優雅的',
  '帥氣的',
  '呆萌的',
  '傲嬌的'
]

// 12 animal/fruit nouns (aligned with getAvatarIcon cases 0-11)
export const NOUNS = [
  '貓頭鷹', // 0: Owl
  '兔子', // 1: Rabbit
  '藍鯨', // 2: Whale
  '貓咪', // 3: Cat
  '無尾熊', // 4: Koala
  '狐狸', // 5: Fox
  '貓熊', // 6: Panda
  '企鵝', // 7: Penguin
  '柴犬', // 8: Shiba/Dog
  '青蛙', // 9: Frog
  '水蜜桃', // 10: Peach
  '酪梨' // 11: Avocado
]

// Hash a string to a positive number
export function djb2hash(str: string): number {
  let hash = 5381
  for (const char of str) {
    hash = (hash << 5) + hash + char.charCodeAt(0)
    hash |= 0
  }

  return hash >>> 0
}

// Get or generate a persistent avatar seed for this browser session
export function getAvatarSeed(): string {
  if (typeof window === 'undefined') return 'default'
  let seed = localStorage.getItem('pagepeer_avatar_seed')
  if (!seed) {
    seed = Math.random().toString(36).substring(2, 10)
    localStorage.setItem('pagepeer_avatar_seed', seed)
  }
  return seed
}

// Resolve avatar information based on seed
// Default fallback mystery visitor icon
export const MYSTERY_AVATAR_ICON = (
  <g
    fill='none'
    stroke='#94a3b8'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='12' r='9' />
    <path d='M8 14s1.5 2 4 2 4-2 4-2' />
    <circle cx='9' cy='9.5' r='1' fill='#94a3b8' />
    <circle cx='15' cy='9.5' r='1' fill='#94a3b8' />
  </g>
)

// Get the SVG path elements for the avatar icon based on index (0-11)
export function getAvatarIcon(iconIndex: number): React.ReactNode {
  switch (iconIndex) {
    case 0: // Owl
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 5C8 5 6 8 6 12c0 4.4 2.5 8 6 8s6-3.6 6-8c0-4-2-7-6-7z' />
          <circle cx='9.5' cy='11.5' r='1.5' strokeWidth={1.5} />
          <circle cx='14.5' cy='11.5' r='1.5' strokeWidth={1.5} />
          <path d='M12 13l-1 1.5h2z' fill='white' />
          <path d='M6 7l2 2' />
          <path d='M18 7l-2 2' />
        </g>
      )
    case 1: // Rabbit
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          {/* Symmetrical long Rabbit ears */}
          <path d='M9.5 9c-.5-3.5-1-6.5 .5-7.5s2 1.5 2 4.5v3' />
          <path d='M14.5 9c.5-3.5 1-6.5-.5-7.5s-2 1.5-2 4.5v3' />
          {/* Head */}
          <path d='M12 22a7 7 0 007-7c0-3.3-2.7-6-6-6H11c-3.3 0-6 2.7-6 6a7 7 0 007 7z' />
          {/* Cute Face */}
          <circle cx='9' cy='14' r='0.8' fill='white' stroke='none' />
          <circle cx='15' cy='14' r='0.8' fill='white' stroke='none' />
          <path d='M12 15.5v1.5' />
          <path d='M10.5 17c.5.6 2.5.6 3 0' stroke='white' strokeWidth='1.5' />
        </g>
      )
    case 2: // Whale
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M2 17c0-4.5 4-8 10-8 5 0 8 3 8 5.5 0 2-1.5 3.5-3.5 3.5H9c-3 0-5 2-7 2z' />
          <path d='M20 14.5c1.5-1 3-3 3-3s-1.5 3-1.5 4.5S23 19 23 19s-1.5-2-3-3z' />
          <path d='M12 9c0-2-1-3-2.5-3' />
          <path d='M12 9c0-2 1-3 2.5-3' />
          <circle cx='7.5' cy='13.5' r='0.8' fill='white' stroke='none' />
        </g>
      )
    case 3: // Cat
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          {/* Head & Ears */}
          <path d='M12 21a8 8 0 008-8c0-3.5-2.5-6-8-6s-8 2.5-8 6a8 8 0 008 8z' />
          <path d='M5 8.5L4 3.5l4.5 2' />
          <path d='M19 8.5L20 3.5l-4.5 2' />
          {/* Big Eyes */}
          <circle cx='8.5' cy='12' r='1.2' fill='white' stroke='none' />
          <circle cx='15.5' cy='12' r='1.2' fill='white' stroke='none' />
          {/* Nose & Vertical Mouth */}
          <path d='M12 13.5l-.8-.8h1.6z' fill='white' />
          <path d='M12 13.5v2.5' />
          {/* 3 Fanned Whiskers on Left */}
          <path d='M6 11.5l-4-1' />
          <path d='M5.5 13.5h-4.5' />
          <path d='M6 15.5l-4 1' />
          {/* 3 Fanned Whiskers on Right */}
          <path d='M18 11.5l4-1' />
          <path d='M18.5 13.5h4.5' />
          <path d='M18 15.5l4 1' />
        </g>
      )
    case 4: // Koala
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 20a6 6 0 006-6c0-3-2-5-6-5s-6 2-6 5a6 6 0 006 6z' />
          <path d='M6 11c-2 0-3.5-1.5-3.5-3.5S4 4 6 4a5 5 0 012.5 1' />
          <path d='M18 11c2 0 3.5-1.5 3.5-3.5S20 4 18 4a5 5 0 00-2.5 1' />
          <circle cx='9' cy='12.5' r='0.8' fill='white' stroke='none' />
          <circle cx='15' cy='12.5' r='0.8' fill='white' stroke='none' />
          <rect
            x='10.5'
            y='13.5'
            width='3'
            height='4'
            rx='1.5'
            fill='white'
            stroke='none'
          />
        </g>
      )
    case 5: // Fox
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          {/* Head Outline */}
          <path d='M12 8c-4 0-7.5 2.5-7.5 6 0 2 1 3.5 2.5 5l5 2 5-2c1.5-1.5 2.5-3 2.5-5 0-3.5-3.5-6-7.5-6z' />
          {/* Ears */}
          <path d='M5 11l-2-6 5.5 3' />
          <path d='M19 11l2-6-5.5 3' />
          {/* Cheek Fur Lines */}
          <path d='M4.5 14c2.5 2 5 5 7.5 7c2.5-2 5-5 7.5-7' />
          {/* Cute Face */}
          <circle cx='8.5' cy='12.5' r='0.8' fill='white' stroke='none' />
          <circle cx='15.5' cy='12.5' r='0.8' fill='white' stroke='none' />
          <path d='M12 18.5l-.8-.8h1.6z' fill='white' />
        </g>
      )
    case 6: // Panda
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 21a7.5 7.5 0 007.5-7.5c0-4-3-6.5-7.5-6.5S4.5 9.5 4.5 13.5A7.5 7.5 0 0012 21z' />
          <circle cx='6' cy='8' r='2' fill='white' stroke='none' />
          <circle cx='18' cy='8' r='2' fill='white' stroke='none' />
          <circle cx='9' cy='13.5' r='1.5' fill='white' stroke='none' />
          <circle cx='15' cy='13.5' r='1.5' fill='white' stroke='none' />
          <circle cx='9' cy='13.5' r='0.6' fill='#475569' stroke='none' />
          <circle cx='15' cy='13.5' r='0.6' fill='#475569' stroke='none' />
          <path d='M12 15.5l-.6-.6h1.2z' fill='white' />
          <path d='M10.5 17c.5.5 2.5.5 3 0' stroke='white' strokeWidth='1.5' />
        </g>
      )
    case 7: // Penguin
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 22c4 0 6.5-3.5 6.5-9s-2-10-6.5-10-6.5 4.5-6.5 10 2.5 9 6.5 9z' />
          <path d='M12 22c2.5 0 4-2.5 4-7.5S14.5 8 12 8s-4 1.5-4 6.5 1.5 7.5 4 7.5z' />
          <circle cx='10' cy='10.5' r='0.8' fill='white' stroke='none' />
          <circle cx='14' cy='10.5' r='0.8' fill='white' stroke='none' />
          <path d='M12 12l-1.5-1h3z' fill='white' />
        </g>
      )
    case 8: // Shiba/Dog
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          {/* Chubby head outline */}
          <path d='M12 8.5C7.5 8.5 5 10.5 5 14C5 18.5 8.5 21 12 21C15.5 21 19 18.5 19 14C19 10.5 16.5 8.5 12 8.5z' />
          {/* Ears */}
          <path d='M5.5 10.5L3.5 5.5L8.5 7.5' />
          <path d='M18.5 10.5L20.5 5.5L15.5 7.5' />
          {/* Shiba Eyebrows (Spots) */}
          <circle cx='8.5' cy='11.5' r='0.8' fill='white' stroke='none' />
          <circle cx='15.5' cy='11.5' r='0.8' fill='white' stroke='none' />
          {/* Eyes */}
          <circle cx='8.5' cy='14' r='1.2' fill='white' stroke='none' />
          <circle cx='15.5' cy='14' r='1.2' fill='white' stroke='none' />
          {/* Snout Circle */}
          <circle cx='12' cy='17' r='2.8' />
          {/* Nose & Mouth */}
          <path d='M12 15.6l-.8-.8h1.6z' fill='white' />
          <path d='M12 15.6v1.4' />
          <path d='M10.5 17c.5.5 1 .5 1.5 0c.5.5 1 .5 1.5 0' />
        </g>
      )
    case 9: // Frog
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 21c4.5 0 8-3.5 8-7.5s-2.5-5.5-8-5.5-8 1.5-8 5.5 3.5 7.5 8 7.5z' />
          <circle cx='8' cy='8' r='2.2' />
          <circle cx='16' cy='8' r='2.2' />
          <circle cx='8' cy='8' r='0.8' fill='white' stroke='none' />
          <circle cx='16' cy='8' r='0.8' fill='white' stroke='none' />
          <path d='M8 15.5c1 1.5 3 2.5 4 2.5s3-1 4-2.5' />
        </g>
      )
    case 10: // Peach
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          {/* Leaves under the peach */}
          <path d='M11 19.5c-3 1.5-5.5 1-7-.5 1.5-1 4-.5 7 1z' fill='white' />
          <path d='M13 19.5c3 1.5 5.5 1 7-.5-1.5-1-4-.5-7 1z' fill='white' />
          {/* Plump Peach body */}
          <path d='M12 5.5C6 5.5 3.5 9 3.5 13c0 4.5 3.5 6.5 8.5 6.5s8.5-2 8.5-6.5c0-4-2.5-7.5-8.5-7.5z' />
          {/* Curved cleft line */}
          <path d='M12 5.5c2 1 2.5 5 1.5 10' />
          {/* Stem */}
          <path d='M12 5.5c-0.5-1.5-1.5-2.5-3-3' />
          {/* Face */}
          <circle cx='8' cy='12.5' r='0.8' fill='white' stroke='none' />
          <circle cx='16' cy='12.5' r='0.8' fill='white' stroke='none' />
          <path d='M10.5 15c.5.8 2.5.8 3 0' stroke='white' strokeWidth='1.5' />
        </g>
      )
    case 11: // Avocado
    default:
      return (
        <g
          stroke='white'
          strokeWidth={2}
          strokeLinecap='round'
          strokeLinejoin='round'
          fill='none'
        >
          <path d='M12 2.5C9.5 2.5 7 5.5 7 9.5c0 4.5 2 11 5 11s5-6.5 5-11c0-4-2.5-7-5-7z' />
          <circle cx='12' cy='14' r='2.5' fill='white' stroke='none' />
          <circle cx='10.5' cy='9.5' r='0.8' fill='white' stroke='none' />
          <circle cx='13.5' cy='9.5' r='0.8' fill='white' stroke='none' />
          <path d='M11.5 11c.3.3.7.3 1 0' stroke='white' strokeWidth='1.2' />
        </g>
      )
  }
}

// Resolve avatar information based on seed
export function getAvatarInfo(seed: string): AvatarInfo {
  if (!seed) {
    return {
      name: '神秘訪客',
      bgColor: '#E2E8F0',
      icon: MYSTERY_AVATAR_ICON
    }
  }

  const hash = djb2hash(seed)
  const colorIndex = hash % MACAROON_COLORS.length
  const nounIndex = djb2hash(seed.repeat(3)) % NOUNS.length
  const iconIndex = nounIndex
  const adjIndex = djb2hash(seed.repeat(5)) % ADJECTIVES.length

  const name = `${ADJECTIVES[adjIndex]}${NOUNS[nounIndex]}`
  const bgColor = MACAROON_COLORS[colorIndex]
  const icon = getAvatarIcon(iconIndex)

  return {
    name,
    bgColor,
    icon
  }
}
