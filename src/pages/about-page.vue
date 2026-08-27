<script setup lang="ts">
import { Info, Mic, Shield, Zap } from 'lucide-vue-next'
</script>

<template>
  <div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 duration-300">
    <div class="rounded-2xl border border-border bg-card p-8 shadow-xs space-y-6">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
          <Info class="w-5 h-5" />
        </div>
        <h1 class="text-2xl font-bold text-foreground">
          About Maina Voice
        </h1>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        Maina Voice is a local-first, browser-based speech-to-text workbench. We built it for people who
        want to dictate, transcribe and benchmark cloud voice models without handing every recording to a
        third-party product server. All recordings, audio blobs, transcript versions and settings live in
        your browser's IndexedDB. The only network call is the one you choose to make — from your
        browser directly to OpenRouter or Groq using your own API key.
      </p>

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="rounded-xl border border-border bg-background p-4 space-y-2">
          <Mic class="w-5 h-5 text-primary" />
          <h2 class="text-sm font-bold text-foreground">
            Dictate & transcribe
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Record from your microphone or upload an existing audio file. Audio is normalised to WAV and
            sent straight to the provider you pick.
          </p>
        </div>

        <div class="rounded-xl border border-border bg-background p-4 space-y-2">
          <Zap class="w-5 h-5 text-primary" />
          <h2 class="text-sm font-bold text-foreground">
            Benchmark engines
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Run the same clip through OpenAI, Deepgram, NVIDIA, Fish Audio and Groq Whisper to compare
            speed, cost and quality side by side.
          </p>
        </div>

        <div class="rounded-xl border border-border bg-background p-4 space-y-2">
          <Shield class="w-5 h-5 text-primary" />
          <h2 class="text-sm font-bold text-foreground">
            Stay private
          </h2>
          <p class="text-xs text-muted-foreground leading-relaxed">
            Your data never touches our servers. Export or import everything as a ZIP backup whenever you
            want.
          </p>
        </div>
      </div>

      <p class="text-sm text-muted-foreground leading-relaxed">
        Maina Voice is open source under the MIT license and is maintained by Awais Alwaisy. The source
        code, changelog and issue tracker live on
        <a
          href="https://github.com/alwaisy/mainavoice-web"
          target="_blank"
          rel="noopener noreferrer"
          class="underline hover:text-foreground"
        >GitHub</a>.
      </p>
    </div>
  </div>
</template>
