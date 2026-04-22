import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import Modal from '../../components/Modal'
import { Plus, Pencil, UserCog, Truck, Camera } from 'lucide-react'

// ---- OUTSOURCED ----
function OutsourcedTab() {
  const [workers, setWorkers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', role: 'limpeza', company: '', active: true })

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/outsourced'); setWorkers(r.data) }
    catch (e) { toast.error('Erro') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', role: 'limpeza', company: '', active: true }); setModalOpen(true) }
  const openEdit = (w) => { setEditing(w); setForm({ ...w }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Nome obrigatório')
    try {
      if (editing) await api.put(`/outsourced/${editing.id}`, form)
      else await api.post('/outsourced', form)
      toast.success('Salvo!')
      setModalOpen(false)
      load()
    } catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{workers.length} terceirizado(s) cadastrado(s)</p>
        <button onClick={openNew} className="btn-primary btn-sm"><Plus size={14} /> Novo</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Nome</th><th>Função</th><th>Empresa</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">Carregando...</td></tr>
              : workers.map(w => (
                <tr key={w.id}>
                  <td className="font-medium">{w.name}</td>
                  <td><span className={w.role === 'jardineiro' ? 'badge-green' : 'badge-blue'}>{w.role === 'jardineiro' ? 'Jardineiro' : 'Limpeza'}</span></td>
                  <td className="text-sm text-gray-500">{w.company || '—'}</td>
                  <td>{w.active ? <span className="badge-green">Ativo</span> : <span className="badge-red">Inativo</span>}</td>
                  <td><button onClick={() => openEdit(w)} className="btn-secondary btn-sm"><Pencil size={12} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Terceirizado' : 'Novo Terceirizado'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Função</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="limpeza">Limpeza</option>
                <option value="jardineiro">Jardineiro</option>
              </select>
            </div>
            <div className="form-group"><label className="label">Empresa</label><input className="input" value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          {editing && <div className="form-group"><label className="label">Status</label>
            <select className="input" value={form.active ? 'true' : 'false'} onChange={e => setForm({ ...form, active: e.target.value === 'true' })}>
              <option value="true">Ativo</option><option value="false">Inativo</option>
            </select>
          </div>}
        </div>
      </Modal>
    </div>
  )
}

// ---- REGISTERED PROVIDERS ----
function ProvidersTab() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', company: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/providers'); setProviders(r.data) }
    catch (e) { toast.error('Erro') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setForm({ name: '', company: '', notes: '' }); setPhoto(null); setPhotoPreview(null); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, company: p.company || '', notes: p.notes || '' }); setPhoto(null); setPhotoPreview(null); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Nome obrigatório')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      if (editing) await api.put(`/providers/${editing.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      else await api.post('/providers', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Salvo!')
      setModalOpen(false)
      load()
    } catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{providers.length} prestador(es) cadastrado(s)</p>
        <button onClick={openNew} className="btn-primary btn-sm"><Plus size={14} /> Novo</button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead><tr><th>Nome</th><th>Empresa</th><th>Notas</th><th>Documento</th><th></th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="text-center py-6 text-gray-400">Carregando...</td></tr>
              : providers.map(p => (
                <tr key={p.id}>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-sm text-gray-500">{p.company || '—'}</td>
                  <td className="text-sm text-gray-400 max-w-[180px] truncate">{p.notes || '—'}</td>
                  <td>{p.document_photo
                    ? <a href={p.document_photo} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-xs flex items-center gap-1"><Camera size={12} />Ver</a>
                    : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td><button onClick={() => openEdit(p)} className="btn-secondary btn-sm"><Pencil size={12} /></button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Prestador' : 'Novo Prestador Cadastrado'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Nome *</label><input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="label">Empresa</label><input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          <div className="form-group"><label className="label">Foto do Documento</label>
            <input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }} className="input text-sm" />
            {(photoPreview || editing?.document_photo) && <img src={photoPreview || editing.document_photo} alt="doc" className="mt-2 h-24 rounded-lg object-cover border" />}
          </div>
          <div className="form-group"><label className="label">Notas</label><textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>
    </div>
  )
}

export default function AdminOutsourced() {
  const [tab, setTab] = useState('outsourced')
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cadastros</h1>
        <p className="text-gray-500 text-sm">Terceirizados e prestadores recorrentes</p>
      </div>
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab('outsourced')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'outsourced' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <UserCog size={16} /> Terceirizados
        </button>
        <button onClick={() => setTab('providers')} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'providers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          <Truck size={16} /> Prestadores Recorrentes
        </button>
      </div>
      <div>
        {tab === 'outsourced' ? <OutsourcedTab /> : <ProvidersTab />}
      </div>
    </div>
  )
}
