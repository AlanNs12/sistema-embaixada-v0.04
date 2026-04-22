import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import { Plus, Pencil, Phone, Mail, Globe, Info } from 'lucide-react'

const CATEGORY_ICONS = { telefone: Phone, email: Mail, site: Globe }
const CATEGORY_COLORS = { telefone: 'badge-green', email: 'badge-blue', site: 'badge-gray' }

export default function EmbassyInfo() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ category: 'telefone', label: '', value: '', description: '' })

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get('/info')
      setItems(res.data)
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openEdit = (item) => {
    setEditing(item)
    setForm({ category: item.category, label: item.label, value: item.value, description: item.description || '' })
    setModalOpen(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ category: 'telefone', label: '', value: '', description: '' })
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.label || !form.value) return toast.error('Rótulo e valor são obrigatórios')
    try {
      if (editing) await api.put(`/info/${editing.id}`, { ...form, active: true })
      else await api.post('/info', form)
      toast.success(editing ? 'Atualizado!' : 'Criado!')
      setModalOpen(false)
      load()
    } catch (e) { toast.error('Erro') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Remover este item?')) return
    try {
      await api.delete(`/info/${id}`)
      toast.success('Removido')
      load()
    } catch (e) { toast.error('Erro') }
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
          <h1 className="text-2xl font-bold text-gray-900">Informações da Embaixada</h1>
          <p className="text-gray-500 text-sm">Contatos e telefones úteis</p>
        </div>
        {isAdmin && <button onClick={openNew} className="btn-primary"><Plus size={16} /> Adicionar</button>}
      </div>

      {loading ? <p className="text-gray-400">Carregando...</p>
        : items.length === 0 ? (
          <div className="card card-body text-center text-gray-400 py-12">
            <Info size={32} className="mx-auto mb-2 opacity-30" />
            <p>Nenhuma informação cadastrada.</p>
            {isAdmin && <button onClick={openNew} className="btn-primary mx-auto mt-4"><Plus size={16} />Adicionar primeiro item</button>}
          </div>
        ) : Object.entries(grouped).map(([cat, catItems]) => {
          const Icon = CATEGORY_ICONS[cat] || Info
          return (
            <div key={cat} className="card">
              <div className="card-header">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2 capitalize">
                  <Icon size={18} className="text-blue-600" /> {cat}s
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {catItems.map(item => (
                  <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-blue-600 font-mono text-sm mt-0.5">{item.value}</p>
                      {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Informação' : 'Nova Informação'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Categoria</label>
            <select className="input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              <option value="telefone">Telefone</option>
              <option value="email">Email</option>
              <option value="site">Site</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div className="form-group">
            <label className="label">Rótulo *</label>
            <input className="input" placeholder="Ex: Secretaria, Emergências..." value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Valor *</label>
            <input className="input" placeholder="Número, email ou URL" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="label">Descrição</label>
            <input className="input" placeholder="Informação adicional" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  )
}
