import { useEffect } from 'react'

import { Grid } from './components/Grid'
import { Header } from './components/Header'
import { PlaybackControls } from './components/PlaybackControls'
import { RecordingModal } from './components/RecordingModal'
import { useSequencerPlayback } from './hooks/useSequencerPlayback'
import { useSequencerTicker } from './hooks/useSequencerTicker'
import { cleanupObjectUrls } from './utils/objectUrls'

function App() {
  const { stepMs } = useSequencerTicker()

  useSequencerPlayback()

  useEffect(() => () => cleanupObjectUrls(), [])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <Header />
        <PlaybackControls stepMs={stepMs} />
        <Grid />
        <RecordingModal />
      </div>
    </div>
  )
}

export default App
