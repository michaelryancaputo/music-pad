type StepCellProps = {
  isActive: boolean
  isCurrent: boolean
  onClick: () => void
}

export const StepCell = ({ isActive, isCurrent, onClick }: StepCellProps) => (
  <button
    onClick={onClick}
    className={`aspect-square rounded-lg border transition ${
      isCurrent ? 'border-slate-200' : 'border-slate-800'
    } ${isActive ? 'bg-indigo-400/90' : 'bg-slate-900'} hover:border-slate-500`}
  />
)
