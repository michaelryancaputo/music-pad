import { useAppStore } from '../store/useAppStore'
import { GridRow } from './GridRow'

export const Grid = () => {
  const rows = useAppStore((state) => state.rows)
  const currentStep = useAppStore((state) => state.currentStep)
  const addRow = useAppStore((state) => state.addRow)
  const collapsedRows = useAppStore((state) => state.collapsedRows)
  const toggleAllRowConfigs = useAppStore((state) => state.toggleAllRowConfigs)

  const allCollapsed =
    rows.length > 0 && rows.every((row) => collapsedRows[row.id])

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-100">Grid</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAllRowConfigs}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
          >
            {allCollapsed ? 'Show all configs' : 'Minimize rows'}
          </button>
          <button
            onClick={addRow}
            className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-slate-500"
          >
            Add sound row
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="grid gap-3">
          {rows.map((row) => (
            <GridRow key={row.id} row={row} currentStep={currentStep} />
          ))}
        </div>
      </div>
    </section>
  )
}
