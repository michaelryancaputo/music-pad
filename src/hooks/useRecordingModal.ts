import { useEffect, useRef } from 'react'

import {
  drawLiveWaveform,
  drawRecordedWaveform,
  stopLiveWaveform,
} from '../ducks/recording'
import { useAppStore } from '../store/useAppStore'

export const useRecordingModal = () => {
  const liveCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const recordedCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const recordModalRowId = useAppStore((state) => state.recordModalRowId)
  const recordingStatus = useAppStore((state) => state.recordingStatus)
  const recordedBuffer = useAppStore((state) => state.recordedBuffer)
  const recordedPeaks = useAppStore((state) => state.recordedPeaks)
  const trimStart = useAppStore((state) => state.trimStart)
  const trimEnd = useAppStore((state) => state.trimEnd)
  const stopModalRecording = useAppStore((state) => state.stopModalRecording)
  const closeRecordModal = useAppStore((state) => state.closeRecordModal)

  useEffect(() => {
    if (!recordModalRowId) {
      return
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && recordingStatus === 'recording') {
        event.preventDefault()
        stopModalRecording()
      }
      if (event.key === 'Escape') {
        closeRecordModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeRecordModal, recordModalRowId, recordingStatus, stopModalRecording])

  useEffect(() => {
    if (!recordedBuffer || recordedPeaks.length === 0) {
      return
    }
    const duration = recordedBuffer.duration || 1
    const startRatio = Math.min(1, Math.max(0, trimStart / duration))
    const endRatio = Math.min(1, Math.max(startRatio, trimEnd / duration))
    drawRecordedWaveform(recordedCanvasRef.current, recordedPeaks, startRatio, endRatio)
  }, [recordedBuffer, recordedPeaks, trimEnd, trimStart])

  useEffect(() => {
    if (recordingStatus !== 'recording') {
      stopLiveWaveform()
      return
    }
    drawLiveWaveform(liveCanvasRef.current)
    return () => stopLiveWaveform()
  }, [recordingStatus])

  return {
    liveCanvasRef,
    recordedCanvasRef,
  }
}
