import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { NotFoundException } from '@zxing/library'
import { X, Camera, RefreshCw } from 'lucide-react'

export default function BarcodeScanner({ onScan, onClose }) {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const [cameras, setCameras] = useState([])
  const [selectedCamera, setSelectedCamera] = useState(null)
  const [error, setError] = useState(null)
  const [scanning, setScanning] = useState(false)

  // Solicita permissão explicitamente e lista as câmeras disponíveis
  useEffect(() => {
    if (!window.isSecureContext) {
      setError('O acesso à câmera requer HTTPS. Contate o administrador do sistema.')
      return
    }

    // Solicita permissão via getUserMedia antes de enumerar dispositivos
    // Isso garante que o popup de permissão do navegador seja exibido
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then(stream => {
        // Encerra o stream temporário — só precisávamos da permissão
        stream.getTracks().forEach(t => t.stop())
        return BrowserMultiFormatReader.listVideoInputDevices()
      })
      .then(devices => {
        setCameras(devices)
        // Prefere câmera traseira em mobile
        const back = devices.find(d => /back|rear|environment/i.test(d.label))
        setSelectedCamera((back || devices[0])?.deviceId || null)
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setError('Permissão de câmera negada. Clique no ícone de câmera 🔒 na barra de endereço, permita o acesso e recarregue a página.')
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setError('Nenhuma câmera encontrada neste dispositivo.')
        } else {
          setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
        }
      })
  }, [])

  // Inicia/reinicia o scanner sempre que a câmera selecionada muda
  useEffect(() => {
    if (!selectedCamera || !videoRef.current) return

    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    setScanning(true)
    setError(null)

    reader
      .decodeFromVideoDevice(selectedCamera, videoRef.current, (result, err, controls) => {
        controlsRef.current = controls
        if (result) {
          const code = result.getText()
          controls.stop()
          onScan(code)
        }
        if (err && !(err instanceof NotFoundException)) {
          setError('Erro ao ler código. Reposicione a câmera.')
        }
      })
      .catch(err => {
        if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
          setError('Permissão de câmera negada. Clique no ícone de câmera 🔒 na barra de endereço, permita o acesso e recarregue a página.')
        } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
          setError('Nenhuma câmera encontrada neste dispositivo.')
        } else {
          setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.')
        }
        setScanning(false)
      })

    return () => {
      controlsRef.current?.stop()
    }
  }, [selectedCamera])

  const handleClose = () => {
    controlsRef.current?.stop()
    onClose()
  }

  // createPortal renderiza o scanner direto no document.body,
  // ficando acima de qualquer modal independentemente de z-index
  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/80"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Camera size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Escanear Código de Barras</h2>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
            <X size={18} />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
          <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />

          {/* Mira central */}
          {!error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-56 h-32">
                <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400 rounded-tl" />
                <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400 rounded-tr" />
                <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400 rounded-bl" />
                <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400 rounded-br" />
                <div className="absolute inset-x-1 h-0.5 bg-blue-400/80 animate-scan" style={{ top: '50%' }} />
              </div>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <Camera size={36} className="text-gray-500" />
              <p className="text-sm text-gray-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            Aponte a câmera para o código de barras da encomenda
          </p>

          {cameras.length > 1 && (
            <div className="flex items-center gap-2">
              <RefreshCw size={14} className="text-gray-400 shrink-0" />
              <select
                className="input text-sm py-1.5 flex-1"
                value={selectedCamera || ''}
                onChange={e => setSelectedCamera(e.target.value)}
              >
                {cameras.map(c => (
                  <option key={c.deviceId} value={c.deviceId}>{c.label || `Câmera ${c.deviceId.slice(0, 6)}`}</option>
                ))}
              </select>
            </div>
          )}

          <button onClick={handleClose} className="btn-secondary w-full">Cancelar</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
