import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import Modal from '../../components/Modal'
import { Plus, Pencil, Shield } from 'lucide-react'

const ROLE_LABELS  = { super_admin:'Super Admin', admin:'Admin', porteiro:'Porteiro', viewer:'Visualizador' }
const ROLE_BADGES  = { super_admin:'badge-red', admin:'badge-blue', porteiro:'badge-gray', viewer:'badge-purple' }
const empty = { name:'', email:'', password:'', role:'porteiro', active:true }

export default function AdminUsers() {
  const { isSuperAdmin, user: me } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(empty)

  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/users'); setUsers(r.data) }
    catch (e) { toast.error('Erro') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const openNew  = () => { setEditing(null); setForm(empty); setModalOpen(true) }
  const openEdit = (u)=> { setEditing(u); setForm({ ...u, password:'' }); setModalOpen(true) }

  const handleSubmit = async () => {
    if (!form.name || !form.email) return toast.error('Nome e email obrigatórios')
    if (!editing && !form.password) return toast.error('Senha obrigatória para novo usuário')
    try {
      if (editing) await api.put(`/users/${editing.id}`, form)
      else         await api.post('/users', form)
      toast.success(editing ? 'Usuário atualizado!' : 'Usuário criado!')
      setModalOpen(false); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários do Sistema</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gerenciamento de acessos</p>
        </div>
        {isSuperAdmin && <button onClick={openNew} className="btn-primary"><Plus size={16} /> Novo Usuário</button>}
      </div>

      <div className="table-container">
        <table className="table">
          <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th><th>Criado em</th><th></th></tr></thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 dark:text-blue-300 font-bold text-xs">{u.name[0].toUpperCase()}</span>
                      </div>
                      <span className="font-medium dark:text-white">{u.name}</span>
                      {u.id === me?.id && <span className="badge-blue text-xs">você</span>}
                    </div>
                  </td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                  <td><span className={ROLE_BADGES[u.role]}>{ROLE_LABELS[u.role]}</span></td>
                  <td>{u.active ? <span className="badge-green">Ativo</span> : <span className="badge-red">Inativo</span>}</td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuário' : 'Novo Usuário'}
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Salvar</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Nome *</label>
            <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="label">Email *</label>
            <input type="email" className="input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          <div className="form-group">
            <label className="label">{editing ? 'Nova senha (deixe em branco para não alterar)' : 'Senha *'}</label>
            <input type="password" className="input" value={form.password||''} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Perfil</label>
              <select className="input" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="porteiro">Porteiro</option>
                <option value="viewer">Visualizador (só leitura)</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
            {editing && (
              <div className="form-group"><label className="label">Status</label>
                <select className="input" value={form.active?'true':'false'} onChange={e => setForm({ ...form, active: e.target.value==='true' })}>
                  <option value="true">Ativo</option><option value="false">Inativo</option>
                </select>
              </div>
            )}
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <p className="font-semibold flex items-center gap-1"><Shield size={12} /> Permissões por perfil:</p>
            <p><strong>Visualizador:</strong> Apenas leitura — sem criar ou editar</p>
            <p><strong>Porteiro:</strong> Registra todos os controles diários</p>
            <p><strong>Admin:</strong> Porteiro + cadastros e relatórios</p>
            <p><strong>Super Admin:</strong> Acesso total</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
