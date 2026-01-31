import { useAppStore } from '../store/useAppStore'
import { getStepMs } from '../utils/audio'
import { MAX_BPM, MIN_BPM } from '../utils/constants'
import { Button } from './ui/button'
import { Card, CardContent } from './ui/card'
import { Input } from './ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export const PlaybackControls = () => {
  const bpm = useAppStore((state) => state.bpm)
  const measures = useAppStore((state) => state.measures)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const setBpm = useAppStore((state) => state.setBpm)
  const updateMeasures = useAppStore((state) => state.updateMeasures)
  const togglePlayback = useAppStore((state) => state.togglePlayback)

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-3">
        <Button
          onClick={togglePlayback}
          variant={isPlaying ? 'secondary' : 'default'}
          size="default"
          className={isPlaying ? 'bg-emerald-500/90 text-emerald-950 hover:bg-emerald-400' : ''}
        >
          {isPlaying ? 'Stop' : 'Play'}
        </Button>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label htmlFor="bpm" className="text-slate-400">
            BPM
          </label>
          <Input
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
            className="h-8 w-16 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">Time</span>
          <Select value="4/4" disabled>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4/4">4/4</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-slate-400">(more soon)</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-300">
          <span className="text-slate-400">Measures: {measures}</span>
          <Button onClick={() => updateMeasures(measures + 1)} variant="outline">
            +4 steps
          </Button>
          <Button
            onClick={() => updateMeasures(Math.max(1, measures - 1))}
            variant="outline"
          >
            -4 steps
          </Button>
        </div>

        <div className="text-xs text-slate-500">
          Step length: {getStepMs(bpm)} ms
        </div>
      </CardContent>
    </Card>
  )
}
