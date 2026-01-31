import type { StateCreator } from 'zustand'

import { ensureAudioContext } from './audio'
import { BEATS_PER_MEASURE, DEFAULT_BPM } from '../utils/constants'
import type { Row } from './grid'

export type SequencerState = {
  bpm: number
  measures: number
  currentStep: number
  isPlaying: boolean
}

export type SequencerActions = {
  setBpm: (bpm: number) => void
  updateMeasures: (nextMeasures: number) => void
  togglePlayback: () => Promise<void>
  setIsPlaying: (isPlaying: boolean) => void
  advanceStep: (steps: number) => void
  resetStep: () => void
}

export type SequencerSlice = SequencerState & SequencerActions

export const createSequencerSlice: StateCreator<
  SequencerSlice,
  [],
  [],
  SequencerSlice
> = (set, get) => ({
  bpm: DEFAULT_BPM,
  measures: 1,
  currentStep: 0,
  isPlaying: false,
  setBpm: (bpm) => set({ bpm }),
  updateMeasures: (nextMeasures) => {
    const nextSteps = BEATS_PER_MEASURE * nextMeasures
    set((state) => {
      const currentRows = (state as { rows?: Row[] }).rows
      if (!currentRows) {
        return { measures: nextMeasures, currentStep: 0 }
      }
      return {
        measures: nextMeasures,
        currentStep: 0,
        rows: currentRows.map((row) => {
          if (row.steps.length === nextSteps) {
            return row
          }
          const resizedSteps = Array.from({ length: nextSteps }, (_, index) =>
            row.steps[index] ?? false,
          )
          return { ...row, steps: resizedSteps }
        }),
      }
    })
  },
  togglePlayback: async () => {
    await ensureAudioContext()
    set((state) => {
      const next = !state.isPlaying
      return {
        isPlaying: next,
        currentStep: next ? 0 : state.currentStep,
      }
    })
  },
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  advanceStep: (steps) => {
    set((state) => ({
      currentStep: (state.currentStep + 1) % steps,
    }))
  },
  resetStep: () => set({ currentStep: 0 }),
})
