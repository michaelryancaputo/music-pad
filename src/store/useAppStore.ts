import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

import { createGridSlice, createInitialRows } from '../ducks/grid'
import { createRecordingSlice } from '../ducks/recording'
import { createSequencerSlice } from '../ducks/sequencer'
import { BEATS_PER_MEASURE } from '../utils/constants'

import type { GridSlice } from '../ducks/grid'
import type { RecordingSlice } from '../ducks/recording'
import type { SequencerSlice } from '../ducks/sequencer'

export type AppStore = SequencerSlice & GridSlice & RecordingSlice

const initialSteps = BEATS_PER_MEASURE * 1

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get, api) => ({
    ...createSequencerSlice(set, get, api),
    ...createGridSlice(createInitialRows(initialSteps))(set, get, api),
    ...createRecordingSlice(set, get, api),
  })),
)
