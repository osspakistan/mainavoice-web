<script setup lang="ts">
import type { RecordingHistoryItem, TranscriptionVersion } from '@/stores/maina-store'
import { AlertCircle, ArrowLeft, Check, Copy, Download, Pause, Play, RefreshCw, Swords, Trash2, Trophy, Zap } from 'lucide-vue-next'
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getSortedModels, transcribeAudio, translateToEnglish } from '@/services/transcription-service'
import { autoTransliterateIfUrduRegion } from '@/services/transliteration-service'
import { useMainaStore } from '@/stores/maina-store'

const route = useRoute()
const router = useRouter()
const store = useMainaStore()
const sortedModels = computed(() => getSortedModels(store.selectedModel))

const itemId = computed(() => route.params.id as string)
const item = computed<RecordingHistoryItem | undefined>(() => store.history.find((h: RecordingHistoryItem) => h.id === itemId.value))

// Standard Single Recording state
const activeTab = ref<'original' | 'english'>('original')
const isTranslating = ref(false)

// Comparison Suite state
const cardActiveTabs = ref<('original' | 'english')[]>([])
const cardTranslating = ref<boolean[]>([])
const copiedCardIndex = ref<number | null>(null)

if (item.value && item.value.isComparisonSuite) {
  cardActiveTabs.value = item.value.versions.map(() => 'original')
  cardTranslating.value = item.value.versions.map(() => false)
}
else if (item.value && item.value.versions.length > 0) {
  store.setActiveVersion(item.value.id, item.value.versions.length - 1)
}

const activeVersion = computed<TranscriptionVersion | undefined>(() => {
  if (!item.value)
    return undefined
  return item.value.versions[item.value.activeVersionIndex] || item.value.versions[0]
})

async function handleTranslate() {
  if (!item.value || !activeVersion.value || !activeVersion.value.text || isTranslating.value)
    return
  isTranslating.value = true
  try {
    const translated = await translateToEnglish(activeVersion.value.text, store.openRouterApiKey)
    await store.updateVersionTranslation(item.value.id, item.value.activeVersionIndex, translated)
    activeTab.value = 'english'
  }
  finally {
    isTranslating.value = false
  }
}

async function handleCardTranslate(vIndex: number) {
  if (!item.value || !item.value.versions[vIndex] || cardTranslating.value[vIndex])
    return
  cardTranslating.value[vIndex] = true
  try {
    const textToTranslate = item.value.versions[vIndex].text
    const translated = await translateToEnglish(textToTranslate, store.openRouterApiKey)
    await store.updateVersionTranslation(item.value.id, vIndex, translated)
    cardActiveTabs.value[vIndex] = 'english'
  }
  finally {
    cardTranslating.value[vIndex] = false
  }
}

const selectedModel = ref(store.selectedModel)
const isRetranscribing = ref(false)
const copiedId = ref<string | null>(null)
const isSavingAudio = ref(false)
const isSavingText = ref(false)

// Audio Player State
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
let audioElement: HTMLAudioElement | null = null

async function initAudio() {
  if (!item.value)
    return
  const src = await store.getAudioUrlForRecording(item.value.id, item.value.audioFilePath)
  if (!src)
    return

  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
  audioElement = new Audio(src)
  audioElement.onloadedmetadata = () => {
    duration.value = audioElement?.duration || 0
  }
  audioElement.ontimeupdate = () => {
    currentTime.value = audioElement?.currentTime || 0
  }
  audioElement.onended = () => {
    isPlaying.value = false
    currentTime.value = 0
  }
}

initAudio()

async function togglePlay() {
  if (!audioElement)
    await initAudio()
  if (!audioElement)
    return

  if (isPlaying.value) {
    audioElement.pause()
    isPlaying.value = false
  }
  else {
    audioElement.play().then(() => {
      isPlaying.value = true
    }).catch(e => console.error(`Audio playback error: ${e?.message || e}`))
  }
}

function seekAudio(event: Event) {
  const target = event.target as HTMLInputElement
  const val = Number.parseFloat(target.value)
  if (audioElement) {
    audioElement.currentTime = val
    currentTime.value = val
  }
}

function formatTime(sec: number) {
  if (Number.isNaN(sec) || !Number.isFinite(sec))
    return '00:00'
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatTimestamp(isoStr: string) {
  const d = new Date(isoStr)
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

// Compute fastest model index for comparison suites (excluding errored models)
const fastestVersionIndex = computed(() => {
  if (!item.value?.isComparisonSuite || !item.value.versions.length)
    return -1
  let minMs = Number.POSITIVE_INFINITY
  let bestIdx = -1
  item.value.versions.forEach((ver, idx) => {
    const isError = !ver.text || ver.text.startsWith('Transcription Error') || ver.text.startsWith('OpenRouter Error') || ver.text.startsWith('Please set')
    if (!isError && ver.latencyMs > 0 && ver.latencyMs < minMs) {
      minMs = ver.latencyMs
      bestIdx = idx
    }
  })
  return bestIdx
})

async function runReTranscription() {
  if (!item.value?.audioFilePath)
    return
  isRetranscribing.value = true
  try {
    const result = await transcribeAudio(
      item.value.audioFilePath,
      selectedModel.value,
      store.openRouterApiKey,
      60,
      store.groqApiKey,
    )

    if (
      store.autoTranslateHistory
      && result.text
      && !result.text.startsWith('Transcription Error')
      && !result.text.startsWith('OpenRouter Error')
      && !result.text.startsWith('Please set')
    ) {
      try {
        const translated = await translateToEnglish(result.text, store.openRouterApiKey)
        result.translatedText = translated
        activeTab.value = 'english'
      }
      catch (tErr) {
        console.error(`Auto-translation for new version failed: ${tErr}`)
      }
    }

    await store.addVersionToItem(item.value.id, result)
  }
  catch (err: any) {
    console.error(`Re-transcription failed: ${err?.message || err}`)
  }
  finally {
    isRetranscribing.value = false
  }
}

function copyText(text?: string, cardIdx?: number) {
  if (!text)
    return
  navigator.clipboard.writeText(text)
  if (cardIdx !== undefined) {
    copiedCardIndex.value = cardIdx
    setTimeout(() => (copiedCardIndex.value = null), 2000)
  }
  else {
    copiedId.value = 'copied'
    setTimeout(() => (copiedId.value = null), 2000)
  }
}

function saveAudio() {
  if (!item.value?.audioFilePath)
    return
  try {
    isSavingAudio.value = true
    const a = document.createElement('a')
    a.href = item.value.audioFilePath
    a.download = `maina_recording_${item.value.id}.wav`
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
  if (!activeVersion.value?.text)
    return
  try {
    isSavingText.value = true
    const blob = new Blob([activeVersion.value.text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transcript_${item.value?.id}_v${activeVersion.value.versionNumber}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
  catch (err: any) {
    console.error(`Save transcript failed: ${err?.message || err}`)
  }
  finally {
    isSavingText.value = false
  }
}

async function deleteRecording() {
  if (!item.value)
    return
  // eslint-disable-next-line no-alert
  if (confirm('Are you sure you want to delete this recording item?')) {
    if (audioElement) {
      audioElement.pause()
      audioElement = null
    }
    await store.deleteHistoryItem(item.value.id)
    router.push('/history')
  }
}

onUnmounted(() => {
  if (audioElement) {
    audioElement.pause()
    audioElement = null
  }
})
</script>

<template>
  <div
    v-if="item"
    class="space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300"
    :class="[item.isComparisonSuite ? 'w-11/12 mx-auto' : 'max-w-[714px] mx-auto']"
  >
    <!-- Unboxed Navigation Header -->
    <div class="flex items-center justify-between">
      <Button
        as-child
        variant="ghost"
        size="sm"
        class="font-bold text-xs cursor-pointer -ml-2 hover:bg-muted"
      >
        <RouterLink to="/history">
          <ArrowLeft class="w-4 h-4 mr-1" />
          <span>Back to history</span>
        </RouterLink>
      </Button>

      <div class="flex items-center gap-2">
        <span v-if="item.isComparisonSuite" class="inline-flex items-center gap-1 text-xs font-bold text-primary">
          <Swords class="w-3.5 h-3.5" />
          Comparison suite
        </span>
        <span class="text-xs text-muted-foreground font-medium">
          {{ formatTimestamp(item.createdAt) }}
        </span>
      </div>
    </div>

    <!-- Shared Audio Player Bar -->
    <div class="p-5 rounded-2xl border border-border bg-card space-y-3 shadow-xs">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button
            variant="default"
            size="icon"
            class="rounded-full shadow-xs cursor-pointer"
            :disabled="!item.audioFilePath"
            @click="togglePlay"
          >
            <Pause v-if="isPlaying" class="w-4 h-4 fill-current" />
            <Play v-else class="w-4 h-4 fill-current ml-0.5" />
          </Button>

          <div>
            <h2 class="text-xs font-bold text-foreground">
              Audio playback
            </h2>
            <p class="text-[11px] text-muted-foreground font-mono">
              {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="font-semibold cursor-pointer border-border h-8 text-xs"
            :disabled="isSavingAudio"
            @click="saveAudio"
          >
            <Download class="w-3.5 h-3.5 mr-1" />
            <span>Save .wav</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            class="font-semibold cursor-pointer h-8 text-xs"
            @click="deleteRecording"
          >
            <Trash2 class="w-3.5 h-3.5 mr-1" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      <!-- Custom Audio Seek Bar -->
      <div class="flex items-center gap-3">
        <span class="text-[11px] font-mono text-muted-foreground w-10 text-right">{{ formatTime(currentTime) }}</span>
        <input
          type="range"
          min="0"
          :max="duration || 100"
          step="0.05"
          :value="currentTime"
          class="flex-1 h-2 accent-primary bg-secondary rounded-lg cursor-pointer"
          @input="seekAudio"
        >
        <span class="text-[11px] font-mono text-muted-foreground w-10">{{ formatTime(duration) }}</span>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- VIEW MODE A: SAVED COMPARISON SUITE (Cards Grid — No Versioning)     -->
    <!-- =================================================================== -->
    <div v-if="item.isComparisonSuite" class="space-y-4">
      <div class="flex items-center justify-between border-b border-border pb-2">
        <h3 class="text-sm font-bold text-foreground flex items-center gap-2">
          <span>Benchmark Speech Models</span>
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-primary text-primary-foreground">
            {{ item.versions.length }} Models
          </span>
        </h3>
      </div>

      <!-- 2-Column Max Grid of Model Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="(ver, vIdx) in item.versions"
          :key="vIdx"
          class="rounded-2xl border border-border bg-card p-5 space-y-3.5 shadow-xs relative flex flex-col justify-between"
          :class="[
            ver.text?.startsWith('Transcription Error') || ver.text?.startsWith('OpenRouter Error')
              ? 'border-destructive/40 bg-destructive/5'
              : (vIdx === fastestVersionIndex ? 'border-amber-500/40 bg-amber-500/5' : ''),
          ]"
        >
          <div class="space-y-3">
            <!-- Card Header: Model Name + Fastest / Error Badge -->
            <div class="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Model {{ vIdx + 1 }}
                </span>
                <span class="text-xs font-bold text-foreground">
                  {{ ver.engineName }}
                </span>
              </div>

              <!-- Error Badge -->
              <span
                v-if="ver.text?.startsWith('Transcription Error') || ver.text?.startsWith('OpenRouter Error')"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-destructive/20 text-destructive border border-destructive/30"
              >
                <AlertCircle class="w-3 h-3" />
                API Error
              </span>

              <span
                v-else-if="vIdx === fastestVersionIndex"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
              >
                <Trophy class="w-3 h-3" />
                Fastest
              </span>
            </div>

            <!-- Card Actions Bar: Tabs + Speed + Copy -->
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <!-- Tab Toggle -->
              <div class="flex items-center gap-1 bg-muted p-0.5 rounded-md border border-border">
                <Button
                  size="sm"
                  :variant="cardActiveTabs[vIdx] === 'original' ? 'default' : 'ghost'"
                  class="h-5 text-[10px] font-bold px-2 cursor-pointer"
                  @click="cardActiveTabs[vIdx] = 'original'"
                >
                  Original
                </Button>
                <Button
                  size="sm"
                  :variant="cardActiveTabs[vIdx] === 'english' ? 'default' : 'ghost'"
                  class="h-5 text-[10px] font-bold px-2 cursor-pointer"
                  @click="cardActiveTabs[vIdx] = 'english'"
                >
                  English
                </Button>
              </div>

              <div class="flex items-center gap-1.5">
                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                  <Zap class="w-3 h-3 text-amber-600" />
                  {{ store.formatDuration(ver.latencyMs) }}
                </span>

                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-secondary text-secondary-foreground border border-border">
                  {{ ver.wordCount }} words
                </span>

                <!-- Copy Button -->
                <Button
                  variant="outline"
                  size="sm"
                  class="h-6 text-[10px] font-semibold cursor-pointer border-border px-2"
                  @click="copyText(cardActiveTabs[vIdx] === 'english' && ver.translatedText ? ver.translatedText : autoTransliterateIfUrduRegion(ver.text), vIdx)"
                >
                  <Check v-if="copiedCardIndex === vIdx" class="w-3 h-3 text-green-600 mr-1" />
                  <Copy v-else class="w-3 h-3 mr-1" />
                  <span>{{ copiedCardIndex === vIdx ? 'Copied' : 'Copy' }}</span>
                </Button>
              </div>
            </div>

            <!-- Card Transcript Output -->
            <div v-if="cardActiveTabs[vIdx] === 'english' && !ver.translatedText" class="p-5 text-center space-y-2.5 rounded-xl bg-muted/30 border border-border min-h-[120px] flex flex-col items-center justify-center">
              <Button
                size="sm"
                variant="secondary"
                class="h-7 text-xs font-bold border border-border cursor-pointer px-3"
                :disabled="cardTranslating[vIdx]"
                @click="handleCardTranslate(vIdx)"
              >
                <span>{{ cardTranslating[vIdx] ? 'Translating...' : 'Generate English Translation' }}</span>
              </Button>
            </div>
            <p v-else-if="cardActiveTabs[vIdx] === 'english' && ver.translatedText" class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-3.5 rounded-xl bg-muted/40 border border-border min-h-[120px]">
              {{ ver.translatedText }}
            </p>
            <p v-else class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-3.5 rounded-xl bg-muted/40 border border-border min-h-[120px]">
              {{ autoTransliterateIfUrduRegion(ver.text) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- =================================================================== -->
    <!-- VIEW MODE B: SINGLE RECORDING WORKBENCH (With Versioning Selector)   -->
    <!-- =================================================================== -->
    <div v-else class="space-y-6">
      <!-- Re-transcription Model Selector Workbench -->
      <div class="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-xs">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-bold text-foreground">
              Re-transcribe Audio
            </h3>
            <p class="text-xs text-muted-foreground">
              Select a cloud model to generate a new version of this transcript.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <Select v-model="selectedModel">
              <SelectTrigger class="w-[260px] h-9 text-xs" aria-label="Select cloud speech model">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Cloud Speech Models</SelectLabel>
                  <SelectItem
                    v-for="model in sortedModels"
                    :key="model.id"
                    :value="model.id"
                    class="text-xs"
                  >
                    <div class="flex items-center justify-between w-full gap-2">
                      <span class="font-medium">{{ model.name }}</span>
                      <span v-if="store.selectedModel === model.id" class="text-[10px] text-primary font-bold">(Default)</span>
                      <span v-else class="text-[10px] text-muted-foreground font-mono">(${{ model.costPerMin }}/m)</span>
                    </div>
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              size="sm"
              class="font-semibold cursor-pointer h-9 px-4 text-xs"
              :disabled="isRetranscribing || !item.audioFilePath"
              @click="runReTranscription"
            >
              <RefreshCw class="w-3.5 h-3.5 mr-1" :class="{ 'animate-spin': isRetranscribing }" />
              <span>{{ isRetranscribing ? 'Transcribing...' : 'Re-transcribe' }}</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- Transcription Viewer & Version Selector -->
      <div class="p-6 rounded-2xl border border-border bg-card space-y-4 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div class="flex items-center gap-3">
            <h3 class="text-sm font-bold text-foreground">
              Transcript Content
            </h3>

            <!-- Version Selector Dropdown -->
            <Select
              v-if="item && item.versions.length > 1"
              :model-value="item.activeVersionIndex.toString()"
              @update:model-value="(val) => { if (item && val) store.setActiveVersion(item.id, Number.parseInt(val as string)) }"
            >
              <SelectTrigger class="h-8 text-xs font-bold bg-muted border-border" aria-label="Select transcript version">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="(ver, idx) in item.versions"
                  :key="ver.versionNumber"
                  :value="idx.toString()"
                  class="text-xs font-medium"
                >
                  v{{ ver.versionNumber }}
                </SelectItem>
              </SelectContent>
            </Select>

            <span v-else-if="activeVersion" class="px-2.5 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border">
              v1
            </span>

            <!-- Tab Controls -->
            <div v-if="activeVersion" class="flex items-center gap-1 bg-muted p-1 rounded-lg border border-border ml-2">
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

          <div v-if="activeVersion" class="flex items-center gap-2">
            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
              <Zap class="w-3 h-3 text-amber-600" />
              {{ store.formatDuration(activeVersion.latencyMs) }}
            </span>

            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-secondary text-secondary-foreground border border-border">
              {{ activeVersion.wordCount }} words
            </span>

            <Button
              variant="outline"
              size="sm"
              class="font-semibold cursor-pointer h-8 text-xs border-border"
              @click="copyText(activeTab === 'english' && activeVersion.translatedText ? activeVersion.translatedText : autoTransliterateIfUrduRegion(activeVersion.text))"
            >
              <Check v-if="copiedId" class="w-3.5 h-3.5 text-green-600 mr-1" />
              <Copy v-else class="w-3.5 h-3.5 mr-1" />
              <span>{{ copiedId ? 'Copied!' : 'Copy' }}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              class="font-semibold cursor-pointer h-8 text-xs border-border"
              :disabled="isSavingText"
              @click="saveTranscript"
            >
              <Download class="w-3.5 h-3.5 mr-1" />
              <span>Export .txt</span>
            </Button>
          </div>
        </div>

        <div v-if="activeVersion" class="space-y-2">
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span>Model: <strong>{{ activeVersion.engineName }}</strong></span>
            <span>Estimated Cost: <strong>${{ activeVersion.costEstimate.toFixed(4) }}</strong></span>
          </div>

          <div v-if="activeTab === 'english' && !activeVersion.translatedText" class="p-6 text-center space-y-3 rounded-xl bg-muted/30 border border-border min-h-[140px] flex flex-col items-center justify-center">
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
          <p v-else-if="activeTab === 'english' && activeVersion.translatedText" class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-4 rounded-xl bg-muted/40 border border-border min-h-[140px]">
            {{ activeVersion.translatedText }}
          </p>
          <p v-else class="text-xs leading-relaxed text-foreground whitespace-pre-wrap font-mono p-4 rounded-xl bg-muted/40 border border-border min-h-[140px]">
            {{ autoTransliterateIfUrduRegion(activeVersion.text) }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="p-12 text-center text-xs text-muted-foreground">
    Recording item not found.
  </div>
</template>
