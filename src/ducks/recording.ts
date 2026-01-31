import type { StateCreator } from 'zustand'
import { z } from 'zod'

import { ensureAudioContext } from './audio'
import { registerObjectUrl } from '../utils/objectUrls'

export const recordingStatusSchema = z.enum(['idle', 'recording', 'review'])
export type RecordingStatus = z.infer<typeof recordingStatusSchema>

export type RecordingState = {
  recordModalRowId: string | null
  recordingStatus: RecordingStatus
  recordedBuffer: AudioBuffer | null
  recordedPeaks: number[]
  trimStart: number
  trimEnd: number
  isPreviewingTrim: boolean
}

export type RecordingActions = {
  openRecordModal: (rowId: string) => void
  closeRecordModal: () => void
  startModalRecording: () => Promise<void>
  stopModalRecording: () => void
  saveRecordingToRow: () => Promise<void>
  setTrimStart: (value: number) => void
  setTrimEnd: (value: number) => void
  playTrimPreview: () => Promise<void>
  stopTrimPreview: () => void
}

export type RecordingSlice = RecordingState & RecordingActions

const recorderRef: { current: MediaRecorder | null } = { current: null }
const streamRef: { current: MediaStream | null } = { current: null }
const analyserRef: { current: AnalyserNode | null } = { current: null }
const liveDataRef: { current: Uint8Array | null } = { current: null }
const recordingAnimationRef: { current: number | null } = { current: null }
const recordingChunksRef: { current: Blob[] } = { current: [] }
const discardRecordingRef: { current: boolean } = { current: false }
const previewSourceRef: { current: AudioBufferSourceNode | null } = {
  current: null,
}

export const stopLiveWaveform = () => {
  if (recordingAnimationRef.current) {
    cancelAnimationFrame(recordingAnimationRef.current)
    recordingAnimationRef.current = null
  }
}

const cleanupRecordingStream = () => {
  stopLiveWaveform()
  streamRef.current?.getTracks().forEach((track) => track.stop())
  streamRef.current = null
  recorderRef.current = null
  analyserRef.current = null
  liveDataRef.current = null
}

const computePeaks = (buffer: AudioBuffer, points = 600) => {
  const channel = buffer.getChannelData(0)
  const blockSize = Math.max(1, Math.floor(channel.length / points))
  const peaks: number[] = []
  for (let i = 0; i < points; i += 1) {
    const start = i * blockSize
    const end = Math.min(start + blockSize, channel.length)
    let peak = 0
    for (let j = start; j < end; j += 1) {
      const value = Math.abs(channel[j])
      if (value > peak) peak = value
    }
    peaks.push(peak)
  }
  return peaks
}

export const drawRecordedWaveform = (
  canvas: HTMLCanvasElement | null,
  peaks: number[],
  startRatio: number,
  endRatio: number,
) => {
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)
  ctx.strokeStyle = '#38bdf8'
  ctx.lineWidth = 2
  ctx.beginPath()
  const mid = height / 2
  peaks.forEach((peak, index) => {
    const x = (index / (peaks.length - 1)) * width
    const y = peak * (height * 0.45)
    ctx.moveTo(x, mid - y)
    ctx.lineTo(x, mid + y)
  })
  ctx.stroke()

  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'
  const startX = startRatio * width
  const endX = endRatio * width
  ctx.fillRect(0, 0, Math.max(0, startX), height)
  ctx.fillRect(Math.min(endX, width), 0, width - endX, height)
  ctx.strokeStyle = '#f8fafc'
  ctx.lineWidth = 1
  ctx.strokeRect(startX, 0, Math.max(0, endX - startX), height)
}

export const drawLiveWaveform = (canvas: HTMLCanvasElement | null) => {
  const analyser = analyserRef.current
  if (!canvas || !analyser) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const bufferLength = analyser.fftSize
  if (!liveDataRef.current || liveDataRef.current.length !== bufferLength) {
    liveDataRef.current = new Uint8Array(bufferLength)
  }

  const draw = () => {
    recordingAnimationRef.current = requestAnimationFrame(draw)
    analyser.getByteTimeDomainData(liveDataRef.current!)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.lineWidth = 2
    ctx.strokeStyle = '#f97316'
    ctx.beginPath()
    const sliceWidth = canvas.width / bufferLength
    let x = 0
    for (let i = 0; i < bufferLength; i += 1) {
      const v = liveDataRef.current![i] / 128.0
      const y = (v * canvas.height) / 2
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
      x += sliceWidth
    }
    ctx.stroke()
  }

  draw()
}

const trimAudioBuffer = async (
  buffer: AudioBuffer,
  startTime: number,
  endTime: number,
) => {
  const context = await ensureAudioContext()
  const startSample = Math.max(0, Math.floor(startTime * buffer.sampleRate))
  const endSample = Math.max(
    startSample + 1,
    Math.floor(endTime * buffer.sampleRate),
  )
  const length = endSample - startSample
  const trimmed = context.createBuffer(
    buffer.numberOfChannels,
    length,
    buffer.sampleRate,
  )
  for (let channel = 0; channel < buffer.numberOfChannels; channel += 1) {
    const data = buffer.getChannelData(channel)
    trimmed.copyToChannel(data.subarray(startSample, endSample), channel)
  }
  return trimmed
}

const audioBufferToWav = (buffer: AudioBuffer) => {
  const numChannels = buffer.numberOfChannels
  const sampleRate = buffer.sampleRate
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = buffer.length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, dataSize, true)

  let offset = 44
  for (let i = 0; i < buffer.length; i += 1) {
    for (let channel = 0; channel < numChannels; channel += 1) {
      let sample = buffer.getChannelData(channel)[i]
      sample = Math.max(-1, Math.min(1, sample))
      view.setInt16(offset, sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

export const createRecordingSlice: StateCreator<
  RecordingSlice,
  [],
  [],
  RecordingSlice
> = (set, get) => ({
  recordModalRowId: null,
  recordingStatus: 'idle',
  recordedBuffer: null,
  recordedPeaks: [],
  trimStart: 0,
  trimEnd: 0,
  isPreviewingTrim: false,
  openRecordModal: (rowId) => {
    get().setIsPlaying(false)
    stopLiveWaveform()
    cleanupRecordingStream()
    if (previewSourceRef.current) {
      previewSourceRef.current.stop()
      previewSourceRef.current.disconnect()
      previewSourceRef.current = null
    }
    set({
      isPreviewingTrim: false,
      recordModalRowId: rowId,
      recordingStatus: 'idle',
      recordedBuffer: null,
      recordedPeaks: [],
      trimStart: 0,
      trimEnd: 0,
    })
  },
  closeRecordModal: () => {
    const { recordingStatus, recordModalRowId } = get()
    if (recordingStatus === 'recording') {
      discardRecordingRef.current = true
      recorderRef.current?.stop()
    }
    if (recordModalRowId) {
      get().setRowRecording(recordModalRowId, false)
    }
    if (previewSourceRef.current) {
      previewSourceRef.current.stop()
      previewSourceRef.current.disconnect()
      previewSourceRef.current = null
    }
    cleanupRecordingStream()
    set({
      recordModalRowId: null,
      recordingStatus: 'idle',
      recordedBuffer: null,
      recordedPeaks: [],
      trimStart: 0,
      trimEnd: 0,
      isPreviewingTrim: false,
    })
  },
  startModalRecording: async () => {
    const { recordModalRowId } = get()
    if (!recordModalRowId) return
    try {
      discardRecordingRef.current = false
      if (previewSourceRef.current) {
        previewSourceRef.current.stop()
        previewSourceRef.current.disconnect()
        previewSourceRef.current = null
      }
      set({
        isPreviewingTrim: false,
        recordedBuffer: null,
        recordedPeaks: [],
        trimStart: 0,
        trimEnd: 0,
      })
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      recordingChunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordingChunksRef.current.push(event.data)
        }
      }
      recorder.onstop = async () => {
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false
          set({ recordingStatus: 'idle' })
          get().setRowRecording(recordModalRowId, false)
          cleanupRecordingStream()
          return
        }
        const blob = new Blob(recordingChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })
        const context = await ensureAudioContext()
        const arrayBuffer = await blob.arrayBuffer()
        const audioBuffer = await context.decodeAudioData(arrayBuffer)
        const duration = audioBuffer.duration
        const peaks = computePeaks(audioBuffer)
        set({
          recordedBuffer: audioBuffer,
          recordedPeaks: peaks,
          trimStart: 0,
          trimEnd: duration,
          recordingStatus: 'review',
        })
        get().setRowRecording(recordModalRowId, false)
        cleanupRecordingStream()
      }
      const context = await ensureAudioContext()
      const source = context.createMediaStreamSource(stream)
      const analyser = context.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      streamRef.current = stream
      recorderRef.current = recorder
      liveDataRef.current = null
      set({ recordingStatus: 'recording' })
      get().setRowRecording(recordModalRowId, true)
      recorder.start()
    } catch {
      set({ recordingStatus: 'idle' })
      get().setRowRecording(recordModalRowId, false)
      cleanupRecordingStream()
    }
  },
  stopModalRecording: () => {
    recorderRef.current?.stop()
  },
  saveRecordingToRow: async () => {
    const { recordModalRowId, recordedBuffer, trimStart, trimEnd } = get()
    if (!recordModalRowId || !recordedBuffer) {
      return
    }
    const duration = recordedBuffer.duration
    const safeStart = Math.max(0, Math.min(trimStart, duration))
    const safeEnd = Math.max(
      safeStart + 0.05,
      Math.min(trimEnd || duration, duration),
    )
    const trimmed = await trimAudioBuffer(recordedBuffer, safeStart, safeEnd)
    const blob = audioBufferToWav(trimmed)
    const url = URL.createObjectURL(blob)
    registerObjectUrl(url)
    get().updateRowSource(recordModalRowId, {
      kind: 'recorded',
      fileName: `Recording ${new Date().toLocaleTimeString()}.wav`,
      url,
    })
    get().closeRecordModal()
  },
  setTrimStart: (value) => {
    get().stopTrimPreview()
    set({ trimStart: value })
  },
  setTrimEnd: (value) => {
    get().stopTrimPreview()
    set({ trimEnd: value })
  },
  playTrimPreview: async () => {
    const { recordedBuffer, trimStart, trimEnd } = get()
    if (!recordedBuffer) {
      return
    }
    const context = await ensureAudioContext()
    get().stopTrimPreview()
    const duration = recordedBuffer.duration || 0
    const safeStart = Math.max(0, Math.min(trimStart, duration))
    const safeEnd = Math.max(
      safeStart + 0.05,
      Math.min(trimEnd || duration, duration),
    )
    const source = context.createBufferSource()
    source.buffer = recordedBuffer
    source.connect(context.destination)
    source.onended = () => {
      if (previewSourceRef.current === source) {
        previewSourceRef.current = null
      }
      set({ isPreviewingTrim: false })
    }
    previewSourceRef.current = source
    set({ isPreviewingTrim: true })
    source.start(0, safeStart, safeEnd - safeStart)
  },
  stopTrimPreview: () => {
    if (previewSourceRef.current) {
      previewSourceRef.current.stop()
      previewSourceRef.current.disconnect()
      previewSourceRef.current = null
    }
    set({ isPreviewingTrim: false })
  },
})
