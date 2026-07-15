import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Modal from '../../components/Modal'
import { Plus, Pencil, Shield } from 'lucide-react'

const ROLE_BADGES = { super_admin: 'badge-red', admin: 'badge-blue', porteiro: 'badge-gray', viewer: 'badge-purple' }
const empty = { name: '', email: '', password: '', role: 'porteiro', active: true }

export default function AdminUsers() {
  const { isSuperAdmin, user: me } = useAuth()
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/users'); setUsers(r.data) }
    catch (e) { toast.error(tc('error_generic')) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (u)=> { setEditing(u); setForm({ ...u, password:'' }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name || !form.email) return toast.error(t('admin_users_toast_name_email'))
    if (!editing && !form.password) return toast.error(t('admin_users_toast_password'))
    try {
      if (editing) await api.put(`/users/${editing.id}`, form)
      else         await api.post('/users', form)
      toast.success(editing ? t('admin_users_toast_updated') : t('admin_users_toast_created'))
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin_users_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_users_subtitle')}</p>
        </div>
        {isSuperAdmin && <button onClick={openNew} className="btn-primary"><Plus size={16} /> {t('admin_users_new')}</button>}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('admin_users_column_name')}</th>
              <th>{t('admin_users_column_email')}</th>
              <th>{t('admin_users_column_role')}</th>
              <th>{t('admin_users_column_status')}</th>
              <th>{t('admin_users_column_created')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 dark:text-blue-300 font-bold text-xs">{u.name[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium dark:text-white">{u.name}</span>
                      {u.id === me?.id && <span className="badge-blue text-xs">{t('admin_users_badge_you')}</span>}
                    </div>
                  </td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td><span className={ROLE_BADGES[u.role]}>{t(`admin_users_role_${u.role}`)}</span></td>
                  <td>{u.active ? <span className="badge-green">{tc('status_active')}</span> : <span className="badge-red">{tc('status_inactive')}</span>}</td>
                  <td className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    {isSuperAdmin && u.id !== me?.id && (
                      <button onClick={() => openEdit(u)} className="btn-secondary btn-sm"><Pencil size={13} /></button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_users_modal_edit') : t('admin_users_modal_new')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">{t('admin_users_field_name')}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('admin_users_field_email')}</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group">
            <label className="label">{editing ? t('admin_users_field_password_new') : t('admin_users_field_password')}</label>
            <input type="password" className="input" value={form.password||''} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('admin_users_field_role')}</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="porteiro">{t('admin_users_role_porteiro')}</option>
                <option value="viewer">{t('admin_users_role_viewer')}</option>
                <option value="admin">{t('admin_users_role_admin')}</option>
                <option value="super_admin">{t('admin_users_role_super_admin')}</option>
              </select>
            </div>
            {editing && (
              <div className="form-group"><label className="label">{t('admin_users_field_status')}</label>
                <select className="input" value={form.active?'true':'false'} onChange={e => setForm({ ...form, active: e.target.value==='true' })}>
                  <option value="true">{tc('status_active')}</option><option value="false">{tc('status_inactive')}</option>
                </select>
              </div>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1"><Shield size={12} /> {t('admin_users_perms_title')}</p>
            <p><strong>{t('admin_users_role_viewer')}:</strong> {t('admin_users_perms_viewer')}</p>
            <p><strong>{t('admin_users_role_porteiro')}:</strong> {t('admin_users_perms_porteiro')}</p>
            <p><strong>{t('admin_users_role_admin')}:</strong> {t('admin_users_perms_admin')}</p>
            <p><strong>{t('admin_users_role_super_admin')}:</strong> {t('admin_users_perms_super_admin')}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
