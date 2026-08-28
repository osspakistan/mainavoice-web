# Implementation Plan: Google Gemini 3.5 Transcribe Integration

## Overview
Integrate Google's new **Gemini 3.5 Transcribe** (`gemini-3.5-transcribe-preview`) into Maina Voice using the **Google AI Studio API** (free tier). This allows users to transcribe recordings and benchmark Gemini 3.5 Transcribe against OpenAI GPT-Transcribe, Deepgram Nova-3, Groq Whisper Turbo, and Fish Audio.

---

## Technical Specifications

| Parameter | Specification |
| :--- | :--- |
| **Model ID** | `google/gemini-3.5-transcribe-preview` |
| **Model Name** | `Google Gemini 3.5 Transcribe` |
| **Provider** | `Google` |
| **Endpoint** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe-preview:generateContent` |
| **Authentication** | `?key=${geminiApiKey}` or `x-goog-api-key: ${geminiApiKey}` |
| **Input Format** | Base64-encoded 16-bit PCM Mono WAV (`inlineData: { mimeType: 'audio/wav', data: base64 }`) |
| **Cost Per Min** | `$0.00` (Free Tier in Google AI Studio) |
| **Latency Grade** | `fast` |
| **Accuracy Grade** | `state-of-the-art` |

---

## Execution Steps

### 1. State & Storage Management (`maina-store.ts`)
* Add `geminiApiKey` reactive ref in `useMainaStore()`.
* Persist `geminiApiKey` in `localStorage` and browser `IndexedDB` (`settings` store).
* Expose `setGeminiApiKey()` action for updating the key.

### 2. Settings View (`settings-page.vue`)
* Add a dedicated **Google Gemini API Key** configuration card alongside OpenRouter and Groq.
* Provide quick link to [Google AI Studio API Keys](https://aistudio.google.com/app/apikey).
* Add test connection / save feedback state (`isGeminiSaved`).

### 3. Audio Pipeline & API Handler (`transcription-service.ts`)
* Add `google/gemini-3.5-transcribe-preview` to `ALL_MODELS` array (without badge).
* Add pricing entry (`0.00`) to `PRICE_PER_MIN`.
* Update `transcribeAudio()` signature to accept optional `geminiApiKey?: string`.
* Implement Gemini REST caller:
  1. Convert WAV audio blob to Base64 string via `FileReader` / `arrayBuffer`.
  2. Send request to `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe-preview:generateContent?key=${geminiApiKey}`.
  3. Extract generated transcript text from `candidates[0].content.parts[0].text`.
  4. Apply regional Urdu/Hindi transliteration filter if in Urdu region.
  5. Compute latency, word count, and return standard `TranscriptionVersion` object.

### 4. Page View Integrations
* **`record-page.vue`**: Pass `store.geminiApiKey` to `transcribeAudio()`.
* **`compare-page.vue`**: Pass `store.geminiApiKey` to `transcribeAudio()` so users can benchmark Gemini 3.5 Transcribe head-to-head with any other engine.
* **`audio-detail-page.vue`**: Pass `store.geminiApiKey` when re-transcribing with different versions.

---

## Verification & Testing
1. **Type Check**: Run `pnpm typecheck` to verify all store contracts and service signatures.
2. **Audio Dispatch Test**: Record 5-second audio and verify transcript returned from Gemini AI Studio API.
3. **Dual Engine Benchmark Test**: Run side-by-side comparison between `Google Gemini 3.5 Transcribe` and `Groq Whisper Turbo`.
4. **Fallback & Error Handling**: Test missing API key state (clear UI guidance pointing to Settings).
