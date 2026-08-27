<script setup lang="ts">
import { Mail, MessageSquare } from 'lucide-vue-next'

const SUPPORT_EMAIL = 'support@mainavoice.lat'
const ISSUES_URL = 'https://github.com/alwaisy/mainavoice-web/issues'
</script>

<template>
  <div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
    <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <MessageSquare class="w-5 h-5" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">
          Contact
        </h1>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        Have a question, bug report or feature idea? The fastest way to reach the maintainers is
        through the public issue tracker. For private questions, send an email.
      </p>

      <div class="grid gap-4 sm:grid-cols-2">
        <a
          :href="`mailto:${SUPPORT_EMAIL}`"
          class="group flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition"
        >
          <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-foreground">
              Email
            </h2>
            <p class="text-xs text-muted-foreground mt-1">
              {{ SUPPORT_EMAIL }}
            </p>
          </div>
        </a>

        <a
          :href="ISSUES_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="group flex items-start gap-4 rounded-xl border border-border bg-background p-4 hover:border-primary/50 transition"
        >
          <div class="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <MessageSquare class="w-4 h-4" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-foreground">
              GitHub Issues
            </h2>
            <p class="text-xs text-muted-foreground mt-1">
              Report bugs and request features
            </p>
          </div>
        </a>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        We typically respond to GitHub issues within a few days. If your question is about a specific
        transcription provider, make sure you include the model name, provider and a description of what
        went wrong.
      </p>
    </div>
  </div>
</template>
