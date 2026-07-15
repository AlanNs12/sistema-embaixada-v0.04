import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, UserCog, Truck, Camera } from 'lucide-react'

function OutsourcedTab() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'limpeza', company: '', active: true })

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/outsourced'); setWorkers(r.data) }
    catch (e) { toast.error(tc('error_generic')) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setEditing(null); setForm({ name: '', role: 'limpeza', company: '', active: true }); setModalOpen(true) }
  const openEdit = (w) => { setEditing(w); setForm({ ...w }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error(t('admin_outsourced_toast_name'))
    try {
      if (editing) await api.put(`/outsourced/${editing.id}`, form)
      else         await api.post('/outsourced', form)
      toast.success(t('admin_outsourced_toast_saved')); setModalOpen(false); load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_outsourced_count_outsourced', { count: workers.length })}</p>
        <button onClick={openNew} className="btn-primary btn-sm"><Plus size={14} /> {tc('new')}</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin_outsourced_column_name')}</th>
              <th>{t('admin_outsourced_column_role')}</th>
              <th>{t('admin_outsourced_column_company')}</th>
              <th>{t('admin_outsourced_column_status')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">{tc('loading')}</td></tr>
              : workers.map(w => (
                <tr key={w.id}>
                  <td className="font-medium dark:text-white">{w.name}</td>
                  <td><span className={w.role === 'jardineiro' ? 'badge-green' : 'badge-blue'}>{t(`admin_outsourced_role_${w.role}`)}</span></td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{w.company || '\u2014'}</td>
                  <td>{w.active ? <span className="badge-green">{tc('status_active')}</span> : <span className="badge-red">{tc('status_inactive')}</span>}</td>
                  <td><button onClick={() => openEdit(w)} className="btn-secondary btn-sm"><Pencil size={12} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_outsourced_modal_edit_out') : t('admin_outsourced_modal_new_out')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">{t('admin_outsourced_field_name')}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('admin_outsourced_field_role')}</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="limpeza">{t('admin_outsourced_role_cleaning')}</option>
                <option value="jardineiro">{t('admin_outsourced_role_gardener')}</option>
              </select></div>
            <div className="form-group"><label className="label">{t('admin_outsourced_field_company')}</label>
              <input className="input" value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          {editing && (
            <div className="form-group"><label className="label">{t('admin_outsourced_field_status')}</label>
              <select className="input" value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
                <option value="true">{tc('status_active')}</option><option value="false">{tc('status_inactive')}</option>
              </select></div>
          )}
        </div>
      </Modal>
    </div>
  )
}

function ProvidersTab() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', company: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/providers'); setProviders(r.data) }
    catch (e) { toast.error(tc('error_generic')) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setEditing(null); setForm({ name: '', company: '', notes: '' }); setPhoto(null); setPhotoPreview(null); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, company: p.company || '', notes: p.notes || '' }); setPhoto(null); setPhotoPreview(null); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error(t('admin_outsourced_toast_name'))
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      if (editing) await api.put(`/providers/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      else         await api.post('/providers', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success(t('admin_outsourced_toast_saved')); setModalOpen(false); load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin_outsourced_count_providers', { count: providers.length })}</p>
        <button onClick={openNew} className="btn-primary btn-sm"><Plus size={14} /> {tc('new')}</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin_outsourced_column_name')}</th>
              <th>{t('admin_outsourced_column_company')}</th>
              <th>{t('admin_outsourced_column_notes')}</th>
              <th>{t('admin_outsourced_column_document')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">{tc('loading')}</td></tr>
              : providers.map(p => (
                <tr key={p.id}>
                  <td className="font-medium dark:text-white">{p.name}</td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{p.company || '\u2014'}</td>
                  <td className="text-sm text-gray-400 dark:text-gray-500 max-w-[180px] truncate">{p.notes || '\u2014'}</td>
                  <td>
                    {p.image_id
                      ? <span className="text-blue-500 text-xs flex items-center gap-1"><Camera size={12} />{t('admin_outsourced_doc_registered')}</span>
                      : <span className="text-gray-300 dark:text-gray-600 text-xs">{'\u2014'}</span>}
                  </td>
                  <td><button onClick={() => openEdit(p)} className="btn-secondary btn-sm"><Pencil size={12} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_outsourced_modal_edit_prov') : t('admin_outsourced_modal_new_prov')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">{t('admin_outsourced_field_name')}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('admin_outsourced_field_company')}</label>
            <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div className="form-group">
            <label className="label">{t('admin_outsourced_field_document_photo')}</label>
            <input type="file" accept="image/*" capture="environment"
              onChange={e => { const f = e.target.files[0]; setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }}
              className="input text-sm dark:text-gray-300" />
            {(photoPreview || editing?.image_id) && !photoPreview && <p className="text-xs text-green-600 dark:text-green-400 mt-1">{t('admin_outsourced_doc_exists')}</p>}
            {photoPreview && <img src={photoPreview} alt="doc" className="mt-2 h-24 rounded-lg object-cover border" />}
          </div>
          <div className="form-group"><label className="label">{t('admin_outsourced_field_notes')}</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  )
}

export default function AdminOutsourced() {
  const { t } = useTranslation('admin')
  const [tab, setTab] = useState('outsourced')

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin_outsourced_title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_outsourced_subtitle')}</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[['outsourced', UserCog, t('admin_outsourced_tab_outsourced')], ['providers', Truck, t('admin_outsourced_tab_providers')]].map(([tKey, Icon, label]) => (
          <button key={tKey} onClick={() => setTab(tKey)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tKey
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      {tab === 'outsourced' ? <OutsourcedTab /> : <ProvidersTab />}
    </div>
  )
}
