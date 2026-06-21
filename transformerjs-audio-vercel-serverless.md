# Hosting a Transformers.js Audio Application on Vercel Serverless

To host a **Transformers.js** audio application on **Vercel Serverless**, you must strictly separate the frontend architecture from Vercel's backend.

Vercel Serverless Functions have:

- **50 MB maximum deployment size**
- **30-second execution timeout** (Free Tier)

Since AI models are typically hundreds of megabytes in size, they **cannot run inside Vercel Serverless Functions**.

Instead, models must be:

- Downloaded directly by the browser
- Executed entirely on the client side
- Cached locally in the browser

This approach completely bypasses Vercel's serverless limitations.

---

# 1. Client-Side Architecture

```text
                  ┌────────────────────────────────────────┐
                  │          Vercel Edge Network           │
                  └──────────────────┬─────────────────────┘
                                     │
                                     │ Serves static assets
                                     ▼
                  ┌────────────────────────────────────────┐
                  │       User's Browser (Client)          │
                  │                                        │
                  │  ┌──────────────────────────────────┐  │
                  │  │          Next.js UI Thread       │  │
                  │  │  Audio Recorder / Playback UI    │  │
                  │  └──────────────────┬───────────────┘  │
                  │                     │                  │
                  │          PostMessage│Bi-directional    │
                  │                     ▼                  │
                  │  ┌──────────────────────────────────┐  │
                  │  │         Web Worker Thread        │  │
                  │  │   Prevents UI freeze/stutter     │  │
                  │  │                                  │  │
                  │  │   ┌───────────────────────────┐  │  │
                  │  │   │     Transformers.js       │  │  │
                  │  │   └──────────────┬────────────┘  │  │
                  │  │                  │               │  │
                  │  │                  ▼               │  │
                  │  │   ┌───────────────────────────┐  │  │
                  │  │   │    ONNX Runtime Web       │  │  │
                  │  │   │  WebGPU / WASM Engine     │  │  │
                  │  │   └──────────────┬────────────┘  │  │
                  │  └──────────────────┼───────────────┘  │
                  └─────────────────────┼──────────────────┘
                                        │
                                        │ Downloads ONNX Model
                                        │ (First load only)
                                        ▼
                  ┌────────────────────────────────────────┐
                  │       Hugging Face CDN or             │
                  │         Vercel Blob Storage           │
                  └────────────────────────────────────────┘
```

## Key Principle

All AI inference runs inside the browser:

- UI rendering → Next.js Client Components
- Model execution → Web Worker
- Hardware acceleration → WebGPU or WASM
- Model storage → IndexedDB cache

No inference is executed on Vercel servers.

---

# 2. Recommended Next.js App Router Structure

Organize the project so that machine learning workloads are fully isolated from server-side rendering (SSR).

```text
my-audio-app/
├── app/
│   ├── layout.tsx
│   └── page.tsx
│       # Next.js Client Component UI
│
├── workers/
│   └── audio.worker.ts
│       # Browser-side ML computation
│
├── components/
│   └── AudioInterface.tsx
│
└── package.json
```

---

# 3. Critical Configuration

## Next.js Configuration (`next.config.mjs`)

Some ONNX Runtime dependencies expect Node.js modules such as `fs`, `path`, or `crypto`.

These modules do not exist in the browser and must be disabled during client-side builds.

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
```

---

## Dynamic Import Without SSR

Because the application relies on browser-only APIs such as:

- `navigator.mediaDevices`
- `window`
- `Web Workers`
- `WebGPU`

the speech interface should be loaded with SSR disabled.

### `app/page.tsx`

```tsx
import dynamic from 'next/dynamic';

const AudioInterface = dynamic(
  () => import('@/components/AudioInterface'),
  {
    ssr: false,
  }
);

export default function Page() {
  return <AudioInterface />;
}
```

This ensures the component is never executed on Vercel's servers.

---

# 4. Runtime Execution Lifecycle

## 1. Static Deployment

Vercel builds the application into:

- HTML
- CSS
- JavaScript bundles

No AI models are included in the deployment artifact.

---

## 2. Initial Page Load

The user opens the application URL.

Vercel Edge Network delivers:

- Static assets
- Client-side JavaScript bundles

---

## 3. Worker Initialization

The `AudioInterface` component creates a dedicated Web Worker:

```text
AudioInterface
        │
        ▼
audio.worker.ts
```

All inference workloads are delegated to this worker thread.

---

## 4. Model Download & Caching

Transformers.js downloads required models (e.g., Whisper or MMS) directly from:

- Hugging Face CDN
- Vercel Blob Storage

The model files are then cached inside:

```text
IndexedDB
```

Subsequent visits reuse the cached model and avoid re-downloading.

---

## 5. Audio Processing

When the user records speech:

```text
Microphone Audio
        │
        ▼
Web Worker
        │
        ▼
Transformers.js
        │
        ▼
ONNX Runtime Web
        │
        ▼
WebGPU / WASM
```

Inference runs entirely on the user's device.

---

## 6. Result Delivery

The worker returns transcription results to the UI via `postMessage`.

```text
Web Worker
        │
        ▼
postMessage()
        │
        ▼
Next.js UI
```

The UI updates immediately without blocking rendering.

---

# Production Benefits

## Scalability

- Zero server-side inference cost
- Unlimited concurrent users
- No GPU infrastructure required

## Performance

- Web Worker prevents UI freezing
- WebGPU acceleration when available
- IndexedDB eliminates repeated model downloads

## Vercel Compatibility

- No serverless execution limits
- No model-size restrictions
- No API timeout concerns

## User Experience

- Fast startup after first model download
- Offline-capable model cache
- Smooth audio recording and transcription

---

# Recommended Technology Stack

| Layer | Technology |
|---------|------------|
| Frontend | Next.js App Router |
| UI | React |
| Background Processing | Web Worker |
| AI Runtime | Transformers.js |
| Inference Engine | ONNX Runtime Web |
| Hardware Acceleration | WebGPU / WASM |
| Model Storage | IndexedDB |
| Model Hosting | Hugging Face CDN / Vercel Blob |
| Deployment | Vercel |

---

# Final Architecture Summary

```text
Vercel
 └── Serves Static Assets

Browser
 ├── Next.js UI
 ├── Web Worker
 ├── Transformers.js
 ├── ONNX Runtime Web
 ├── WebGPU / WASM
 └── IndexedDB Cache

Model Source
 └── Hugging Face CDN / Vercel Blob
```

This architecture is the recommended production approach for running **Transformers.js audio applications on Vercel**, as it keeps all AI inference inside the browser while allowing Vercel to function purely as a static asset delivery platform.