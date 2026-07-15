import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, Users, GripVertical } from 'lucide-react'

const empty = { name: '', position: '', department: '', email: '', phone: '', active: true }

export default function AdminEmployees() {
  const { t } = useTranslation('admin')
  const { t: tc } = useTranslation('common')

  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const dragIndex = useRef(null)
  const [dragOver, setDragOver] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/employees')
      setEmployees(res.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (emp) => { setEditing(emp); setForm({ ...emp }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error(t('admin_employees_toast_name_required'))
    try {
      if (editing) await api.put(`/employees/${editing.id}`, form)
      else await api.post('/employees', form)
      toast.success(editing ? t('admin_employees_toast_updated') : t('admin_employees_toast_created'))
      setModalOpen(false)
      load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  // ── Drag-and-drop ──────────────────────────────────────────────
  const handleDragStart = (e, index) => {
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
    // Necessário para Firefox
    e.dataTransfer.setData('text/plain', index)
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOver !== index) setDragOver(index)
  }

  const handleDrop = async (e, index) => {
    e.preventDefault()
    const from = dragIndex.current
    if (from === null || from === index) { setDragOver(null); return }

    const reordered = [...employees]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(index, 0, moved)
    setEmployees(reordered)
    setDragOver(null)
    dragIndex.current = null

    try {
      await api.put('/employees/reorder', {
        order: reordered.map((emp, i) => ({ id: emp.id, sort_order: i }))
      })
      toast.success(t('admin_employees_toast_order_saved'))
    } catch (e) {
      toast.error(t('admin_employees_toast_order_error'))
      load()
    }
  }

  const handleDragEnd = () => {
    dragIndex.current = null
    setDragOver(null)
  }

  const isDragging = search === ''
  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin_employees_title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('admin_employees_subtitle')}</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> {t('admin_employees_new')}</button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder={t('admin_employees_search')} value={search} onChange={e => setSearch(e.target.value)} />
        {isDragging && (
          <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
            <GripVertical size={13} /> {t('admin_employees_drag_hint')}
          </p>
        )}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {isDragging && <th className="w-8"></th>}
              <th>{t('admin_employees_column_name')}</th>
              <th>{t('admin_employees_column_position')}</th>
              <th>{t('admin_employees_column_department')}</th>
              <th>{t('admin_employees_column_email')}</th>
              <th>{t('admin_employees_column_phone')}</th>
              <th>{t('admin_employees_column_status')}</th>
              <th>{t('admin_employees_column_actions')}</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={isDragging ? 8 : 7} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : filtered.length === 0
              ? <tr><td colSpan={isDragging ? 8 : 7} className="text-center py-8 text-gray-400">{t('admin_employees_empty')}</td></tr>
              : filtered.map((emp, index) => (
                <tr
                  key={emp.id}
                  draggable={isDragging}
                  onDragStart={isDragging ? (e) => handleDragStart(e, index) : undefined}
                  onDragOver={isDragging ? (e) => handleDragOver(e, index) : undefined}
                  onDrop={isDragging ? (e) => handleDrop(e, index) : undefined}
                  onDragEnd={isDragging ? handleDragEnd : undefined}
                  className={isDragging && dragOver === index ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  style={isDragging ? { cursor: 'grab' } : undefined}
                >
                  {isDragging && (
                    <td className="w-8 text-gray-300 dark:text-gray-600">
                      <GripVertical size={16} />
                    </td>
                  )}
                  <td><p className="font-medium dark:text-white">{emp.name}</p></td>
                  <td className="text-sm text-gray-600 dark:text-gray-300">{emp.position || '\u2014'}</td>
                  <td className="text-sm text-gray-600 dark:text-gray-300">{emp.department || '\u2014'}</td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{emp.email || '\u2014'}</td>
                  <td className="text-sm font-mono dark:text-gray-300">{emp.phone || '\u2014'}</td>
                  <td>{emp.active ? <span className="badge-green">{tc('status_active')}</span> : <span className="badge-red">{tc('status_inactive')}</span>}</td>
                  <td>
                    <button onClick={() => openEdit(emp)} className="btn-secondary btn-sm"><Pencil size={13} /> {tc('edit')}</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin_employees_modal_edit') : t('admin_employees_modal_new')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('save')}</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">{t('admin_employees_field_name')}</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">{t('admin_employees_field_position')}</label>
              <input className="input" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">{t('admin_employees_field_department')}</label>
              <input className="input" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">{t('admin_employees_field_email')}</label>
              <input type="email" className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">{t('admin_employees_field_phone')}</label>
              <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          {editing && (
            <div className="form-group">
              <label className="label">{t('admin_employees_field_status')}</label>
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
