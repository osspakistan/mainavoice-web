<script setup lang="ts">
import { ShieldCheck } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
    <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <ShieldCheck class="w-5 h-5" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">
          Privacy Policy
        </h1>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        Maina Voice is designed so your voice and transcripts stay under your control. There is no
        account system, no analytics beacon and no first-party backend that stores your data.
      </p>

      <div class="space-y-4">
        <div class="rounded-xl border border-border bg-background p-4">
          <h2 class="text-sm font-bold text-foreground mb-2">
            What stays on your device
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Every audio recording, WAV blob, generated transcript, translation, comparison result and
            application setting is stored in the IndexedDB inside your own browser. We cannot access it,
            sell it or lose it in a server breach because we never receive it.
          </p>
        </div>

        <div class="rounded-xl border border-border bg-background p-4">
          <h2 class="text-sm font-bold text-foreground mb-2">
            What leaves your device
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            The only network request happens when you choose to transcribe. Your audio file is POSTed
            directly from your browser to the speech provider you selected — currently OpenRouter or Groq
            — using your own API key. Maina Voice does not proxy, log or store that audio. The provider's
            privacy policy applies to that single request.
          </p>
        </div>

        <div class="rounded-xl border border-border bg-background p-4">
          <h2 class="text-sm font-bold text-foreground mb-2">
            Backups and exports
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            You can export your full history and recordings as a ZIP archive from the Settings page at
            any time. That archive is generated locally in your browser and saved to your local disk.
          </p>
        </div>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        If you want your data gone, clear your browser storage for mainavoice.lat. For questions,
        reach out through the contact page or open a
        <a
          href="https://github.com/alwaisy/mainavoice-web/issues"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-foreground"
        >GitHub issue</a>.
      </p>
    </div>
  </div>
</template>
