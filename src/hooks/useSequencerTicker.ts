import { useEffect, useMemo } from 'react'

import { useAppStore } from '../store/useAppStore'
import { getStepMs } from '../utils/audio'
import { BEATS_PER_MEASURE } from '../utils/constants'

export const useSequencerTicker = () => {
  const bpm = useAppStore((state) => state.bpm)
  const measures = useAppStore((state) => state.measures)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const advanceStep = useAppStore((state) => state.advanceStep)

  const stepMs = useMemo(() => getStepMs(bpm), [bpm])
  const steps = BEATS_PER_MEASURE * measures

  useEffect(() => {
    if (!isPlaying) {
      return
    }
    const interval = window.setInterval(() => {
      advanceStep(steps)
    }, stepMs)
    return () => window.clearInterval(interval)
  }, [advanceStep, isPlaying, stepMs, steps])

  return { stepMs, steps }
}
