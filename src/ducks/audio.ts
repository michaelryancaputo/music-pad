import type { PresetSound, SoundSource } from './grid'

let audioContext: AudioContext | null = null
let noiseBuffer: AudioBuffer | null = null

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

  const audio = new Audio(source.url)
  audio.volume = 0.9
  audio.play().catch(() => {})
}
