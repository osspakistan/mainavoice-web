import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './app.vue'
import router from './router'
import './assets/css/base.css'

// Theme is applied pre-paint by an inline script in index.html to avoid a
// flash of the wrong colour scheme. Nothing to do here.

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')

// Register the PWA service worker after the app is interactive so it does not
// compete with hydration for main-thread time (lowers Total Blocking Time).
function registerServiceWorker() {
  import('virtual:pwa-register')
    .then(({ registerSW }) => registerSW({ immediate: true }))
    .catch(() => {})
}
const win = window as Window & { requestIdleCallback?: (cb: () => void) => void }
if (typeof win.requestIdleCallback === 'function')
  win.requestIdleCallback(registerServiceWorker)
else
  win.addEventListener('load', registerServiceWorker)
