import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Camera } from 'lucide-react'

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!window.isSecureContext) {
      setError('O acesso à câmera requer HTTPS. Contate o administrador do sistema.')
      return
    }

    navigator.mediaDevices
      .getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setError('Permissão de câmera negada. Permita o acesso e tente novamente.')
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setError('Nenhuma câmera encontrada neste dispositivo.')
        } else {
          setError('Não foi possível acessar a câmera. Verifique as permissões.')
        }
      })

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [])

  const handleCapture = () => {
    const video = videoRef.current
    if (!video) return

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' })
      streamRef.current?.getTracks().forEach(t => t.stop())
      onCapture(file)
    }, 'image/jpeg', 0.85)
  }

  const handleClose = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    onClose()
  }

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center bg-black/80" style={{ zIndex: 9999 }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Tirar Foto</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera size={36} className="text-gray-500" />
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-3">
          {!error && (
            <button
              onClick={handleCapture}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Camera size={16} /> Capturar Foto
            </button>
          )}
          <button onClick={handleClose} className="btn-secondary w-full">Cancelar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
