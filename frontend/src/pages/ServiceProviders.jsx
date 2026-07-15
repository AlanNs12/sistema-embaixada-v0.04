import { useEffect, useRef, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import DocImage from '../components/DocImage'
import CameraCapture from '../components/CameraCapture'
import { Plus, LogOut, Eye, Camera, Image } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ServiceProviders() {
  const { t } = useTranslation('providers')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [visits, setVisits] = useState([])
  const [inside, setInside] = useState([])
  const [providers, setProviders] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ provider_id: '', visitor_name: '', company: '', reason: '', employee_id: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const galleryInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const [visitsRes, providersRes, empRes] = await Promise.all([
        api.get(`/providers/visits?date=${date}`),
        api.get('/providers'),
        api.get('/employees'),
      ])
      setVisits(visitsRes.data.visits)
      setInside(visitsRes.data.currently_inside)
      setProviders(providersRes.data)
      setEmployees(empRes.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleProviderSelect = (id) => {
    const p = providers.find(p => String(p.id) === id)
    if (p) setForm(f => ({ ...f, provider_id: id, visitor_name: p.name, company: p.company || '' }))
    else setForm(f => ({ ...f, provider_id: id }))
  }

  const handleSubmit = async () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/providers/visits', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(t('toast_entrance_registered'))
      setModalOpen(false)
      setForm({ provider_id: '', visitor_name: '', company: '', reason: '', employee_id: '', notes: '' })
      setPhoto(null); setPhotoPreview(null); load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  const handleExit = async (id) => {
    try { await api.put(`/providers/visits/${id}`, {}); toast.success(t('toast_exit_registered')); load() }
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
          {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> {t('register_entry')}</button>}
        </div>
      </div>

      {inside.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">{t('providers_inside_now')}</p>
          <div className="flex flex-wrap gap-2">
            {inside.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-sm font-medium dark:text-white">{p.visitor_name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{p.company}</span>
                {canEdit && (
                  <button onClick={() => handleExit(p.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
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
            <tr><th>{t('column_name')}</th><th>{t('column_company')}</th><th>{t('column_reason')}</th><th>{t('column_employee')}</th><th>{t('column_entry')}</th><th>{t('column_exit')}</th><th>{t('column_status')}</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : visits.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">{t('empty_no_records')}</td></tr>
              : visits.map(v => (
                <tr key={v.id}>
                  <td className="font-medium dark:text-white">{v.visitor_name}</td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{v.company || '—'}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{v.reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{v.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.entry_time ? format(new Date(v.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.exit_time ? format(new Date(v.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {v.exit_time
                      ? <span className="badge-gray">{t('status_left')}</span>
                      : canEdit
                      ? <button onClick={() => handleExit(v.id)} className="badge-red cursor-pointer hover:bg-red-200 text-xs">{t('status_reg_exit')}</button>
                      : <span className="badge-purple">{t('status_inside')}</span>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('modal_entry_title')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('register')}</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">{t('field_provider_optional')}</label>
            <select className="input" value={form.provider_id} onChange={e => handleProviderSelect(e.target.value)}>
              <option value="">{t('field_new_unnamed')}</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} — {p.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('field_name_required')}</label>
              <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">{t('field_company')}</label>
              <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="label">{t('field_visit_reason')}</label>
            <input className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('field_responsible')}</label>
            <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">{tc('select_option')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group">
            <label className="label">{t('field_document_photo')}</label>
            {photoPreview && (
              <div className="relative inline-block mb-2">
                <img src={photoPreview} alt="doc" className="h-24 rounded-lg object-cover border" />
                <button
                  onClick={() => { setPhoto(null); setPhotoPreview(null) }}
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
                if (f) { setPhoto(f); setPhotoPreview(URL.createObjectURL(f)) }
                e.target.value = ''
              }}
              className="hidden"
            />
            <p className="text-xs text-gray-400 mt-1">
              {photo ? t('photo_selected') : t('photo_help')}
            </p>
          </div>
        </div>
      </Modal>

      {cameraOpen && (
        <CameraCapture
          onCapture={file => { setPhoto(file); setPhotoPreview(URL.createObjectURL(file)); setCameraOpen(false) }}
          onClose={() => setCameraOpen(false)}
        />
      )}

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="provider_visit" record={detail} />
    </div>
  )
}
