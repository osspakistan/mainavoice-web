<script setup lang="ts">
import { Bug, FileText, Github, Lightbulb } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const ISSUES_URL = 'https://github.com/alwaisy/mainavoice-web/issues'
const NEW_BUG_URL = 'https://github.com/alwaisy/mainavoice-web/issues/new?labels=bug&title=%5BBug%5D%20'
const NEW_FEATURE_URL = 'https://github.com/alwaisy/mainavoice-web/issues/new?labels=enhancement&title=%5BFeature%5D%20'
</script>

<template>
  <footer class="shrink-0 z-20 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85 mb-14 sm:mb-0">
    <div class="mx-auto w-full max-w-[1020px] px-4 py-3 sm:py-4 space-y-3">
      <!-- Top Row: Launch Badges & Trust Marks -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div class="flex items-center gap-3">
          <!-- SubmitForBacklinks Verified Badge -->
          <a href="https://submitforbacklinks.com/product/maina-voice?utm_source=badge&utm_medium=embed&utm_campaign=maina-voice&ref=submitforbacklinks" target="_blank" rel="noopener" data-s4b-token="yAF_V67a1bzbr6XO8vvLyVP3" data-s4b-theme="dark" class="inline-block transition-opacity hover:opacity-90"><img src="https://submitforbacklinks.com/api/badge/yAF_V67a1bzbr6XO8vvLyVP3.svg?variant=verified&theme=dark" alt="Maina Voice — Verified on SubmitForBacklinks" width="220" height="48" loading="lazy" class="h-9 w-auto"></a>
        </div>

        <div class="text-[11px] text-muted-foreground flex items-center gap-2">
          <span>AI Speech Transcription &amp; Engine Benchmarking</span>
        </div>
      </div>

      <!-- Bottom Row: Copyright & Navigation Links -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] leading-none">
        <span class="text-muted-foreground truncate hidden sm:inline">© 2026 Maina Voice — by awais</span>
        <span class="text-muted-foreground sm:hidden">© 2026 Maina Voice</span>
        <nav class="flex items-center flex-wrap justify-center gap-2 sm:gap-3 shrink-0">
          <a :href="NEW_BUG_URL" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Bug class="w-3 h-3" />
            Found an issue?
          </a>
          <span class="text-border">·</span>
          <a :href="NEW_FEATURE_URL" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Lightbulb class="w-3 h-3" />
            Request feature
          </a>
          <span class="text-border hidden sm:inline">·</span>
          <a :href="ISSUES_URL" target="_blank" rel="noopener noreferrer" class="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <Github class="w-3 h-3" />
            Issues
          </a>

          <span class="text-border hidden sm:inline">·</span>

          <RouterLink
            to="/about"
            class="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          >
            About
          </RouterLink>

          <span class="text-border hidden sm:inline">·</span>

          <RouterLink
            to="/privacy"
            class="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          >
            Privacy
          </RouterLink>

          <span class="text-border hidden sm:inline">·</span>

          <RouterLink
            to="/contact"
            class="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          >
            Contact
          </RouterLink>

          <span class="text-border hidden sm:inline">·</span>

          <a href="/llms.txt" class="hidden sm:inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition">
            <FileText class="w-3 h-3" />
            llms.txt
          </a>
        </nav>
      </div>
    </div>
  </footer>
</template>
