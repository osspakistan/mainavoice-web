<script setup lang="ts">
import { onMounted } from 'vue'
import AppFooter from '@/components/app-footer.vue'
import DesktopHeader from '@/components/desktop-header.vue'
import MobileBottomNav from '@/components/mobile-bottom-nav.vue'

const BOOT_SPLASH_MIN_MS = 1200

onMounted(() => {
  // The static boot splash in index.html painted before JS ran. Keep it visible
  // for a minimum amount of time (for UX / loading vibe) and then fade it out.
  setTimeout(() => {
    requestAnimationFrame(() => {
      const el = document.getElementById('boot-splash')
      if (!el)
        return
      el.style.transition = 'opacity 250ms ease'
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 250)
    })
  }, BOOT_SPLASH_MIN_MS)
})
</script>

<template>
  <div class="h-screen flex flex-col bg-background text-foreground font-sans selection:bg-muted antialiased overflow-hidden relative">
    <DesktopHeader class="shrink-0 z-30" />

    <main class="flex-1 overflow-y-auto px-4 pt-6 pb-6 sm:pb-6">
      <div class="max-w-[1020px] mx-auto space-y-6">
        <router-view />
      </div>
    </main>

    <AppFooter />

    <MobileBottomNav />
  </div>
</template>
