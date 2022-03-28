import SparkMD5 from 'spark-md5'

export function downloadFile(url: string, filename: string) {
  const a = document.createElement('a')
  a.download = filename
  a.target = '_blank'
  a.href = url
  a.click()
}

export function fileExtension(filename: string) {
  const ext = filename.split('.').reverse().shift()
  return ext ? `.${ext}` : ''
}

export async function md5(input: Blob | string): Promise<string> {
  if (input instanceof Blob) {
    const arrayBuffer = await input.arrayBuffer()
    return SparkMD5.ArrayBuffer.hash(arrayBuffer)
  } else if (typeof input === 'string') {
    return SparkMD5.hash(input)
  }
  return ''
}
