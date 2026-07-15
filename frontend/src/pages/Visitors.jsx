import { useEffect, useRef, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import CameraCapture from '../components/CameraCapture'
import { Plus, LogOut, UserCheck, Eye, Search, History, Camera, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

function dataUrlToFile(dataUrl, filename, mimeType) {
  const base64 = dataUrl.split(',')[1]
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
  return new File([bytes], filename || 'documento.jpg', { type: mimeType || 'image/jpeg' })
}

export default function Visitors() {
  const { t, i18n } = useTranslation('visitors')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const dateLocale = i18n.language === 'en-US' ? enUS : ptBR
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ visitors: [], currently_inside: [] })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ visitor_name: '', document_number: '', reason: '', employee_id: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [photoFromPrevious, setPhotoFromPrevious] = useState(false)
  const [cameraOpen, setCameraOpen] = useState(false)
  const galleryInputRef = useRef(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchTimeout = useRef(null)

  const fmtDate = (v) => {
    if (!v) return ''
    try { return format(new Date(v), 'P', { locale: dateLocale }) }
    catch { return '' }
  }

  const load = async () => {
    setLoading(true)
    try {
      const [visRes, empRes] = await Promise.all([api.get(`/visitors?date=${date}`), api.get('/employees')])
      setData(visRes.data); setEmployees(empRes.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const closeModal = () => {
    setModalOpen(false)
    setForm({ visitor_name: '', document_number: '', reason: '', employee_id: '', notes: '' })
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
        const res = await api.get(`/visitors/search?q=${encodeURIComponent(value.trim())}`)
        setSearchResults(res.data)
      } catch (e) {}
    }, 300)
  }

  const selectPreviousVisitor = async (v) => {
    setForm({
      visitor_name: v.visitor_name,
      document_number: v.document_number || '',
      reason: v.reason || '',
      employee_id: v.employee_id ? String(v.employee_id) : '',
      notes: '',
    })
    setSearchQuery(''); setSearchResults([])
    setPhoto(null); setPhotoPreview(null); setPhotoFromPrevious(false)
    if (v.id) {
      try {
        const res = await api.get(`/images/visitor/${v.id}`)
        if (res.data?.src) {
          const file = dataUrlToFile(res.data.src, res.data.original_name, res.data.mime_type)
          setPhoto(file)
          setPhotoPreview(res.data.src)
          setPhotoFromPrevious(true)
        }
      } catch (_) { /* sem foto cadastrada — ok */ }
    }
  }

  const handleSubmit = async () => {
    if (!form.visitor_name) return toast.error(t('toast_name_required'))
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/visitors', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(t('toast_entrance_registered'))
      closeModal(); load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  const handleExit = async (id) => {
    try { await api.put(`/visitors/${id}`, {}); toast.success(t('toast_exit_registered')); load() }
    catch (e) { toast.error(tc('error_generic')) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && <button onClick={() => { setModalOpen(true); setSearchQuery(''); setSearchResults([]) }} className="btn-primary"><Plus size={16} /> {t('register_entry')}</button>}
        </div>
      </div>

      {data.currently_inside.length > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
          <p className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-2 flex items-center gap-2">
            <UserCheck size={16} /> {t('visitors_inside_now', { count: data.currently_inside.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.currently_inside.map(v => (
              <div key={v.id} className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium dark:text-white">{v.visitor_name}</p>
                  <p className="text-xs text-gray-400">{v.reason || '—'}</p>
                </div>
                {canEdit && (
                  <button onClick={() => handleExit(v.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 ml-2">
                    <LogOut size={12} /> {t('exit_action')}
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
            <tr><th>{t('column_visitor')}</th><th>{t('column_document')}</th><th>{t('column_reason')}</th><th>{t('column_employee')}</th><th>{t('column_entry')}</th><th>{t('column_exit')}</th><th>{t('column_status')}</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : data.visitors.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">{t('empty_no_visitors')}</td></tr>
              : data.visitors.map(v => (
                <tr key={v.id}>
                  <td>
                    <p className="font-medium dark:text-white">{v.visitor_name}</p>
                    {v.notes && <p className="text-xs text-gray-400 truncate max-w-[120px]">{v.notes}</p>}
                  </td>
                  <td className="font-mono text-xs text-gray-500 dark:text-gray-400">{v.document_number || '—'}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{v.reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{v.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.entry_time ? format(new Date(v.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.exit_time ? format(new Date(v.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {v.exit_time
                      ? <span className="badge-gray">{t('status_left')}</span>
                      : canEdit
                      ? <button onClick={() => handleExit(v.id)} className="badge-red cursor-pointer hover:bg-red-200 text-xs">{t('status_reg_exit')}</button>
                      : <span className="badge-green">{t('status_inside')}</span>}
                  </td>
                  <td>
                    <button onClick={() => setDetail(v)} className="btn-secondary btn-sm" title={tc('view_details')}>
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={t('modal_title')}
        footer={<><button onClick={closeModal} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('register')}</button></>}>
        <div className="space-y-4">

          {/* ── Busca de visita anterior ─────────────────────── */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-3">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-1">
              <History size={13} /> {t('search_previous')}
            </p>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                className="input pl-8 text-sm"
                placeholder={t('search_placeholder')}
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
                    onClick={() => selectPreviousVisitor(r)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-100 dark:hover:bg-blue-800/40 border-b last:border-b-0 border-blue-100 dark:border-blue-700/50 transition-colors"
                  >
                    <p className="text-sm font-medium dark:text-white">{r.visitor_name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {r.document_number && <span className="font-mono">{r.document_number} · </span>}
                      {t('search_last_visit', { date: fmtDate(r.date) })}
                      {r.employee_name && <span> · {r.employee_name}</span>}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-xs text-gray-400 mt-1 text-center">{t('search_none_found')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('field_name_required')}</label>
              <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">{t('field_document')}</label>
              <input className="input" placeholder={t('placeholder_document')} value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="label">{t('field_visit_reason')}</label>
            <textarea className="input" rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('field_employee_to_visit')}</label>
            <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">{tc('select_option')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group">
            <label className="label">{t('field_document_photo')}</label>
            {photoPreview && (
              <div className="relative inline-block mb-2">
                <img src={photoPreview} alt="doc" className="h-24 rounded-lg object-cover border" />
                {photoFromPrevious && (
                  <span className="absolute top-1 left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                    {t('photo_previous_badge')}
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
                <Camera size={16} /> {t('take_photo')}
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <Image size={16} /> {t('browse_gallery')}
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
              {photo ? t('photo_selected') : photoFromPrevious ? t('photo_previous') : t('photo_help')}
            </p>
          </div>
          <div className="form-group"><label className="label">{t('field_notes')}</label>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      {cameraOpen && (
        <CameraCapture
          onCapture={file => { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setPhotoFromPrevious(false); setCameraOpen(false) }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="visitor" record={detail} />
    </div>
  )
}
