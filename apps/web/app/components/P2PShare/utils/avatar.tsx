import React from 'react'

export interface AvatarInfo {
  name: string
  bgColor: string
  icon: React.ReactNode
}

// 12 beautiful macaroon background colors
export const MACAROON_COLORS = [
  '#FFB7B2', // Peach Rose
  '#FFDAC1', // Apricot Orange
  '#FFE5D9', // Melon Peach
  '#FFF5BA', // Lemon Chiffon
  '#E2F0CB', // Mint Green
  '#B5EAD7', // Soft Sage
  '#C7CEEA', // Lavender Blue
  '#E8D7FF', // Lilac Purple
  '#FFC6FF', // Bubblegum Pink
  '#BFFCC6', // Pastel Mint
  '#A7EEFF', // Soft Ice Blue
  '#FCD5CE'  // Powder Pink
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

// 12 animal/fruit nouns
export const NOUNS = [
  '藍鯨',
  '樹懶',
  '貓熊',
  '企鵝',
  '兔子',
  '水蜜桃',
  '草莓',
  '無尾熊',
  '狐狸',
  '貓頭鷹',
  '柴犬',
  '酪梨'
]

// Hash a string to a positive number
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
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
export function getAvatarInfo(seed: string): AvatarInfo {
  if (!seed) {
    return {
      name: '神秘訪客',
      bgColor: '#E2E8F0',
      icon: (
        <g fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <circle cx="9" cy="9.5" r="1" fill="#94a3b8" />
          <circle cx="15" cy="9.5" r="1" fill="#94a3b8" />
        </g>
      )
    }
  }

  const hash = hashString(seed)
  const colorIndex = hash % MACAROON_COLORS.length
  const adjIndex = Math.floor(hash / 4) % ADJECTIVES.length
  const nounIndex = Math.floor(hash / 16) % NOUNS.length
  const iconIndex = Math.floor(hash / 64) % 12 // 12 animals

  const name = `${ADJECTIVES[adjIndex]}${NOUNS[nounIndex]}`
  const bgColor = MACAROON_COLORS[colorIndex]

  // Beautiful white outline SVG icons
  let icon: React.ReactNode

  switch (iconIndex) {
    case 0: // Owl
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 2C8 2 6 5 6 9c0 4.4 2.5 8 6 8s6-3.6 6-8c0-4-2-7-6-7z" />
          <circle cx="9.5" cy="8.5" r="1.5" strokeWidth={1.5} />
          <circle cx="14.5" cy="8.5" r="1.5" strokeWidth={1.5} />
          <path d="M12 10l-1 1.5h2z" fill="white" />
          <path d="M6 4l2 2" />
          <path d="M18 4l-2 2" />
        </g>
      )
      break
    case 1: // Rabbit
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M9 7c-1-3.5-2-5-3-5s-1.5 1.5-1.5 4v3" />
          <path d="M15 7c1-3.5 2-5 3-5s1.5 1.5 1.5 4v3" />
          <path d="M12 22a7 7 0 007-7c0-3.3-2.7-6-6-6H11c-3.3 0-6 2.7-6 6a7 7 0 007 7z" />
          <path d="M12 14l-.8-.8h1.6z" fill="white" />
        </g>
      )
      break
    case 2: // Whale
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M2 14c0-4.5 4-8 10-8 5 0 8 3 8 5.5 0 2-1.5 3.5-3.5 3.5H9c-3 0-5 2-7 2z" />
          <path d="M20 11.5c1.5-1 3-3 3-3s-1.5 3-1.5 4.5S23 16 23 16s-1.5-2-3-3z" />
          <path d="M12 6c0-2-1-3-2.5-3" />
          <path d="M12 6c0-2 1-3 2.5-3" />
        </g>
      )
      break
    case 3: // Cat
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21a8 8 0 008-8c0-3.5-2.5-6-8-6s-8 2.5-8 6a8 8 0 008 8z" />
          <path d="M5 8.5L4 3.5l4.5 2" />
          <path d="M19 8.5L20 3.5l-4.5 2" />
          <path d="M12 13.5l-.8-.8h1.6z" fill="white" />
          <path d="M10 16c.5.5 1.5.5 2 0" />
        </g>
      )
      break
    case 4: // Koala
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 20a6 6 0 006-6c0-3-2-5-6-5s-6 2-6 5a6 6 0 006 6z" />
          <path d="M6 11c-2 0-3.5-1.5-3.5-3.5S4 4 6 4a5 5 0 012.5 1" />
          <path d="M18 11c2 0 3.5-1.5 3.5-3.5S20 4 18 4a5 5 0 00-2.5 1" />
          <rect x="10.5" y="12.5" width="3" height="4" rx="1.5" fill="white" stroke="none" />
        </g>
      )
      break
    case 5: // Fox
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21l-5-5h10l-5 5z" />
          <path d="M12 8c-4.4 0-8 3-8 6.5 0 1.5.7 3 2 4.5l1-5h10l1 5c1.3-1.5 2-3 2-4.5C20 11 16.4 8 12 8z" />
          <path d="M4 12.5L3.5 6 9 9.5" />
          <path d="M20 12.5L20.5 6 15 9.5" />
        </g>
      )
      break
    case 6: // Panda
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21a7.5 7.5 0 007.5-7.5c0-4-3-6.5-7.5-6.5S4.5 9.5 4.5 13.5A7.5 7.5 0 0012 21z" />
          <circle cx="6" cy="8" r="2" fill="white" stroke="none" />
          <circle cx="18" cy="8" r="2" fill="white" stroke="none" />
          <circle cx="9" cy="13.5" r="1.5" fill="white" stroke="none" />
          <circle cx="15" cy="13.5" r="1.5" fill="white" stroke="none" />
        </g>
      )
      break
    case 7: // Penguin
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 22c4 0 6.5-3.5 6.5-9s-2-10-6.5-10-6.5 4.5-6.5 10 2.5 9 6.5 9z" />
          <path d="M12 22c2.5 0 4-2.5 4-7.5S14.5 8 12 8s-4 1.5-4 6.5 1.5 7.5 4 7.5z" />
          <path d="M12 11l-1.5-1h3z" fill="white" />
        </g>
      )
      break
    case 8: // Shiba/Dog
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21c4.5 0 7-3.5 7-7s-2.5-6-7-6-7 2.5-7 6 2.5 7 7 7z" />
          <path d="M5.5 9.5L4 4.5l4.5 2" />
          <path d="M18.5 9.5L20 4.5l-4.5 2" />
          <circle cx="12" cy="14" r="1" fill="white" stroke="none" />
          <path d="M10.5 16.5c.5.5 2.5.5 3 0" />
        </g>
      )
      break
    case 9: // Frog
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21c4.5 0 8-3.5 8-7.5s-2.5-5.5-8-5.5-8 1.5-8 5.5 3.5 7.5 8 7.5z" />
          <circle cx="8" cy="8" r="2.2" />
          <circle cx="16" cy="8" r="2.2" />
          <path d="M8 15.5c1 1.5 3 2.5 4 2.5s3-1 4-2.5" />
        </g>
      )
      break
    case 10: // Peach
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 21.5c-5-2-9-5.5-9-10.5 0-3.5 2.5-6 6-6 2.5 0 4.5 1.5 5 3.5.5-2 2.5-3.5 5-3.5 3.5 0 6 2.5 6 6 0 5-4 8.5-9 10.5z" />
          <path d="M12 5c0-1.5 1-2.5 2-3" />
          <path d="M12 5c-1-1-2-1.2-3.5-.8" />
        </g>
      )
      break
    case 11: // Avocado
    default:
      icon = (
        <g stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M12 2.5C9.5 2.5 7 5.5 7 9.5c0 4.5 2 11 5 11s5-6.5 5-11c0-4-2.5-7-5-7z" />
          <circle cx="12" cy="14" r="2.5" fill="white" stroke="none" />
          <path d="M12 4.5c-1.5 0-3 2-3 4.5c0 2.5 1.5 8 3 8s3-5.5 3-8c0-2.5-1.5-4.5-3-4.5z" strokeWidth={1} strokeDasharray="2,2" />
        </g>
      )
      break
  }

  return {
    name,
    bgColor,
    icon
  }
}
