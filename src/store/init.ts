import { BEATS_PER_MEASURE, DEFAULT_BPM } from '../utils/constants'
import { getStepMs } from '../utils/audio'
import { cleanupObjectUrls } from '../utils/objectUrls'
import { buildSharePackage, hydrateSharePackage, parseSharePackage } from '../utils/share'
import { playInstrumentNote, playSound } from '../ducks/audio'
import { createInitialRows } from '../ducks/grid'
import type { Row } from '../ducks/grid'
import { useAppStore } from './useAppStore'

const STORAGE_KEY = 'music-pad-sequence-v1'

let initialized = false
let intervalId: number | null = null
let saveTimeout: number | null = null
let pendingSave = false

const stopInterval = () => {
  if (intervalId) {
    window.clearInterval(intervalId)
    intervalId = null
  }
}

const playStep = (step: number) => {
  const { rows, bpm } = useAppStore.getState()
  const stepMs = getStepMs(bpm)

  rows.forEach((row) => {
    const effectiveMuted =
      step === 0 && row.pendingMute !== null ? row.pendingMute : row.isMuted
    if (effectiveMuted) {
      return
    }
    if (row.type === 'rhythm') {
      if (row.steps[step]) {
        void playSound(row.source)
      }
      return
    }
    const stepNotes = row.steps[step]
    if (!stepNotes) return
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
}

const startInterval = () => {
  stopInterval()
  const { bpm, measures } = useAppStore.getState()
  const stepMs = getStepMs(bpm)
  const steps = BEATS_PER_MEASURE * measures
  intervalId = window.setInterval(() => {
    const state = useAppStore.getState()
    const nextStep = (state.currentStep + 1) % steps
    if (nextStep === 0) {
      state.applyPendingMutes()
    }
    state.setCurrentStep(nextStep)
    playStep(nextStep)
  }, stepMs)
}

const scheduleSave = (force = false) => {
  const { isPlaying } = useAppStore.getState()
  if (isPlaying && !force) {
    pendingSave = true
    return
  }
  if (saveTimeout) {
    window.clearTimeout(saveTimeout)
  }
  saveTimeout = window.setTimeout(async () => {
    try {
      const { bpm, measures, rows } = useAppStore.getState()
      const blob = await buildSharePackage({ bpm, measures, rows })
      const text = await blob.text()
      localStorage.setItem(STORAGE_KEY, text)
      pendingSave = false
    } catch {
      // ignore localStorage errors
    }
  }, 500)
}

export const initializeStore = () => {
  if (initialized) {
    return
  }
  initialized = true

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = parseSharePackage(stored)
      const hydrated = hydrateSharePackage(parsed)
      const state = useAppStore.getState()
      state.setIsPlaying(false)
      state.setBpm(hydrated.bpm)
      state.setMeasures(hydrated.measures)
      state.setRows(hydrated.rows as Row[])
      state.resetStep()
      state.setMissingAssets(hydrated.missing)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  } else {
    const state = useAppStore.getState()
    state.setBpm(DEFAULT_BPM)
  }

  useAppStore.subscribe(
    (state) => state.isPlaying,
    (isPlaying) => {
      const state = useAppStore.getState()
      if (isPlaying) {
        state.resetStep()
        playStep(0)
        startInterval()
      } else {
        stopInterval()
        if (pendingSave) {
          scheduleSave(true)
        }
      }
    },
  )

  useAppStore.subscribe(
    (state) => [state.bpm, state.measures, state.isPlaying],
    ([, , isPlaying]) => {
      if (isPlaying) {
        startInterval()
      }
    },
  )

  useAppStore.subscribe(
    (state) => [state.bpm, state.measures, state.rows],
    () => scheduleSave(),
  )

  window.addEventListener('beforeunload', cleanupObjectUrls)
}

export const startOver = () => {
  localStorage.removeItem(STORAGE_KEY)
  cleanupObjectUrls()
  const state = useAppStore.getState()
  state.clearMissingAssets()
  state.setIsPlaying(false)
  state.setBpm(DEFAULT_BPM)
  state.setMeasures(1)
  state.setRows(createInitialRows(BEATS_PER_MEASURE))
  state.resetStep()
}
