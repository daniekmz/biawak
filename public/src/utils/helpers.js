// src/utils/helpers.js
const helpers = {
    // Escape HTML untuk mencegah XSS
    escapeHtml(text) {
      if (!text) return ''
      const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }
      return text.toString().replace(/[&<>"']/g, m => map[m])
    },
  
    // Format tanggal Indonesia
    formatDate(dateString) {
      if (!dateString) return ''
      
      try {
        const date = new Date(dateString)
        return new Intl.DateTimeFormat('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Jakarta'
        }).format(date)
      } catch (error) {
        console.error('Date formatting error:', error)
        return dateString
      }
    },
  
    // Throttle function untuk performance
    throttle(func, wait) {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    },
  
    // Debounce function
    debounce(func, wait, immediate) {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          timeout = null
          if (!immediate) func(...args)
        }
        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func(...args)
      }
    },
  
    // Validasi email
    isValidEmail(email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    },
  
    // Generate random ID
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2)
    },
  
    // Copy to clipboard
    async copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch (error) {
        console.error('Copy failed:', error)
        return false
      }
    }
  }
  
  // Make available globally
  window.helpers = helpers
  
  export default helpers