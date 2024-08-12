import { default as PicaPicture } from 'pica'
import { FormEvent, useCallback, useContext, useEffect, useState } from 'react'
import { Button, Form, InputGroup, Modal } from 'react-bootstrap'
import { CgChevronUpO } from 'react-icons/cg'
import { MdOutlineWbIncandescent } from 'react-icons/md'
import ReactCrop, { Crop } from 'react-image-crop'
import { AppContext } from '../../../context/app.ctx'
import { UseResize } from '../../../hooks/useResize'
import { getMobileOS, hash } from '../../../utils/wm-functions'
import { OverlaySpinner } from '../../OverlaySpinner'
import { useTranslation } from 'react-i18next'

/**
 * @param {HTMLImageElement} image - Image File Object
 * @param {Object} crop - crop Object
 * @param {String} fileName - Name of the returned file in Promise
 */

interface CropModalTypes {
  show: boolean
  quality?: number //Qualidade de retorno da imagem se não passado é .5
  maxWidth?: number //Corte  maximo de largura
  maxHeight?: number //Corte maximo de altura
  aspectInitial?: boolean // Manter aspect Ratios?
  typeCrop?: 'profileCover' | 'profileLogo' | 'profileIcon' | 'productImage' | 'pizzaSizeCover' | 'pizzaFlavorImage'
  inputFile?: HTMLInputElement
  setImageBlob?: (...props: any) => void
  onHide: () => void
}

export function CropModal(props: CropModalTypes) {
  const { t } = useTranslation()
  const { profile } = useContext(AppContext)
  const { show, quality, onHide, aspectInitial, maxWidth, maxHeight, setImageBlob, typeCrop, inputFile } = props

  const [crop, setCrop] = useState<Crop | null>(null)
  const [widthCrop, setWidthCrop] = useState<number>(crop?.width || 0)
  const [heightCrop, setHeightCrop] = useState<number>(crop?.height || 0)
  const [imageSrcCrop, setImageCropped] = useState<string>('')
  const [minWidth, setMinWidth] = useState<number>(0)
  const [minHeight, setMinHeight] = useState<number>(0)

  const canvas = document.createElement('canvas')

  useEffect(() => {
    if (show) {
      const newCrop = async () => {
        switch (typeCrop) {
          case 'profileCover':
            await resizeImage(768, 307)
            setCrop({ unit: 'px', width: 768, height: 307, y: 0, x: 0 })
            break
          case 'profileLogo':
            await resizeImage(145, 145)
            setCrop({ unit: 'px', width: 145, height: 145, y: 0, x: 0 })
            break
          case 'profileIcon':
            const newUrl = await resizeImage(16, 16)
            setCrop({ unit: 'px', width: 16, height: 16, y: 0, x: 0 })
            setTimeout(async () => {
              await createImage({ unit: 'px', width: 16, height: 16, y: 0, x: 0 }, `${profile.slug}${hash(15)}jpeg`, newUrl)
              onHide()
            }, 10)
            break
          case 'pizzaSizeCover':
            await resizeImage(200, 150)
            setCrop({ unit: 'px', width: 200, height: 150, y: 0, x: 0 })
            break
          case 'productImage':
            await resizeImage(600, 450)
            setCrop({ unit: 'px', width: 600, height: 450, y: 0, x: 0 })
            break
          case 'pizzaFlavorImage':
            await resizeImage(600, 450)
            setCrop({ unit: 'px', width: 600, height: 450, y: 0, x: 0 })
            break
        }
      }

      newCrop()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show])

  useEffect(() => {
    if (crop) {
      // setWidthCrop(crop.width);
      // setHeightCrop(crop.height);
      setWidthCrop(crop.width)
      setHeightCrop(crop.height)
      if (!minHeight || !minWidth) {
        setMinHeight(crop.height)
        setMinWidth(crop.width)
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crop])

  // const [zoomRange, setZoomRange] = useState<number>(0)
  // const [rotateRange, setRotateRange] = useState<number>(0)

  function getCroppedImg(image: HTMLImageElement, crop: any, fileName: any) {
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width
    canvas.height = crop.height

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      return
    }

    // New lines to be added
    const pixelRatio = window.devicePixelRatio
    canvas.width = crop.width * pixelRatio
    canvas.height = crop.height * pixelRatio
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    ctx.imageSmoothingQuality = 'high'

    ctx.drawImage(image, crop.x * scaleX, crop.y * scaleY, crop.width * scaleX, crop.height * scaleY, 0, 0, crop.width, crop.height)

    // const dataURL = canvas.toDataURL('jpeg', 'base64');
    // As Base64 string
    // const base64Image = canvas
    //   .toDataURL("jpg", .1)
    //   .replace("image/jpg", "image/octet-stream");

    // return base64Image;

    // As a blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob: any) => {
          blob.name = fileName
          resolve(blob)
        },
        'image/webp',
        0.8
      )
    })
  }

  function blobToBase64(blob: any) {
    return new Promise<string | ArrayBuffer | null>((resolve, _) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  }

  async function readImage(ev: FormEvent, id: string) {
    const input = ev.target as HTMLInputElement
    if (input.files && input.files[0]) {
      const file = new FileReader()
      file.onload = function (e: Event) {
        const url = (e.target as any).result
      }

      file.readAsDataURL(input.files[0] as Blob)
    }
  }

  async function createImage(crop: any, fileName: string, srcUrl?: string) {
    try {
      let imageBlob: Blob = new Blob()

      if (getMobileOS() === 'iOS' && imageSrcCrop) {
        const picture = new PicaPicture({ features: ['js', 'wasm', 'ww'] })
        const imageElement = document.createElement('img')
        imageElement.src = imageSrcCrop
        const canvas = document.createElement('canvas')
        canvas.width = imageElement.naturalWidth
        canvas.height = imageElement.naturalHeight

        imageBlob = await picture
          .resize(imageElement, canvas, {
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2,
            filter: 'box',
          })
          .then((result) => picture.toBlob(result, 'image/jpeg', 0.8))
      } else {
        const imageReactCrop = document.getElementsByClassName('ReactCrop__image')[0] as HTMLImageElement
        imageBlob = (await getCroppedImg(imageReactCrop, crop, fileName)) as Blob
      }

      const imageCroppedUrl = (await blobToBase64(imageBlob)) as string
      const newImageFile = new File([imageBlob], fileName.split(' ').join(''), {
        type: 'image/jpeg',
      })

      setImageBlob && setImageBlob(newImageFile, imageCroppedUrl)
    } catch (error) {
      console.error(error)
    }
  }

  const onLoad = useCallback(
    (img: HTMLImageElement) => {
      if (crop) {
        const width = img.width > crop.width ? crop.width : img.width
        const height = img.height > crop.height ? img.height : img.height
        const aspect = aspectInitial ? width / height : 0
        const y = 0
        const x = 0

        setCrop({
          unit: 'px',
          aspect: 0,
          width,
          height,
          x,
          y,
        })

        return false
      }

      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [crop?.width, crop?.height, aspectInitial]
  )

  // return true // Return false if you set crop state in here.

  const resizeImage = async (width: number, height: number) => {
    if (inputFile && inputFile?.files?.length) {
      const resizedImage = await UseResize(inputFile.files[0], width, height)
      const newImage = (await blobToBase64(resizedImage)) as string
      setImageCropped(newImage)

      return newImage
    }
  }

  return (
    <>
      {crop && imageSrcCrop && (
        <Modal
          show={show}
          onHide={onHide}
          size="lg"
          backdrop="static"
          aria-labelledby="contained-modal-title-vcenter"
          centered
          onExit={() => setCrop(null)}
          style={{ zIndex: 99999999, opacity: typeCrop === 'profileIcon' ? 0 : 1 }}
        >
          <Modal.Header>
            <Modal.Title id="contained-modal-title-vcenter">{t('image_preview')}</Modal.Title>
          </Modal.Header>
          <Modal.Body id="modal-body" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <div className="d-flex justify-content-center gap-2">
              {/* <InputGroup className="w-25">
              <Form.Range min="1" max="10" id="zoom-range" onChange={(e) => {
                setZoomRange(parseInt(e.target.value))
              }}/>
              <Form.Label>Zoom</Form.Label>
            </InputGroup> */}
              <div className="d-flex justify-content-center gap-2">
                <span>
                  {t('width')}: {widthCrop.toFixed(0)}px{' '}
                </span>
                <span>
                  {t('height')}: {heightCrop.toFixed(0)}px{' '}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <ReactCrop
                src={imageSrcCrop}
                onImageLoaded={onLoad}
                // ruleOfThirds={true}
                crop={crop}
                minWidth={minWidth}
                minHeight={minHeight}
                locked={true}
                onChange={(newCrop) => {
                  setCrop(newCrop)
                }}
                onComplete={(crop, percent) => {
                  setWidthCrop(crop.width)
                  setHeightCrop(crop.height)
                }}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            {/* <Button onClick={() => {
            if (!resized) {
              resizeImage();
            } else {
              undoResize();
            }
          }} variant="danger">
            {
              !resized ?
                "Ajustar Imagem" :
                "Desfazer"
            }
          </Button> */}
            <Button
              onClick={async () => {
                await createImage(crop, `${profile.slug}${hash(15)}webp`)
                onHide()
              }}
              variant="success"
              autoFocus
            >
              {t('complete')}
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </>
  )
}
