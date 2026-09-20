# Issue #6: bounded voice recording

## Implementation and automated evidence

- MIME negotiation prefers WebM/Opus, then Ogg/Opus. MP4 is selected only when those are unavailable and the browser reports MP4 support. If construction rejects bitrate options, retry with the selected MIME; if that also fails, use the browser's native encoder. Blob and transcription use the actual recorder/chunk MIME, never an assumed WebM label.
- `AUDIO_BITS_PER_SECOND = 24_000`: 30 seconds × 24,000 bits/second ÷ 8 = **90,000 payload bytes**, leaving 60,000 bytes for overhead against the conservative **150,000-byte** acceptance target. The request is a policy, not a measured encoder guarantee. AAC/native fallback or a browser that ignores bitrate may exceed the target; do not mark size acceptance complete without measuring.
- The recorder owns the 90-second deadline, stops the encoder and microphone tracks once, and shares one result promise between manual and automatic Stop. Cancellation rejects with `AbortError` and aborts pending transcription. Startup failures and permission grants arriving after unmount also release tracks.
- Browsers do not expose a MediaRecorder hardware duration cap. JavaScript timers can be delayed by a blocked/suspended event loop. Recording also stops on `visibilitychange` when the page becomes hidden, reducing background capture risk. This is a recorder-owned automatic boundary, **not a guaranteed hardware deadline under OS suspension**.
- `useAudioLevelMeter(stream)` owns the analyser/context/animation lifecycle and observes, but never stops, the supplied tracks. Its 0–100 RMS display is a relative voice level, not calibrated sound-pressure dB. Suspended/unavailable AudioContext yields zero safely.
- All five recorder callers use the shared session hook so pending permission, unmount, automatic completion and playback URL ownership remain consistent. Registration shows elapsed/max time, a warning from 75 seconds, processing state and automatic-stop feedback. Existing client speech recognition and `/api/transcribe-audio` fallback remain in use; no new recording destination or analytics is added.

Run from the repository root:

```sh
npm install
npm run lint   # tsc --noEmit
npm test       # tsx --test 'src/**/__tests__/**/*.test.ts'
npm run build
```

The repository previously had no tests or test script. Tests use its existing `tsx` and Node's `node:test`/assert/mocks; the only added test dependency is `jsdom` for actual React DOM lifecycle and registration interaction tests. No separate test framework is introduced. The lockfile remains ignored per existing repository policy.

Coverage includes MIME ordering and construction retries, actual MIME propagation, bitrate policy, deadline/manual/cancel races, startup/encoder/FileReader failure, microphone cleanup, transcription preservation/cancellation, analyser lifecycle, React StrictMode/unmount, delayed permission grants, modal close, repeated clicks and registration auto-save feedback. Encoder mocks test orchestration only; fixture Blob sizes are **not** codec-compression evidence.

## iPhone Safari and Android Chrome checklist (not yet physically verified)

1. Run `npm run dev` and open the app through a **trusted HTTPS URL** on the phone (plain `http://<computer-LAN-IP>:3000` cannot provide microphone access). An existing HTTPS preview works. For a temporary preview, if Cloudflare Tunnel is installed, run `cloudflared tunnel --url http://localhost:3000` and open its printed HTTPS URL; stop that process when finished. Use the app's normal configuration if checking server transcription.
2. In the main menu, tap **“Probar y medir micrófono”**. Allow microphone access. Speak naturally for **30 seconds**, then Stop. The diagnostic now displays exact **bytes and actual MIME type** next to the duration. Record device model, OS/browser version, MIME, duration and byte count. Require **≤150,000 bytes**. Repeat with continuous speech and pauses; MP4/AAC must be measured separately from Opus.
3. Tap **“Escuchar mi voz grabada”**. Confirm audible, understandable speech without clipped syllables. For indigenous-variant acceptance, have a fluent speaker assess representative words/phoneme distinctions; transcription accuracy alone is not proof of vocal comprehension.
4. Open a product's registration screen and record for 90 seconds. Confirm elapsed time `/ 1:30`, warning from 75 seconds, automatic-stop message, one saved playable note, and that the OS microphone-use indicator clears. Repeat Stop just before/at the limit and rapidly tap Stop twice.
5. Start again, then navigate away or close the diagnostic. Repeat while the permission prompt is pending, then grant permission. Confirm no continuing microphone capture. Hide the browser/lock the phone while recording; verify early automatic stop and usable audio on return. Check for OS suspension behavior on both devices.
6. Deny permission, retry after allowing it, record repeatedly, and test with transcription unavailable/offline. Audio playback should remain usable. Verify existing speech text and configured server transcription separately.

| Device | OS / browser | 30s actual MIME | Bytes | Speech clarity | 90s / cleanup |
| --- | --- | --- | --- | --- | --- |
| iPhone | Pending | Pending | Pending | Pending | Pending |
| Android | Pending | Pending | Pending | Pending | Pending |

**Acceptance status:** automated policy, lifecycle and UI behavior are verified by tests; actual-device file size, comprehension and dual-engine compatibility remain pending. No claim of physical iOS Safari or Android Chrome verification is made.

References: [MediaStream Recording specification](https://www.w3.org/TR/mediastream-recording/) (bitrate is an encoder hint), [WebKit's MediaRecorder implementation notes](https://webkit.org/blog/11353/mediarecorder-api/) (MP4/AAC and capability detection). Runtime probing, not a browser-name assumption, decides the format.
