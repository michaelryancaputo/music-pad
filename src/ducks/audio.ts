import type { Note } from '../utils/notes'
import { noteToFrequency } from '../utils/notes'
import type { PresetSound, SoundSource } from './grid'

let audioContext: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null
const bufferCache = new Map<string, AudioBuffer>()

export const presetLabel: Record<PresetSound, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hat: 'Hi-hat',
}

export const ensureAudioContext = async () => {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume()
  }
  return audioContext
}

const getNoiseBuffer = (context: AudioContext) => {
  if (noiseBuffer) {
    return noiseBuffer
  }
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  noiseBuffer = buffer
  return buffer
}

export const playPreset = async (preset: PresetSound) => {
  const context = await ensureAudioContext()
  const now = context.currentTime

  if (preset === 'kick') {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.2)
    gain.gain.setValueAtTime(0.9, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc.connect(gain).connect(context.destination)
    osc.start(now)
    osc.stop(now + 0.25)
    return
  }

  if (preset === 'snare') {
    const noise = context.createBufferSource()
    noise.buffer = getNoiseBuffer(context)
    const noiseFilter = context.createBiquadFilter()
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1200
    const noiseGain = context.createGain()
    noiseGain.gain.setValueAtTime(0.6, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
    noise.connect(noiseFilter).connect(noiseGain).connect(context.destination)
    noise.start(now)
    noise.stop(now + 0.2)
    return
  }

  const hatNoise = context.createBufferSource()
  hatNoise.buffer = getNoiseBuffer(context)
  const hatFilter = context.createBiquadFilter()
  hatFilter.type = 'highpass'
  hatFilter.frequency.value = 7000
  const hatGain = context.createGain()
  hatGain.gain.setValueAtTime(0.4, now)
  hatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
  hatNoise.connect(hatFilter).connect(hatGain).connect(context.destination)
  hatNoise.start(now)
  hatNoise.stop(now + 0.08)
}

export const playSound = async (source: SoundSource) => {
  if (source.kind === 'preset') {
    await playPreset(source.preset)
    return
  }
  if (source.kind === 'midi') {
    const context = await ensureAudioContext()
    const now = context.currentTime
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = source.waveform
    osc.frequency.setValueAtTime(220, now)
    gain.gain.setValueAtTime(0.3, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
    osc.connect(gain).connect(context.destination)
    osc.start(now)
    osc.stop(now + 0.4)
    return
  }

  if (!source.url) {
    return
  }

  const audio = new Audio(source.url)
  audio.volume = 0.9
  audio.play().catch(() => {})
}

const loadAudioBuffer = async (url: string) => {
  if (bufferCache.has(url)) {
    return bufferCache.get(url)!
  }
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const context = await ensureAudioContext()
  const buffer = await context.decodeAudioData(arrayBuffer)
  bufferCache.set(url, buffer)
  return buffer
}

export const playInstrumentNote = async ({
  source,
  note,
  baseNote,
  delayMs = 0,
  durationMs = 220,
}: {
  source: SoundSource
  note: Note
  baseNote: Note
  delayMs?: number
  durationMs?: number
}) => {
  const context = await ensureAudioContext()
  const startTime = context.currentTime + delayMs / 1000
  const durationSeconds = durationMs / 1000

  if (source.kind === 'midi') {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = source.waveform
    osc.frequency.setValueAtTime(noteToFrequency(note), startTime)
    gain.gain.setValueAtTime(0.4, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds)
    osc.connect(gain).connect(context.destination)
    osc.start(startTime)
    osc.stop(startTime + durationSeconds)
    return
  }

  if (source.kind === 'preset') {
    await playPreset(source.preset)
    return
  }

  if (!source.url) {
    return
  }
  const playbackRate = noteToFrequency(note) / noteToFrequency(baseNote)
  try {
    const buffer = await loadAudioBuffer(source.url)
    const node = context.createBufferSource()
    const gain = context.createGain()
    node.buffer = buffer
    node.playbackRate.setValueAtTime(playbackRate, startTime)
    gain.gain.setValueAtTime(0.7, startTime)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds)
    node.connect(gain).connect(context.destination)
    node.start(startTime)
    node.stop(startTime + durationSeconds)
  } catch {
    const audio = new Audio(source.url)
    audio.playbackRate = playbackRate
    const play = () => {
      audio.currentTime = 0
      audio.play().catch(() => {})
      window.setTimeout(() => {
        audio.pause()
      }, durationMs)
    }
    const delay = Math.max(0, delayMs)
    if (delay > 0) {
      window.setTimeout(play, delay)
    } else {
      play()
    }
  }
}
