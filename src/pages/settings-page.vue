<script setup lang="ts">
import { BarChart3, Check, Clock, Coins, Database, Download, FileAudio, Globe, Key, Languages, Laptop, Layers, Mic, Moon, RotateCcw, Sun, Swords, Upload, Zap } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { exportBackupArchive, importBackupArchive, performFactoryReset } from '@/services/backup-service'
import { getSortedModels } from '@/services/transcription-service'
import { useMainaStore } from '@/stores/maina-store'

const store = useMainaStore()
const apiKeyInput = ref(store.openRouterApiKey)
const groqKeyInput = ref(store.groqApiKey)

const sortedModels = computed(() => getSortedModels(store.selectedModel))

const totalRecordings = computed(() => store.history.length)
const totalVersions = computed(() => store.history.reduce((n, h) => n + h.versions.length, 0))
const totalWords = computed(() => store.history.reduce((n, h) => n + h.versions.reduce((a, v) => a + (v.wordCount || 0), 0), 0))
const totalCost = computed(() => store.history.reduce((n, h) => n + h.versions.reduce((a, v) => a + (v.costEstimate || 0), 0), 0))
const totalLatencyMs = computed(() => store.history.reduce((n, h) => n + h.versions.reduce((a, v) => a + (v.latencyMs || 0), 0), 0))
const avgLatencyMs = computed(() => totalVersions.value ? Math.round(totalLatencyMs.value / totalVersions.value) : 0)
const comparisonSuites = computed(() => store.history.filter(h => h.isComparisonSuite).length)
const translatedCount = computed(() => store.history.reduce((n, h) => n + h.versions.filter(v => !!v.translatedText).length, 0))
const avgWordsPerVersion = computed(() => totalVersions.value ? Math.round(totalWords.value / totalVersions.value) : 0)

const engineStats = computed(() => {
  const map = new Map<string, { count: number, words: number, cost: number, latency: number }>()
  for (const item of store.history) {
    for (const v of item.versions) {
      const cur = map.get(v.engineName) || { count: 0, words: 0, cost: 0, latency: 0 }
      cur.count += 1
      cur.words += v.wordCount || 0
      cur.cost += v.costEstimate || 0
      cur.latency += v.latencyMs || 0
      map.set(v.engineName, cur)
    }
  }
  return Array.from(map.entries()).map(([engine, s]) => ({
    engine,
    shortName: engine.split('/').pop() || engine,
    ...s,
    avgLatency: s.count ? Math.round(s.latency / s.count) : 0,
  })).sort((a, b) => b.count - a.count)
})
const maxEngineCount = computed(() => Math.max(1, ...engineStats.value.map(e => e.count)))

function fmtCost(n: number): string {
  if (n === 0)
    return '$0.00'
  if (n < 0.01)
    return `$${n.toFixed(4)}`
  return `$${n.toFixed(2)}`
}

// Keep input synced when store initializes asynchronously from IndexedDB on page reload
watch(
  () => store.openRouterApiKey,
  (newKey) => {
    if (newKey && !apiKeyInput.value) {
      apiKeyInput.value = newKey
    }
  },
  { immediate: true },
)
watch(
  () => store.groqApiKey,
  (newKey) => {
    if (newKey && !groqKeyInput.value) {
      groqKeyInput.value = newKey
    }
  },
  { immediate: true },
)
const isSaved = ref(false)
const isGroqSaved = ref(false)

const isExporting = ref(false)
const isImporting = ref(false)
const isResetting = ref(false)
const statusMessage = ref<string | null>(null)
const restoreInputRef = ref<HTMLInputElement | null>(null)

function handleSaveKey() {
  store.setApiKey(apiKeyInput.value)
  isSaved.value = true
  setTimeout(() => {
    isSaved.value = false
  }, 2000)
}

function handleSaveGroqKey() {
  store.setGroqApiKey(groqKeyInput.value)
  isGroqSaved.value = true
  setTimeout(() => {
    isGroqSaved.value = false
  }, 2000)
}

async function handleExport() {
  isExporting.value = true
  statusMessage.value = null
  try {
    await exportBackupArchive()
    statusMessage.value = 'Backup archive exported successfully.'
  }
  catch (err: any) {
    statusMessage.value = `Export failed: ${err?.message || err}`
  }
  finally {
    isExporting.value = false
  }
}

function triggerRestore() {
  if (restoreInputRef.value) {
    restoreInputRef.value.click()
  }
}

async function handleFileRestore(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  // eslint-disable-next-line no-alert
  if (!confirm('Restoring a backup will OVERWRITE all current recordings, transcript versions, and settings. Are you sure you want to proceed?')) {
    target.value = ''
    return
  }

  isImporting.value = true
  statusMessage.value = 'Restoring backup data...'
  try {
    const res = await importBackupArchive(file)
    await store.initStore()
    apiKeyInput.value = store.openRouterApiKey
    statusMessage.value = `Backup restored successfully (${res.recordingsCount} recordings restored). Redirecting...`
    setTimeout(() => {
      window.location.href = '/history'
    }, 1000)
  }
  catch (err: any) {
    statusMessage.value = `Restore failed: ${err?.message || err}`
  }
  finally {
    isImporting.value = false
    target.value = ''
  }
}

async function handleFactoryReset() {
  // eslint-disable-next-line no-alert
  if (!confirm('WARNING: Factory Reset will permanently delete ALL recordings, audio files, and saved settings. This action cannot be undone. Are you sure?')) {
    return
  }

  isResetting.value = true
  statusMessage.value = 'Performing factory reset...'
  try {
    await performFactoryReset()
    await store.initStore()
    apiKeyInput.value = ''
    statusMessage.value = 'Factory reset complete. All data has been cleared. Redirecting...'
    setTimeout(() => {
      window.location.href = '/history'
    }, 1000)
  }
  catch (err: any) {
    statusMessage.value = `Reset failed: ${err?.message || err}`
  }
  finally {
    isResetting.value = false
  }
}
</script>

<template>
  <div class="max-w-[714px] mx-auto space-y-6 animate-in fade-in-50 slide-in-from-bottom-3 duration-300">
    <!-- Unboxed Page Title Header -->
    <div class="space-y-1">
      <h1 class="text-xl font-bold text-foreground tracking-tight">
        Settings
      </h1>
      <p class="text-xs font-medium text-muted-foreground">
        Configure your API key, theme, auto-translation, and backups.
      </p>
    </div>

    <!-- 1. Color Mode / Theme Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground">
          Theme
        </h2>
        <p class="text-xs text-muted-foreground">
          Select light, dark, or follow system settings.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Button
          size="lg"
          :variant="store.themeMode === 'light' ? 'default' : 'outline'"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12 border-border"
          @click="store.setThemeMode('light')"
        >
          <Sun class="w-4 h-4 text-amber-500" />
          <span>Light Mode</span>
        </Button>

        <Button
          size="lg"
          :variant="store.themeMode === 'dark' ? 'default' : 'outline'"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12 border-border"
          @click="store.setThemeMode('dark')"
        >
          <Moon class="w-4 h-4 text-indigo-400" />
          <span>Dark Mode</span>
        </Button>

        <Button
          size="lg"
          :variant="store.themeMode === 'system' ? 'default' : 'outline'"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12 border-border"
          @click="store.setThemeMode('system')"
        >
          <Laptop class="w-4 h-4 text-muted-foreground" />
          <span>System Preference</span>
        </Button>
      </div>
    </div>

    <!-- 1b. Default Speech Engine Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Mic class="w-4 h-4 text-primary" />
          <span>Default Speech Engine</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Choose which AI model is active by default for single recordings and shown first across all selectors.
        </p>
      </div>

      <div class="space-y-2 pt-1">
        <div
          v-for="model in sortedModels"
          :key="model.id"
          class="flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer"
          :class="[
            store.selectedModel === model.id
              ? 'border-primary/60 bg-primary/5 shadow-xs'
              : 'border-border bg-background hover:border-border/80 hover:bg-muted/30',
          ]"
          @click="store.setSelectedModel(model.id)"
        >
          <div class="space-y-0.5">
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-foreground">{{ model.name }}</span>
              <span
                v-if="store.selectedModel === model.id"
                class="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                Default Engine
              </span>
              <span
                v-else-if="model.badge"
                class="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-secondary text-secondary-foreground border border-border"
              >
                {{ model.badge }}
              </span>
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed line-clamp-1">
              {{ model.description }}
            </p>
          </div>

          <div class="flex items-center gap-3 shrink-0 ml-3">
            <span class="text-[11px] font-mono font-medium text-muted-foreground">
              ${{ model.costPerMin }}/m
            </span>
            <div
              class="w-4 h-4 rounded-full border flex items-center justify-center transition-colors"
              :class="[
                store.selectedModel === model.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-muted-foreground/40',
              ]"
            >
              <Check v-if="store.selectedModel === model.id" class="w-3 h-3 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. Granular Auto-Translate Options Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-5 shadow-xs">
      <div class="space-y-1 border-b border-border pb-3">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Globe class="w-4 h-4 text-primary" />
          <span>Auto-Translate to English</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Configure where automated English translation should run using Qwen 3.7 Flash.
        </p>
      </div>

      <div class="space-y-4">
        <!-- Option 1: Record Page -->
        <div class="flex items-center justify-between gap-4">
          <div class="space-y-0.5 max-w-[80%]">
            <div class="text-xs font-bold text-foreground">
              Record Page
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Auto-translates single-engine voice notes immediately after recording.
            </p>
          </div>
          <Switch
            :model-value="store.autoTranslateRecord"
            @update:model-value="(val: boolean) => store.setAutoTranslateRecord(val)"
          />
        </div>

        <!-- Option 2: Compare Page -->
        <div class="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
          <div class="space-y-0.5 max-w-[80%]">
            <div class="text-xs font-bold text-foreground">
              Compare Page
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Auto-translates multi-engine benchmark results. Keep off to avoid triggering up to 4 parallel translation API calls at once.
            </p>
          </div>
          <Switch
            :model-value="store.autoTranslateCompare"
            @update:model-value="(val: boolean) => store.setAutoTranslateCompare(val)"
          />
        </div>

        <!-- Option 3: History Page Re-transcription -->
        <div class="flex items-center justify-between gap-4 pt-3 border-t border-border/60">
          <div class="space-y-0.5 max-w-[80%]">
            <div class="text-xs font-bold text-foreground">
              History Re-transcription
            </div>
            <p class="text-[11px] text-muted-foreground leading-relaxed">
              Auto-translates newly generated versions when re-transcribing recordings with different AI models in History view.
            </p>
          </div>
          <Switch
            :model-value="store.autoTranslateHistory"
            @update:model-value="(val: boolean) => store.setAutoTranslateHistory(val)"
          />
        </div>
      </div>
    </div>

    <!-- 3. OpenRouter API Key Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Key class="w-4 h-4 text-primary" />
          <span>OpenRouter API Key</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Required for OpenRouter speech models (OpenAI GPT-Transcribe, Deepgram Nova-3, NVIDIA Parakeet). Saved locally in your browser.
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-foreground mb-1.5">
            OpenRouter API Key
          </label>
          <input
            v-model="apiKeyInput"
            type="password"
            placeholder="sk-or-v1-..."
            class="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition shadow-xs"
          >
        </div>

        <div class="flex items-center justify-between pt-1">
          <span
            v-if="store.openRouterApiKey"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <Check class="w-3.5 h-3.5" />
            API key saved
          </span>
          <span v-else class="text-xs text-muted-foreground">
            No API key saved.
          </span>

          <Button
            variant="default"
            size="sm"
            class="font-bold cursor-pointer"
            @click="handleSaveKey"
          >
            <Check v-if="isSaved" class="w-3.5 h-3.5 text-emerald-400" />
            <span>{{ isSaved ? 'Saved' : 'Save Key' }}</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- 3b. Groq API Key Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-500" />
          <span>Groq API Key (Optional)</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Direct Groq API key for ultra-fast, sub-300ms Whisper Large v3 Turbo transcriptions at $0.04/hr (or 2,000 free requests/day).
        </p>
      </div>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-foreground mb-1.5">
            Groq API Key
          </label>
          <input
            v-model="groqKeyInput"
            type="password"
            placeholder="gsk_..."
            class="w-full px-3.5 py-2.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition shadow-xs"
          >
        </div>

        <div class="flex items-center justify-between pt-1">
          <span
            v-if="store.groqApiKey"
            class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"
          >
            <Check class="w-3.5 h-3.5" />
            Groq key saved
          </span>
          <span v-else class="text-xs text-muted-foreground">
            No Groq key saved (will fallback to OpenRouter key if set).
          </span>

          <Button
            variant="default"
            size="sm"
            class="font-bold cursor-pointer"
            @click="handleSaveGroqKey"
          >
            <Check v-if="isGroqSaved" class="w-3.5 h-3.5 text-emerald-400" />
            <span>{{ isGroqSaved ? 'Saved' : 'Save Groq Key' }}</span>
          </Button>
        </div>
      </div>
    </div>

    <!-- 4. Data Management: Backup, Restore & Reset Card -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <Database class="w-4 h-4 text-primary" />
          <span>Data Management</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Export your data to a ZIP file, restore from a backup file, or reset the app.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        <!-- Export Backup -->
        <Button
          size="lg"
          variant="outline"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12 border-border"
          :disabled="isExporting"
          @click="handleExport"
        >
          <Download class="w-4 h-4 text-primary" />
          <span>{{ isExporting ? 'Exporting...' : 'Export Backup (.zip)' }}</span>
        </Button>

        <!-- Restore Backup -->
        <Button
          size="lg"
          variant="outline"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12 border-border"
          :disabled="isImporting"
          @click="triggerRestore"
        >
          <Upload class="w-4 h-4 text-amber-500" />
          <span>{{ isImporting ? 'Restoring...' : 'Restore Backup' }}</span>
        </Button>

        <!-- Factory Reset -->
        <Button
          size="lg"
          variant="destructive"
          class="flex items-center justify-center gap-2 font-bold cursor-pointer h-12"
          :disabled="isResetting"
          @click="handleFactoryReset"
        >
          <RotateCcw class="w-4 h-4" />
          <span>{{ isResetting ? 'Resetting...' : 'Factory Reset' }}</span>
        </Button>

        <input
          ref="restoreInputRef"
          type="file"
          accept=".zip"
          class="hidden"
          @change="handleFileRestore"
        >
      </div>

      <div v-if="statusMessage" class="p-3 rounded-lg bg-muted text-xs font-medium text-foreground border border-border">
        {{ statusMessage }}
      </div>
    </div>

    <!-- 5. Usage Analytics (on-demand, computed from IndexedDB history) -->
    <div class="rounded-xl border border-border bg-card p-6 space-y-4 shadow-xs">
      <div class="space-y-1">
        <h2 class="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 class="w-4 h-4 text-primary" />
          <span>Usage Analytics</span>
        </h2>
        <p class="text-xs text-muted-foreground leading-relaxed">
          Live stats computed on the fly from your local recordings. No tracking — just your data.
        </p>
      </div>

      <div v-if="totalVersions === 0" class="rounded-lg border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-xs text-muted-foreground">
        No recordings yet. Record something and your stats will appear here.
      </div>

      <template v-else>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-lg border border-border bg-muted/30 px-3 py-3 space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
              <FileAudio class="w-3 h-3" /> Recordings
            </div>
            <div class="text-lg font-bold text-foreground">
              {{ totalRecordings }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              {{ comparisonSuites }} benchmark suites
            </div>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-3 py-3 space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
              <Layers class="w-3 h-3" /> Transcriptions
            </div>
            <div class="text-lg font-bold text-foreground">
              {{ totalVersions }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              {{ totalWords.toLocaleString() }} words · avg {{ avgWordsPerVersion }}/run
            </div>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-3 py-3 space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
              <Coins class="w-3 h-3" /> Est. cost
            </div>
            <div class="text-lg font-bold text-foreground">
              {{ fmtCost(totalCost) }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              OpenRouter pricing
            </div>
          </div>
          <div class="rounded-lg border border-border bg-muted/30 px-3 py-3 space-y-1">
            <div class="flex items-center gap-1.5 text-[10px] font-bold tracking-wide uppercase text-muted-foreground">
              <Clock class="w-3 h-3" /> Avg latency
            </div>
            <div class="text-lg font-bold text-foreground">
              {{ store.formatDuration(avgLatencyMs) }}
            </div>
            <div class="text-[11px] text-muted-foreground">
              per run · total {{ store.formatDuration(totalLatencyMs) }}
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 text-[11px] text-muted-foreground pt-1">
          <span class="inline-flex items-center gap-1"><Languages class="w-3 h-3" /> {{ translatedCount }} translated</span>
          <span class="text-border">·</span>
          <span class="inline-flex items-center gap-1"><Swords class="w-3 h-3" /> {{ comparisonSuites }} compares</span>
        </div>

        <div v-if="engineStats.length" class="space-y-2 pt-2 border-t border-border/60">
          <div class="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            By model
          </div>
          <div class="space-y-2">
            <div v-for="row in engineStats" :key="row.engine" class="space-y-1">
              <div class="flex items-center justify-between gap-3 text-xs">
                <span class="font-semibold text-foreground truncate">{{ row.shortName }}</span>
                <span class="text-muted-foreground shrink-0 tabular-nums">{{ row.count }} runs · {{ row.words.toLocaleString() }} words · {{ fmtCost(row.cost) }} · {{ store.formatDuration(row.avgLatency) }} avg</span>
              </div>
              <div class="h-1.5 rounded-full bg-muted overflow-hidden">
                <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${Math.round((row.count / maxEngineCount) * 100)}%` }" />
              </div>
              <div class="text-[10px] text-muted-foreground truncate">
                {{ row.engine }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Unboxed Clean Footer -->
    <div class="pt-4 text-center space-y-1">
      <p class="text-[11px] font-semibold text-muted-foreground">
        Maina Voice v0.1.0 — Desktop AI Voice Dictation & Multi-Model Benchmarking Application
      </p>
      <p class="text-[10px] text-muted-foreground/70">
        Powered by Vue 3, Vite, and OpenRouter AI APIs.
      </p>
    </div>
  </div>
</template>
