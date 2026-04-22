import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, Car } from 'lucide-react'

const empty = { plate: '', model: '', description: '', active: true }

export default function AdminVehicles() {
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
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (v) => { setEditing(v); setForm({ ...v }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.plate) return toast.error('Placa é obrigatória')
    try {
      if (editing) await api.put(`/vehicles/${editing.id}`, form)
      else await api.post('/vehicles', form)
      toast.success(editing ? 'Veículo atualizado!' : 'Veículo cadastrado!')
      setModalOpen(false)
      load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Frota de Veículos</h1>
          <p className="text-gray-500 text-sm">Cadastro e gestão dos veículos</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo Veículo</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="text-gray-400">Carregando...</p>
          : vehicles.length === 0 ? (
            <div className="col-span-3 card card-body text-center text-gray-400 py-12">
              <Car size={32} className="mx-auto mb-2 opacity-30" />
              <p>Nenhum veículo cadastrado.</p>
              <button onClick={openNew} className="btn-primary mx-auto mt-4"><Plus size={16} />Cadastrar veículo</button>
            </div>
          ) : vehicles.map(v => (
            <div key={v.id} className="card p-5 flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mt-0.5">
                  <Car size={20} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-mono font-bold text-lg tracking-wider">{v.plate}</p>
                  <p className="font-medium text-sm text-gray-700">{v.model || '—'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{v.description || ''}</p>
                  <span className={`mt-2 inline-block ${v.active ? 'badge-green' : 'badge-red'}`}>
                    {v.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
              <button onClick={() => openEdit(v)} className="btn-secondary btn-sm"><Pencil size={13} /></button>
            </div>
          ))}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Veículo' : 'Novo Veículo'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Placa *</label>
            <input className="input uppercase" placeholder="ABC-1234" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value.toUpperCase() })} />
          </div>
          <div className="form-group">
            <label className="label">Modelo</label>
            <input className="input" placeholder="Ex: Toyota Corolla, Volkswagen Tiguan..." value={form.model || ''} onChange={e => setForm({ ...form, model: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Descrição</label>
            <input className="input" placeholder="Cor, ano, detalhes..." value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {editing && (
            <div className="form-group">
              <label className="label">Status</label>
              <select className="input" value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
