import { useEffect, useState } from 'react'
import api from '../api'
import { Camera, Loader } from 'lucide-react'

/**
 * DocImage — carrega imagem do banco pelo entityType + entityId
 * Props:
 *   entityType: 'provider' | 'provider_visit' | 'consular' | 'visitor'
 *   entityId: number
 *   imageId: number (opcional, se já tiver o ID direto)
 *   className: string
 */
export default function DocImage({ entityType, entityId, imageId, className = 'h-10 w-10 rounded-lg object-cover' }) {
  const [src, setSrc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!entityId && !imageId) { setLoading(false); return }
    const url = imageId ? `/images/id/${imageId}` : `/images/${entityType}/${entityId}`
    api.get(imageId ? `/images/id/${imageId}` : `/images/${entityType}/${entityId}`, { responseType: imageId ? 'blob' : 'json' })
      .then(res => {
        if (imageId) {
          // binary response
          setSrc(URL.createObjectURL(res.data))
        } else {
          setSrc(res.data.src)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [entityType, entityId, imageId])

  if (loading) return <Loader size={14} className="animate-spin text-gray-400" />
  if (!src) return <span className="text-gray-300 dark:text-gray-600 text-xs flex items-center gap-1"><Camera size={12} />—</span>

  return (
    <>
      <button onClick={() => setOpen(true)} className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
        <Camera size={12} /> Ver doc.
      </button>
      {open && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="relative max-w-lg w-full">
            <img src={src} alt="Documento" className="w-full rounded-xl shadow-2xl" />
            <button onClick={() => setOpen(false)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg">✕</button>
          </div>
        </div>
      )}
    </>
  )
}
