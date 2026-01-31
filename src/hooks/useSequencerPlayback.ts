import { useEffect, useRef } from 'react'

import { playSound } from '../ducks/audio'
import { useAppStore } from '../store/useAppStore'

export const useSequencerPlayback = () => {
  const currentStep = useAppStore((state) => state.currentStep)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const rows = useAppStore((state) => state.rows)
  const lastPlayedStepRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isPlaying) {
      lastPlayedStepRef.current = null
      return
    }
    if (lastPlayedStepRef.current === currentStep) {
      return
    }
    lastPlayedStepRef.current = currentStep
    rows.forEach((row) => {
      if (row.steps[currentStep]) {
        void playSound(row.source)
      }
    })
  }, [currentStep, isPlaying, rows])
}
