<script setup lang="ts">
import type { TranscriptionVersion } from '@/stores/maina-store'
import { AlertCircle, Check, Copy, Mic, Square, Trophy, Upload, Zap } from 'lucide-vue-next'
import { computed, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSortedModels, transcribeAudio, translateToEnglish } from '@/services/transcription-service'
import { autoTransliterateIfUrduRegion } from '@/services/transliteration-service'
import { useMainaStore } from '@/stores/maina-store'

const store = useMainaStore()
const sortedModels = computed(() => getSortedModels(store.selectedModel))

// Model slots count (2, 3, 4, or 5)
const modelCount = ref<2 | 3 | 4 | 5>(5)

// Selected models for up to 5 comparison workbenches (initialized with sorted models)
const selectedModels = ref<string[]>([
  sortedModels.value[0]?.id || 'fish-audio/transcribe-1',
  sortedModels.value[1]?.id || 'openai/gpt-transcribe',
  sortedModels.value[2]?.id || 'google/gemini-3.5-transcribe-preview',
  sortedModels.value[3]?.id || 'groq/whisper-large-v3-turbo',
  sortedModels.value[4]?.id || 'deepgram/nova-3',
])

// Results array for up to 5 models
const results = ref<(TranscriptionVersion | null)[]>([null, null, null, null, null])
const copiedStates = ref<boolean[]>([false, false, false, false, false])
const activeTabs = ref<('original' | 'english')[]>(['original', 'original', 'original', 'original', 'original'])
const translatingSlots = ref<boolean[]>([false, false, false, false, false])

async function translateSlot(index: number) {
  const res = results.value[index]
  if (!res || !res.text || translatingSlots.value[index])
    return
  translatingSlots.value[index] = true
  try {
    const translated = await translateToEnglish(res.text, store.openRouterApiKey)
    res.translatedText = translated
    activeTabs.value[index] = 'english'
  }
  finally {
    translatingSlots.value[index] = false
  }
}

const isRecording = ref(false)
const isProcessing = ref(false)
const recordSeconds = ref(0)
const micError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

let timer: number | null = null
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []

function startTimer() {
  recordSeconds.value = 0
  timer = window.setInterval(() => {
    recordSeconds.value++
  }, 1000)
}

function stopTimer() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

async function getMicrophoneStream() {
  try {
    return await navigator.mediaDevices.getUserMedia({ audio: true })
  }
  catch (e1) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })
    }
    catch {
      throw e1
    }
  }
}

// Compute the fastest model index among valid non-errored results
const fastestIndex = computed(() => {
  let minMs = Number.POSITIVE_INFINITY
  let bestIdx = -1

  for (let i = 0; i < modelCount.value; i++) {
    const res = results.value[i]
    const isError = !res || !res.text || res.text.startsWith('Transcription Error') || res.text.startsWith('OpenRouter Error') || res.text.startsWith('Please set')
    if (res && !isError && res.latencyMs > 0 && res.latencyMs < minMs) {
      minMs = res.latencyMs
      bestIdx = i
    }
  }
  return bestIdx
})

async function toggleBenchmarkRecording() {
  micError.value = null
  if (isRecording.value) {
    stopTimer()
    isRecording.value = false
    isProcessing.value = true

    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop()
    }
  }
  else {
    try {
      const stream = await getMicrophoneStream()
      audioChunks = []
      mediaRecorder = new MediaRecorder(stream)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0)
          audioChunks.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder?.mimeType || 'audio/webm'
        const audioBlob = new Blob(audioChunks, { type: mimeType })
        const duration = Math.max(recordSeconds.value, 1)

        // Initialize empty slot results
        results.value = [null, null, null, null, null]
        isProcessing.value = true

        // Stream transcription in parallel for active slots
        const activePromises = []
        for (let i = 0; i < modelCount.value; i++) {
          const modelId = selectedModels.value[i] || 'openai/gpt-transcribe'
          const slotTask = (async (slotIndex: number) => {
            const res = await transcribeAudio(
              audioBlob,
              modelId,
              store.openRouterApiKey,
              duration,
              store.groqApiKey,
              store.geminiApiKey,
            )

            if (store.autoTranslateCompare && res && res.text && !res.text.startsWith('Transcription Error') && !res.text.startsWith('OpenRouter Error') && !res.text.startsWith('Please set')) {
              try {
                res.translatedText = await translateToEnglish(res.text, store.openRouterApiKey)
                activeTabs.value[slotIndex] = 'english'
              }
              catch {}
            }

            // Immediately display this slot's result as soon as it arrives!
            results.value[slotIndex] = res
            return res
          })(i)

          activePromises.push(slotTask)
        }

        const resList = await Promise.all(activePromises)
        isProcessing.value = false

        const activeVersions = resList.filter((r): r is TranscriptionVersion => r !== null && r !== undefined)
        if (activeVersions.length > 0) {
          await store.saveComparisonSuite(audioBlob, activeVersions, fastestIndex.value)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      startTimer()
      isRecording.value = true
      results.value = [null, null, null, null, null]
    }
    catch (err: any) {
      micError.value = err?.message || String(err)
      isProcessing.value = false
    }
  }
}

function triggerFileUpload() {
  if (fileInputRef.value) {
    fileInputRef.value.click()
  }
}

async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  micError.value = null
  isProcessing.value = true
  results.value = [null, null, null, null, null]

  try {
    const activePromises = []
    for (let i = 0; i < modelCount.value; i++) {
      const modelId = selectedModels.value[i] || 'openai/gpt-transcribe'
      const slotTask = (async (slotIndex: number) => {
        const res = await transcribeAudio(
          file,
          modelId,
          store.openRouterApiKey,
          60,
          store.groqApiKey,
          store.geminiApiKey,
        )

        if (store.autoTranslateCompare && res && res.text && !res.text.startsWith('Transcription Error') && !res.text.startsWith('OpenRouter Error') && !res.text.startsWith('Please set')) {
          try {
            res.translatedText = await translateToEnglish(res.text, store.openRouterApiKey)
            activeTabs.value[slotIndex] = 'english'
          }
          catch {}
        }

        results.value[slotIndex] = res
        return res
      })(i)

      activePromises.push(slotTask)
    }

    const resList = await Promise.all(activePromises)

    const activeVersions = resList.filter((r): r is TranscriptionVersion => r !== null && r !== undefined)
    if (activeVersions.length > 0) {
      await store.saveComparisonSuite(file, activeVersions, fastestIndex.value)
    }
  }
  catch (err: any) {
    micError.value = `File analysis error: ${err?.message || err}`
  }
  finally {
    isProcessing.value = false
  }
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function copyText(text: string, index: number) {
  navigator.clipboard.writeText(text)
  copiedStates.value[index] = true
  setTimeout(() => (copiedStates.value[index] = false), 2000)
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300 w-11/12 mx-auto">
    <!-- Hidden File Input -->
    <input
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      class="hidden"
      @change="handleFileChange"
    >

    <!-- Top Bar: Model Count Selector -->
    <div class="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-xs">
      <div>
        <h2 class="text-xs font-bold text-foreground">
          Compare speech models
        </h2>
        <p class="text-[11px] text-muted-foreground">
          Compare speed, accuracy, and cost across multiple models.
        </p>
      </div>

      <!-- Pill Buttons for 2, 3, 4, or 5 Models -->
      <div class="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
        <Button
          size="sm"
          :variant="modelCount === 2 ? 'default' : 'ghost'"
          class="h-7 text-xs font-bold px-3 cursor-pointer"
          @click="modelCount = 2"
        >
          2 Models
        </Button>
        <Button
          size="sm"
          :variant="modelCount === 3 ? 'default' : 'ghost'"
          class="h-7 text-xs font-bold px-3 cursor-pointer"
          @click="modelCount = 3"
        >
          3 Models
        </Button>
        <Button
          size="sm"
          :variant="modelCount === 4 ? 'default' : 'ghost'"
          class="h-7 text-xs font-bold px-3 cursor-pointer"
          @click="modelCount = 4"
        >
          4 Models
        </Button>
        <Button
          size="sm"
          :variant="modelCount === 5 ? 'default' : 'ghost'"
          class="h-7 text-xs font-bold px-3 cursor-pointer"
          @click="modelCount = 5"
        >
          5 Models
        </Button>
      </div>
    </div>

    <!-- Microphone Error Alert -->
    <div v-if="micError" class="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold space-y-1">
      <p>Microphone error:</p>
      <p class="font-normal font-mono">
        {{ micError }}
      </p>
    </div>

    <!-- Center Control Panel: Record & Upload Actions -->
    <div class="rounded-2xl border border-border bg-card p-8 flex flex-col items-center justify-center text-center space-y-4 shadow-xs relative overflow-hidden">
      <div class="relative">
        <div v-if="isRecording" class="absolute -inset-3 rounded-full bg-destructive/20 animate-ping" />
        <button
          class="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer select-none"
          :class="[
            isRecording
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-105'
              : 'bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90',
            isProcessing ? 'opacity-50 pointer-events-none' : '',
          ]"
          :disabled="isProcessing"
          :aria-label="isRecording ? 'Stop benchmark recording' : 'Start benchmark recording'"
          :aria-pressed="isRecording"
          @click="toggleBenchmarkRecording"
        >
          <Square v-if="isRecording" class="w-7 h-7 fill-current" aria-hidden="true" />
          <Mic v-else class="w-9 h-9" aria-hidden="true" />
        </button>
      </div>

      <div class="space-y-1">
        <p v-if="isRecording" class="text-lg font-bold font-mono text-destructive tracking-wide animate-pulse">
          {{ formatTimer(recordSeconds) }}
        </p>
        <p v-else-if="isProcessing" class="text-xs font-semibold text-muted-foreground animate-pulse">
          Transcribing with {{ modelCount }} models...
        </p>
        <p v-else class="text-xs font-bold text-foreground">
          Record audio
        </p>
      </div>

      <!-- Upload Button -->
      <div v-if="!isRecording && !isProcessing" class="pt-1">
        <Button
          variant="outline"
          size="sm"
          class="text-xs font-semibold cursor-pointer border-border shadow-xs"
          @click="triggerFileUpload"
        >
          <Upload class="w-3.5 h-3.5 mr-1.5" />
          <span>Upload Audio File</span>
        </Button>
      </div>
    </div>

    <!-- 2x2 Grid Layout (Max 2 Columns) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div
        v-for="index in modelCount"
        :key="index"
        class="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs relative flex flex-col justify-between"
        :class="[
          results[index - 1]?.text?.startsWith('Transcription Error') || results[index - 1]?.text?.startsWith('OpenRouter Error')
            ? 'border-destructive/40 bg-destructive/5'
            : (fastestIndex === (index - 1) && results[index - 1] ? 'border-amber-500/40 bg-amber-500/5' : ''),
        ]"
      >
        <!-- Card Header: Model Selector + Badges -->
        <div class="space-y-3">
          <div class="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div class="flex-1 space-y-1">
              <label class="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Speech Model {{ index }}
              </label>
              <Select v-model="selectedModels[index - 1]">
                <SelectTrigger class="w-full h-8 text-xs bg-background" :aria-label="`Select speech model ${index}`">
                  <SelectValue placeholder="Select Speech Model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem v-for="m in sortedModels" :key="m.id" :value="m.id" class="text-xs">
                      <div class="flex items-center justify-between w-full gap-2">
                        <span>{{ m.name }}</span>
                        <span v-if="store.selectedModel === m.id" class="text-[10px] text-primary font-bold">(Default)</span>
                        <span v-else class="text-[10px] text-muted-foreground font-mono">(${{ m.costPerMin }}/m)</span>
                      </div>
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <!-- Error Badge -->
            <span
              v-if="results[index - 1]?.text?.startsWith('Transcription Error') || results[index - 1]?.text?.startsWith('OpenRouter Error')"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30 shrink-0 self-end mb-0.5"
            >
              <AlertCircle class="w-3 h-3" />
              API Error
            </span>

            <!-- Fastest Winner Badge -->
            <span
              v-else-if="fastestIndex === (index - 1) && results[index - 1]"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 shrink-0 self-end mb-0.5"
            >
              <Trophy class="w-3 h-3" />
              Fastest
            </span>
          </div>

          <!-- Active Metrics & Actions -->
          <div v-if="results[index - 1]" class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="flex items-center gap-1 bg-muted p-0.5 rounded-md border border-border">
                <Button
                  size="sm"
                  :variant="activeTabs[index - 1] === 'original' ? 'default' : 'ghost'"
                  class="h-5 text-[10px] font-bold px-2 cursor-pointer"
                  @click="activeTabs[index - 1] = 'original'"
                >
                  Original
                </Button>
                <Button
                  size="sm"
                  :variant="activeTabs[index - 1] === 'english' ? 'default' : 'ghost'"
                  class="h-5 text-[10px] font-bold px-2 cursor-pointer"
                  @click="activeTabs[index - 1] = 'english'"
                >
                  English
                </Button>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                  <Zap class="w-3 h-3 text-amber-600" />
                  {{ store.formatDuration(results[index - 1]!.latencyMs) }}
                </span>

                <Button
                  variant="outline"
                  size="sm"
                  class="h-6 text-[10px] font-semibold cursor-pointer border-border px-2"
                  @click="copyText(activeTabs[index - 1] === 'english' && results[index - 1]?.translatedText ? (results[index - 1]?.translatedText || '') : autoTransliterateIfUrduRegion(results[index - 1]?.text || ''), index - 1)"
                >
                  <Check v-if="copiedStates[index - 1]" class="w-3 h-3 text-green-600 mr-1" />
                  <Copy v-else class="w-3 h-3 mr-1" />
                  <span>{{ copiedStates[index - 1] ? 'Copied' : 'Copy' }}</span>
                </Button>
              </div>
            </div>

            <!-- Output Text -->
            <div v-if="activeTabs[index - 1] === 'english' && !results[index - 1]!.translatedText" class="p-5 text-center space-y-2 rounded-xl bg-muted/30 border border-border min-h-[120px] flex flex-col items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                class="h-7 text-xs font-bold border border-border cursor-pointer px-3"
                :disabled="translatingSlots[index - 1]"
                @click="translateSlot(index - 1)"
              >
                <span>{{ translatingSlots[index - 1] ? 'Translating...' : 'Generate English Translation' }}</span>
              </Button>
            </div>
            <p v-else-if="activeTabs[index - 1] === 'english' && results[index - 1]!.translatedText" class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-3.5 rounded-xl bg-muted/40 border border-border min-h-[120px]">
              {{ results[index - 1]!.translatedText }}
            </p>
            <p v-else class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-3.5 rounded-xl bg-muted/40 border border-border min-h-[120px]">
              {{ autoTransliterateIfUrduRegion(results[index - 1]!.text) }}
            </p>
          </div>

          <!-- Idle Placeholder -->
          <div v-else class="py-10 text-center text-xs text-muted-foreground">
            Transcription output for Model {{ index }} will appear here.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
