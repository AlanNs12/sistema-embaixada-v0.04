import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, Car } from 'lucide-react'

const empty = { plate: '', model: '', description: '', active: true }

export default function AdminVehicles() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/vehicles')
      setVehicles(res.data)
    } catch (e) { toast.error(tc('error_generic')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (v) => { setEditing(v); setForm({ ...v }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.plate) return toast.error(t('admin_vehicles_toast_plate'))
    try {
      if (editing) await api.put(`/vehicles/${editing.id}`, form)
      else await api.post('/vehicles', form)
      toast.success(editing ? t('admin_vehicles_toast_updated') : t('admin_vehicles_toast_created'))
      setModalOpen(false)
      load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin_vehicles_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_vehicles_subtitle')}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> {t('admin_vehicles_new')}</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-gray-400">{tc('loading')}</p>
          : vehicles.length === 0 ? (
            <div className="col-span-3 card card-body text-center text-gray-400 dark:text-gray-500 py-12">
              <Car size={32} className="mx-auto mb-2 opacity-30" />
              <p>{t('admin_vehicles_empty')}</p>
              <button onClick={openNew} className="btn-primary mx-auto mt-4"><Plus size={16} />{t('admin_vehicles_register_first')}</button>
            </div>
          ) : vehicles.map(v => (
            <div key={v.id} className="card p-5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mt-0.5">
                  <Car size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-mono font-bold text-lg tracking-wider dark:text-white">{v.plate}</p>
                  <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{v.model || '\u2014'}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{v.description || ''}</p>
                  <span className={`mt-2 inline-block ${v.active ? 'badge-green' : 'badge-red'}`}>
                    {v.active ? tc('status_active') : tc('status_inactive')}
                  </span>
                </div>
              </div>
              <button onClick={() => openEdit(v)} className="btn-secondary btn-sm"><Pencil size={13} /></button>
            </div>
          ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_vehicles_modal_edit') : t('admin_vehicles_modal_new')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">{t('admin_vehicles_field_plate')}</label>
            <input className="input uppercase" placeholder={t('admin_vehicles_placeholder_plate')} value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
          </div>
          <div className="form-group">
            <label className="label">{t('admin_vehicles_field_model')}</label>
            <input className="input" placeholder={t('admin_vehicles_placeholder_model')} value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">{t('admin_vehicles_field_description')}</label>
            <input className="input" placeholder={t('admin_vehicles_placeholder_desc')} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {editing && (
            <div className="form-group">
              <label className="label">{t('admin_vehicles_field_status')}</label>
              <select className="input" value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
                <option value="true">{tc('status_active')}</option>
                <option value="false">{tc('status_inactive')}</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
