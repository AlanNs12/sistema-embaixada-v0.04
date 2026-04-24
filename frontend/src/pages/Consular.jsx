import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import DocImage from '../components/DocImage'
import { Plus, LogOut, Eye } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Consular() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ appointments: [], currently_inside: [] })
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState({ visitor_name: '', visit_reason: '', employee_id: '', scheduled_time: '', notes: '' })
  const [photo, setPhoto] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [aptsRes, empRes] = await Promise.all([api.get(`/consular?date=${date}`), api.get('/employees')])
      setData(aptsRes.data); setEmployees(empRes.data)
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleSubmit = async () => {
    if (!form.visitor_name) return toast.error('Nome obrigatório')
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => v && fd.append(k, v))
    if (photo) fd.append('document_photo', photo)
    try {
      await api.post('/consular', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Atendimento registrado!')
      setModalOpen(false)
      setForm({ visitor_name: '', visit_reason: '', employee_id: '', scheduled_time: '', notes: '' })
      setPhoto(null); setPhotoPreview(null); load()
    } catch (e) { toast.error('Erro') }
  }

  const handleExit = async (id) => {
    try { await api.put(`/consular/${id}`, {}); toast.success('Saída registrada!'); load() }
    catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Atendimentos Consulares</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Controle de visitantes para atendimento</p>
        </div>
        <div className="flex gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Novo Atendimento</button>}
        </div>
      </div>

      {data.currently_inside.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">Visitantes na embaixada agora:</p>
          <div className="flex flex-wrap gap-2">
            {data.currently_inside.map(a => (
              <div key={a.id} className="bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2 flex items-center gap-2">
                <div>
                  <p className="text-sm font-medium dark:text-white">{a.visitor_name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">c/ {a.employee_name || 'N/A'}</p>
                </div>
                {canEdit && (
                  <button onClick={() => handleExit(a.id)} className="text-red-500 text-xs flex items-center gap-1 hover:text-red-700 ml-2">
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
            <tr><th>Visitante</th><th>Motivo</th><th>Funcionário</th><th>Agendado</th><th>Entrada</th><th>Saída</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : data.appointments.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum atendimento nesta data</td></tr>
              : data.appointments.map(a => (
                <tr key={a.id}>
                  <td className="font-medium dark:text-white">{a.visitor_name}</td>
                  <td className="text-sm dark:text-gray-300 max-w-[140px] truncate">{a.visit_reason || '—'}</td>
                  <td className="text-sm dark:text-gray-300">{a.employee_name || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.scheduled_time || '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.entry_time ? format(new Date(a.entry_time), 'HH:mm') : '—'}</td>
                  <td className="font-mono text-xs dark:text-gray-300">{a.exit_time ? format(new Date(a.exit_time), 'HH:mm') : '—'}</td>
                  <td>
                    {a.exit_time ? <span className="badge-gray">Saiu</span>
                      : a.entry_time && canEdit
                      ? <button onClick={() => handleExit(a.id)} className="badge-blue cursor-pointer hover:bg-blue-200 text-xs">Reg. saída</button>
                      : <span className="badge-yellow">Aguardando</span>}
                  </td>
                  <td>
                    <button onClick={() => setDetail(a)} className="btn-secondary btn-sm" title="Ver detalhes">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Novo atendimento */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo Atendimento Consular"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="form-group"><label className="label">Nome do Visitante *</label>
            <input className="input" value={form.visitor_name} onChange={e => setForm({ ...form, visitor_name: e.target.value })} /></div>
          <div className="form-group"><label className="label">Motivo</label>
            <textarea className="input" rows={2} value={form.visit_reason} onChange={e => setForm({ ...form, visit_reason: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Funcionário</label>
              <select className="input" value={form.employee_id} onChange={e => setForm({ ...form, employee_id: e.target.value })}>
                <option value="">Selecione...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select></div>
            <div className="form-group"><label className="label">Horário Agendado</label>
              <input type="time" className="input" value={form.scheduled_time} onChange={e => setForm({ ...form, scheduled_time: e.target.value })} /></div>
          </div>
          <div className="form-group">
            <label className="label">Foto do Documento</label>
            <input type="file" accept="image/*" capture="environment"
              onChange={e => { const f = e.target.files[0]; setPhoto(f); setPhotoPreview(f ? URL.createObjectURL(f) : null) }}
              className="input text-sm dark:text-gray-300" />
            {photoPreview && <img src={photoPreview} alt="doc" className="mt-2 h-24 rounded-lg object-cover border" />}
          </div>
          <div className="form-group"><label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
        </div>
      </Modal>

      {/* Modal de detalhes */}
      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="consular" record={detail} />
    </div>
  )
}
