import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'

const TODAY = () => format(new Date(), 'yyyy-MM-dd')

function TimeBtn({ value, fieldKey, workerId, attendanceId, date, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(value || '')
  const [loading, setLoading] = useState(false)
  const isToday = date === TODAY()
  const isDisabled = disabled || !isToday

  const save = async () => {
    setLoading(true)
    try {
      const t = time || format(new Date(), 'HH:mm')
      if (attendanceId) {
        await api.put(`/outsourced/attendance/${attendanceId}`, { [fieldKey]: t })
      } else {
        await api.post('/outsourced/attendance', { worker_id: workerId, date, [fieldKey]: t })
      }
      onUpdate(); setEditing(false)
      toast.success('Registrado!')
    } catch (e) {
      console.error(e)
      toast.error(e.response?.data?.error || 'Erro ao registrar')
    } finally { setLoading(false) }
  }

  if (editing) return (
    <div className="flex items-center gap-1">
      <input type="time" className="input py-1 px-2 w-28 text-xs" value={time}
        onChange={e => setTime(e.target.value)} autoFocus />
      <button onClick={save} disabled={loading} className="btn-primary btn-sm py-1">OK</button>
      <button onClick={() => setEditing(false)} className="btn-secondary btn-sm py-1">✕</button>
    </div>
  )

  return (
    <button disabled={isDisabled}
      title={!isToday ? 'Só é possível editar o ponto do dia atual' : ''}
      onClick={() => { setTime(value || format(new Date(), 'HH:mm')); setEditing(true) }}
      className={`text-xs px-2 py-1 rounded-md transition-colors ${
        value
          ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 font-mono font-medium'
          : isDisabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : 'border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-500'
      }`}
    >
      {value || (isToday ? '—' : '·')}
    </button>
  )
}

const ROLE_LABEL = { jardineiro: 'Jardineiro', limpeza: 'Limpeza' }
const ROLE_BADGE = { jardineiro: 'badge-green', limpeza: 'badge-blue' }

export default function OutsourcedAttendance() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(TODAY())
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)
  const isToday = date === TODAY()

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Terceirizados</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Jardineiros e equipe de limpeza</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {!isToday && <span className="badge-yellow text-xs">Somente leitura</span>}
        </div>
      </div>

      {!isToday && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ Visualizando <strong>{date}</strong>. Edições só são permitidas no dia atual.
        </div>
      )}

      <div className="flex gap-2 text-xs">
        <span className="badge-green">{data.present.length} presentes</span>
        <span className="badge-gray">{data.absent.length} ausentes</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Nome</th><th>Função</th><th>Empresa</th><th>Entrada</th><th>Saída</th><th>Status</th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : allRows.length === 0
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum terceirizado cadastrado</td></tr>
              : allRows.map(row => (
                <tr key={row.worker_id}>
                  <td><p className="font-medium dark:text-white">{row.worker_name}</p></td>
                  <td><span className={ROLE_BADGE[row.worker_role] || 'badge-gray'}>{ROLE_LABEL[row.worker_role] || row.worker_role}</span></td>
                  <td className="text-gray-500 dark:text-gray-400 text-sm">{row.company || '—'}</td>
                  <td>
                    <TimeBtn value={row.entry_time} fieldKey="entry_time"
                      workerId={row.worker_id} attendanceId={row.id}
                      date={date} onUpdate={load} disabled={!canEdit} />
                  </td>
                  <td>
                    <TimeBtn value={row.exit_time} fieldKey="exit_time"
                      workerId={row.worker_id} attendanceId={row.id}
                      date={date} onUpdate={load} disabled={!canEdit || !row.entry_time} />
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
