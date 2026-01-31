const objectUrls = new Set<string>()

export const registerObjectUrl = (url: string) => {
  objectUrls.add(url)
}

export const revokeObjectUrl = (url: string) => {
  URL.revokeObjectURL(url)
  objectUrls.delete(url)
}

export const cleanupObjectUrls = () => {
  objectUrls.forEach((url) => URL.revokeObjectURL(url))
  objectUrls.clear()
}
