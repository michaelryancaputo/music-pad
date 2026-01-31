import { rowSchema } from '../ducks/grid'
import type { Row } from '../ducks/grid'
import { registerObjectUrl } from './objectUrls'

type ShareAsset = {
  fileName: string
  mime: string
  dataBase64: string
}

type SharePackage = {
  version: 1
  data: {
    bpm: number
    measures: number
    rows: Row[]
  }
  assets: Record<string, ShareAsset>
}

const blobToBase64 = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('Unable to encode file.'))
        return
      }
      const base64 = result.split(',')[1] ?? ''
      resolve(base64)
    }
    reader.onerror = () => reject(new Error('Unable to encode file.'))
    reader.readAsDataURL(blob)
  })

const base64ToBlob = (base64: string, mime: string) => {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

export const buildSharePackage = async (state: {
  bpm: number
  measures: number
  rows: Row[]
}) => {
  const assets: Record<string, ShareAsset> = {}

  await Promise.all(
    state.rows.map(async (row) => {
      if (row.source.kind !== 'file' && row.source.kind !== 'recorded') {
        return
      }
      if (!row.source.url) {
        return
      }
      const response = await fetch(row.source.url)
      const blob = await response.blob()
      const base64 = await blobToBase64(blob)
      assets[row.id] = {
        fileName: row.source.fileName,
        mime: blob.type || 'audio/webm',
        dataBase64: base64,
      }
    }),
  )

  const payload: SharePackage = {
    version: 1,
    data: {
      bpm: state.bpm,
      measures: state.measures,
      rows: state.rows,
    },
    assets,
  }

  return new Blob([JSON.stringify(payload)], { type: 'application/json' })
}

export const parseSharePackage = (json: string) => {
  const parsed = JSON.parse(json) as SharePackage
  if (!parsed || parsed.version !== 1) {
    throw new Error('Unsupported share format.')
  }
  const rows = parsed.data.rows.map((row) => {
    const result = rowSchema.safeParse(row)
    if (!result.success) {
      throw new Error('Invalid row data in share file.')
    }
    return result.data
  })
  return { ...parsed, data: { ...parsed.data, rows } }
}

export const hydrateSharePackage = (pkg: SharePackage) => {
  const missing: string[] = []
  const rows = pkg.data.rows.map((row) => {
    if (row.source.kind !== 'file' && row.source.kind !== 'recorded') {
      return row
    }
    const asset = pkg.assets[row.id]
    if (!asset) {
      missing.push(row.name || row.id)
      return row.type === 'instrument'
        ? { ...row, source: { kind: 'midi', waveform: 'sine' } }
        : { ...row, source: { kind: 'preset', preset: 'kick' } }
    }
    const blob = base64ToBlob(asset.dataBase64, asset.mime)
    const url = URL.createObjectURL(blob)
    registerObjectUrl(url)
    return {
      ...row,
      source: {
        ...row.source,
        fileName: asset.fileName,
        url,
      },
    }
  })

  return {
    bpm: pkg.data.bpm,
    measures: pkg.data.measures,
    rows,
    missing,
  }
}
