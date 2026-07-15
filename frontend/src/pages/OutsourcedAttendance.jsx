import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import DetailModal from '../components/DetailModal'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Eye } from 'lucide-react'

const TODAY = () => format(new Date(), 'yyyy-MM-dd')

function TimeBtn({ value, fieldKey, workerId, attendanceId, date, onUpdate, disabled }) {
  const { t } = useTranslation('outsourced')
  const { t: tc } = useTranslation('common')
  const [editing, setEditing] = useState(false)
  const [time, setTime] = useState(value || '')
  const [loading, setLoading] = useState(false)
  const isToday = date === TODAY()
  const isDisabled = disabled || !isToday

  const save = async () => {
    setLoading(true)
    try {
      const tm = time || format(new Date(), 'HH:mm')
      if (attendanceId) {
        await api.put(`/outsourced/attendance/${attendanceId}`, { [fieldKey]: tm })
      } else {
        await api.post('/outsourced/attendance', { worker_id: workerId, date, [fieldKey]: tm })
      }
      onUpdate(); setEditing(false)
      toast.success(t('toast_registered'))
    } catch (e) {
      console.error(e)
      toast.error(e.response?.data?.error || t('toast_error_register'))
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
      title={!isToday ? t('tooltip_cant_edit') : ''}
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

const ROLE_LABEL = { jardineiro: 'role_gardener', limpeza: 'role_cleaning' }
const ROLE_BADGE = { jardineiro: 'badge-green', limpeza: 'badge-blue' }

export default function OutsourcedAttendance() {
  const { t } = useTranslation('outsourced')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const [date, setDate] = useState(TODAY())
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)
  const isToday = date === TODAY()
  const [detail, setDetail] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/outsourced/attendance?date=${date}`)
      setData(res.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [date])
  const allRows = [...data.present, ...data.absent]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {!isToday && <span className="badge-yellow text-xs">{t('read_only_badge')}</span>}
        </div>
      </div>

      {!isToday && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ <span dangerouslySetInnerHTML={{ __html: t('read_only_warning', { date }) }} />
        </div>
      )}

      <div className="flex gap-2 text-xs">
        <span className="badge-green">{t('present_count', { count: data.present.length })}</span>
        <span className="badge-gray">{t('absent_count', { count: data.absent.length })}</span>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>{t('column_name')}</th><th>{t('column_role')}</th><th>{t('column_company')}</th><th>{t('column_entry')}</th><th>{t('column_exit')}</th><th>{t('column_status')}</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : allRows.length === 0
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">{t('empty_no_workers')}</td></tr>
              : allRows.map(row => (
                <tr key={row.worker_id}>
                  <td><p className="font-medium dark:text-white">{row.worker_name}</p></td>
                  <td><span className={ROLE_BADGE[row.worker_role] || 'badge-gray'}>{t(ROLE_LABEL[row.worker_role]) || row.worker_role}</span></td>
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
                    {row.exit_time ? <span className="badge-gray">{t('status_left')}</span>
                      : row.entry_time ? <span className="badge-green">{t('status_present')}</span>
                      : <span className="badge-red">{t('status_absent')}</span>}
                  </td>
                  <td>
                    <button onClick={() => setDetail(row)} className="btn-secondary btn-sm" title={tc('view_details')}>
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="outsourced_attendance" record={detail} />
    </div>
  )
}
