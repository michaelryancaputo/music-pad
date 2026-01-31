import { useMemo } from 'react'

import { useRecordingModal } from '../hooks/useRecordingModal'
import { useAppStore } from '../store/useAppStore'
import { NOTE_OPTIONS } from '../utils/notes'
import { Button } from './ui/button'
import { Card } from './ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export const RecordingModal = () => {
  const recordModalRowId = useAppStore((state) => state.recordModalRowId)
  const recordingStatus = useAppStore((state) => state.recordingStatus)
  const recordedBuffer = useAppStore((state) => state.recordedBuffer)
  const trimStart = useAppStore((state) => state.trimStart)
  const trimEnd = useAppStore((state) => state.trimEnd)
  const isPreviewingTrim = useAppStore((state) => state.isPreviewingTrim)
  const rows = useAppStore((state) => state.rows)
  const closeRecordModal = useAppStore((state) => state.closeRecordModal)
  const startModalRecording = useAppStore((state) => state.startModalRecording)
  const stopModalRecording = useAppStore((state) => state.stopModalRecording)
  const saveRecordingToRow = useAppStore((state) => state.saveRecordingToRow)
  const setTrimStart = useAppStore((state) => state.setTrimStart)
  const setTrimEnd = useAppStore((state) => state.setTrimEnd)
  const playTrimPreview = useAppStore((state) => state.playTrimPreview)
  const stopTrimPreview = useAppStore((state) => state.stopTrimPreview)
  const setRowBaseNote = useAppStore((state) => state.setRowBaseNote)

  const { liveCanvasRef, recordedCanvasRef } = useRecordingModal()

  const recordingRow = useMemo(
    () => rows.find((row) => row.id === recordModalRowId) ?? null,
    [recordModalRowId, rows],
  )

  if (!recordModalRowId) {
    return null
  }

  const recordingDuration = recordedBuffer?.duration ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <Card className="w-full max-w-2xl bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Recording
            </p>
            <h3 className="text-lg font-semibold text-slate-100">
              {recordingRow?.name ?? 'Sound'}
            </h3>
          </div>
          <Button onClick={closeRecordModal}>Close</Button>
        </div>

        {recordingStatus === 'idle' && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-slate-300">
              Press start to record a new sound. Recording stops when you press
              the space bar.
            </p>
            <Button
              onClick={startModalRecording}
              variant="secondary"
              size="default"
              className="w-fit bg-emerald-500/90 text-emerald-950 hover:bg-emerald-400"
            >
              Start recording
            </Button>
          </div>
        )}

        {recordingStatus === 'recording' && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-slate-300">
              <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-rose-400" />
              Recording... Press space to stop.
            </div>
            <canvas
              ref={liveCanvasRef}
              width={720}
              height={160}
              className="w-full rounded-lg border border-slate-800 bg-slate-900"
            />
            <Button
              onClick={stopModalRecording}
              variant="destructive"
              size="default"
              className="w-fit"
            >
              Stop recording
            </Button>
          </div>
        )}

        {recordingStatus === 'review' && (
          <div className="mt-4 flex flex-col gap-4">
            <div>
              <p className="text-sm text-slate-300">
                Trim your recording and save it to this row.
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Duration: {recordingDuration.toFixed(2)}s
              </p>
              {recordingRow?.type === 'instrument' && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                  <span className="text-slate-400">Base note</span>
                  <Select
                    value={recordingRow.baseNote}
                    onValueChange={(value) =>
                      setRowBaseNote(
                        recordingRow.id,
                        value as typeof recordingRow.baseNote,
                      )
                    }
                  >
                    <SelectTrigger className="h-7">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_OPTIONS.map((note) => (
                        <SelectItem key={note} value={note}>
                          {note}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <canvas
              ref={recordedCanvasRef}
              width={720}
              height={160}
              className="w-full rounded-lg border border-slate-800 bg-slate-900"
            />

            <div className="grid gap-3 text-xs text-slate-300">
              <label className="flex flex-col gap-2">
                Start: {trimStart.toFixed(2)}s
                <input
                  type="range"
                  min={0}
                  max={recordingDuration || 0}
                  step={0.01}
                  value={trimStart}
                  onChange={(event) =>
                    setTrimStart(
                      Math.min(
                        Number(event.target.value),
                        Math.max(0, trimEnd - 0.05),
                      ),
                    )
                  }
                  className="accent-sky-400"
                />
              </label>
              <label className="flex flex-col gap-2">
                End: {trimEnd.toFixed(2)}s
                <input
                  type="range"
                  min={0}
                  max={recordingDuration || 0}
                  step={0.01}
                  value={trimEnd}
                  onChange={(event) =>
                    setTrimEnd(
                      Math.max(
                        Number(event.target.value),
                        trimStart + 0.05,
                      ),
                    )
                  }
                  className="accent-sky-400"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={startModalRecording} variant="outline">
                Record again
              </Button>
              <Button
                onClick={isPreviewingTrim ? stopTrimPreview : playTrimPreview}
                disabled={!recordedBuffer}
                variant="outline"
              >
                {isPreviewingTrim ? 'Stop preview' : 'Play trimmed'}
              </Button>
              <Button
                onClick={saveRecordingToRow}
                variant="secondary"
                size="default"
                className="bg-emerald-500/90 text-emerald-950 hover:bg-emerald-400"
              >
                Save recording
              </Button>
              <Button onClick={closeRecordModal} variant="outline">
                Discard
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
