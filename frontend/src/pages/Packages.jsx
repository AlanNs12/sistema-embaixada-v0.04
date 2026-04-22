import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import { Plus, CheckCircle, Package } from 'lucide-react'

export default function Packages() {
  const [packages, setPackages] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [modalOpen, setModalOpen] = useState(false)
  const [deliverModal, setDeliverModal] = useState(null)
  const [form, setForm] = useState({ delivery_company: '', tracking_code: '', recipient_employee_id: '', recipient_name: '', notes: '' })
  const [deliverForm, setDeliverForm] = useState({ delivered_to_id: '', delivered_to_name: '' })

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
      setForm({ delivery_company: '', tracking_code: '', recipient_employee_id: '', recipient_name: '', notes: '' })
      load()
    } catch (e) { toast.error('Erro') }
  }

  const handleDeliver = async () => {
    try {
      await api.put(`/packages/${deliverModal.id}`, deliverForm)
      toast.success('Entrega registrada!')
      setDeliverModal(null)
      setDeliverForm({ delivered_to_id: '', delivered_to_name: '' })
      load()
    } catch (e) { toast.error('Erro') }
  }

  const handleEmployeeSelect = (id, field) => {
    const emp = employees.find(e => String(e.id) === id)
    if (field === 'recipient') setForm(f => ({ ...f, recipient_employee_id: id, recipient_name: emp?.name || '' }))
    else setDeliverForm(f => ({ ...f, delivered_to_id: id, delivered_to_name: emp?.name || '' }))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Encomendas</h1>
          <p className="text-gray-500 text-sm">Recebimento e entrega de pacotes</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Registrar Encomenda</button>
      </div>

      <div className="flex gap-2">
        {['pending', 'delivered', ''].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s === 'pending' ? 'Pendentes' : s === 'delivered' ? 'Entregues' : 'Todas'}
          </button>
        ))}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Destinatário</th><th>Empresa</th><th>Rastreio</th><th>Recebido em</th><th>Entregue a</th><th>Entregue em</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : packages.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhuma encomenda</td></tr>
              : packages.map(p => (
                <tr key={p.id}>
                  <td>
                    <p className="font-medium">{p.recipient_name || p.recipient_employee_name || '—'}</p>
                    {p.notes && <p className="text-xs text-gray-400 truncate max-w-[150px]">{p.notes}</p>}
                  </td>
                  <td className="text-sm">{p.delivery_company}</td>
                  <td className="font-mono text-xs">{p.tracking_code || '—'}</td>
                  <td className="text-xs text-gray-500">{format(new Date(p.received_at), 'dd/MM/yyyy HH:mm')}</td>
                  <td className="text-sm">{p.delivered_to_name || p.delivered_to_employee_name || '—'}</td>
                  <td className="text-xs text-gray-500">{p.delivered_at ? format(new Date(p.delivered_at), 'dd/MM/yyyy HH:mm') : '—'}</td>
                  <td>
                    {p.status === 'delivered'
                      ? <span className="badge-green">Entregue</span>
                      : <button onClick={() => { setDeliverModal(p); setDeliverForm({ delivered_to_id: '', delivered_to_name: '' }) }} className="badge-yellow cursor-pointer hover:bg-yellow-200">Entregar</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Encomenda Recebida"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Empresa Entregadora *</label>
              <input className="input" placeholder="Correios, JadLog..." value={form.delivery_company} onChange={e => setForm({ ...form, delivery_company: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Código de Rastreio</label>
              <input className="input" value={form.tracking_code} onChange={e => setForm({ ...form, tracking_code: e.target.value })} />
            </div>
          </div>
          <div className="form-group">
            <label className="label">Funcionário Destinatário</label>
            <select className="input" value={form.recipient_employee_id} onChange={e => handleEmployeeSelect(e.target.value, 'recipient')}>
              <option value="">Selecione ou deixe em branco</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Nome do Destinatário</label>
            <input className="input" placeholder="Confirme ou ajuste o nome" value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deliverModal} onClose={() => setDeliverModal(null)} title="Registrar Entrega"
        footer={<><button onClick={() => setDeliverModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleDeliver} className="btn-success"><CheckCircle size={16} />Confirmar Entrega</button></>}>
        {deliverModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Package size={20} className="text-gray-400" />
                <div>
                  <p className="font-medium">{deliverModal.recipient_name || deliverModal.recipient_employee_name}</p>
                  <p className="text-sm text-gray-500">{deliverModal.delivery_company} {deliverModal.tracking_code && `· ${deliverModal.tracking_code}`}</p>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="label">Entregue para (funcionário)</label>
              <select className="input" value={deliverForm.delivered_to_id} onChange={e => handleEmployeeSelect(e.target.value, 'deliver')}>
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Nome de quem recebeu</label>
              <input className="input" placeholder="Confirme o nome" value={deliverForm.delivered_to_name} onChange={e => setDeliverForm({ ...deliverForm, delivered_to_name: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
