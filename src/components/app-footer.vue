<script setup lang="ts">
import { Bug, FileText, Github, Lightbulb } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

const ISSUES_URL = 'https://github.com/alwaisy/mainavoice-web/issues'
const NEW_BUG_URL = 'https://github.com/alwaisy/mainavoice-web/issues/new?labels=bug&title=%5BBug%5D%20'
const NEW_FEATURE_URL = 'https://github.com/alwaisy/mainavoice-web/issues/new?labels=enhancement&title=%5BFeature%5D%20'
</script>

<template>
  <footer class="shrink-0 z-20 border-t border-border bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/80 mb-14 sm:mb-0">
    <div class="mx-auto w-full max-w-[1020px] px-4 h-7 flex items-center justify-between gap-3 text-[11px] leading-none">
      <span class="text-muted-foreground truncate hidden sm:inline">© 2026 Maina Voice — by awais</span>
      <span class="text-muted-foreground sm:hidden">© 2026 Maina Voice</span>
      <nav class="flex items-center gap-2 sm:gap-3 shrink-0">
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
  </footer>
</template>
