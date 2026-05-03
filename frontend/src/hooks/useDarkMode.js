import { useEffect, useState } from 'react'

/**
 * useDarkMode
 * - Reads user preference from localStorage on mount
 * - Falls back to system preference (prefers-color-scheme) if no saved value
 * - Writes 'dark' | 'light' to localStorage on every toggle
 * - Applies data-theme="dark" | "light" to <html> so CSS variables take effect globally
 */
const useDarkMode = () => {
  const getInitialTheme = () => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }

  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))

  return { theme, toggleTheme }
}

export default useDarkMode