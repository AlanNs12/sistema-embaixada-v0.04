import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import { Plus, LogOut, UserCheck, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Visitors() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ visitors: [], currently_inside: [] })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ visitor_name: '', document_number: '', reason: '', employee_id: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [visRes, empRes] = await Promise.all([api.get(`/visitors?date=${date}`), api.get('/employees')])
      setData(visRes.data); setEmployees(empRes.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleSubmit = async () => {
    if (!form.visitor_name) return toast.error('Nome do visitante obrigatório')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/visitors', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Entrada registrada!')
      setModalOpen(false)
      setForm({ visitor_name: '', document_number: '', reason: '', employee_id: '', notes: '' })
      setPhoto(null); setPhotoPreview(null); load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  const handleExit = async (id) => {
    try { await api.put(`/visitors/${id}`, {}); toast.success('Saída registrada!'); load() }
    catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Visitantes</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Controle geral de visitantes</p>
        </div>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Registrar Entrada</button>}
        </div>
      </div>

      {data.currently_inside.length > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-4">
          <p className="text-sm font-medium text-teal-800 dark:text-teal-300 mb-2 flex items-center gap-2">
            <UserCheck size={16} /> {data.currently_inside.length} visitante(s) na embaixada agora
          </p>
          <div className="flex flex-wrap gap-2">
            {data.currently_inside.map(v => (
              <div key={v.id} className="bg-white dark:bg-gray-800 border border-teal-200 dark:border-teal-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium dark:text-white">{v.visitor_name}</p>
                  <p className="text-xs text-gray-400">{v.reason || '—'}</p>
                </div>
                {canEdit && (
                  <button onClick={() => handleExit(v.id)} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1 ml-2">
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
            <tr><th>Visitante</th><th>Documento</th><th>Motivo</th><th>Funcionário</th><th>Entrada</th><th>Saída</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : data.visitors.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum visitante nesta data</td></tr>
              : data.visitors.map(v => (
                <tr key={v.id}>
                  <td>
                    <p className="font-medium dark:text-white">{v.visitor_name}</p>
                    {v.notes && <p className="text-xs text-gray-400 truncate max-w-[120px]">{v.notes}</p>}
                  </td>
                  <td className="font-mono text-xs text-gray-500 dark:text-gray-400">{v.document_number || '—'}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{v.reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{v.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.entry_time ? format(new Date(v.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{v.exit_time ? format(new Date(v.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {v.exit_time
                      ? <span className="badge-gray">Saiu</span>
                      : canEdit
                      ? <button onClick={() => handleExit(v.id)} className="badge-red cursor-pointer hover:bg-red-200 text-xs">Reg. saída</button>
                      : <span className="badge-green">Dentro</span>}
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Entrada de Visitante"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Nome Completo *</label>
              <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
            <div className="form-group"><label className="label">Nº Documento</label>
              <input className="input" placeholder="RG, CPF, Passaporte..." value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="label">Motivo da Visita</label>
            <textarea className="input" rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></div>
          <div className="form-group"><label className="label">Funcionário a Visitar</label>
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
            <p className="text-xs text-gray-400 mt-1">No celular abre a câmera automaticamente</p>
          </div>
          <div className="form-group"><label className="label">Observações</label>
            <input className="input" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="visitor" record={detail} />
    </div>
  )
}
