"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { UI } from "@/content/segment1";
import { saveRecording } from "@/lib/recordings";
import { useRuntime } from "@/lib/runtime";
import { listen, speechCheckAvailable, type Listener } from "@/lib/speech";
import { saveFile } from "@/lib/host";

/**
 * Real microphone recording (getUserMedia + MediaRecorder).
 *
 * States (Visual & Context Reference A, "Recording states"):
 *  Idle: big mic button.
 *  Recording: a soft pulsing ring, a wave line and the time counting up (never down).
 *  Review: 'Play', 'Record again' and 'Keep' (practice) or 'Submit' (test).
 * Practice: blue 'Practice' badge + 'Only you can hear this.'
 * Assessment: orange 'Assessment' badge + 'This recording will be submitted.'
 */

type Mode = "practice" | "assessment";
type Phase = "idle" | "requesting" | "recording" | "checking" | "review" | "kept" | "error";

export interface KeptRecording {
  durationMs: number;
  blob: Blob;
  /** What the browser's speech service heard; null when no check was possible. */
  transcript: string | null;
  /** The learner uploaded a sound file because the microphone could not be used. */
  uploaded?: boolean;
}

interface Props {
  stageId: string;
  slot: string;
  maxSeconds: number;
  mode?: Mode;
  onKeep: (info: KeptRecording) => void;
  /** Also listen with the browser's speech recognition and show what it heard. */
  recognize?: boolean;
  /** Accessible name for the mic button. */
  label?: string;
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const options = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return options.find((m) => MediaRecorder.isTypeSupported(m));
}

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export function Recorder({ stageId, slot, maxSeconds, mode = "practice", onKeep, label, recognize = false }: Props) {
  const { paused } = useRuntime();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [speechOk, setSpeechOk] = useState(true);
  const [uploaded, setUploaded] = useState(false);
  const listenerRef = useRef<Listener | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const tick = useRef<number | null>(null);
  const durationRef = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const raf = useRef<number | null>(null);
  const acRef = useRef<AudioContext | null>(null);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);
    raf.current = null;
    void acRef.current?.close().catch(() => {});
    acRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (tick.current) window.clearInterval(tick.current);
    tick.current = null;
    const r = recRef.current;
    if (r && r.state !== "inactive") r.stop();
  }, []);

  const drawWave = useCallback((stream: MediaStream) => {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ac = new AC();
    acRef.current = ac;
    const src = ac.createMediaStreamSource(stream);
    const an = ac.createAnalyser();
    an.fftSize = 512;
    src.connect(an);
    const data = new Uint8Array(an.fftSize);
    const loop = () => {
      const c = canvasRef.current;
      if (c) {
        const g = c.getContext("2d")!;
        an.getByteTimeDomainData(data);
        g.clearRect(0, 0, c.width, c.height);
        g.lineWidth = 2;
        g.strokeStyle = "#0f766e";
        g.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = (i / (data.length - 1)) * c.width;
          const y = (data[i] / 255) * c.height;
          if (i === 0) g.moveTo(x, y);
          else g.lineTo(x, y);
        }
        g.stroke();
      }
      raf.current = requestAnimationFrame(loop);
    };
    loop();
  }, []);

  const start = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setPhase("error");
      setError("This browser cannot record sound. Please open the course in a recent version of Chrome, Edge, Firefox or Safari.");
      return;
    }
    setPhase("requesting");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch (e) {
      const name = (e as DOMException)?.name;
      setPhase("error");
      setError(
        name === "NotAllowedError" || name === "SecurityError"
          ? "The microphone is blocked. Allow the microphone for this page in your browser and tap the mic again, or upload a recording instead."
          : name === "NotFoundError"
            ? "No microphone was found. Connect a microphone and tap the mic again, or upload a recording instead."
            : "The microphone could not start. Check it is not used by another app and tap the mic again, or upload a recording instead.",
      );
      return;
    }
    streamRef.current = stream;
    const mime = pickMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    recRef.current = rec;
    chunks.current = [];
    rec.ondataavailable = (ev) => {
      if (ev.data.size > 0) chunks.current.push(ev.data);
    };
    rec.onstop = async () => {
      durationRef.current = Date.now() - startedAt.current;
      const b = new Blob(chunks.current, { type: rec.mimeType || mime || "audio/webm" });
      releaseStream();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(b);
      setBlob(b);
      const l = listenerRef.current;
      listenerRef.current = null;
      if (l) {
        setPhase("checking");
        setTranscript(await l.stop());
      }
      setPhase("review");
    };
    rec.start(250);
    startedAt.current = Date.now();
    setElapsed(0);
    setLiveText("");
    setTranscript(null);
    setPhase("recording");
    drawWave(stream);
    if (recognize) {
      listenerRef.current = listen(setLiveText, () => {
        setSpeechOk(false);
        listenerRef.current?.abort();
        listenerRef.current = null;
      });
      if (!listenerRef.current) setSpeechOk(false);
    }
    tick.current = window.setInterval(() => {
      const e = Date.now() - startedAt.current;
      setElapsed(e);
      if (e >= maxSeconds * 1000) stop();
    }, 200);
  }, [drawWave, maxSeconds, releaseStream, stop, recognize]);

  // Pausing the stage stops a recording in progress (it goes to review).
  useEffect(() => {
    if (paused && phase === "recording") stop();
    if (paused) audioRef.current?.pause();
  }, [paused, phase, stop]);

  useEffect(
    () => () => {
      if (tick.current) window.clearInterval(tick.current);
      const r = recRef.current;
      if (r && r.state !== "inactive") {
        r.onstop = null;
        r.stop();
      }
      releaseStream();
      listenerRef.current?.abort();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [releaseStream],
  );

  const playBack = () => {
    if (!urlRef.current) return;
    if (!audioRef.current) audioRef.current = new Audio();
    const a = audioRef.current;
    a.src = urlRef.current;
    a.currentTime = 0;
    a.onended = () => setPlaying(false);
    a.onpause = () => setPlaying(false);
    setPlaying(true);
    a.play().catch(() => setPlaying(false));
  };

  const recordAgain = () => {
    audioRef.current?.pause();
    setBlob(null);
    setTranscript(null);
    setUploaded(false);
    void start();
  };

  const keep = async () => {
    if (!blob) return;
    audioRef.current?.pause();
    setSaving(true);
    try {
      await saveRecording({ stageId, slot, blob, mimeType: blob.type, durationMs: durationRef.current });
    } catch {
      /* IndexedDB unavailable (private mode): the learner can still go on */
    }
    setSaving(false);
    setPhase("kept");
    onKeep({ durationMs: durationRef.current, blob, transcript: recognize && speechOk && !uploaded ? (transcript ?? "") : null, uploaded });
  };

  /** When the microphone cannot be used: take a sound file the learner recorded elsewhere. */
  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("audio/") && !/\.(mp3|m4a|wav|webm|ogg|aac|mp4|opus)$/i.test(file.name)) {
      setError("Choose a sound file, for example .mp3, .m4a or .wav.");
      return;
    }
    const url = URL.createObjectURL(file);
    const ms = await new Promise<number>((res) => {
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => res(Number.isFinite(a.duration) ? a.duration * 1000 : 0);
      a.onerror = () => res(-1);
      a.src = url;
    });
    if (ms < 0) {
      URL.revokeObjectURL(url);
      setError("This file cannot be played. Choose another sound file.");
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = url;
    durationRef.current = Math.round(ms);
    setBlob(file);
    setUploaded(true);
    setTranscript(null);
    setError(null);
    setPhase("review");
  };

  const badge =
    mode === "practice" ? (
      <div className="flex items-center gap-2" data-testid="practice-badge">
        <span className="rounded-full bg-blue-600 px-3 py-1 text-sm font-semibold text-white">{UI.practiceBadge}</span>
        <span className="text-base text-slate-700">{UI.practiceLine}</span>
      </div>
    ) : (
      <div className="flex items-center gap-2" data-testid="assessment-badge">
        <span className="rounded-md bg-orange-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-white">{UI.assessmentBadge}</span>
        <span className="text-base text-slate-800">{UI.assessmentLine}</span>
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-4" data-testid="recorder" data-phase={phase}>
      {badge}
      {recognize && (
        <p className="max-w-md text-center text-sm text-slate-600" data-testid="speech-note">
          {speechOk && speechCheckAvailable()
            ? "To check your words, your speech is sent to your browser's speech service. Your recording stays on this device."
            : "The automatic check does not work in this browser. Your recording still works — check it yourself with the boxes."}
        </p>
      )}

      {(phase === "idle" || phase === "requesting" || phase === "error") && (
        <button
          type="button"
          onClick={start}
          disabled={phase === "requesting"}
          aria-label={label ?? "Start recording"}
          className="grid h-24 w-24 place-items-center rounded-full bg-teal-700 text-white shadow-lg transition hover:bg-teal-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-400 disabled:opacity-60"
        >
          <MicIcon />
        </button>
      )}

      {phase === "recording" && (
        <>
          <button
            type="button"
            onClick={stop}
            aria-label="Stop recording"
            className="relative grid h-24 w-24 place-items-center rounded-full bg-teal-700 text-white shadow-lg focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-amber-400"
          >
            <span className="absolute inset-0 animate-[pulse-ring_1.6s_ease-out_infinite] rounded-full ring-8 ring-teal-400/60" aria-hidden />
            <span className="h-7 w-7 rounded-md bg-white" aria-hidden />
          </button>
          <canvas ref={canvasRef} width={240} height={36} className="h-9 w-60" aria-hidden />
          <p className="text-xl font-semibold tabular-nums text-teal-800" aria-live="off" data-testid="rec-time">
            {fmt(elapsed)} <span className="text-base font-normal text-slate-600">/ {fmt(maxSeconds * 1000)}</span>
          </p>
          {recognize && speechOk && (
            <p className="min-h-7 max-w-xl text-center text-lg text-slate-700" data-testid="live-transcript">
              <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-teal-600 align-middle" aria-hidden />
              {liveText || "Listening to you…"}
            </p>
          )}
          <p className="sr-only" role="status">
            Recording. Tap the button again to stop.
          </p>
        </>
      )}

      {phase === "checking" && (
        <p className="text-lg text-slate-700" role="status" data-testid="checking">
          Checking what you said…
        </p>
      )}

      {phase === "review" && recognize && transcript !== null && (
        <div className="w-full max-w-xl rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="heard-box">
          <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-600">What the system heard</p>
          <p className="text-xl text-slate-900" data-testid="heard-text">
            {transcript.trim() ? transcript : <span className="text-amber-900">No words were heard. Speak a little louder and closer to the microphone, then record again.</span>}
          </p>
        </div>
      )}

      {phase === "review" && (
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Your recording">
          <button type="button" onClick={playBack} className="btn-secondary" data-testid="rec-play">
            <SpeakerIcon /> {UI.play}
            {playing && <span className="sr-only"> (playing)</span>}
          </button>
          <button type="button" onClick={recordAgain} className="btn-secondary" data-testid="rec-again">
            <ReplayIcon /> {UI.recordAgain}
          </button>
          <button type="button" onClick={keep} disabled={saving} className="btn-primary" data-testid="rec-keep">
            {mode === "practice" ? UI.keep : UI.submit}
          </button>
        </div>
      )}
      {phase === "review" && playing && <WaveLine />}

      {phase === "error" && error && (
        <p role="alert" className="max-w-md rounded-xl bg-amber-50 px-4 py-3 text-center text-lg text-amber-900 ring-1 ring-amber-300">
          {error}
        </p>
      )}
      {phase === "error" && (
        <label className="btn-secondary cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-4 has-[:focus-visible]:outline-amber-400" data-testid="upload-label">
          <input type="file" accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg,.aac" className="sr-only" data-testid="upload-input" onChange={(e) => void onUpload(e.target.files?.[0])} />
          Upload a recording
        </label>
      )}
      {phase === "review" && uploaded && <p className="text-base text-slate-600" data-testid="uploaded-note">You uploaded this recording. Play it to check it is the right one.</p>}
    </div>
  );
}

export function WaveLine() {
  return (
    <svg viewBox="0 0 120 20" className="h-5 w-32 text-teal-700" aria-hidden data-testid="wave-line">
      <path d="M0 10 Q 7.5 0 15 10 T 30 10 T 45 10 T 60 10 T 75 10 T 90 10 T 105 10 T 120 10" fill="none" stroke="currentColor" strokeWidth="2" className="animate-[wave_1s_linear_infinite]" />
    </svg>
  );
}

export function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}

export function SpeakerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M4 9h4l5-4v14l-5-4H4z" />
      <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 12a8 8 0 1 0 2.3-5.7" />
      <path d="M4 4v4h4" />
    </svg>
  );
}

/**
 * A kept practice recording, still on screen where it was made:
 * play it back or save it ('Your recording · 0:09').
 */
export function KeptRecordingPlayer({ rec, label = "Your recording" }: { rec: KeptRecording; label?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const u = URL.createObjectURL(rec.blob);
    // An object URL must be created and revoked together, so it lives in this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [rec.blob]);
  // Recorded by this browser: webm (Chrome, Edge, Firefox) or mp4 (Safari). Uploaded files are already the learner's own.
  const ext = rec.uploaded ? null : rec.blob.type.includes("mp4") ? "mp4" : rec.blob.type.includes("webm") ? "webm" : null;
  return (
    <div className="flex w-full max-w-xl flex-wrap items-center gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200" data-testid="kept-recording">
      <span className="text-base text-slate-700">
        {label} · {fmt(Math.max(1000, Math.round(rec.durationMs / 1000) * 1000))}
      </span>
      {url && <audio controls src={url} className="h-10 min-w-0 flex-1" data-testid="kept-audio" />}
      {url && ext && (
        <button type="button" onClick={() => void saveFile(rec.blob, `my-recording.${ext}`)} className="text-base text-teal-800 underline underline-offset-4" data-testid="kept-download">
          Download
        </button>
      )}
    </div>
  );
}
