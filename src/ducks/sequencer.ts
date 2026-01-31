import type { StateCreator } from 'zustand'

import { ensureAudioContext } from './audio'
import { BEATS_PER_MEASURE, DEFAULT_BPM } from '../utils/constants'
import type { Row } from './grid'
import type { AppStore } from '../store/useAppStore'

export type SequencerState = {
  bpm: number
  measures: number
  currentStep: number
  isPlaying: boolean
}

export type SequencerActions = {
  setBpm: (bpm: number) => void
  setMeasures: (measures: number) => void
  updateMeasures: (nextMeasures: number) => void
  togglePlayback: () => Promise<void>
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentStep: (step: number) => void
  advanceStep: (steps: number) => void
  resetStep: () => void
}

export type SequencerSlice = SequencerState & SequencerActions

export const createSequencerSlice: StateCreator<
  AppStore,
  [],
  [],
  SequencerSlice
> = (set) => ({
  bpm: DEFAULT_BPM,
  measures: 1,
  currentStep: 0,
  isPlaying: false,
  setBpm: (bpm) => set({ bpm }),
  setMeasures: (measures) => set({ measures, currentStep: 0 }),
  setCurrentStep: (step) => set({ currentStep: step }),
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
          if (row.type === 'rhythm') {
            const resizedSteps = Array.from({ length: nextSteps }, (_, index) =>
              row.steps[index] ?? false,
            )
            return { ...row, steps: resizedSteps }
          }
          const resizedSteps = Array.from({ length: nextSteps }, (_, index) =>
            row.steps[index] ?? [null, null, null, null],
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
