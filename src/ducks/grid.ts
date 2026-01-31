import type { ChangeEvent } from 'react'
import type { StateCreator } from 'zustand'
import { z } from 'zod'

import { createId } from '../utils/ids'
import { BEATS_PER_MEASURE } from '../utils/constants'
import { registerObjectUrl, revokeObjectUrl } from '../utils/objectUrls'
import type { AppStore } from '../store/useAppStore'
import { NOTE_OPTIONS } from '../utils/notes'
import type { Note } from '../utils/notes'

export const presetSoundSchema = z.enum(['kick', 'snare', 'hat'])
export type PresetSound = z.infer<typeof presetSoundSchema>

export const soundSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('preset'),
    preset: presetSoundSchema,
  }),
  z.object({
    kind: z.literal('midi'),
    waveform: z.enum(['sine', 'triangle', 'square', 'sawtooth']),
  }),
  z.object({
    kind: z.literal('file'),
    fileName: z.string(),
    url: z.string(),
  }),
  z.object({
    kind: z.literal('recorded'),
    fileName: z.string(),
    url: z.string(),
  }),
])

export type SoundSource = z.infer<typeof soundSourceSchema>

export const noteSchema = z.enum(NOTE_OPTIONS)
export type InstrumentStep = [Note | null, Note | null, Note | null, Note | null]

export const instrumentStepSchema = z.tuple([
  noteSchema.nullable(),
  noteSchema.nullable(),
  noteSchema.nullable(),
  noteSchema.nullable(),
])

export const rhythmRowSchema = z.object({
  type: z.literal('rhythm'),
  id: z.string(),
  name: z.string(),
  source: soundSourceSchema,
  steps: z.array(z.boolean()),
  isRecording: z.boolean(),
  isMuted: z.boolean(),
  pendingMute: z.boolean().nullable(),
})

export const instrumentRowSchema = z.object({
  type: z.literal('instrument'),
  id: z.string(),
  name: z.string(),
  source: soundSourceSchema,
  steps: z.array(instrumentStepSchema),
  baseNote: noteSchema,
  isRecording: z.boolean(),
  isMuted: z.boolean(),
  pendingMute: z.boolean().nullable(),
})

export const rowSchema = z.discriminatedUnion('type', [
  rhythmRowSchema,
  instrumentRowSchema,
])

export type Row = z.infer<typeof rowSchema>

export const createInitialRows = (steps: number): Row[] => [
  {
    type: 'rhythm',
    id: createId(),
    name: 'Kick',
    source: { kind: 'preset', preset: 'kick' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
    isMuted: false,
    pendingMute: null,
  },
  {
    type: 'rhythm',
    id: createId(),
    name: 'Snare',
    source: { kind: 'preset', preset: 'snare' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
    isMuted: false,
    pendingMute: null,
  },
  {
    type: 'rhythm',
    id: createId(),
    name: 'Hi-hat',
    source: { kind: 'preset', preset: 'hat' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
    isMuted: false,
    pendingMute: null,
  },
]

export type GridState = {
  rows: Row[]
  collapsedRows: Record<string, boolean>
  missingAssets: string[]
}

export type GridActions = {
  toggleCell: (rowId: string, stepIndex: number) => void
  setInstrumentStepNote: (
    rowId: string,
    stepIndex: number,
    subIndex: number,
    note: Note | null,
  ) => void
  setRowType: (rowId: string, type: Row['type']) => void
  setRowBaseNote: (rowId: string, note: Note) => void
  updateRowName: (rowId: string, name: string) => void
  updateRowSource: (rowId: string, source: SoundSource) => void
  toggleRowMute: (rowId: string) => void
  applyPendingMutes: () => void
  addRow: () => void
  removeRow: (rowId: string) => void
  toggleRowConfig: (rowId: string) => void
  toggleAllRowConfigs: () => void
  setRowRecording: (rowId: string, isRecording: boolean) => void
  handleFileChange: (rowId: string, event: ChangeEvent<HTMLInputElement>) => void
  setRows: (rows: Row[]) => void
  setMissingAssets: (missing: string[]) => void
  clearMissingAssets: () => void
}

export type GridSlice = GridState & GridActions

export const createGridSlice =
  (initialRows: Row[]): StateCreator<AppStore, [], [], GridSlice> =>
  (set, get) => ({
    rows: initialRows,
    collapsedRows: {},
    missingAssets: [],
    toggleCell: (rowId, stepIndex) => {
      set((state) => ({
        rows: state.rows.map((row) =>
          row.id === rowId
          ? row.type === 'rhythm'
            ? {
                ...row,
                steps: row.steps.map((value, index) =>
                  index === stepIndex ? !value : value,
                ),
              }
            : row
            : row,
        ),
      }))
    },
    setInstrumentStepNote: (rowId, stepIndex, subIndex, note) => {
      set((state) => ({
        rows: state.rows.map((row) => {
          if (row.id !== rowId || row.type !== 'instrument') {
            return row
          }
          return {
            ...row,
            steps: row.steps.map((step, index) => {
              if (index !== stepIndex) {
                return step
              }
              const nextStep: InstrumentStep = [...step] as InstrumentStep
              nextStep[subIndex] = note
              return nextStep
            }),
          }
        }),
      }))
    },
    setRowType: (rowId, type) => {
      set((state) => ({
        rows: state.rows.map((row) => {
          if (row.id !== rowId || row.type === type) {
            return row
          }
          if (type === 'instrument') {
            const instrumentSteps: InstrumentStep[] = Array.from(
              { length: row.steps.length },
              () => [null, null, null, null],
            )
            return {
              type: 'instrument',
              id: row.id,
              name: row.name,
              source:
                row.source.kind === 'preset'
                  ? { kind: 'midi', waveform: 'sine' }
                  : row.source,
              steps: instrumentSteps,
              baseNote: 'C4',
              isRecording: row.isRecording,
              isMuted: row.isMuted,
              pendingMute: row.pendingMute,
            }
          }
          const rhythmSteps = row.steps.map((step) =>
            step.some((note) => Boolean(note)),
          )
          return {
            type: 'rhythm',
            id: row.id,
            name: row.name,
            source: row.source.kind === 'midi' ? { kind: 'preset', preset: 'kick' } : row.source,
            steps: rhythmSteps,
            isRecording: row.isRecording,
            isMuted: row.isMuted,
            pendingMute: row.pendingMute,
          }
        }),
      }))
    },
    setRowBaseNote: (rowId, note) => {
      set((state) => ({
        rows: state.rows.map((row) =>
          row.id === rowId && row.type === 'instrument'
            ? { ...row, baseNote: note }
            : row,
        ),
      }))
    },
    updateRowName: (rowId, name) => {
      set((state) => ({
        rows: state.rows.map((row) =>
          row.id === rowId ? { ...row, name } : row,
        ),
      }))
    },
    updateRowSource: (rowId, source) => {
      set((state) => ({
        rows: state.rows.map((row) => {
          if (row.id !== rowId) {
            return row
          }
          const sourceHasUrl =
            source.kind === 'file' || source.kind === 'recorded'
          if (row.source.kind === 'file' || row.source.kind === 'recorded') {
            if (!sourceHasUrl || row.source.url !== source.url) {
              revokeObjectUrl(row.source.url)
            }
          }
          return { ...row, source }
        }),
      }))
    },
    toggleRowMute: (rowId) => {
      const { isPlaying } = get()
      set((state) => ({
        rows: state.rows.map((row) => {
          if (row.id !== rowId) {
            return row
          }
          if (!isPlaying) {
            return { ...row, isMuted: !row.isMuted, pendingMute: null }
          }
          return { ...row, pendingMute: !row.isMuted }
        }),
      }))
    },
    applyPendingMutes: () => {
      set((state) => ({
        rows: state.rows.map((row) => {
          if (row.pendingMute === null) {
            return row
          }
          return { ...row, isMuted: row.pendingMute, pendingMute: null }
        }),
      }))
    },
    addRow: () => {
      const measures = (get() as { measures?: number }).measures ?? 1
      const steps = BEATS_PER_MEASURE * measures
      set((state) => ({
        rows: [
          ...state.rows,
          {
            type: 'rhythm',
            id: createId(),
            name: `Sound ${state.rows.length + 1}`,
            source: { kind: 'preset', preset: 'kick' },
            steps: Array.from({ length: steps }, () => false),
            isRecording: false,
            isMuted: false,
            pendingMute: null,
          },
        ],
      }))
    },
    removeRow: (rowId) => {
      const { recordModalRowId, closeRecordModal } = get()
      if (recordModalRowId === rowId) {
        closeRecordModal?.()
      }
      const row = get().rows.find((item) => item.id === rowId)
      if (
        row &&
        (row.source.kind === 'file' || row.source.kind === 'recorded')
      ) {
        revokeObjectUrl(row.source.url)
      }
      set((state) => ({
        rows: state.rows.filter((row) => row.id !== rowId),
      }))
    },
    toggleRowConfig: (rowId) => {
      set((state) => ({
        collapsedRows: {
          ...state.collapsedRows,
          [rowId]: !state.collapsedRows[rowId],
        },
      }))
    },
    toggleAllRowConfigs: () => {
      set((state) => {
        const allCollapsed = state.rows.every(
          (row) => state.collapsedRows[row.id],
        )
        const nextCollapsed = state.rows.reduce<Record<string, boolean>>(
          (acc, row) => {
            acc[row.id] = !allCollapsed
            return acc
          },
          {},
        )
        return { collapsedRows: nextCollapsed }
      })
    },
    setRowRecording: (rowId, isRecording) => {
      set((state) => ({
        rows: state.rows.map((row) =>
          row.id === rowId ? { ...row, isRecording } : row,
        ),
      }))
    },
    handleFileChange: (rowId, event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      registerObjectUrl(url)
      get().updateRowSource(rowId, {
        kind: 'file',
        fileName: file.name,
        url,
      })
      event.target.value = ''
    },
    setRows: (rows) => set({ rows }),
    setMissingAssets: (missing) => set({ missingAssets: missing }),
    clearMissingAssets: () => set({ missingAssets: [] }),
  })
