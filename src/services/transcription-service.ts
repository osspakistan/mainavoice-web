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
    description: 'Multilingual speech recognition with broad language support.',
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
    id: 'google/gemini-3.5-transcribe-preview',
    name: 'Google Gemini 3.5 Transcribe',
    provider: 'Google',
    costPerMin: 0.0,
    latencyGrade: 'fast',
    accuracyGrade: 'state-of-the-art',
    description: 'High-precision smart transcription with filler word removal and 85+ language support.',
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
  'groq/whisper-large-v3-turbo': 0.00067,
  'google/gemini-3.5-transcribe-preview': 0.0,
  'google/gemini-3.5-transcribe': 0.0,
  'google/gemini-2.5-flash': 0.0,
  'openai/gpt-transcribe': 0.0045,
  'deepgram/nova-3': 0.0043,
  'nvidia/parakeet-tdt-0.6b-v3': 0.0035,
  'fish-audio/transcribe-1': 0.0038,
}

async function audioBlobToWavBlob(blob: Blob): Promise<Blob> {
  try {
    const arrayBuffer = await blob.arrayBuffer()
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtx)
      return blob
    const audioContext = new AudioCtx()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

    const sampleRate = audioBuffer.sampleRate
    const numChannels = audioBuffer.numberOfChannels

    let channelData: Float32Array
    if (numChannels === 1) {
      channelData = audioBuffer.getChannelData(0)
    }
    else {
      const left = audioBuffer.getChannelData(0)
      const right = audioBuffer.getChannelData(1)
      channelData = new Float32Array(left.length)
      for (let i = 0; i < left.length; i++) {
        channelData[i] = 0.5 * ((left[i] ?? 0) + (right[i] ?? 0))
      }
    }

    const wavBuffer = new ArrayBuffer(44 + channelData.length * 2)
    const view = new DataView(wavBuffer)

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + channelData.length * 2, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Subchunk1Size
    view.setUint16(20, 1, true) // AudioFormat (PCM)
    view.setUint16(22, 1, true) // NumChannels (1 = Mono)
    view.setUint32(24, sampleRate, true) // SampleRate
    view.setUint32(28, sampleRate * 2, true) // ByteRate
    view.setUint16(32, 2, true) // BlockAlign
    view.setUint16(34, 16, true) // BitsPerSample
    writeString(36, 'data')
    view.setUint32(40, channelData.length * 2, true)

    let offset = 44
    for (let i = 0; i < channelData.length; i++, offset += 2) {
      const val = channelData[i] ?? 0
      const s = Math.max(-1, Math.min(1, val))
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
    }

    await audioContext.close()
    return new Blob([wavBuffer], { type: 'audio/wav' })
  }
  catch (e) {
    console.warn('WAV conversion fallback to original blob:', e)
    return blob
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8Array(buffer)
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i] ?? 0)
  }
  return window.btoa(binary)
}

export async function transcribeAudio(
  audioSource: Blob | string,
  modelId: string,
  openRouterApiKey: string,
  durationSeconds: number = 5,
  groqApiKey?: string,
  geminiApiKey?: string,
): Promise<TranscriptionVersion> {
  const startTime = Date.now()

  const isGroqModel = modelId.startsWith('groq/')
  const isGeminiModel = modelId.startsWith('google/')
  const effectiveApiKey = isGroqModel
    ? (groqApiKey || openRouterApiKey)
    : isGeminiModel
      ? (geminiApiKey || openRouterApiKey)
      : openRouterApiKey

  if (!effectiveApiKey || effectiveApiKey.trim() === '') {
    const keyName = isGroqModel
      ? 'Groq API Key (or OpenRouter Key)'
      : isGeminiModel
        ? 'Google Gemini API Key'
        : 'OpenRouter API Key'
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

    // Convert any browser recording (WebM/Ogg/etc.) to a clean 16-bit PCM WAV blob for 100% provider compatibility
    audioBlob = await audioBlobToWavBlob(audioBlob)

    // Handler for Google Gemini via Google AI Studio API with automatic model fallback
    if (isGeminiModel) {
      const base64Data = await blobToBase64(audioBlob)
      const candidateModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ]

      let textOutput = ''
      let lastError = ''

      for (const model of candidateModels) {
        try {
          const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${effectiveApiKey}`
          const response = await fetch(endpointUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      inlineData: {
                        mimeType: 'audio/wav',
                        data: base64Data,
                      },
                    },
                    {
                      text: 'Generate an accurate, verbatim, punctuated transcription of this audio. Output ONLY the raw transcript text without any conversational preamble or markdown codeblocks.',
                    },
                  ],
                },
              ],
            }),
          })

          if (response.ok) {
            const json = await response.json()
            textOutput = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
            if (textOutput)
              break
          }
          else {
            const errText = await response.text()
            try {
              const errJson = JSON.parse(errText)
              lastError = errJson.error?.message || `HTTP ${response.status}: ${response.statusText}`
            }
            catch {
              lastError = `HTTP ${response.status}: ${response.statusText}`
            }
          }
        }
        catch (e: any) {
          lastError = e?.message || String(e)
        }
      }

      if (!textOutput) {
        throw new Error(lastError || 'No transcript text was returned by Google Gemini API.')
      }

      textOutput = autoTransliterateIfUrduRegion(textOutput)

      const latencyMs = Date.now() - startTime
      const wordCount = textOutput.trim().split(/\s+/).filter(Boolean).length
      const costEstimate = 0.0

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

    const form = new FormData()
    form.append('file', audioBlob, 'recording.wav')

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
