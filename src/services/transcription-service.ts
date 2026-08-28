import type { TranscriptionVersion } from '@/stores/maina-store'
import { autoTransliterateIfUrduRegion } from './transliteration-service'

export interface ModelInfo {
  id: string
  name: string
  provider: string
  costPerMin: number
  latencyGrade: 'ultra-fast' | 'fast' | 'balanced'
  accuracyGrade: 'high' | 'very-high' | 'state-of-the-art'
  description: string
  badge?: string
}

export const ALL_MODELS: ModelInfo[] = [
  {
    id: 'fish-audio/transcribe-1',
    name: 'Fish Audio Transcribe-1',
    provider: 'Fish Audio',
    costPerMin: 0.0038,
    latencyGrade: 'fast',
    accuracyGrade: 'very-high',
    description: 'Raw verbatim multilingual speech recognition with broad language support.',
    badge: 'Best Accuracy & Winner',
  },
  {
    id: 'openai/gpt-transcribe',
    name: 'OpenAI GPT-Transcribe',
    provider: 'OpenAI',
    costPerMin: 0.0045,
    latencyGrade: 'fast',
    accuracyGrade: 'state-of-the-art',
    description: 'High-accuracy whisper & multimodal transcription engine.',
  },
  {
    id: 'google/gemini-3.5-transcribe',
    name: 'Google Gemini 3.5 Transcribe',
    provider: 'Google',
    costPerMin: 0.0,
    latencyGrade: 'fast',
    accuracyGrade: 'state-of-the-art',
    description: 'High-precision speech transcription with filler word removal and 85+ language support.',
  },
  {
    id: 'groq/whisper-large-v3-turbo',
    name: 'Groq Whisper Large v3 Turbo',
    provider: 'Groq',
    costPerMin: 0.00067,
    latencyGrade: 'ultra-fast',
    accuracyGrade: 'very-high',
    description: 'Blazing sub-300ms LPU transcription at $0.04/hr with a generous free tier.',
    badge: 'Cheapest & Fastest',
  },
  {
    id: 'deepgram/nova-3',
    name: 'Deepgram Nova-3',
    provider: 'Deepgram',
    costPerMin: 0.0043,
    latencyGrade: 'ultra-fast',
    accuracyGrade: 'very-high',
    description: 'Blazing fast low-latency streaming & batch speech engine.',
  },
  {
    id: 'nvidia/parakeet-tdt-0.6b-v3',
    name: 'NVIDIA Parakeet TDT v3',
    provider: 'NVIDIA',
    costPerMin: 0.0035,
    latencyGrade: 'ultra-fast',
    accuracyGrade: 'high',
    description: 'Ultra lightweight speech recognition model optimized for speed.',
  },
]

export function getSortedModels(defaultModelId?: string): ModelInfo[] {
  if (!defaultModelId)
    return [...ALL_MODELS]
  const defaultModel = ALL_MODELS.find(m => m.id === defaultModelId)
  if (!defaultModel)
    return [...ALL_MODELS]
  const rest = ALL_MODELS.filter(m => m.id !== defaultModelId)
  return [defaultModel, ...rest]
}

const PRICE_PER_MIN: Record<string, number> = {
  'openai/gpt-transcribe': 0.0045,
  'fish-audio/transcribe-1': 0.0038,
  'google/gemini-3.5-transcribe': 0.0,
  'google/gemini-3.5-transcribe-preview': 0.0,
  'groq/whisper-large-v3-turbo': 0.00067,
  'deepgram/nova-3': 0.0043,
  'nvidia/parakeet-tdt-0.6b-v3': 0.0035,
}

export async function transcribeAudio(
  audioSource: Blob | string,
  modelId: string,
  openRouterApiKey: string,
  durationSeconds: number = 5,
  groqApiKey?: string,
  _geminiApiKey?: string,
): Promise<TranscriptionVersion> {
  const startTime = Date.now()

  const isGroqModel = modelId.startsWith('groq/')
  const isGeminiModel = modelId.startsWith('google/')
  const effectiveApiKey = isGroqModel
    ? (groqApiKey || openRouterApiKey)
    : openRouterApiKey

  if (!effectiveApiKey || effectiveApiKey.trim() === '') {
    const keyName = isGroqModel ? 'Groq API Key (or OpenRouter Key)' : 'OpenRouter API Key'
    return {
      versionNumber: 1,
      engineName: modelId,
      text: `Please set your ${keyName} in Settings to transcribe audio using cloud AI models.`,
      latencyMs: 15,
      wordCount: 0,
      costEstimate: 0.0,
      timestamp: new Date().toISOString(),
    }
  }

  try {
    let audioBlob: Blob

    if (audioSource instanceof Blob) {
      audioBlob = audioSource
    }
    else if (typeof audioSource === 'string') {
      const res = await fetch(audioSource)
      audioBlob = await res.blob()
    }
    else {
      throw new TypeError('Invalid audio source provided to transcribeAudio')
    }

    // Route google/gemini-3.5-transcribe through OpenRouter audio transcriptions endpoint
    // (gemini-3.5-transcribe is a dedicated STT model, not a generateContent multimodal model)
    if (isGeminiModel) {
      const form = new FormData()
      form.append('file', audioBlob, 'recording.webm')
      form.append('model', 'google/gemini-3.5-transcribe')

      const response = await fetch('https://openrouter.ai/api/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${effectiveApiKey}`,
          'HTTP-Referer': 'https://mainavoice.lat',
          'X-Title': 'Maina Voice Web App',
        },
        body: form,
      })

      if (!response.ok) {
        const errText = await response.text()
        let msg = `HTTP ${response.status}`
        try {
          msg = JSON.parse(errText)?.error?.message || msg
        }
        catch {}
        throw new Error(`Google Gemini Error: ${msg}`)
      }

      const json = await response.json()
      let textOutput = (json.text || '').trim()

      if (!textOutput)
        throw new Error('Google Gemini returned an empty transcript.')

      textOutput = autoTransliterateIfUrduRegion(textOutput)
      const latencyMs = Date.now() - startTime
      const wordCount = textOutput.trim().split(/\s+/).filter(Boolean).length

      return {
        versionNumber: 1,
        engineName: modelId,
        text: textOutput,
        latencyMs,
        wordCount,
        costEstimate: 0.0,
        timestamp: new Date().toISOString(),
      }
    }

    const form = new FormData()
    const rawType = audioBlob.type || ''
    const ext = rawType.includes('webm') ? 'webm' : rawType.includes('ogg') ? 'ogg' : rawType.includes('mp4') ? 'mp4' : 'wav'
    form.append('file', audioBlob, `recording.${ext}`)

    let endpointUrl = 'https://openrouter.ai/api/v1/audio/transcriptions'
    const headers: Record<string, string> = {
      Authorization: `Bearer ${effectiveApiKey}`,
    }

    if (isGroqModel) {
      endpointUrl = 'https://api.groq.com/openai/v1/audio/transcriptions'
      const actualGroqModel = modelId.replace('groq/', '')
      form.append('model', actualGroqModel)
    }
    else {
      form.append('model', modelId)
      headers['HTTP-Referer'] = 'https://mainavoice.lat'
      headers['X-Title'] = 'Maina Voice Web App'
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: form,
    })

    if (!response.ok) {
      const errText = await response.text()
      const providerName = isGroqModel ? 'Groq' : 'OpenRouter'
      let errorMsg = `${providerName} HTTP ${response.status}: ${response.statusText}`
      try {
        const errJson = JSON.parse(errText)
        if (errJson.error?.message) {
          errorMsg = `${providerName} Error: ${errJson.error.message}`
        }
      }
      catch {}
      throw new Error(errorMsg)
    }

    const json = await response.json()
    let textOutput = json.text || json.transcript || json.choices?.[0]?.message?.content || 'Transcription completed, but no text output was returned.'

    // Auto-transliterate Devanagari Hindi -> Perso-Arabic Urdu if user is in Pakistan / Urdu region
    textOutput = autoTransliterateIfUrduRegion(textOutput)

    const latencyMs = Date.now() - startTime
    const wordCount = textOutput.trim().split(/\s+/).filter(Boolean).length
    const costEstimate = (durationSeconds / 60) * (PRICE_PER_MIN[modelId] || 0.0045)

    return {
      versionNumber: 1,
      engineName: modelId,
      text: textOutput,
      latencyMs,
      wordCount,
      costEstimate,
      timestamp: new Date().toISOString(),
    }
  }
  catch (err: any) {
    return {
      versionNumber: 1,
      engineName: modelId,
      text: `Transcription Error: ${err?.message || err}`,
      latencyMs: Date.now() - startTime,
      wordCount: 0,
      costEstimate: 0.0,
      timestamp: new Date().toISOString(),
    }
  }
}

export async function translateToEnglish(text: string, apiKey: string): Promise<string> {
  if (!text || text.trim() === '' || text.startsWith('Please set') || text.startsWith('Transcription Error')) {
    return text
  }
  if (!apiKey || apiKey.trim() === '') {
    return 'Please set your OpenRouter API Key in Settings to translate text.'
  }

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mainavoice.lat',
        'X-Title': 'Maina Voice Web App',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.7-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert translator. Translate the provided audio transcript into fluent English. Preserve the original meaning and formatting. Respond ONLY with the direct English translation.',
          },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`OpenRouter HTTP ${res.status}: ${errText}`)
    }

    const json = await res.json()
    return json.choices?.[0]?.message?.content?.trim() || text
  }
  catch (err: any) {
    return `Translation Error: ${err?.message || err}`
  }
}
