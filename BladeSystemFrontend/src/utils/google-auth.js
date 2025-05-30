export const initGoogleAuth = () => {
  return new Promise((resolve, reject) => {
    try {
      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/platform.js'
      script.async = true
      script.defer = true
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2
            .init({
              client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
              scope: 'email profile'
            })
            .then(() => resolve())
            .catch(err => reject(err))
        })
      }
      script.onerror = (err) => reject(err)
      document.head.appendChild(script)
    } catch (err) {
      reject(err)
    }
  })
} 