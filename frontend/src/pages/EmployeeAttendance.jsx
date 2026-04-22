import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { Clock, UserCheck, Coffee, LogOut, ChevronDown } from 'lucide-react'

const TIME_FIELDS = [
  { key: 'entry_time', label: 'Entrada', icon: UserCheck, color: 'text-green-600' },
  { key: 'lunch_out_time', label: 'Saída Almoço', icon: Coffee, color: 'text-orange-500' },
  { key: 'lunch_return_time', label: 'Retorno Almoço', icon: Coffee, color: 'text-blue-500' },
  { key: 'exit_time', label: 'Saída', icon: LogOut, color: 'text-red-500' },
]

function TimeButton({ value, fieldKey, employeeId, attendanceId, date, onUpdate }) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(value || '')
  const [loading, setLoading] = useState(false)

  const save = async () => {
    setLoading(true)
    try {
      const now = format(new Date(), 'HH:mm')
      const t = time || now
      if (attendanceId) {
        await api.put(`/employees/attendance/${attendanceId}`, { [fieldKey]: t })
      } else {
        await api.post('/employees/attendance', {
          employee_id: employeeId, date, [fieldKey]: t,
        })
      }
      onUpdate()
      setEditing(false)
      toast.success('Horário registrado!')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erro')
    } finally {
      setLoading(false)
    }
  }

  if (editing) return (
    <div className="flex items-center gap-1">
      <input
        type="time"
        className="input py-1 px-2 w-28 text-xs"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        autoFocus
      />
      <button onClick={save} disabled={loading} className="btn-primary btn-sm py-1">OK</button>
      <button onClick={() => setEditing(false)} className="btn-secondary btn-sm py-1">✕</button>
    </div>
  )

  return (
    <button
      onClick={() => { setTime(value || format(new Date(), 'HH:mm')); setEditing(true) }}
      className={`text-xs px-2 py-1 rounded-md transition-colors ${
        value
          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 font-mono font-medium'
          : 'border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500'
      }`}
    >
      {value || '—'}
    </button>
  )
}

export default function EmployeeAttendance() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/employees/attendance?date=${date}`)
      setData(res.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])

  const allRows = [...data.present, ...data.absent].filter((r) =>
    r.employee_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Funcionários</h1>
          <p className="text-gray-500 text-sm">Registro de ponto diário</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input w-auto" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div className="flex gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar funcionário..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex gap-2 text-xs">
          <span className="badge-green">{data.present.length} presentes</span>
          <span className="badge-gray">{data.absent.length} ausentes</span>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Funcionário</th>
              <th>Entrada</th>
              <th>Saída Almoço</th>
              <th>Retorno Almoço</th>
              <th>Saída</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
            ) : allRows.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum funcionário encontrado</td></tr>
            ) : allRows.map((row) => {
              const hasEntry = !!row.entry_time
              const hasExit = !!row.exit_time
              const onLunch = row.lunch_out_time && !row.lunch_return_time

              const status = hasExit
                ? <span className="badge-gray">Saiu</span>
                : onLunch
                ? <span className="badge-yellow">Almoço</span>
                : hasEntry
                ? <span className="badge-green">Presente</span>
                : <span className="badge-red">Ausente</span>

              return (
                <tr key={row.employee_id}>
                  <td>
                    <div>
                      <p className="font-medium">{row.employee_name}</p>
                      <p className="text-xs text-gray-400">{row.position || '—'}</p>
                    </div>
                  </td>
                  {TIME_FIELDS.map(({ key }) => (
                    <td key={key}>
                      <TimeButton
                        value={row[key]}
                        fieldKey={key}
                        employeeId={row.employee_id}
                        attendanceId={row.id}
                        date={date}
                        onUpdate={load}
                      />
                    </td>
                  ))}
                  <td>{status}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
