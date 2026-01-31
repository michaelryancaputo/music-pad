import { useMemo } from 'react'

import { useRecordingModal } from '../hooks/useRecordingModal'
import { useAppStore } from '../store/useAppStore'

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
      <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Recording
            </p>
            <h3 className="text-lg font-semibold text-slate-100">
              {recordingRow?.name ?? 'Sound'}
            </h3>
          </div>
          <button
            onClick={closeRecordModal}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
          >
            Close
          </button>
        </div>

        {recordingStatus === 'idle' && (
          <div className="mt-4 flex flex-col gap-3">
            <p className="text-sm text-slate-300">
              Press start to record a new sound. Recording stops when you press
              the space bar.
            </p>
            <button
              onClick={startModalRecording}
              className="w-fit rounded-md bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
            >
              Start recording
            </button>
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
            <button
              onClick={stopModalRecording}
              className="w-fit rounded-md border border-red-400 px-3 py-2 text-xs font-semibold text-red-200 hover:border-red-300"
            >
              Stop recording
            </button>
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
              <button
                onClick={startModalRecording}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
              >
                Record again
              </button>
              <button
                onClick={isPreviewingTrim ? stopTrimPreview : playTrimPreview}
                disabled={!recordedBuffer}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
              >
                {isPreviewingTrim ? 'Stop preview' : 'Play trimmed'}
              </button>
              <button
                onClick={saveRecordingToRow}
                className="rounded-md bg-emerald-500/90 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                Save recording
              </button>
              <button
                onClick={closeRecordModal}
                className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-200 hover:border-slate-500"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
