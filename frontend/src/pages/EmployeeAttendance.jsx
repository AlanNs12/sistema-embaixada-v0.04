import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import { MessageSquare } from 'lucide-react'

const TODAY = () => format(new Date(), 'yyyy-MM-dd')

function TimeButton({ value, fieldKey, employeeId, attendanceId, date, onUpdate, disabled }) {
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(value || '')
  const [loading, setLoading] = useState(false)

  // Bloqueia edição em datas que não são hoje
  const isToday = date === TODAY()
  const isDisabled = disabled || !isToday

  const save = async () => {
    setLoading(true)
    try {
      const t = time || format(new Date(), 'HH:mm')
      if (attendanceId) {
        await api.put(`/employees/attendance/${attendanceId}`, { [fieldKey]: t })
      } else {
        await api.post('/employees/attendance', { employee_id: employeeId, date, [fieldKey]: t })
      }
      onUpdate(); setEditing(false)
      toast.success('Horário registrado!')
    } catch (e) { toast.error(e.response?.data?.error || 'Erro') }
    finally { setLoading(false) }
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
          : isDisabled
          ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
          : 'border border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-blue-400 hover:text-blue-500'
      }`}
    >
      {value || (isToday ? '—' : '·')}
    </button>
  )
}

const TIME_FIELDS = [
  { key: 'entry_time', label: 'Entrada' },
  { key: 'lunch_out_time', label: 'Saída Almoço' },
  { key: 'lunch_return_time', label: 'Retorno Almoço' },
  { key: 'exit_time', label: 'Saída' },
]

export default function EmployeeAttendance() {
  const { canEdit } = useAuth()
  const [date, setDate] = useState(TODAY())
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notesModal, setNotesModal] = useState(null)
  const [notesText, setNotesText] = useState('')
  const isToday = date === TODAY()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/employees/attendance?date=${date}`)
      setData(res.data)
    } catch (e) { toast.error('Erro ao carregar') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])

  const saveNotes = async () => {
    try {
      if (notesModal.id) {
        await api.put(`/employees/attendance/${notesModal.id}`, { notes: notesText })
      } else {
        await api.post('/employees/attendance', { employee_id: notesModal.employee_id, date, notes: notesText })
      }
      toast.success('Observação salva!')
      setNotesModal(null); load()
    } catch (e) { toast.error('Erro') }
  }

  const allRows = [...data.present, ...data.absent].filter(r =>
    r.employee_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Controle de Funcionários</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Registro de ponto diário</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {!isToday && (
            <span className="badge-yellow text-xs">Somente leitura</span>
          )}
        </div>
      </div>

      {!isToday && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ Visualizando registros de <strong>{date}</strong>. Edições só são permitidas no dia atual.
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder="Buscar funcionário..." value={search} onChange={e => setSearch(e.target.value)} />
        <span className="badge-green self-center">{data.present.length} presentes</span>
        <span className="badge-gray self-center">{data.absent.length} ausentes</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Funcionário</th>
              {TIME_FIELDS.map(f => <th key={f.key}>{f.label}</th>)}
              <th>Obs.</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : allRows.map(row => {
                const onLunch = row.lunch_out_time && !row.lunch_return_time
                const status = row.exit_time ? <span className="badge-gray">Saiu</span>
                  : onLunch ? <span className="badge-yellow">Almoço</span>
                  : row.entry_time ? <span className="badge-green">Presente</span>
                  : <span className="badge-red">Ausente</span>
                return (
                  <tr key={row.employee_id}>
                    <td>
                      <p className="font-medium dark:text-white">{row.employee_name}</p>
                      <p className="text-xs text-gray-400">{row.position || '—'}</p>
                    </td>
                    {TIME_FIELDS.map(({ key }) => (
                      <td key={key}>
                        <TimeButton value={row[key]} fieldKey={key}
                          employeeId={row.employee_id} attendanceId={row.id}
                          date={date} onUpdate={load} disabled={!canEdit} />
                      </td>
                    ))}
                    <td>
                      <button
                        onClick={() => { setNotesModal(row); setNotesText(row.notes || '') }}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${row.notes ? 'text-blue-500' : 'text-gray-300 dark:text-gray-600'}`}
                        title={row.notes || 'Adicionar observação'}
                      >
                        <MessageSquare size={15} />
                      </button>
                    </td>
                    <td>{status}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </div>

      <Modal open={!!notesModal} onClose={() => setNotesModal(null)}
        title={`Observação — ${notesModal?.employee_name}`}
        footer={
          <>
            <button onClick={() => setNotesModal(null)} className="btn-secondary">Cancelar</button>
            {canEdit && isToday && <button onClick={saveNotes} className="btn-primary">Salvar</button>}
          </>
        }>
        <div className="form-group">
          <label className="label">Observação do dia {date}</label>
          <textarea className="input" rows={4}
            placeholder="Atraso, atestado, saída antecipada..."
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            readOnly={!canEdit || !isToday} />
          {!isToday && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ Edição bloqueada para datas anteriores</p>}
        </div>
      </Modal>
    </div>
  )
}
