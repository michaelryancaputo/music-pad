import { Button } from './ui/button'

type HeaderProps = {
  onStartOver: () => void
}

export const Header = ({ onStartOver }: HeaderProps) => (
  <header className="flex flex-col gap-2">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
          Music Looper
        </p>
        <h1 className="text-2xl font-semibold text-slate-50">Step sequencer</h1>
      </div>
      <Button onClick={onStartOver} variant="outline" size="default">
        Start Over
      </Button>
    </div>
    <p className="max-w-2xl text-xs text-slate-400">
      Assign sounds to rows, toggle steps, and press play to loop through the
      grid.
    </p>
  </header>
)
