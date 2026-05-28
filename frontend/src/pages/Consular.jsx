import { useEffect, useRef, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import CameraCapture from '../components/CameraCapture'
import { Plus, LogOut, Eye, Search, History, Camera, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function dataUrlToFile(dataUrl, filename, mimeType) {
  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new File([bytes], filename || 'documento.jpg', { type: mimeType || 'image/jpeg' })
}

const fmtDate = (v) => {
  if (!v) return ''
  try {
    const s = typeof v === 'string' ? v.substring(0, 10) : new Date(v).toISOString().substring(0, 10)
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  } catch { return '' }
}

export default function Consular() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ appointments: [], currently_inside: [] })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ visitor_name: '', visit_reason: '', employee_id: '', scheduled_time: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFromPrevious, setPhotoFromPrevious] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const galleryInputRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchTimeout = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const [aptsRes, empRes] = await Promise.all([api.get(`/consular?date=${date}`), api.get('/employees')])
      setData(aptsRes.data); setEmployees(empRes.data)
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const closeModal = () => {
    setModalOpen(false)
    setForm({ visitor_name: '', visit_reason: '', employee_id: '', scheduled_time: '', notes: '' })
    setPhoto(null); setPhotoPreview(null); setPhotoFromPrevious(false)
    setSearchQuery(''); setSearchResults([])
    clearTimeout(searchTimeout.current)
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    clearTimeout(searchTimeout.current)
    if (value.trim().length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await api.get(`/consular/search?q=${encodeURIComponent(value.trim())}`)
        setSearchResults(res.data)
      } catch (e) {}
    }, 300)
  }

  const selectPrevious = async (v) => {
    setForm({
      visitor_name: v.visitor_name,
      visit_reason: v.visit_reason || '',
      employee_id: v.employee_id ? String(v.employee_id) : '',
      scheduled_time: '',
      notes: '',
    })
    setSearchQuery(''); setSearchResults([])
    setPhoto(null); setPhotoPreview(null); setPhotoFromPrevious(false)
    if (v.id) {
      try {
        const res = await api.get(`/images/consular/${v.id}`)
        if (res.data?.src) {
          const file = dataUrlToFile(res.data.src, res.data.original_name, res.data.mime_type)
          setPhoto(file)
          setPhotoPreview(res.data.src)
          setPhotoFromPrevious(true)
        }
      } catch (_) { /* sem foto — ok */ }
    }
  }

  const handleSubmit = async () => {
    if (!form.visitor_name) return toast.error('Nome obrigatório')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/consular', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Atendimento registrado!')
      closeModal(); load()
    } catch (e) { toast.error('Erro') }
  }

  const handleExit = async (id) => {
    try { await api.put(`/consular/${id}`, {}); toast.success('Saída registrada!'); load() }
    catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atendimentos Consulares</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Controle de visitantes para atendimento</p>
        </div>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && (
            <button onClick={() => { setModalOpen(true); setSearchQuery(''); setSearchResults([]) }} className="btn-primary">
              <Plus size={16} /> Novo Atendimento
            </button>
          )}
        </div>
      </div>

      {data.currently_inside.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Visitantes na embaixada agora:</p>
          <div className="flex flex-wrap gap-2">
            {data.currently_inside.map(a => (
              <div key={a.id} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium dark:text-white">{a.visitor_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">c/ {a.employee_name || 'N/A'}</p>
                </div>
                {canEdit && (
                  <button onClick={() => handleExit(a.id)} className="text-red-500 text-xs flex items-center gap-1 hover:text-red-700 ml-2">
                    <LogOut size={12} /> Saída
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Visitante</th><th>Motivo</th><th>Funcionário</th><th>Agendado</th><th>Entrada</th><th>Saída</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : data.appointments.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum atendimento nesta data</td></tr>
              : data.appointments.map(a => (
                <tr key={a.id}>
                  <td className="font-medium dark:text-white">{a.visitor_name}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{a.visit_reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{a.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.scheduled_time || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.entry_time ? format(new Date(a.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.exit_time ? format(new Date(a.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {a.exit_time ? <span className="badge-gray">Saiu</span>
                      : a.entry_time && canEdit
                      ? <button onClick={() => handleExit(a.id)} className="badge-blue cursor-pointer hover:bg-blue-200 text-xs">Reg. saída</button>
                      : <span className="badge-yellow">Aguardando</span>}
                  </td>
                  <td>
                    <button onClick={() => setDetail(a)} className="btn-secondary btn-sm" title="Ver detalhes">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title="Novo Atendimento Consular"
        footer={<><button onClick={closeModal} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">

          {/* ── Busca de atendimento anterior ────────────────── */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
              <History size={13} /> Buscar atendimento anterior (preenche o formulário automaticamente)
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="input pl-8 text-sm"
                placeholder="Nome do visitante..."
                value={searchQuery}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="mt-1 border border-blue-200 dark:border-blue-700 rounded-lg overflow-hidden">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectPrevious(r)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/40 border-b last:border-b-0 border-blue-100 dark:border-blue-700/50 transition-colors"
                  >
                    <p className="text-sm font-medium dark:text-white">{r.visitor_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Último atendimento: {fmtDate(r.date)}
                      {r.employee_name && <span> · {r.employee_name}</span>}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 mt-1 text-center">Nenhum atendimento anterior encontrado</p>
            )}
          </div>

          <div className="form-group"><label className="label">Nome do Visitante *</label>
            <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
          <div className="form-group"><label className="label">Motivo</label>
            <textarea className="input" rows={2} value={form.visit_reason} onChange={e => setForm({ ...form, visit_reason: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Funcionário</label>
              <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">Horário Agendado</label>
              <input type="time" className="input" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label className="label">Foto do Documento</label>
            {photoPreview && (
              <div className="relative inline-block mb-2">
                <img src={photoPreview} alt="doc" className="h-24 rounded-lg object-cover border" />
                {photoFromPrevious && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    atend. anterior
                  </span>
                )}
                <button
                  onClick={() => { setPhoto(null); setPhotoPreview(null); setPhotoFromPrevious(false) }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Camera size={16} /> Tirar Foto
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Image size={16} /> Buscar da Galeria
              </button>
            </div>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files[0]
                if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)); setPhotoFromPrevious(false) }
                e.target.value = ''
              }}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">
              {photo ? 'Foto selecionada' : photoFromPrevious ? 'Foto do atendimento anterior' : 'Tire uma foto ou escolha da galeria'}
            </p>
          </div>
          <div className="form-group"><label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      {cameraOpen && (
        <CameraCapture
          onCapture={file => { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setPhotoFromPrevious(false); setCameraOpen(false) }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="consular" record={detail} />
    </div>
  )
}
