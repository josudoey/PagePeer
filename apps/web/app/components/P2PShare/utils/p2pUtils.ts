/**
 * Utility to format bytes into a human-readable string.
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Utility to format transfer speed (e.g. MB/s).
 */
export const formatSpeed = (bytesPerSecond: number): string => {
  return formatBytes(bytesPerSecond, 1) + '/s'
}

/**
 * Helper to copy text to clipboard with fallback for non-secure contexts.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text)
      return true
    } else {
      // Fallback for non-secure contexts (e.g. HTTP over local network IP)
      const textArea = document.createElement('textarea')
      textArea.value = text
      // Position off-screen and set styling to prevent zoom/scrolling
      textArea.style.position = 'fixed'
      textArea.style.top = '-9999px'
      textArea.style.left = '-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      if (!successful) {
        throw new Error('execCommand copy was unsuccessful')
      }
      return true
    }
  } catch (err) {
    console.error('Failed to copy text: ', err)
    return false
  }
}
