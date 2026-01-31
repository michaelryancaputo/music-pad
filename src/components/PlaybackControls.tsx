import { useAppStore } from '../store/useAppStore'
import { MAX_BPM, MIN_BPM } from '../utils/constants'

type PlaybackControlsProps = {
  stepMs: number
}

export const PlaybackControls = ({ stepMs }: PlaybackControlsProps) => {
  const bpm = useAppStore((state) => state.bpm)
  const measures = useAppStore((state) => state.measures)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setBpm = useAppStore((state) => state.setBpm)
  const updateMeasures = useAppStore((state) => state.updateMeasures)
  const togglePlayback = useAppStore((state) => state.togglePlayback)

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/30">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={togglePlayback}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
            isPlaying
              ? 'bg-emerald-500/90 text-emerald-950 hover:bg-emerald-400'
              : 'bg-slate-200 text-slate-900 hover:bg-white'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </button>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label htmlFor="bpm" className="text-slate-400">
            BPM
          </label>
          <input
            id="bpm"
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(event) =>
              setBpm(
                Math.min(
                  MAX_BPM,
                  Math.max(MIN_BPM, Number(event.target.value)),
                ),
              )
            }
            className="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 focus:border-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">Time</span>
          <select
            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
            value="4/4"
            disabled
          >
            <option value="4/4">4/4</option>
          </select>
          <span className="text-slate-400">(more soon)</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">Measures: {measures}</span>
          <button
            onClick={() => updateMeasures(measures + 1)}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
          >
            +4 steps
          </button>
          <button
            onClick={() => updateMeasures(Math.max(1, measures - 1))}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
          >
            -4 steps
          </button>
        </div>

        <div className="text-xs text-slate-500">Step length: {stepMs} ms</div>
      </div>
    </section>
  )
}
