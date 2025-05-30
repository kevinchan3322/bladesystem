import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import { useMainStore } from '@/stores/main.js'
import GAuth from 'vue-google-oauth2'

import './css/main.css'

// Init Pinia
const pinia = createPinia()

// Google OAuth Configuration
const gauthOption = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  scope: 'email profile',
  prompt: 'select_account'
}

// Create Vue app
const app = createApp(App)
app.use(router)
   .use(pinia)
   .use(ElementPlus)
   .use(GAuth, gauthOption)
   .mount('#app')

// Init main store
const mainStore = useMainStore(pinia)

// Fetch sample data
mainStore.fetchSampleClients()
mainStore.fetchSampleHistory()

// Dark mode
// Uncomment, if you'd like to restore persisted darkMode setting, or use `prefers-color-scheme: dark`. Make sure to uncomment localStorage block in src/stores/darkMode.js
// import { useDarkModeStore } from './stores/darkMode'

// const darkModeStore = useDarkModeStore(pinia)

// if (
//   (!localStorage['darkMode'] && window.matchMedia('(prefers-color-scheme: dark)').matches) ||
//   localStorage['darkMode'] === '1'
// ) {
//   darkModeStore.set(true)
// }

// Default title tag
const defaultDocumentTitle = ''

// Set document title from route meta
router.afterEach((to) => {
  document.title = to.meta?.title ? `${to.meta.title}` : defaultDocumentTitle
})
