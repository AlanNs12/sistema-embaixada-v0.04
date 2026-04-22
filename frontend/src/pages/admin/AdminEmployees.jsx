import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, Users } from 'lucide-react'

const empty = { name: '', position: '', department: '', email: '', phone: '', active: true }

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/employees')
      setEmployees(res.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (emp) => { setEditing(emp); setForm({ ...emp }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Nome é obrigatório')
    try {
      if (editing) await api.put(`/employees/${editing.id}`, form)
      else await api.post('/employees', form)
      toast.success(editing ? 'Funcionário atualizado!' : 'Funcionário cadastrado!')
      setModalOpen(false)
      load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Funcionários da Embaixada</h1>
          <p className="text-gray-500 text-sm">Cadastro e gestão dos funcionários</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo Funcionário</button>
      </div>

      <input className="input max-w-xs" placeholder="Buscar por nome ou setor..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>Cargo</th><th>Setor</th><th>Email</th><th>Telefone</th><th>Status</th><th>Ações</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={7} className="text-center py-8 text-gray-400">Nenhum funcionário encontrado</td></tr>
              : filtered.map(emp => (
                <tr key={emp.id}>
                  <td><p className="font-medium">{emp.name}</p></td>
                  <td className="text-sm text-gray-600">{emp.position || '—'}</td>
                  <td className="text-sm text-gray-600">{emp.department || '—'}</td>
                  <td className="text-sm text-gray-500">{emp.email || '—'}</td>
                  <td className="text-sm font-mono">{emp.phone || '—'}</td>
                  <td>{emp.active ? <span className="badge-green">Ativo</span> : <span className="badge-red">Inativo</span>}</td>
                  <td>
                    <button onClick={() => openEdit(emp)} className="btn-secondary btn-sm"><Pencil size={13} /> Editar</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Funcionário' : 'Novo Funcionário'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Nome Completo *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Cargo</label>
              <input className="input" value={form.position || ''} onChange={e => setForm({ ...form, position: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Setor / Departamento</label>
              <input className="input" value={form.department || ''} onChange={e => setForm({ ...form, department: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label className="label">Email</label>
              <input type="email" className="input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="label">Telefone</label>
              <input className="input" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
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
