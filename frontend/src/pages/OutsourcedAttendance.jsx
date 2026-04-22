import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

function TimeBtn({ value, fieldKey, workerId, attendanceId, date, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(value || '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      const t = time || format(new Date(), 'HH:mm')
      if (attendanceId) {
        await api.put(`/outsourced/attendance/${attendanceId}`, { [fieldKey]: t })
      } else {
        await api.post('/outsourced/attendance', { worker_id: workerId, date, [fieldKey]: t })
      }
      onUpdate()
      setEditing(false)
      toast.success('Registrado!')
    } catch (e) { toast.error('Erro') }
    finally { setLoading(false) }
  }

  if (editing) return (
    <div className="flex items-center gap-1">
      <input type="time" className="input py-1 px-2 w-28 text-xs" value={time} onChange={e => setTime(e.target.value)} autoFocus />
      <button onClick={save} disabled={loading} className="btn-primary btn-sm py-1">OK</button>
      <button onClick={() => setEditing(false)} className="btn-secondary btn-sm py-1">✕</button>
    </div>
  )

  return (
    <button
      onClick={() => { setTime(value || format(new Date(), 'HH:mm')); setEditing(true) }}
      className={`text-xs px-2 py-1 rounded-md transition-colors ${value ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-mono font-medium' : 'border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'}`}
    >
      {value || '—'}
    </button>
  )
}

const ROLE_LABEL = { jardineiro: 'Jardineiro', limpeza: 'Limpeza' }
const ROLE_BADGE = { jardineiro: 'badge-green', limpeza: 'badge-blue' }

export default function OutsourcedAttendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/outsourced/attendance?date=${date}`)
      setData(res.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])

  const allRows = [...data.present, ...data.absent]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Terceirizados</h1>
          <p className="text-gray-500 text-sm">Jardineiros e equipe de limpeza</p>
        </div>
        <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
      </div>

      <div className="flex gap-2 text-xs">
        <span className="badge-green">{data.present.length} presentes</span>
        <span className="badge-gray">{data.absent.length} ausentes</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Função</th>
              <th>Empresa</th>
              <th>Entrada</th>
              <th>Saída</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            ) : allRows.map((row) => (
              <tr key={row.worker_id}>
                <td><p className="font-medium">{row.worker_name}</p></td>
                <td><span className={ROLE_BADGE[row.worker_role] || 'badge-gray'}>{ROLE_LABEL[row.worker_role] || row.worker_role}</span></td>
                <td className="text-gray-500 text-sm">{row.company || '—'}</td>
                <td>
                  <TimeBtn value={row.entry_time} fieldKey="entry_time" workerId={row.worker_id} attendanceId={row.id} date={date} onUpdate={load} />
                </td>
                <td>
                  <TimeBtn value={row.exit_time} fieldKey="exit_time" workerId={row.worker_id} attendanceId={row.id} date={date} onUpdate={load} />
                </td>
                <td>
                  {row.exit_time ? <span className="badge-gray">Saiu</span>
                    : row.entry_time ? <span className="badge-green">Presente</span>
                    : <span className="badge-red">Ausente</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
