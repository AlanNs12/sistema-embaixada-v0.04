import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import Modal from '../components/Modal'
import { useAuth } from '../contexts/AuthContext'
import { Car, Plus, CheckCircle, Pencil } from 'lucide-react'

export default function Vehicles() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ logs: [], vehicles_out: [] })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [returnModal, setReturnModal] = useState(null)
  const [obsModal, setObsModal] = useState(null)  // editar observações
  const [obsText, setObsText] = useState('')
  const [form, setForm] = useState({ vehicle_id: '', departure_time: format(new Date(), 'HH:mm'), driver: '', passengers: '', reason: '', observations: '' })
  const [returnTime, setReturnTime] = useState(format(new Date(), 'HH:mm'))

  const load = async () => {
    setLoading(true)
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get(`/vehicles/logs?date=${date}`),
        api.get('/vehicles'),
      ])
      setData(logsRes.data)
      setVehicles(vehiclesRes.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.departure_time) return toast.error('Preencha os campos obrigatórios')
    try {
      await api.post('/vehicles/logs', { ...form, date })
      toast.success('Saída registrada!')
      setModalOpen(false)
      setForm({ vehicle_id: '', departure_time: format(new Date(), 'HH:mm'), driver: '', passengers: '', reason: '', observations: '' })
      load()
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
  }

  const handleReturn = async () => {
    try {
      await api.put(`/vehicles/logs/${returnModal.id}`, { return_time: returnTime })
      toast.success('Retorno registrado!'); setReturnModal(null); load()
    } catch (e) { toast.error('Erro') }
  }

  const handleSaveObs = async () => {
    try {
      await api.put(`/vehicles/logs/${obsModal.id}`, { observations: obsText })
      toast.success('Observação salva!'); setObsModal(null); load()
    } catch (e) { toast.error('Erro') }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Veículos</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Saídas e retornos da frota</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {canEdit && <button onClick={() => setModalOpen(true)} className="btn-primary"><Plus size={16} /> Registrar Saída</button>}
        </div>
      </div>

      {data.vehicles_out.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
            <Car size={16} /> {data.vehicles_out.length} veículo(s) fora agora
          </p>
          <div className="flex flex-wrap gap-2">
            {data.vehicles_out.map(v => (
              <button key={v.id}
                onClick={() => canEdit && (setReturnModal(v), setReturnTime(format(new Date(), 'HH:mm')))}
                className="bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded-lg px-3 py-1.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center gap-2">
                <span className="font-mono font-bold dark:text-white">{v.plate}</span>
                <span className="text-gray-500 dark:text-gray-400">{v.model}</span>
                <span className="text-xs text-orange-600">saiu {v.departure_time}</span>
                {canEdit && <span className="badge-yellow">Registrar retorno</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Veículo</th><th>Saída</th><th>Retorno</th><th>Condutor</th><th>Motivo</th><th>Passageiros/Obs.</th><th>Ações</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : data.logs.length === 0
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Nenhum registro nesta data</td></tr>
              : data.logs.map(log => (
                <tr key={log.id}>
                  <td><p className="font-mono font-bold dark:text-white">{log.plate}</p><p className="text-xs text-gray-400">{log.model}</p></td>
                  <td className="font-mono text-sm">{log.departure_time}</td>
                  <td className="font-mono text-sm">{log.return_time || <span className="text-gray-300">—</span>}</td>
                  <td className="text-sm">{log.driver || '—'}</td>
                  <td className="text-sm max-w-[120px] truncate">{log.reason || '—'}</td>
                  <td className="text-sm max-w-[120px] truncate text-gray-500 dark:text-gray-400">{log.observations || log.passengers || '—'}</td>
                  <td>
                    {canEdit && (
                      <button onClick={() => { setObsModal(log); setObsText(log.observations || '') }}
                        className="btn-secondary btn-sm"><Pencil size={12} /> Obs.</button>
                    )}
                  </td>
                  <td>
                    {log.return_time ? <span className="badge-green">Retornou</span> : <span className="badge-yellow">Fora</span>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* New departure modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Saída de Veículo"
        footer={<><button onClick={() => setModalOpen(false)} className="btn-secondary">Cancelar</button><button onClick={handleSubmit} className="btn-primary">Registrar</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">Veículo *</label>
            <select className="input" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Selecione...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} — {v.plate}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">Horário Saída *</label>
              <input type="time" className="input" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
            </div>
            <div className="form-group"><label className="label">Condutor</label>
              <input className="input" value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} />
            </div>
          </div>
          <div className="form-group"><label className="label">Motivo</label>
            <input className="input" placeholder="Busca de documentos, manutenção..." value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="form-group"><label className="label">Passageiros</label>
            <input className="input" value={form.passengers} onChange={e => setForm({ ...form, passengers: e.target.value })} />
          </div>
          <div className="form-group"><label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Return modal */}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title="Registrar Retorno"
        footer={<><button onClick={() => setReturnModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleReturn} className="btn-success"><CheckCircle size={16} />Confirmar</button></>}>
        {returnModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="font-mono font-bold text-lg dark:text-white">{returnModal.plate}</p>
              <p className="text-gray-500 dark:text-gray-400">{returnModal.model}</p>
              <p className="text-sm text-gray-400 mt-1">Saiu às {returnModal.departure_time}</p>
            </div>
            <div className="form-group"><label className="label">Horário de Retorno</label>
              <input type="time" className="input" value={returnTime} onChange={e => setReturnTime(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit observations modal (porteiro pode editar) */}
      <Modal open={!!obsModal} onClose={() => setObsModal(null)} title="Editar Observações"
        footer={<><button onClick={() => setObsModal(null)} className="btn-secondary">Cancelar</button><button onClick={handleSaveObs} className="btn-primary">Salvar</button></>}>
        {obsModal && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Veículo: <span className="font-mono font-bold dark:text-white">{obsModal.plate}</span> — {obsModal.model}
            </p>
            <div className="form-group">
              <label className="label">Observações / Passageiros</label>
              <textarea className="input" rows={4}
                placeholder="Passageiros, detalhes da viagem, observações..."
                value={obsText} onChange={e => setObsText(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
