import { Grid } from './components/Grid'
import { Header } from './components/Header'
import { PlaybackControls } from './components/PlaybackControls'
import { RecordingModal } from './components/RecordingModal'
import { initializeStore, startOver } from './store/init'

function App() {
  initializeStore()

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <Header onStartOver={startOver} />
        <PlaybackControls />
        <Grid />
        <RecordingModal />
      </div>
    </div>
  )
}

export default App
