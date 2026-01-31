import { useEffect, useMemo, useRef, useState } from 'react'

type PresetSound = 'kick' | 'snare' | 'hat'

type SoundSource =
  | { kind: 'preset'; preset: PresetSound }
  | { kind: 'file'; fileName: string; url: string }
  | { kind: 'recorded'; fileName: string; url: string }

type Row = {
  id: string
  name: string
  source: SoundSource
  steps: boolean[]
  isRecording: boolean
}

const BEATS_PER_MEASURE = 4
const DEFAULT_BPM = 90
const MIN_BPM = 40
const MAX_BPM = 220

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Math.random().toString(36).slice(2, 10)}`

const presetLabel: Record<PresetSound, string> = {
  kick: 'Kick',
  snare: 'Snare',
  hat: 'Hi-hat',
}

const createInitialRows = (steps: number): Row[] => [
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

const getStepMs = (bpm: number) => Math.round((60_000 / bpm) * 1)

function App() {
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [measures, setMeasures] = useState(1)
  const steps = BEATS_PER_MEASURE * measures
  const [rows, setRows] = useState<Row[]>(() => createInitialRows(steps))
  const rowsRef = useRef(rows)
  const [currentStep, setCurrentStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [recordingRowId, setRecordingRowId] = useState<string | null>(null)

  const audioContextRef = useRef<AudioContext | null>(null)
  const noiseBufferRef = useRef<AudioBuffer | null>(null)
  const recorderRef = useRef<Record<string, MediaRecorder | null>>({})
  const streamRef = useRef<Record<string, MediaStream | null>>({})
  const objectUrlsRef = useRef(new Set<string>())
  const lastPlayedStepRef = useRef<number | null>(null)

  const stepMs = useMemo(() => getStepMs(bpm), [bpm])

  useEffect(() => {
    rowsRef.current = rows
  }, [rows])

  useEffect(() => {
    setRows((prevRows) =>
      prevRows.map((row) => {
        if (row.steps.length === steps) {
          return row
        }
        const nextSteps = Array.from({ length: steps }, (_, index) =>
          row.steps[index] ?? false,
        )
        return { ...row, steps: nextSteps }
      }),
    )
    setCurrentStep(0)
    lastPlayedStepRef.current = null
  }, [steps])

  useEffect(() => {
    if (!isPlaying) {
      return
    }

    const interval = window.setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps)
    }, stepMs)

    return () => window.clearInterval(interval)
  }, [isPlaying, stepMs, steps])

  useEffect(() => {
    if (!isPlaying) {
      return
    }
    playStep(currentStep)
  }, [currentStep, isPlaying])

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  const ensureAudioContext = async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext()
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
    return audioContextRef.current
  }

  const getNoiseBuffer = (context: AudioContext) => {
    if (noiseBufferRef.current) {
      return noiseBufferRef.current
    }
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i += 1) {
      data[i] = Math.random() * 2 - 1
    }
    noiseBufferRef.current = buffer
    return buffer
  }

  const playPreset = async (preset: PresetSound) => {
    const context = await ensureAudioContext()
    const now = context.currentTime

    if (preset === 'kick') {
      const osc = context.createOscillator()
      const gain = context.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(140, now)
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.2)
      gain.gain.setValueAtTime(0.9, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
      osc.connect(gain).connect(context.destination)
      osc.start(now)
      osc.stop(now + 0.25)
      return
    }

    if (preset === 'snare') {
      const noise = context.createBufferSource()
      noise.buffer = getNoiseBuffer(context)
      const noiseFilter = context.createBiquadFilter()
      noiseFilter.type = 'highpass'
      noiseFilter.frequency.value = 1200
      const noiseGain = context.createGain()
      noiseGain.gain.setValueAtTime(0.6, now)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      noise.connect(noiseFilter).connect(noiseGain).connect(context.destination)
      noise.start(now)
      noise.stop(now + 0.2)
      return
    }

    const hatNoise = context.createBufferSource()
    hatNoise.buffer = getNoiseBuffer(context)
    const hatFilter = context.createBiquadFilter()
    hatFilter.type = 'highpass'
    hatFilter.frequency.value = 7000
    const hatGain = context.createGain()
    hatGain.gain.setValueAtTime(0.4, now)
    hatGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08)
    hatNoise.connect(hatFilter).connect(hatGain).connect(context.destination)
    hatNoise.start(now)
    hatNoise.stop(now + 0.08)
  }

  const playSound = async (row: Row) => {
    if (row.source.kind === 'preset') {
      await playPreset(row.source.preset)
      return
    }

    const audio = new Audio(row.source.url)
    audio.volume = 0.9
    audio.play().catch(() => {})
  }

  const playStep = (stepIndex: number) => {
    if (lastPlayedStepRef.current === stepIndex) {
      return
    }
    lastPlayedStepRef.current = stepIndex
    rowsRef.current.forEach((row) => {
      if (row.steps[stepIndex]) {
        void playSound(row)
      }
    })
  }

  const toggleCell = (rowId: string, stepIndex: number) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              steps: row.steps.map((value, index) =>
                index === stepIndex ? !value : value,
              ),
            }
          : row,
      ),
    )
  }

  const updateRowName = (rowId: string, name: string) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, name } : row)),
    )
  }

  const updateRowSource = (rowId: string, source: SoundSource) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== rowId) {
          return row
        }
        if (
          (row.source.kind === 'file' || row.source.kind === 'recorded') &&
          row.source.url !== source.url
        ) {
          URL.revokeObjectURL(row.source.url)
          objectUrlsRef.current.delete(row.source.url)
        }
        return { ...row, source }
      }),
    )
  }

  const handleFileChange = (
    rowId: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    objectUrlsRef.current.add(url)
    updateRowSource(rowId, {
      kind: 'file',
      fileName: file.name,
      url,
    })
    event.target.value = ''
  }

  const startRecording = async (rowId: string) => {
    if (recordingRowId && recordingRowId !== rowId) {
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: recorder.mimeType || 'audio/webm',
        })
        const url = URL.createObjectURL(blob)
        objectUrlsRef.current.add(url)
        updateRowSource(rowId, {
          kind: 'recorded',
          fileName: `Recording ${new Date().toLocaleTimeString()}`,
          url,
        })
        setRows((prev) =>
          prev.map((row) =>
            row.id === rowId ? { ...row, isRecording: false } : row,
          ),
        )
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current[rowId] = null
        recorderRef.current[rowId] = null
        setRecordingRowId(null)
      }
      recorderRef.current[rowId] = recorder
      streamRef.current[rowId] = stream
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, isRecording: true } : row,
        ),
      )
      setRecordingRowId(rowId)
      recorder.start()
    } catch (error) {
      setRecordingRowId(null)
    }
  }

  const stopRecording = (rowId: string) => {
    recorderRef.current[rowId]?.stop()
  }

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: createId(),
        name: `Sound ${prev.length + 1}`,
        source: { kind: 'preset', preset: 'kick' },
        steps: Array.from({ length: steps }, () => false),
        isRecording: false,
      },
    ])
  }

  const togglePlayback = async () => {
    await ensureAudioContext()
    setIsPlaying((prev) => {
      const next = !prev
      if (next) {
        lastPlayedStepRef.current = null
        setCurrentStep(0)
      }
      return next
    })
  }

  const selectPreset = (rowId: string, preset: PresetSound) => {
    updateRowSource(rowId, { kind: 'preset', preset })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
            Music Looper
          </p>
          <h1 className="text-3xl font-semibold text-slate-50">
            Step sequencer
          </h1>
          <p className="max-w-2xl text-sm text-slate-400">
            Assign sounds to rows, toggle steps, and press play to loop through
            the grid.
          </p>
        </header>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-black/30">
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={togglePlayback}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                isPlaying
                  ? 'bg-emerald-500/90 text-emerald-950 hover:bg-emerald-400'
                  : 'bg-slate-200 text-slate-900 hover:bg-white'
              }`}
            >
              {isPlaying ? 'Stop' : 'Play'}
            </button>

            <div className="flex items-center gap-3 text-sm text-slate-300">
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
                className="w-20 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100 focus:border-slate-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-300">
              <span className="text-slate-400">Time</span>
              <select
                className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                value="4/4"
                disabled
              >
                <option value="4/4">4/4</option>
              </select>
              <span className="text-slate-400">(more soon)</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="text-slate-400">
                Measures: {measures}
              </span>
              <button
                onClick={() => setMeasures((prev) => prev + 1)}
                className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:border-slate-500"
              >
                +4 steps
              </button>
              <button
                onClick={() => setMeasures((prev) => Math.max(1, prev - 1))}
                className="rounded-md border border-slate-700 px-2 py-1 text-slate-200 hover:border-slate-500"
              >
                -4 steps
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Step length: {stepMs} ms
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Grid</h2>
            <button
              onClick={addRow}
              className="rounded-md border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-slate-500"
            >
              Add sound row
            </button>
          </div>

          <div className="mt-6 overflow-x-auto">
            <div className="grid gap-4">
              {rows.map((row) => {
                const sourceLabel =
                  row.source.kind === 'preset'
                    ? `${presetLabel[row.source.preset]} preset`
                    : row.source.fileName

                return (
                  <div
                    key={row.id}
                    className="grid items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 lg:grid-cols-[220px_1fr]"
                  >
                    <div className="flex flex-col gap-2">
                      <input
                        value={row.name}
                        onChange={(event) =>
                          updateRowName(row.id, event.target.value)
                        }
                        className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        placeholder="Sound name"
                      />

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        <span>Source:</span>
                        <span className="rounded-full bg-slate-800 px-2 py-1">
                          {sourceLabel}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                        <select
                          value={
                            row.source.kind === 'preset'
                              ? row.source.preset
                              : ''
                          }
                          onChange={(event) =>
                            selectPreset(
                              row.id,
                              event.target.value as PresetSound,
                            )
                          }
                          className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                        >
                          <option value="">Choose preset</option>
                          <option value="kick">Kick</option>
                          <option value="snare">Snare</option>
                          <option value="hat">Hi-hat</option>
                        </select>

                        <label className="cursor-pointer rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500">
                          Choose file
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(event) =>
                              handleFileChange(row.id, event)
                            }
                            className="hidden"
                          />
                        </label>

                        <button
                          onClick={() =>
                            row.isRecording
                              ? stopRecording(row.id)
                              : startRecording(row.id)
                          }
                          disabled={
                            Boolean(recordingRowId) &&
                            recordingRowId !== row.id
                          }
                          className={`rounded-md border px-2 py-1 text-xs transition ${
                            row.isRecording
                              ? 'border-red-400 text-red-200 hover:border-red-300'
                              : 'border-slate-700 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          {row.isRecording ? 'Stop' : 'Record'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fit,minmax(36px,1fr))] gap-2">
                      {row.steps.map((isActive, stepIndex) => {
                        const isCurrent = stepIndex === currentStep
                        return (
                          <button
                            key={`${row.id}-${stepIndex}`}
                            onClick={() => toggleCell(row.id, stepIndex)}
                            className={`aspect-square rounded-lg border transition ${
                              isCurrent
                                ? 'border-slate-200'
                                : 'border-slate-800'
                            } ${
                              isActive
                                ? 'bg-indigo-400/90'
                                : 'bg-slate-900'
                            } hover:border-slate-500`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default App
