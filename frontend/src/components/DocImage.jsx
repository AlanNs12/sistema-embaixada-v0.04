import { useEffect, useState } from 'react'
import api from '../api'
import { Camera, Loader, X } from 'lucide-react'

/**
 * DocImage — exibe botão "Ver doc." que abre a imagem do banco
 * Props:
 *   entityType : 'provider' | 'provider_visit' | 'consular' | 'visitor'
 *   entityId   : número do registro
 *   imageId    : ID direto na tabela document_images (opcional, preferido)
 */
export default function DocImage({ entityType, entityId, imageId }) {
  const [src, setSrc]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen]     = useState(false)

  useEffect(() => {
    if (!entityId && !imageId) { setLoading(false); return }

    // Sempre usa JSON — evita o problema do blob/ObjectURL
    const endpoint = imageId
      ? `/images/id/${imageId}`
      : `/images/${entityType}/${entityId}`

    api.get(endpoint)           // responseType padrão = json
      .then(res => setSrc(res.data?.src || null))
      .catch(() => setSrc(null))
      .finally(() => setLoading(false))
  }, [entityType, entityId, imageId])

  if (loading) return <Loader size={14} className="animate-spin text-gray-400" />

  if (!src) return (
    <span className="text-gray-300 dark:text-gray-600 text-xs flex items-center gap-1">
      <Camera size={12} />—
    </span>
  )

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 text-xs flex items-center gap-1"
      >
        <Camera size={12} /> Ver doc.
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <img src={src} alt="Documento" className="w-full rounded-xl shadow-2xl" />
            <button
              onClick={() => setOpen(false)}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-gray-100"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
