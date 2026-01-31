import type { ChangeEvent } from 'react'
import type { StateCreator } from 'zustand'
import { z } from 'zod'

import { createId } from '../utils/ids'
import { BEATS_PER_MEASURE } from '../utils/constants'
import { registerObjectUrl, revokeObjectUrl } from '../utils/objectUrls'

export const presetSoundSchema = z.enum(['kick', 'snare', 'hat'])
export type PresetSound = z.infer<typeof presetSoundSchema>

export const soundSourceSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('preset'),
    preset: presetSoundSchema,
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

export const rowSchema = z.object({
  id: z.string(),
  name: z.string(),
  source: soundSourceSchema,
  steps: z.array(z.boolean()),
  isRecording: z.boolean(),
})

export type Row = z.infer<typeof rowSchema>

export const createInitialRows = (steps: number): Row[] => [
  {
    id: createId(),
    name: 'Kick',
    source: { kind: 'preset', preset: 'kick' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
  },
  {
    id: createId(),
    name: 'Snare',
    source: { kind: 'preset', preset: 'snare' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
  },
  {
    id: createId(),
    name: 'Hi-hat',
    source: { kind: 'preset', preset: 'hat' },
    steps: Array.from({ length: steps }, () => false),
    isRecording: false,
  },
]

export type GridState = {
  rows: Row[]
  collapsedRows: Record<string, boolean>
}

export type GridActions = {
  toggleCell: (rowId: string, stepIndex: number) => void
  updateRowName: (rowId: string, name: string) => void
  updateRowSource: (rowId: string, source: SoundSource) => void
  addRow: () => void
  removeRow: (rowId: string) => void
  toggleRowConfig: (rowId: string) => void
  toggleAllRowConfigs: () => void
  setRowRecording: (rowId: string, isRecording: boolean) => void
  handleFileChange: (rowId: string, event: ChangeEvent<HTMLInputElement>) => void
}

export type GridSlice = GridState & GridActions

export const createGridSlice =
  (initialRows: Row[]): StateCreator<GridSlice, [], [], GridSlice> =>
  (set, get) => ({
    rows: initialRows,
    collapsedRows: {},
    toggleCell: (rowId, stepIndex) => {
      set((state) => ({
        rows: state.rows.map((row) =>
          row.id === rowId
            ? {
                ...row,
                steps: row.steps.map((value, index) =>
                  index === stepIndex ? !value : value,
                ),
              }
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
    addRow: () => {
      const measures = (get() as { measures?: number }).measures ?? 1
      const steps = BEATS_PER_MEASURE * measures
      set((state) => ({
        rows: [
          ...state.rows,
          {
            id: createId(),
            name: `Sound ${state.rows.length + 1}`,
            source: { kind: 'preset', preset: 'kick' },
            steps: Array.from({ length: steps }, () => false),
            isRecording: false,
          },
        ],
      }))
    },
    removeRow: (rowId) => {
      const { recordModalRowId, closeRecordModal } = get() as {
        recordModalRowId?: string | null
        closeRecordModal?: () => void
      }
      if (recordModalRowId === rowId) {
        closeRecordModal?.()
      }
      const row = get().rows.find((item) => item.id === rowId)
      if (row && (row.source.kind === 'file' || row.source.kind === 'recorded')) {
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
  })
