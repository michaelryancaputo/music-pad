import { useRef, useState } from 'react'

import type { Row } from '../ducks/grid'
import { useAppStore } from '../store/useAppStore'
import { buildSharePackage, hydrateSharePackage, parseSharePackage } from '../utils/share'
import { GridRow } from './GridRow'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const Grid = () => {
  const rows = useAppStore((state) => state.rows)
  const currentStep = useAppStore((state) => state.currentStep)
  const addRow = useAppStore((state) => state.addRow)
  const bpm = useAppStore((state) => state.bpm)
  const measures = useAppStore((state) => state.measures)
  const setRows = useAppStore((state) => state.setRows)
  const setBpm = useAppStore((state) => state.setBpm)
  const setMeasures = useAppStore((state) => state.setMeasures)
  const resetStep = useAppStore((state) => state.resetStep)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const missingAssets = useAppStore((state) => state.missingAssets)
  const setMissingAssets = useAppStore((state) => state.setMissingAssets)
  const clearMissingAssets = useAppStore((state) => state.clearMissingAssets)

  const [isExporting, setIsExporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const blob = await buildSharePackage({ bpm, measures, rows })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `music-pad-sequence-${Date.now()}.json`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImport = async (file: File) => {
    const text = await file.text()
    const parsed = parseSharePackage(text)
    const hydrated = hydrateSharePackage(parsed)
    setIsPlaying(false)
    setBpm(hydrated.bpm)
    setMeasures(hydrated.measures)
    setRows(hydrated.rows as Row[])
    resetStep()
    setMissingAssets(hydrated.missing)
  }

  return (
    <Card className="border-slate-800/60 bg-slate-950/40">
      {missingAssets.length > 0 && (
        <div className="mx-4 mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          <span>
            Missing audio files for: {missingAssets.join(', ')}. Using presets instead.
          </span>
          <Button
            onClick={clearMissingAssets}
            variant="outline"
            className="border-amber-400/60 text-amber-100 hover:border-amber-300"
          >
            Dismiss
          </Button>
        </div>
      )}
      <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-800/60">
        <CardTitle className="text-sm uppercase tracking-[0.16em] text-slate-300">
          Grid
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
          >
            Import
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              void handleImport(file)
              event.target.value = ''
            }}
            className="hidden"
          />
          <Button
            onClick={addRow}
          >
            Add sound row
          </Button>
        </div>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <div className="grid gap-3">
          {rows.map((row) => (
            <GridRow key={row.id} row={row} currentStep={currentStep} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
