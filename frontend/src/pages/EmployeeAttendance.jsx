import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import { MessageSquare, Eye, MoreVertical, Clock, X } from 'lucide-react'

const TODAY = () => format(new Date(), 'yyyy-MM-dd')

function TimeButton({ value, fieldKey, employeeId, attendanceId, date, onUpdate, disabled }) {
  const { t } = useTranslation('employees')
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
        await api.put(`/employees/attendance/${attendanceId}`, { [fieldKey]: tm })
      } else {
        await api.post('/employees/attendance', { employee_id: employeeId, date, [fieldKey]: tm })
      }
      onUpdate(); setEditing(false)
      toast.success(t('toast_time_registered'))
    } catch (e) { toast.error(e.response?.data?.error || t('error_generic', { ns: 'common' })) }
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
      title={!isToday ? t('tooltip_cant_edit') : ''}
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
  { key: 'entry_time', labelKey: 'column_entry' },
  { key: 'lunch_out_time', labelKey: 'column_lunch_out' },
  { key: 'lunch_return_time', labelKey: 'column_lunch_return' },
  { key: 'exit_time', labelKey: 'column_exit' },
]

function MobileTimeEditor({ open, onClose, row, date, onUpdate }) {
  const { t } = useTranslation('employees')
  const [times, setTimes] = useState({})
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const isToday = date === format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    if (!open || !row) return
    const init = {}
    TIME_FIELDS.forEach(f => { init[f.key] = row[f.key] || '' })
    setTimes(init)
    setNotes(row.notes || '')
    setLoading(false)
  }, [open, row])

  const saveField = async (fieldKey) => {
    setLoading(true)
    try {
      const tm = times[fieldKey] || format(new Date(), 'HH:mm')
      if (row.id) {
        await api.put(`/employees/attendance/${row.id}`, { [fieldKey]: tm })
      } else {
        await api.post('/employees/attendance', { employee_id: row.employee_id, date, [fieldKey]: tm })
      }
      onUpdate()
      toast.success(t('toast_time_registered'))
    } catch (e) { toast.error(e.response?.data?.error || t('error_generic', { ns: 'common' })) }
    finally { setLoading(false) }
  }

  const saveNotes = async () => {
    setLoading(true)
    try {
      if (row.id) {
        await api.put(`/employees/attendance/${row.id}`, { notes })
      } else {
        await api.post('/employees/attendance', { employee_id: row.employee_id, date, notes })
      }
      toast.success(t('toast_notes_saved'))
      onUpdate()
    } catch (e) { toast.error(t('error_generic', { ns: 'common' })) }
    finally { setLoading(false) }
  }

  if (!open || !row) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{row.employee_name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{row.position || row.department || ''}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1 space-y-4">
          {isToday ? (
            TIME_FIELDS.map(f => (
              <div key={f.key} className="flex items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-300 w-28 shrink-0">{t(f.labelKey)}</label>
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    className="input py-1.5 text-sm flex-1"
                    value={times[f.key] || ''}
                    onChange={e => setTimes(ts => ({ ...ts, [f.key]: e.target.value }))}
                  />
                  <button
                    onClick={() => saveField(f.key)}
                    disabled={loading}
                    className="btn-primary btn-sm py-1.5 px-3"
                  >
                    OK
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-2">
              {TIME_FIELDS.map(f => (
                <div key={f.key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-28 shrink-0">{t(f.labelKey)}</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-white">{row[f.key] || '—'}</span>
                </div>
              ))}
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                ⚠️ {t('notes_edit_blocked')}
              </p>
            </div>
          )}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <label className="label">{t('notes', { ns: 'common' })}</label>
            <textarea
              className="input"
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              readOnly={!isToday}
              placeholder={t('notes_placeholder')}
            />
            {isToday && (
              <button onClick={saveNotes} disabled={loading} className="btn-primary btn-sm mt-2">
                {t('mobile_save_note')}
              </button>
            )}
          </div>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button onClick={onClose} className="btn-secondary w-full justify-center">{t('close', { ns: 'common' })}</button>
        </div>
      </div>
    </div>
  )
}

export default function EmployeeAttendance() {
  const { t } = useTranslation('employees')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const [date, setDate] = useState(TODAY())
  const [data, setData] = useState({ present: [], absent: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [notesModal, setNotesModal] = useState(null)
  const [notesText, setNotesText] = useState('')
  const [detail, setDetail] = useState(null)
  const [mobileEditor, setMobileEditor] = useState(null)
  const isToday = date === TODAY()

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/employees/attendance?date=${date}`)
      setData(res.data)
    } catch (e) { toast.error(t('error_loading', { ns: 'common' })) }
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
      toast.success(t('toast_notes_saved'))
      setNotesModal(null); load()
    } catch (e) { toast.error(t('error_generic', { ns: 'common' })) }
  }

  const quickRegister = async (row, fieldKey) => {
    try {
      const tm = format(new Date(), 'HH:mm')
      if (row.id) {
        await api.put(`/employees/attendance/${row.id}`, { [fieldKey]: tm })
      } else {
        await api.post('/employees/attendance', { employee_id: row.employee_id, date, [fieldKey]: tm })
      }
      toast.success(t('toast_time_registered'))
      load()
    } catch (e) { toast.error(e.response?.data?.error || t('error_generic', { ns: 'common' })) }
  }

  const allRows = [...data.present, ...data.absent].filter(r =>
    r.employee_name?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
          {!isToday && (
            <span className="badge-yellow text-xs">{t('read_only_badge')}</span>
          )}
        </div>
      </div>

      {!isToday && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
          ⚠️ <span dangerouslySetInnerHTML={{ __html: t('read_only_warning', { date }) }} />
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <input className="input max-w-xs" placeholder={t('search_placeholder')} value={search} onChange={e => setSearch(e.target.value)} />
        <span className="badge-green self-center">{t('present_count', { count: data.present.length })}</span>
        <span className="badge-gray self-center">{t('absent_count', { count: data.absent.length })}</span>
      </div>

      {/* Desktop: tabela */}
      <div className="hidden md:block table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('column_employee')}</th>
              {TIME_FIELDS.map(f => <th key={f.key}>{t(f.labelKey)}</th>)}
              <th>{t('column_obs')}</th><th>{t('column_status')}</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={8} className="text-center py-8 text-gray-400">{t('loading', { ns: 'common' })}</td></tr>
              : allRows.map(row => {
                const onLunch = row.lunch_out_time && !row.lunch_return_time
                const status = row.exit_time ? <span className="badge-gray">{t('status_left')}</span>
                  : onLunch ? <span className="badge-yellow">{t('status_lunch')}</span>
                  : row.entry_time ? <span className="badge-green">{t('status_present')}</span>
                  : <span className="badge-red">{t('status_absent')}</span>
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
                        title={row.notes || t('tooltip_add_observation')}
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

      {/* Mobile: cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-400">
            <Clock size={24} className="animate-spin mr-2" /> {t('loading', { ns: 'common' })}
          </div>
        ) : allRows.length === 0 ? (
          <div className="text-center py-12 text-gray-400">{t('no_employees_found')}</div>
        ) : (
          allRows.map(row => {
            const onLunch = row.lunch_out_time && !row.lunch_return_time
            const hasExited = !!row.exit_time
            const hasEntered = !!row.entry_time
            const lunchOutButNotReturned = row.lunch_out_time && !row.lunch_return_time
            const lunchDone = row.lunch_return_time

            let statusBadge
            if (hasExited) {
              statusBadge = <span className="badge-gray">{t('status_left')}</span>
            } else if (onLunch) {
              statusBadge = <span className="badge-yellow">{t('status_lunch')}</span>
            } else if (hasEntered) {
              statusBadge = <span className="badge-green">{t('status_present')}</span>
            } else {
              statusBadge = <span className="badge-red">{t('status_absent')}</span>
            }

            return (
              <div key={row.employee_id} className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{row.employee_name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{row.position || row.department || '—'}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {statusBadge}
                    {canEdit && isToday && (
                      <button
                        onClick={() => setMobileEditor(row)}
                        aria-label={t('mobile_aria_edit')}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500"
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {hasEntered && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <Clock size={13} className="text-gray-400" />
                    <span>{t('entered_at', { time: row.entry_time })}</span>
                  </div>
                )}

                {row.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate">
                    {row.notes}
                  </p>
                )}

                {canEdit && isToday && (
                  <div className="flex gap-2 pt-1">
                    {!hasEntered && (
                      <button
                        onClick={() => quickRegister(row, 'entry_time')}
                        className="btn-success w-full justify-center py-2 text-sm"
                      >
                        {t('mobile_register_entry')}
                      </button>
                    )}
                    {hasEntered && !hasExited && !lunchOutButNotReturned && !lunchDone && (
                      <>
                        <button
                          onClick={() => quickRegister(row, 'lunch_out_time')}
                          className="btn-secondary flex-1 justify-center py-2 text-sm"
                        >
                          {t('mobile_lunch_out')}
                        </button>
                        <button
                          onClick={() => quickRegister(row, 'exit_time')}
                          className="btn-danger flex-1 justify-center py-2 text-sm"
                        >
                          {t('mobile_register_exit')}
                        </button>
                      </>
                    )}
                    {lunchOutButNotReturned && (
                      <>
                        <button
                          onClick={() => quickRegister(row, 'lunch_return_time')}
                          className="btn-success flex-1 justify-center py-2 text-sm"
                        >
                          {t('mobile_lunch_return')}
                        </button>
                        <button
                          onClick={() => quickRegister(row, 'exit_time')}
                          className="btn-danger flex-1 justify-center py-2 text-sm"
                        >
                          {t('mobile_register_exit')}
                        </button>
                      </>
                    )}
                    {lunchDone && !hasExited && (
                      <button
                        onClick={() => quickRegister(row, 'exit_time')}
                        className="btn-danger w-full justify-center py-2 text-sm"
                      >
                        {t('mobile_register_exit')}
                      </button>
                    )}
                    {hasExited && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center w-full py-1">
                        {t('mobile_day_complete')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="employee_attendance" record={detail} />

      <MobileTimeEditor
        open={!!mobileEditor}
        onClose={() => setMobileEditor(null)}
        row={mobileEditor}
        date={date}
        onUpdate={load}
      />

      <Modal open={!!notesModal} onClose={() => setNotesModal(null)}
        title={t('notes_modal_title', { name: notesModal?.employee_name })}
        footer={
          <>
            <button onClick={() => setNotesModal(null)} className="btn-secondary">{tc('cancel')}</button>
            {canEdit && isToday && <button onClick={saveNotes} className="btn-primary">{tc('save')}</button>}
          </>
        }>
        <div className="form-group">
          <label className="label">{t('notes_label', { date })}</label>
          <textarea className="input" rows={4}
            placeholder={t('notes_placeholder')}
            value={notesText}
            onChange={e => setNotesText(e.target.value)}
            readOnly={!canEdit || !isToday} />
          {!isToday && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">⚠️ {t('notes_edit_blocked')}</p>}
        </div>
      </Modal>
    </div>
  )
}
