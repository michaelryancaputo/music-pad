type StepCellProps = {
  isActive: boolean
  isCurrent: boolean
  onClick: () => void
}

export const StepCell = ({ isActive, isCurrent, onClick }: StepCellProps) => (
  <button
    onClick={onClick}
    className={`aspect-square rounded-md border transition-colors ${
      isCurrent ? 'border-slate-200' : 'border-slate-800/80'
    } ${isActive ? 'bg-indigo-400/90' : 'bg-slate-950/40'} hover:border-slate-500`}
  />
)
