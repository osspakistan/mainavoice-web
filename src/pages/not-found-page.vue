<script setup lang="ts">
import { FileText, Home, Map } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="max-w-[714px] mx-auto py-16 animate-in fade-in-50 duration-300">
    <div class="rounded-2xl border border-border bg-card p-10 text-center shadow-xs space-y-5">
      <h1 class="text-4xl font-bold text-foreground">
        404 // Not found
      </h1>

      <p class="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
        We couldn't find this page. Agents and humans can use
        <a href="/llms.txt" class="inline-flex items-center gap-1 underline hover:text-foreground">
          <FileText class="w-3.5 h-3.5" /> /llms.txt
        </a>
        or
        <a href="/sitemap.xml" class="inline-flex items-center gap-1 underline hover:text-foreground">
          <Map class="w-3.5 h-3.5" /> /sitemap.xml
        </a>
        to find what they need.
      </p>

      <button
        class="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition cursor-pointer"
        @click="router.push('/')"
      >
        <Home class="w-4 h-4" />
        Go home
      </button>
    </div>
  </div>
</template>
