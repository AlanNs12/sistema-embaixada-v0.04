import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import DocImage from '../components/DocImage'
import { Plus, LogOut, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function ServiceProviders() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [visits, setVisits] = useState([])
  const [inside, setInside] = useState([])
  const [providers, setProviders] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ provider_id: '', visitor_name: '', company: '', reason: '', employee_id: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [visitsRes, providersRes, empRes] = await Promise.all([
        api.get(`/providers/visits?date=${date}`),
        api.get('/providers'),
        api.get('/employees'),
      ])
      setVisits(visitsRes.data.visits)
      setInside(visitsRes.data.currently_inside)
      setProviders(providersRes.data)
      setEmployees(empRes.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleProviderSelect = (id) => {
    const p = providers.find(p => String(p.id) === id)
    if (p) setForm(f => ({ ...f, provider_id: id, visitor_name: p.name, company: p.company || '' }))
    else setForm(f => ({ ...f, provider_id: id }))
  }

  const handleSubmit = async () => {
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/providers/visits', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Entrada registrada!')
      setModalOpen(false)
      setForm({ provider_id: '', visitor_name: '', company: '', reason: '', employee_id: '', notes: '' })
      setPhoto(null); setPhotoPreview(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  const handleExit = async (id) => {
    try { await api.put(`/providers/visits/${id}`, {}); toast.success('Saída registrada!'); load() }
    catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Prestadores de Serviço</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Controle de acesso e visitas</p>
        </div>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Registrar Entrada</button>}
        </div>
      </div>

      {inside.length > 0 && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-2">Prestadores na embaixada agora:</p>
          <div className="flex flex-wrap gap-2">
            {inside.map(p => (
              <div key={p.id} className="bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-1.5 flex items-center gap-2">
                <span className="text-sm font-medium dark:text-white">{p.visitor_name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{p.company}</span>
                {canEdit && (
                  <button onClick={() => handleExit(p.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                    <LogOut size={12} /> Saída
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>Empresa</th><th>Motivo</th><th>Funcionário</th><th>Entrada</th><th>Saída</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : visits.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum registro nesta data</td></tr>
              : visits.map(v => (
                <tr key={v.id}>
                  <td className="font-medium dark:text-white">{v.visitor_name}</td>
                  <td className="text-sm text-gray-500 dark:text-gray-400">{v.company || '—'}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{v.reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{v.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.entry_time ? format(new Date(v.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.exit_time ? format(new Date(v.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {v.exit_time
                      ? <span className="badge-gray">Saiu</span>
                      : canEdit
                      ? <button onClick={() => handleExit(v.id)} className="badge-red cursor-pointer hover:bg-red-200 text-xs">Reg. saída</button>
                      : <span className="badge-purple">Dentro</span>}
                  </td>
                  <td>
                    <button onClick={() => setDetail(v)} className="btn-secondary btn-sm" title="Ver detalhes">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Entrada de Prestador"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Prestador Cadastrado (opcional)</label>
            <select className="input" value={form.provider_id} onChange={e => handleProviderSelect(e.target.value)}>
              <option value="">Novo / não cadastrado</option>
              {providers.map(p => <option key={p.id} value={p.id}>{p.name} — {p.company}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Nome *</label>
              <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">Empresa</label>
              <input className="input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="label">Motivo da Visita</label>
            <input className="input" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="form-group"><label className="label">Funcionário Responsável</label>
            <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
              <option value="">Selecione...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select></div>
          <div className="form-group">
            <label className="label">Foto do Documento</label>
            <input type="file" accept="image/*" capture="environment"
              onChange={e => { const f = e.target.files[0]; setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }}
              className="input text-sm dark:text-gray-300" />
            {photoPreview && <img src={photoPreview} alt="doc" className="mt-2 h-24 rounded-lg object-cover border" />}
          </div>
        </div>
      </Modal>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="provider_visit" record={detail} />
    </div>
  )
}
