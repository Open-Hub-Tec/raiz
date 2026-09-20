# Issue #6: bounded voice recording

## Implementation and automated evidence

- MIME negotiation prefers WebM/Opus, then Ogg/Opus. MP4 is selected only when those are unavailable and the browser reports MP4 support. For each selected/native format, retry rejected `audioBitsPerSecond` with the standard audio-only `bitsPerSecond` target before falling back to default bitrate. Blob and transcription use the actual recorder/chunk MIME, never an assumed WebM label.
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

## Physical iPhone failure and bitrate investigation

Jovan tested commit `ec47528` on physical iPhone Safari: **30 seconds,
`audio/webm;codecs=opus`, 187,752 bytes**. This **fails** the unchanged
150,000-byte limit by 37,752 bytes (25.17%). File size divided by the reported
duration is 50,067.2 bits/s including container overhead; it does not by itself
identify the encoded audio payload bitrate or prove a 48 kbps clamp.

The diagnostic now displays the options accepted by the successful constructor,
the number of construction attempts, the browser's `audioBitsPerSecond` getter,
capture channels/sample rate, unrounded elapsed time, total file bits/s and chunk
count. These values are local diagnostic data, not analytics. A download link
allows inspection of the encoded file without adding an upload destination.

Source inspection (WebKit revision `fd3406f133a4e56d7aaf399ba5611ae44b8da7e9`,
not a claim about the exact WebKit build on Jovan's phone):

- [Bitrate selection](https://github.com/WebKit/WebKit/blob/fd3406f133a4e56d7aaf399ba5611ae44b8da7e9/Source/WebCore/platform/mediarecorder/MediaRecorderPrivate.cpp)
  retains explicit `audioBitsPerSecond`; there is no general 48 kbps clamp here.
  For an audio-only stream, `bitsPerSecond` is also supported.
- [Encoder setup](https://github.com/WebKit/WebKit/blob/fd3406f133a4e56d7aaf399ba5611ae44b8da7e9/Source/WebCore/platform/mediarecorder/MediaRecorderPrivateEncoder.cpp)
  passes the requested bitrate and capture format to Apple's converter.
- [Apple converter integration](https://github.com/WebKit/WebKit/blob/fd3406f133a4e56d7aaf399ba5611ae44b8da7e9/Source/WebCore/platform/audio/cocoa/AudioSampleBufferConverter.mm)
  attempts `kAudioConverterEncodeBitRate`; failure can fall back internally to a
  default without throwing a JavaScript constructor exception. The exposed rate
  is not a measurement of the resulting file. A reported 24,000 therefore does
  not prove that the encoder produced 24 kbps.
- [MediaRecorder IDL](https://github.com/WebKit/WebKit/blob/fd3406f133a4e56d7aaf399ba5611ae44b8da7e9/Source/WebCore/Modules/mediarecorder/MediaRecorder.idl)
  does not expose `audioBitrateMode` in this revision. Adding `constant` cannot
  be presented as a demonstrated Safari fix.

The original app's second constructor attempt omitted bitrate. Without device
diagnostics or the encoded file, it is not yet possible to attribute the original
failure to that retry, encoder behavior, channels, or container overhead.

The minimal candidate for retest keeps Opus priority and the 24,000 bps target:

- Request `channelCount: { ideal: 1 }` for a single voice, letting unsupported
  capture devices fall back rather than rejecting access. Actual channels are
  displayed. No sample-rate reduction is forced.
- Try `bitsPerSecond: 24_000` before a bitrate-free constructor retry; both knobs
  express the same target for an audio-only stream. The diagnostic exposes any
  remaining fallback rather than claiming it recorded at 24 kbps.
- Use `start()` without a timeslice. The app consumes the entire bounded recording
  on Stop and already retained every chunk. Removing periodic requests avoids
  unnecessary encoder flushes and forced container clusters; the meter and
  90-second timer operate independently. This is not proof that container overhead
  caused the original excess, or that the candidate meets the size limit.

Regression tests cover the bitrate-preserving retry, default fallback disclosure,
reported-versus-measured rates, optional mono capture, no periodic flush request,
and the diagnostic UI. No fixture file size is used as Safari encoder evidence.
Retest the candidate on the same phone before considering further encoding changes.

## iPhone Safari and Android Chrome checklist

1. Run `npm run dev` and open the app through a **trusted HTTPS URL** on the phone (plain `http://<computer-LAN-IP>:3000` cannot provide microphone access). An existing HTTPS preview works. For a temporary preview, if Cloudflare Tunnel is installed, run `cloudflared tunnel --url http://localhost:3000` and open its printed HTTPS URL; stop that process when finished. Use the app's normal configuration if checking server transcription.
2. Reload the page. In the main menu, tap **“Probar y medir micrófono”**. Allow microphone access. Speak naturally for **30 seconds**, then Stop. The diagnostic displays **bytes, actual MIME, accepted constructor options/attempt count, reported bitrate, channels/sample rate, elapsed time, file bits/s and chunk count**. Confirm the profile reads **“voz mono solicitada, sin bloques periódicos”**. Record these values plus device model and OS/browser version. Require **≤150,000 bytes**; do not normalize away an oversized file. Repeat with continuous speech and pauses; MP4/AAC must be measured separately from Opus. If oversized again, use **“Descargar grabación”** to retain the actual file for packet/container analysis.
3. Tap **“Escuchar mi voz grabada”**. Confirm audible, understandable speech without clipped syllables. For indigenous-variant acceptance, have a fluent speaker assess representative words/phoneme distinctions; transcription accuracy alone is not proof of vocal comprehension.
4. Open a product's registration screen and record for 90 seconds. Confirm elapsed time `/ 1:30`, warning from 75 seconds, automatic-stop message, one saved playable note, and that the OS microphone-use indicator clears. Repeat Stop just before/at the limit and rapidly tap Stop twice.
5. Start again, then navigate away or close the diagnostic. Repeat while the permission prompt is pending, then grant permission. Confirm no continuing microphone capture. Hide the browser/lock the phone while recording; verify early automatic stop and usable audio on return. Check for OS suspension behavior on both devices.
6. Deny permission, retry after allowing it, record repeatedly, and test with transcription unavailable/offline. Audio playback should remain usable. Verify existing speech text and configured server transcription separately.

| Device | OS / browser | 30s actual MIME | Bytes | Speech clarity | 90s / cleanup |
| --- | --- | --- | --- | --- | --- |
| iPhone (Jovan, `ec47528`) | Version pending | audio/webm;codecs=opus | **187,752 — FAIL** | Pending | Pending |
| Android | Pending | Pending | Pending | Pending | Pending |

**Acceptance status:** the original physical iPhone size test failed. Automated
policy/lifecycle/UI checks do not override that result. A corrected 30-second
physical iPhone retest, speech comprehension and Android testing remain required.

References: [MediaStream Recording specification](https://www.w3.org/TR/mediastream-recording/) (bitrate is an encoder hint), [WebKit's MediaRecorder implementation notes](https://webkit.org/blog/11353/mediarecorder-api/) (MP4/AAC and capability detection). Runtime probing, not a browser-name assumption, decides the format.
