<script setup lang="ts">
import type { TranscriptionVersion } from '@/stores/maina-store'
import { Check, Copy, DollarSign, Download, HelpCircle, Mic, Square, Upload, Zap } from 'lucide-vue-next'
import { onUnmounted, ref } from 'vue'
import ModelInfoModal from '@/components/model-info-modal.vue'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ALL_MODELS, transcribeAudio, translateToEnglish } from '@/services/transcription-service'
import { autoTransliterateIfUrduRegion } from '@/services/transliteration-service'
import { useMainaStore } from '@/stores/maina-store'

const store = useMainaStore()
const isInfoOpen = ref(false)
const isRecording = ref(false)
const isProcessing = ref(false)
const recordSeconds = ref(0)
const isCopied = ref(false)
const activeResult = ref<TranscriptionVersion | null>(null)
const activeAudioPath = ref<string | null>(null)
const isSavingAudio = ref(false)
const isSavingText = ref(false)
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

const micError = ref<string | null>(null)

const activeTab = ref<'original' | 'english'>('original')
const isTranslating = ref(false)

async function handleTranslate() {
  if (!activeResult.value || !activeResult.value.text || isTranslating.value)
    return
  isTranslating.value = true
  try {
    const translated = await translateToEnglish(activeResult.value.text, store.openRouterApiKey)
    activeResult.value.translatedText = translated
    activeTab.value = 'english'

    // Update in history if saved
    if (store.history[0] && store.history[0].versions[0]) {
      await store.updateVersionTranslation(store.history[0].id, 0, translated)
    }
  }
  finally {
    isTranslating.value = false
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

async function toggleRecording() {
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
        const audioUrl = URL.createObjectURL(audioBlob)
        const duration = Math.max(recordSeconds.value, 1)

        const result = await transcribeAudio(
          audioUrl,
          store.selectedModel,
          store.openRouterApiKey,
          duration,
          store.groqApiKey,
          store.geminiApiKey,
        )

        activeResult.value = result
        activeAudioPath.value = audioUrl
        isProcessing.value = false

        if (result.text && !result.text.startsWith('Error')) {
          if (store.autoTranslateRecord) {
            const translated = await translateToEnglish(result.text, store.openRouterApiKey)
            result.translatedText = translated
            activeTab.value = 'english'
          }
          else {
            activeTab.value = 'original'
          }
          await store.addOrUpdateHistoryItem(audioUrl, result)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      startTimer()
      isRecording.value = true
      activeResult.value = null
      activeAudioPath.value = null
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
  activeResult.value = null

  try {
    const fileUrl = URL.createObjectURL(file)
    const result = await transcribeAudio(
      fileUrl,
      store.selectedModel,
      store.openRouterApiKey,
      60,
      store.groqApiKey,
      store.geminiApiKey,
    )

    activeResult.value = result
    activeAudioPath.value = fileUrl
    isProcessing.value = false

    if (result.text && !result.text.startsWith('Error') && !result.text.startsWith('Transcription Error')) {
      store.addOrUpdateHistoryItem(fileUrl, result)
    }
  }
  catch (err: any) {
    micError.value = `Upload error: ${err?.message || err}`
    isProcessing.value = false
  }
}

function saveAudio() {
  if (!activeAudioPath.value)
    return
  try {
    isSavingAudio.value = true
    const a = document.createElement('a')
    a.href = activeAudioPath.value
    a.download = `maina_recording_${Date.now()}.wav`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
  catch (err: any) {
    console.error(`Save audio failed: ${err?.message || err}`)
  }
  finally {
    isSavingAudio.value = false
  }
}

function saveTranscript() {
  const textToSave = activeTab.value === 'english' && activeResult.value?.translatedText
    ? activeResult.value.translatedText
    : activeResult.value?.text
  if (!textToSave)
    return
  try {
    isSavingText.value = true
    const blob = new Blob([textToSave], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${activeTab.value}_${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  catch (err: any) {
    console.error(`Export failed: ${err?.message || err}`)
  }
  finally {
    isSavingText.value = false
  }
}

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function copyTranscript() {
  const textToCopy = activeTab.value === 'english' && activeResult.value?.translatedText
    ? activeResult.value.translatedText
    : activeResult.value?.text
  if (!textToCopy)
    return
  navigator.clipboard.writeText(textToCopy)
  isCopied.value = true
  setTimeout(() => (isCopied.value = false), 2000)
}

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
    <!-- Hidden HTML File Input for Audio Upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      class="hidden"
      @change="handleFileChange"
    >

    <!-- Top Bar: Model Selector + Info Button -->
    <div class="flex items-center justify-center gap-2">
      <Select v-model="store.selectedModel">
        <SelectTrigger class="w-[320px] bg-card border-border shadow-xs" aria-label="Select speech-to-text model">
          <SelectValue placeholder="Select speech model" />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            <SelectLabel class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Speech-to-Text Models
            </SelectLabel>
            <SelectItem
              v-for="model in ALL_MODELS"
              :key="model.id"
              :value="model.id"
              class="cursor-pointer text-xs"
            >
              <div class="flex items-center justify-between w-full gap-4">
                <span class="font-medium text-foreground">{{ model.name }}</span>
                <span class="text-[10px] text-muted-foreground font-mono">
                  (${{ model.costPerMin }}/m)
                </span>
              </div>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      <!-- Info Dialog Trigger Button -->
      <Button
        variant="ghost"
        size="icon-sm"
        class="text-muted-foreground hover:text-foreground cursor-pointer"
        title="View Model Metrics & Specs"
        @click="isInfoOpen = true"
      >
        <HelpCircle class="w-4 h-4" />
      </Button>
    </div>

    <!-- Microphone Error Banner -->
    <div v-if="micError" class="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs font-semibold space-y-1">
      <p>Microphone error:</p>
      <p class="font-normal font-mono">
        {{ micError }}
      </p>
    </div>

    <!-- Center Hero Section: Record Button + Status -->
    <div class="rounded-2xl border border-border bg-card p-10 flex flex-col items-center justify-center text-center space-y-6 shadow-xs relative overflow-hidden">
      <!-- Recording Status Rings -->
      <div class="relative">
        <div
          v-if="isRecording"
          class="absolute -inset-4 rounded-full bg-destructive/20 animate-ping"
        />

        <button
          class="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer select-none"
          :class="[
            isRecording
              ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 scale-105'
              : 'bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90',
            isProcessing ? 'opacity-50 pointer-events-none' : '',
          ]"
          :disabled="isProcessing"
          :aria-label="isRecording ? 'Stop recording' : 'Start recording'"
          :aria-pressed="isRecording"
          @click="toggleRecording"
        >
          <Square v-if="isRecording" class="w-8 h-8 fill-current" aria-hidden="true" />
          <Mic v-else class="w-10 h-10" aria-hidden="true" />
        </button>
      </div>

      <!-- Action Subtitle & Timer -->
      <div class="space-y-1">
        <p v-if="isRecording" class="text-xl font-bold font-mono text-destructive tracking-wide animate-pulse">
          {{ formatTimer(recordSeconds) }}
        </p>

        <p v-else-if="isProcessing" class="text-sm font-semibold text-muted-foreground animate-pulse">
          Transcribing audio...
        </p>

        <p v-else class="text-sm font-semibold text-foreground">
          Click to record
        </p>

        <p v-if="!isRecording && !isProcessing" class="text-xs text-muted-foreground">
          Recorded with {{ ALL_MODELS.find(m => m.id === store.selectedModel)?.name }}
        </p>
      </div>

      <!-- Feature 1: Upload Audio File Button -->
      <div v-if="!isRecording && !isProcessing" class="pt-2">
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

    <!-- Live Result Container -->
    <div
      class="rounded-2xl border border-border bg-card p-6 space-y-4 shadow-xs transition-all duration-300 min-h-[160px]"
    >
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <div class="flex items-center gap-3">
          <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
            <span>Live Transcription Result</span>
            <span
              v-if="activeResult"
              class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground"
            >
              v1
            </span>
          </h3>

          <!-- Tab Controls -->
          <div v-if="activeResult" class="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border">
            <Button
              size="sm"
              :variant="activeTab === 'original' ? 'default' : 'ghost'"
              class="h-6 text-[11px] font-bold px-2.5 cursor-pointer"
              @click="activeTab = 'original'"
            >
              Original
            </Button>
            <Button
              size="sm"
              :variant="activeTab === 'english' ? 'default' : 'ghost'"
              class="h-6 text-[11px] font-bold px-2.5 cursor-pointer"
              @click="activeTab = 'english'"
            >
              English Translation
            </Button>
          </div>
        </div>

        <!-- Result Metrics & Actions -->
        <div v-if="activeResult" class="flex items-center gap-2">
          <!-- Latency Badge -->
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            <Zap class="w-3 h-3 text-amber-600" />
            {{ store.formatDuration(activeResult.latencyMs) }}
          </span>

          <!-- Word Count Badge -->
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            {{ activeResult.wordCount }} words
          </span>

          <!-- Estimated Cost Badge -->
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
            <DollarSign class="w-3 h-3 text-green-600" />
            ${{ activeResult.costEstimate.toFixed(4) }}
          </span>

          <!-- Feature 3: Download Audio .wav Button -->
          <Button
            v-if="activeAudioPath"
            variant="outline"
            size="sm"
            class="h-7 text-xs font-semibold cursor-pointer border-border"
            :disabled="isSavingAudio"
            @click="saveAudio"
          >
            <Download class="w-3 h-3 mr-1" />
            <span>Save .wav</span>
          </Button>

          <!-- Feature 3: Download Transcript .txt Button -->
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs font-semibold cursor-pointer border-border"
            :disabled="isSavingText"
            @click="saveTranscript"
          >
            <Download class="w-3 h-3 mr-1" />
            <span>Export .txt</span>
          </Button>

          <!-- Copy Button -->
          <Button
            variant="outline"
            size="sm"
            class="h-7 text-xs font-semibold cursor-pointer border-border"
            @click="copyTranscript"
          >
            <Check v-if="isCopied" class="w-3 h-3 text-green-600 mr-1" />
            <Copy v-else class="w-3 h-3 mr-1" />
            <span>{{ isCopied ? 'Copied' : 'Copy' }}</span>
          </Button>
        </div>
      </div>

      <!-- Transcript Output Content (Switches by Tab) -->
      <div v-if="activeResult">
        <div v-if="activeTab === 'english' && !activeResult.translatedText" class="p-6 text-center space-y-3 rounded-xl bg-muted/30 border border-border min-h-[100px] flex flex-col items-center justify-center">
          <Button
            size="sm"
            variant="secondary"
            class="h-8 text-xs font-bold border border-border cursor-pointer px-4"
            :disabled="isTranslating"
            @click="handleTranslate"
          >
            <span>{{ isTranslating ? 'Translating...' : 'Generate English Translation' }}</span>
          </Button>
        </div>
        <p v-else-if="activeTab === 'english' && activeResult.translatedText" class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-4 rounded-xl bg-muted/40 border border-border min-h-[100px]">
          {{ activeResult.translatedText }}
        </p>
        <p v-else class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-4 rounded-xl bg-muted/40 border border-border min-h-[100px]">
          {{ autoTransliterateIfUrduRegion(activeResult.text) }}
        </p>
      </div>

      <div v-else class="py-6 text-center text-xs text-muted-foreground">
        Recorded or uploaded audio transcript will appear here.
      </div>
    </div>

    <!-- Model Specs Info Modal -->
    <ModelInfoModal
      :is-open="isInfoOpen"
      @close="isInfoOpen = false"
    />
  </div>
</template>
