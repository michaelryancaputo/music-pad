export const NOTE_OPTIONS = [
  'C3',
  'D3',
  'E3',
  'F3',
  'G3',
  'A3',
  'B3',
  'C4',
  'D4',
  'E4',
  'F4',
  'G4',
  'A4',
  'B4',
  'C5',
] as const

export type Note = (typeof NOTE_OPTIONS)[number]

const SEMITONES: Record<string, number> = {
  C: 0,
  'C#': 1,
  D: 2,
  'D#': 3,
  E: 4,
  F: 5,
  'F#': 6,
  G: 7,
  'G#': 8,
  A: 9,
  'A#': 10,
  B: 11,
}

export const noteToFrequency = (note: Note) => {
  const match = /^([A-G]#?)(\d)$/.exec(note)
  if (!match) {
    return 440
  }
  const [, pitch, octaveRaw] = match
  const octave = Number(octaveRaw)
  const semitone = SEMITONES[pitch] ?? 9
  const midi = (octave + 1) * 12 + semitone
  return 440 * 2 ** ((midi - 69) / 12)
}
