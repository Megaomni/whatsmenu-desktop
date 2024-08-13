import Resizer from 'react-image-file-resizer'

export async function UseResize(
  file: Blob,
  maxWidth: number,
  maxHeight: number,
  quality: number = 100
) {
  return new Promise((resolve) => {
    Resizer.imageFileResizer(
      file,
      maxWidth,
      maxHeight,
      'PNG',
      100,
      0,
      (uri) => {
        resolve(uri)
      },
      'blob'
    )
  })
}
