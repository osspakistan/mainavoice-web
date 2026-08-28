# Maina Voice

A browser-based voice transcription app that lets you record audio, send it to cloud speech-to-text models, and compare their speed and accuracy side by side. Everything stays local: no server, no account, no background telemetry.

By [Awais Alwaisy](https://alwaisy.dev) &nbsp;|&nbsp; [Maina Voice](https://mainavoice.alwaisy.dev) &nbsp;|&nbsp; MIT License

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Vue 3](https://img.shields.io/badge/Vue-3-42b883.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6.svg)

---

## Launch

Maina Voice publicly launched on **August 12, 2026**.

### Directory listings

| Directory | Status | Submitted |
| --- | --- | --- |
| [WhatAreYouBuilding.ai](https://whatareyoubuilding.ai/product/jbsvccMXkLu7hYPXc10F) | Live | Aug 28, 2026 |
| [TinyLaunch](https://www.tinylaunch.com/launch/20717) | Scheduled for Sep 28, 2026 | Aug 28, 2026 |
| SubmitForBacklinks | In review, launch week of Oct 5, 2026 | Aug 28, 2026 |

## What it does

**Record mode**: Pick a speech model, record your voice, and get a transcript. Re-transcribe the same recording with another model whenever you want to compare outputs without speaking twice.

**Benchmark mode**: Run multiple models on the same audio clip simultaneously to see which finishes first and check the exact speed ratio between them.

**History**: Saves every transcription locally with full version tracking. Re-transcribe as many times as you like without losing older attempts. You can diff, copy, or clean them up anytime.

**Backup and restore**: Export your recordings, transcripts, and settings to a ZIP archive. Filenames include your local time and timezone so you always know when a backup was taken.

## Usage analytics & cost analysis

![Usage Analytics](./docs/images/usage-analytics.png)

### Word-by-word cost breakdown: Wispr Flow vs. Maina Voice

| Usage scale | Monthly words | Estimated audio time | Wispr Flow Pro | Maina Voice (OpenRouter API) | Your monthly savings |
| --- | --- | --- | --- | --- | --- |
| **Light dictation** | **2,000 words** | ~15 minutes | **\$0.00** *(Free tier cap limit)* | **~\$0.05** | *Free tier cap hit on Flow* |
| **Casual user** | **10,000 words** | ~1.2 hours | **\$15.00** / mo ($180/yr) | **~\$0.27** | **Save \$14.73 / month (98.2%)** |
| **Power dictator** | **30,000 words** | ~3.5 hours | **\$15.00** / mo ($180/yr) | **~\$0.81** | **Save \$14.19 / month (94.6%)** |
| **Heavy professional** | **100,000 words** | ~12 hours | **\$15.00** / mo ($180/yr) | **~\$2.70** | **Save \$12.30 / month (82.0%)** |
| **Enterprise / Heavy** | **250,000 words** | ~30 hours | **\$15.00** + team upsell | **~\$6.75** | **Save \$8.25 / month (55.0%)** |

> *Note: Maina Voice costs come directly from live benchmarked usage in the dashboard image above (~2,594 words processed for \$0.07 across OpenAI GPT-Transcribe, Fish Audio Transcribe-1, Deepgram Nova-3, and NVIDIA Parakeet).*

### Why Maina Voice beats Wispr Flow

1. **Pay only for what you use**: Wispr Flow charges **\$15/month (\$144/year)** regardless of whether you speak 500 words or 50,000 words. Maina Voice uses pay-as-you-go pricing, so light users pay cents instead of a full monthly bill.
2. **No word caps or forced upgrades**: Wispr Flow caps free accounts at **2,000 words per week** (roughly 15 minutes of audio). Maina Voice puts no limits on your usage because you connect your own OpenRouter key directly.
3. **Multi-model benchmarking**: Wispr Flow ties you to a single closed stack. Maina Voice lets you choose between 4+ providers (OpenAI, Deepgram, NVIDIA, Fish Audio) and benchmark them head-to-head.
4. **Local data storage**: Wispr Flow syncs your audio and text to cloud servers under a user account. Maina Voice stores everything in your browser's IndexedDB. Audio goes straight to OpenRouter over HTTPS and nowhere else.

### How the audio-to-word math works

If someone asks how word counts translate into audio duration:

#### 1. Speech rate baseline
Average conversational dictation sits around **150 Words Per Minute (WPM)**.
- **Words per second (WPS)**: $150 \div 60 = 2.5\text{ words/sec}$
- **Seconds per word**: $1 \div 2.5 = 0.4\text{ seconds/word}$

#### 2. Conversion formulas
$$\text{Estimated Audio Minutes} = \frac{\text{Total Words}}{150\text{ WPM}}$$

$$\text{Estimated Words} = \text{Audio Seconds} \times 2.5$$

#### 3. Real cost benchmarks from live data
- **Sample run**: 24 runs, **2,594 words**, total audio ~365 seconds (~6.08 minutes).
- **Total OpenRouter cost**: **\$0.07 total** across all four models.
- **Unit metrics**:
  $$\text{Cost per 1,000 words} = \frac{\$0.07}{2,594} \times 1,000 = \$0.027$$
  $$\text{Cost per minute of audio} = \frac{\$0.07}{6.08\text{ mins}} = \$0.0115$$

#### 4. Real-world cost comparison

| Category | Words / Month | Formula | Audio Time | Maina Voice (OpenRouter API) | Wispr Flow Flat Fee |
| --- | --- | --- | --- | --- | --- |
| **Casual** | 10,000 words | $10,000 \div 150\text{ WPM}$ | ~66.6 mins (~1.1 hrs) | **~\$0.27** | **\$15.00** |
| **Moderate** | 30,000 words | $30,000 \div 150\text{ WPM}$ | ~200 mins (~3.3 hrs) | **~\$0.81** | **\$15.00** |
| **Heavy** | 100,000 words | $100,000 \div 150\text{ WPM}$ | ~666 mins (~11.1 hrs) | **~\$2.70** | **\$15.00** |

## Supported models & price analysis

Maina Voice connects to both [OpenRouter](https://openrouter.ai) and direct provider APIs (such as [Groq](https://groq.com)), giving you direct access to the top speech-to-text models.

### Model pricing & performance breakdown

| Speech Model | Provider | Latency Grade | Accuracy Grade | Cost per Min | Cost per Hour | Status & Rank |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Transcribe-1** | Fish Audio | Fast | Very High | **$0.0038** | **$0.228** | 🥇 **#1 Best Overall Accuracy** |
| **GPT-Transcribe** | OpenAI | Fast | State-of-the-Art | **$0.0045** | **$0.270** | 🥈 **#2 High Precision** |
| **Whisper Large v3 Turbo** | Groq | Blazing | Very High | **$0.00067** | **$0.040** | ⚡ **#3 Ultra-Fast & Cheapest ($0.04/hr)** |
| **Nova-3** | Deepgram | Ultra-Fast | Very High | **$0.0043** | **$0.258** | 🟡 **Standard Cloud API** |
| **Parakeet TDT v3** | NVIDIA | Ultra-Fast | High | **$0.0035** | **$0.210** | 🟢 **Lightweight Model** |

> **Key takeaway**: **Groq Whisper Large v3 Turbo** offers sub-300ms latency at **$0.04/hr** (up to 9x cheaper than standard APIs with 2,000 free requests/day). However, benchmark testing shows **Fish Audio Transcribe-1** and **OpenAI GPT-Transcribe** consistently rank higher in raw transcription accuracy and nuance handling, placing Groq in 3rd position for overall output quality.

## What's Next / Roadmap

We are continuously benchmarking and expanding Maina Voice to evaluate the absolute best speech-to-text APIs in the industry:

- [ ] **Benchmark & Integrate Top STT APIs (Gladia, etc.)**: Benchmark and evaluate industry leaders (as discussed in [Awais Alwaisy's update](https://x.com/alvaisy/status/2063534975853670573) and [Gladia's STT API landscape study](https://www.gladia.io/blog/best-speech-to-text-apis)) to integrate the highest-accuracy real-time engines.
- [x] **Groq LPU Direct Integration**: Native support for Groq API keys (`https://api.groq.com/openai/v1/audio/transcriptions`) for $0.04/hr Whisper Large v3 Turbo transcriptions.
- [ ] **Custom OpenAI-Compatible Endpoints**: Allow users to specify custom API Base URLs (for local Ollama, vLLM, or self-hosted Whisper microservices).
- [ ] **Global Hotkey Dictation**: Desktop system-wide hold-to-talk keybindings for immediate pasting into active windows.
- [ ] **Advanced LLM Post-Processing & Cleanup**: Custom background cleanup prompts for fixing punctuation, filler words ("uh", "um"), and domain jargon using local or cloud LLMs.

## Tech stack

- [Vue 3](https://vuejs.org) with Composition API (`<script setup>`)
- [Vite](https://vite.dev) as the build tool
- [TypeScript](https://www.typescriptlang.org) in strict mode
- [Tailwind CSS v4](https://tailwindcss.com) via `@tailwindcss/vite`
- [Pinia](https://pinia.vuejs.org) for state management
- [Reka UI](https://reka-ui.com) for accessible UI primitives
- [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) for local storage (no backend)
- [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) for audio conversion

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 9+
- An [OpenRouter](https://openrouter.ai) API key

### Install and run

```bash
git clone https://github.com/alwaisy/mainavoice-web.git
cd mainavoice
pnpm install
pnpm dev
```

Open the app in your browser, head to Settings, and paste your OpenRouter API key.

### Build for production

```bash
pnpm build
pnpm preview
```

## Project structure

```
src/
  assets/       Global styles and Tailwind setup
  components/   UI components and dialogs
    ui/         Primitive components (Reka UI wrappers)
  i18n/         Localization files
  layouts/      Shared layout components
  lib/          Utility functions
  pages/        Page views (Record, Compare, History, Settings, Audio Detail)
  router/       Route definitions
  schemas/      Zod validation schemas
  services/     Transcription, transliteration, backup, and DB logic
  stores/       Pinia stores
public/         Static assets, icons, PWA manifest
```

## How the audio pipeline works

The browser's `MediaRecorder` API captures microphone input directly as lightweight WebM Opus (or Ogg/MP4 depending on browser). Maina Voice streams this compact audio payload directly to OpenRouter and Groq endpoints (`/audio/transcriptions`), minimizing network latency and delivering sub-second transcription speeds without client-side CPU bloat.

Transcriptions stream asynchronously and independently per model slot, rendering each card the millisecond its result arrives.

## Data and privacy

Your audio only leaves your device when you explicitly submit a recording for transcription. All recordings, transcripts, and configuration settings stay in IndexedDB (`mainavoice_indexeddb`). The app runs no telemetry, tracking scripts, or remote database logging.

Your OpenRouter API key is stored locally in IndexedDB and attached to requests via HTTP `Authorization: Bearer` headers. It is sent exclusively to OpenRouter endpoints.

## Transliteration

When transcribed text includes Devanagari script, Maina Voice can convert it to Urdu. This works offline using a character map in `transliteration-service.ts` and can be enabled or disabled in Settings.

## Contributing

Run validation before submitting a pull request:

```bash
pnpm check   # runs lint:fix, lint, and typecheck in sequence
```

Available commands:

```bash
pnpm dev          # start dev server
pnpm build        # production build
pnpm lint         # lint only
pnpm lint:fix     # auto-fix lint issues
pnpm typecheck    # type check only
pnpm clean        # remove build artifacts
pnpm shadcn       # add a Reka UI component
```

Contribution guidelines:

- Write commits using [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `chore:`, `docs:`).
- Keep PRs green with `pnpm check`.
- Use `<script setup>` syntax exclusively.
- Follow `@antfu/eslint-config` formatting (2 spaces, single quotes, no semicolons).
- Route state modifications through Pinia actions.

## License

MIT. See [LICENSE.md](./LICENSE.md).
