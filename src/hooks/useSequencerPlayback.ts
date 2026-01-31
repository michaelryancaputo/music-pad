import { useEffect, useRef } from 'react'

import { playInstrumentNote, playSound } from '../ducks/audio'
import { useAppStore } from '../store/useAppStore'
import { getStepMs } from '../utils/audio'

export const useSequencerPlayback = () => {
  const currentStep = useAppStore((state) => state.currentStep)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const rows = useAppStore((state) => state.rows)
  const bpm = useAppStore((state) => state.bpm)
  const applyPendingMutes = useAppStore((state) => state.applyPendingMutes)
  const lastPlayedStepRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      lastPlayedStepRef.current = null
      return
    }
    if (lastPlayedStepRef.current === currentStep) {
      return
    }
    if (currentStep === 0) {
      applyPendingMutes()
    }
    lastPlayedStepRef.current = currentStep
    const stepMs = getStepMs(bpm)
    rows.forEach((row) => {
      const effectiveMuted =
        currentStep === 0 && row.pendingMute !== null
          ? row.pendingMute
          : row.isMuted
      if (effectiveMuted) {
        return
      }
      if (row.type === 'rhythm') {
        if (row.steps[currentStep]) {
          void playSound(row.source)
        }
        return
      }
      const stepNotes = row.steps[currentStep]
      if (!stepNotes) {
        return
      }
      const subStepMs = stepMs / 4
      stepNotes.forEach((note, subIndex) => {
        if (!note) return
        void playInstrumentNote({
          source: row.source,
          note,
          baseNote: row.baseNote,
          delayMs: subIndex * subStepMs,
          durationMs: subStepMs * 0.9,
        })
      })
    })
  }, [bpm, currentStep, isPlaying, rows])
}
