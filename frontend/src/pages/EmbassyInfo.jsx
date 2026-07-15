import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import { Plus, Pencil, Phone, Mail, Globe, Info } from 'lucide-react'

const CATEGORY_ICONS = { telefone: Phone, email: Mail, site: Globe }

const CATEGORY_LABELS = {
  telefone: 'category_telefone',
  email: 'category_email',
  site: 'category_site',
  outro: 'category_outro',
}

export default function EmbassyInfo() {
  const { t } = useTranslation('embassyInfo')
  const { t: tc } = useTranslation('common')
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category: 'telefone', label: '', value: '', description: '' })

  const load = async () => {
    setLoading(true)
    try { const res = await api.get('/info'); setItems(res.data) }
    catch (e) { toast.error(tc('error_generic')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openEdit = (item) => {
    setEditing(item)
    setForm({ category: item.category, label: item.label, value: item.value, description: item.description || '' })
    setModalOpen(true)
  }
  const openNew = () => { setEditing(null); setForm({ category: 'telefone', label: '', value: '', description: '' }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.label || !form.value) return toast.error(t('toast_required'))
    try {
      if (editing) await api.put(`/info/${editing.id}`, { ...form, active: true })
      else await api.post('/info', form)
      toast.success(editing ? t('toast_updated') : t('toast_created'))
      setModalOpen(false); load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  const handleDelete = async (id) => {
    if (!confirm(t('confirm_remove'))) return
    try { await api.delete(`/info/${id}`); toast.success(t('toast_removed')); load() }
    catch (e) { toast.error(tc('error_generic')) }
  }

  const grouped = items.reduce((acc, item) => {
    acc[item.category] = acc[item.category] || []
    acc[item.category].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-primary"><Plus size={16} /> {t('add_button')}</button>}
      </div>

      {loading ? <p className="text-gray-400">{tc('loading')}</p>
        : items.length === 0 ? (
          <div className="card card-body text-center text-gray-400 py-12">
            <Info size={32} className="mx-auto mb-2 opacity-30" />
            <p>{t('empty_state')}</p>
            {isAdmin && <button onClick={openNew} className="btn-primary mx-auto mt-4"><Plus size={16} />{t('add_first')}</button>}
          </div>
        ) : Object.entries(grouped).map(([cat, catItems]) => {
          const Icon = CATEGORY_ICONS[cat] || Info
          return (
            <div key={cat} className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 capitalize">
                  <Icon size={18} className="text-blue-600 dark:text-blue-400" /> {t(CATEGORY_LABELS[cat], cat + 's')}
                </h2>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {catItems.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm dark:text-white">{item.label}</p>
                      <p className="text-blue-600 dark:text-blue-400 font-mono text-sm mt-0.5">{item.value}</p>
                      {item.description && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{item.description}</p>}
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(item)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                        <button onClick={() => handleDelete(item.id)} className="btn-danger btn-sm">✕</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('modal_edit') : t('modal_new')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">{t('field_category')}</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="telefone">{t('category_telefone')}</option>
              <option value="email">{t('category_email')}</option>
              <option value="site">{t('category_site')}</option>
              <option value="outro">{t('category_outro')}</option>
            </select>
          </div>
          <div className="form-group"><label className="label">{t('field_label_required')}</label>
            <input className="input" placeholder={t('placeholder_label')} value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('field_value_required')}</label>
            <input className="input" placeholder={t('placeholder_value')} value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('field_description')}</label>
            <input className="input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  )
}
