import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import { Plus, CheckCircle, Package, Pencil } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Packages() {
  const { canEdit } = useAuth()
  const [packages, setPackages] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [modalOpen, setModalOpen] = useState(false)
  const [deliverModal, setDeliverModal] = useState(null)
  const [editModal, setEditModal] = useState(null)
  const [form, setForm] = useState({ delivery_company:'', tracking_code:'', recipient_employee_id:'', recipient_name:'', notes:'' })
  const [deliverForm, setDeliverForm] = useState({ delivered_to_id:'', delivered_to_name:'' })
  const [editForm, setEditForm] = useState({ delivery_company:'', tracking_code:'', recipient_name:'', recipient_employee_id:'', notes:'' })

  const load = async () => {
    setLoading(true)
    try {
      const [pkgRes, empRes] = await Promise.all([
        api.get(`/packages?status=${filter}`),
        api.get('/employees'),
      ])
      setPackages(pkgRes.data)
      setEmployees(empRes.data)
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filter])

  const handleSubmit = async () => {
    if (!form.delivery_company) return toast.error('Empresa entregadora obrigatória')
    try {
      await api.post('/packages', form)
      toast.success('Encomenda registrada!')
      setModalOpen(false)
      setForm({ delivery_company:'', tracking_code:'', recipient_employee_id:'', recipient_name:'', notes:'' })
      load()
    } catch (e) { toast.error('Erro') }
  }

  const handleDeliver = async () => {
    try {
      await api.put(`/packages/${deliverModal.id}`, { ...deliverForm, action: 'deliver' })
      toast.success('Entrega registrada!')
      setDeliverModal(null)
      setDeliverForm({ delivered_to_id:'', delivered_to_name:'' })
      load()
    } catch (e) { toast.error('Erro') }
  }

  const handleEdit = async () => {
    try {
      await api.put(`/packages/${editModal.id}`, editForm)
      toast.success('Encomenda atualizada!')
      setEditModal(null)
      load()
    } catch (e) { toast.error('Erro') }
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Encomendas</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Recebimento e entrega de pacotes</p>
        </div>
        {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Registrar Encomenda</button>}
      </div>

      <div className="flex gap-2">
        {[['pending','Pendentes'],['delivered','Entregues'],['','Todas']].map(([s,l]) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>{l}</button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Destinatário</th><th>Empresa</th><th>Rastreio</th><th>Recebido em</th><th>Entregue a</th><th>Status</th>{canEdit && <th>Ações</th>}</tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : packages.length === 0
              ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma encomenda</td></tr>
              : packages.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium dark:text-white">{p.recipient_name || p.recipient_employee_name || '—'}</p>
                    {p.notes && <p className="text-xs text-gray-400 truncate max-w-[150px]">{p.notes}</p>}
                  </td>
                  <td className="text-sm">{p.delivery_company}</td>
                  <td className="font-mono text-xs">{p.tracking_code || '—'}</td>
                  <td className="text-xs text-gray-500 dark:text-gray-400">{format(new Date(p.received_at), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="text-sm">{p.delivered_to_name || p.delivered_to_employee_name || '—'}</td>
                  <td>
                    {p.status === 'delivered'
                      ? <span className="badge-green">Entregue</span>
                      : <span className="badge-yellow">Pendente</span>}
                  </td>
                  {canEdit && (
                    <td>
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(p)} className="btn-secondary btn-sm"><Pencil size={12} /></button>
                        {p.status !== 'delivered' && (
                          <button onClick={() => { setDeliverModal(p); setDeliverForm({ delivered_to_id:'', delivered_to_name:'' }) }}
                            className="btn-success btn-sm"><CheckCircle size={12} /> Entregar</button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* New package modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Encomenda Recebida"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Empresa Entregadora *</label>
              <input className="input" placeholder="Correios, JadLog..." value={form.delivery_company} onChange={e => setForm({ ...form, delivery_company: e.target.value })} /></div>
            <div className="form-group"><label className="label">Código de Rastreio</label>
              <input className="input" value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="label">Funcionário Destinatário</label>
            <select className="input" value={form.recipient_employee_id} onChange={e => selectEmployee(e.target.value, 'recipient')}>
              <option value="">Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group"><label className="label">Nome do Destinatário</label>
            <input className="input" value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} /></div>
          <div className="form-group"><label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Editar Encomenda"
        footer={<><button onClick={() => setEditModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleEdit} className="btn-primary">Salvar</button></>}>
        {editModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="label">Empresa Entregadora</label>
                <input className="input" value={editForm.delivery_company} onChange={e => setEditForm({ ...editForm, delivery_company: e.target.value })} /></div>
              <div className="form-group"><label className="label">Código de Rastreio</label>
                <input className="input" value={editForm.tracking_code} onChange={e => setEditForm({ ...editForm, tracking_code: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="label">Funcionário Destinatário</label>
              <select className="input" value={editForm.recipient_employee_id} onChange={e => selectEmployee(e.target.value, 'edit')}>
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">Nome do Destinatário</label>
              <input className="input" value={editForm.recipient_name} onChange={e => setEditForm({ ...editForm, recipient_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">Observações</label>
              <textarea className="input" rows={2} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} /></div>
          </div>
        )}
      </Modal>

      {/* Deliver modal */}
      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title="Registrar Entrega"
        footer={<><button onClick={() => setDeliverModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleDeliver} className="btn-success"><CheckCircle size={16} />Confirmar</button></>}>
        {deliverModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 flex items-center gap-3">
              <Package size={20} className="text-gray-400" />
              <div>
                <p className="font-medium dark:text-white">{deliverModal.recipient_name || deliverModal.recipient_employee_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{deliverModal.delivery_company}{deliverModal.tracking_code && ` · ${deliverModal.tracking_code}`}</p>
              </div>
            </div>
            <div className="form-group"><label className="label">Entregue para (funcionário)</label>
              <select className="input" value={deliverForm.delivered_to_id} onChange={e => selectEmployee(e.target.value, 'deliver')}>
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">Nome de quem recebeu</label>
              <input className="input" value={deliverForm.delivered_to_name} onChange={e => setDeliverForm({ ...deliverForm, delivered_to_name: e.target.value })} /></div>
          </div>
        )}
      </Modal>
    </div>
  )
}
