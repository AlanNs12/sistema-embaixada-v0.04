import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import BarcodeScanner from '../components/BarcodeScanner'
import { Plus, CheckCircle, Package, Pencil, Eye, ScanBarcode } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Packages() {
  const { t, i18n } = useTranslation('packages')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const dateLocale = i18n.language === 'en-US' ? enUS : ptBR
  const [packages, setPackages] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [modalOpen, setModalOpen] = useState(false)
  const [deliverModal, setDeliverModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ delivery_company:'', tracking_code:'', recipient_employee_id:'', recipient_name:'', notes:'' })
  const [deliverForm, setDeliverForm] = useState({ delivered_to_id:'', delivered_to_name:'' })
  const [editForm, setEditForm] = useState({ delivery_company:'', tracking_code:'', recipient_name:'', recipient_employee_id:'', notes:'' })
  const [scannerTarget, setScannerTarget] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [pkgRes, empRes] = await Promise.all([
        api.get(`/packages?status=${filter}`),
        api.get('/employees'),
      ])
      setPackages(pkgRes.data)
      setEmployees(empRes.data)
    } catch (e) { toast.error(tc('error_generic')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const handleSubmit = async () => {
    if (!form.delivery_company) return toast.error(t('toast_company_required'))
    try {
      await api.post('/packages', form)
      toast.success(t('toast_registered'))
      setModalOpen(false)
      setForm({ delivery_company:'', tracking_code:'', recipient_employee_id:'', recipient_name:'', notes:'' })
      load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  const handleDeliver = async () => {
    try {
      await api.put(`/packages/${deliverModal.id}`, { ...deliverForm, action: 'deliver' })
      toast.success(t('toast_delivered'))
      setDeliverModal(null)
      setDeliverForm({ delivered_to_id:'', delivered_to_name:'' })
      load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  const handleEdit = async () => {
    try {
      await api.put(`/packages/${editModal.id}`, editForm)
      toast.success(t('toast_updated'))
      setEditModal(null)
      load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  const openEdit = (pkg) => {
    setEditModal(pkg)
    setEditForm({
      delivery_company: pkg.delivery_company || '',
      tracking_code: pkg.tracking_code || '',
      recipient_name: pkg.recipient_name || pkg.recipient_employee_name || '',
      recipient_employee_id: pkg.recipient_employee_id || '',
      notes: pkg.notes || '',
    })
  }

  const selectEmployee = (id, target) => {
    const emp = employees.find(e => String(e.id) === id)
    if (target === 'recipient') setForm(f => ({ ...f, recipient_employee_id: id, recipient_name: emp?.name || '' }))
    else if (target === 'deliver') setDeliverForm(f => ({ ...f, delivered_to_id: id, delivered_to_name: emp?.name || '' }))
    else if (target === 'edit') setEditForm(f => ({ ...f, recipient_employee_id: id, recipient_name: emp?.name || '' }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> {t('register_package')}</button>}
      </div>

      <div className="flex gap-2">
        {[['pending', t('filter_pending')],['delivered', t('filter_delivered')],['', t('filter_all')]].map(([s,l]) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>{t('column_recipient')}</th><th>{t('column_company')}</th><th>{t('column_tracking')}</th><th>{t('column_received_at')}</th><th>{t('column_delivered_to')}</th><th>{t('column_status')}</th>{canEdit && <th>{t('column_actions')}</th>}<th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : packages.length === 0
              ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">{t('empty_no_packages')}</td></tr>
              : packages.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium dark:text-white">{p.recipient_name || p.recipient_employee_name || '—'}</p>
                    {p.notes && <p className="text-xs text-gray-400 truncate max-w-[150px]">{p.notes}</p>}
                  </td>
                  <td className="text-sm">{p.delivery_company}</td>
                  <td className="font-mono text-xs">{p.tracking_code || '—'}</td>
                  <td className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(p.received_at), 'P p', { locale: dateLocale })}</td>
                  <td className="text-sm">{p.delivered_to_name || p.delivered_to_employee_name || '—'}</td>
                  <td>
                    {p.status === 'delivered'
                      ? <span className="badge-green">{t('status_delivered')}</span>
                      : <span className="badge-yellow">{t('status_pending')}</span>}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                        {p.status !== 'delivered' && (
                          <button onClick={() => { setDeliverModal(p); setDeliverForm({ delivered_to_id:'', delivered_to_name:'' }) }}
                            className="btn-success btn-sm"><CheckCircle size={12} /> {t('button_deliver')}</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="package" record={detail} />

      {/* New package modal */}
      {scannerTarget === 'new' && (
        <BarcodeScanner
          onScan={code => { setForm(f => ({ ...f, tracking_code: code })); setScannerTarget(null); toast.success(t('toast_code_read')) }}
          onClose={() => setScannerTarget(null)}
        />
      )}

      {scannerTarget === 'edit' && (
        <BarcodeScanner
          onScan={code => { setEditForm(f => ({ ...f, tracking_code: code })); setScannerTarget(null); toast.success(t('toast_code_read')) }}
          onClose={() => setScannerTarget(null)}
        />
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('modal_register_title')}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('register')}</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('field_company_required')}</label>
              <input className="input" placeholder={t('placeholder_company')} maxLength={100} value={form.delivery_company} onChange={e => setForm({ ...form, delivery_company: e.target.value })} /></div>
            <div className="form-group"><label className="label">{t('field_tracking')}</label>
              <div className="flex gap-2">
                <input className="input" maxLength={100} value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} />
                <button type="button" onClick={() => setScannerTarget('new')} title={t('tooltip_scan_barcode')}
                  className="shrink-0 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition-colors">
                  <ScanBarcode size={18} />
                </button>
              </div>
            </div>
          </div>
          <div className="form-group"><label className="label">{t('field_recipient_employee')}</label>
            <select className="input" value={form.recipient_employee_id} onChange={e => selectEmployee(e.target.value, 'recipient')}>
              <option value="">{tc('select_option')}</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group"><label className="label">{t('field_recipient_name')}</label>
            <input className="input" maxLength={150} value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} /></div>
          <div className="form-group"><label className="label">{t('field_notes')}</label>
            <textarea className="input" rows={2} maxLength={500} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={t('modal_edit_title')}
        footer={<><button onClick={() => setEditModal(null)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleEdit} className="btn-primary">{tc('save')}</button></>}>
        {editModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="label">{t('field_company_required')}</label>
                <input className="input" maxLength={100} value={editForm.delivery_company} onChange={e => setEditForm({ ...editForm, delivery_company: e.target.value })} /></div>
              <div className="form-group"><label className="label">{t('field_tracking')}</label>
                <div className="flex gap-2">
                  <input className="input" maxLength={100} value={editForm.tracking_code} onChange={e => setEditForm({ ...editForm, tracking_code: e.target.value })} />
                  <button type="button" onClick={() => setScannerTarget('edit')} title={t('tooltip_scan_barcode')}
                    className="shrink-0 px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition-colors">
                    <ScanBarcode size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="form-group"><label className="label">{t('field_recipient_employee')}</label>
              <select className="input" value={editForm.recipient_employee_id} onChange={e => selectEmployee(e.target.value, 'edit')}>
                <option value="">{tc('select_option')}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">{t('field_recipient_name')}</label>
              <input className="input" maxLength={150} value={editForm.recipient_name} onChange={e => setEditForm({ ...editForm, recipient_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">{t('field_notes')}</label>
              <textarea className="input" rows={2} maxLength={500} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
        )}
      </Modal>

      {/* Deliver modal */}
      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title={t('modal_deliver_title')}
        footer={<><button onClick={() => setDeliverModal(null)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleDeliver} className="btn-success"><CheckCircle size={16} />{tc('confirm')}</button></>}>
        {deliverModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3">
              <Package size={20} className="text-gray-400" />
              <div>
                <p className="font-medium dark:text-white">{deliverModal.recipient_name || deliverModal.recipient_employee_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{deliverModal.delivery_company}{deliverModal.tracking_code && ` · ${deliverModal.tracking_code}`}</p>
              </div>
            </div>
            <div className="form-group"><label className="label">{t('field_deliver_to_employee')}</label>
              <select className="input" value={deliverForm.delivered_to_id} onChange={e => selectEmployee(e.target.value, 'deliver')}>
                <option value="">{tc('select_option')}</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">{t('field_deliver_to_name')}</label>
              <input className="input" maxLength={150} value={deliverForm.delivered_to_name} onChange={e => setDeliverForm({ ...deliverForm, delivered_to_name: e.target.value })} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
