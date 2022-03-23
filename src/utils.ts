export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.download = filename
  a.target = '_blank'
  a.href = url
  a.click()
}

export function fileExtension(filename: string) {
  const ext = filename.split('.').reverse().shift()
  return ext
    ? `.${ext}`
    : ''
}
