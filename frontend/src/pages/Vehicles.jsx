import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import Modal from '../components/Modal'
import DetailModal from '../components/DetailModal'
import { useAuth } from '../contexts/AuthContext'
import { Car, Plus, CheckCircle, Pencil, Eye } from 'lucide-react'

function toDateStr(v) {
  if (!v) return ''
  if (typeof v === 'string') return v.substring(0, 10)
  return new Date(v).toISOString().substring(0, 10)
}

function fmtVehicleTime(time, thisDate, refDate, dateLocale) {
  if (!time) return null
  const tStr = String(time).substring(0, 5)
  const d1 = toDateStr(thisDate)
  const d2 = toDateStr(refDate)
  if (d1 && d2 && d1 !== d2) {
    const formattedDate = format(new Date(d1 + 'T00:00:00'), 'dd/MM', { locale: dateLocale })
    return `${formattedDate} ${tStr}`
  }
  return tStr
}

export default function Vehicles() {
  const { t, i18n } = useTranslation('vehicles')
  const { t: tc } = useTranslation('common')
  const { canEdit } = useAuth()
  const dateLocale = i18n.language === 'en-US' ? enUS : ptBR
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState({ logs: [], vehicles_out: [] })
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [returnModal, setReturnModal] = useState(null)
  const [obsModal, setObsModal] = useState(null)
  const [detail, setDetail] = useState(null)
  const [obsText, setObsText] = useState('')
  const [form, setForm] = useState({ vehicle_id: '', departure_time: format(new Date(), 'HH:mm'), driver: '', passengers: '', reason: '', observations: '' })
  const [returnTime, setReturnTime] = useState(format(new Date(), 'HH:mm'))
  const [returnDate, setReturnDate] = useState(format(new Date(), 'yyyy-MM-dd'))

  const load = async () => {
    setLoading(true)
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        api.get(`/vehicles/logs?date=${date}`),
        api.get('/vehicles'),
      ])
      setData(logsRes.data)
      setVehicles(vehiclesRes.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [date])

  const handleSubmit = async () => {
    if (!form.vehicle_id || !form.departure_time) return toast.error(t('toast_required_fields'))
    const outIds = new Set(data.vehicles_out.map(v => String(v.vehicle_id)))
    if (outIds.has(String(form.vehicle_id)))
      return toast.error(t('toast_vehicle_open'))
    try {
      await api.post('/vehicles/logs', { ...form, date })
      toast.success(t('toast_exit_registered'))
      setModalOpen(false)
      setForm({ vehicle_id: '', departure_time: format(new Date(), 'HH:mm'), driver: '', passengers: '', reason: '', observations: '' })
      load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  const handleReturn = async () => {
    if (returnTime) {
      const depDateStr = returnModal.date instanceof Date
        ? returnModal.date.toISOString().split('T')[0]
        : String(returnModal.date).substring(0, 10)
      const depTimeStr = String(returnModal.departure_time).substring(0, 5)
      const retDateStr = returnDate || format(new Date(), 'yyyy-MM-dd')
      const departureMs = new Date(`${depDateStr}T${depTimeStr}:00`).getTime()
      const returnMs    = new Date(`${retDateStr}T${returnTime}:00`).getTime()
      if (returnMs < departureMs)
        return toast.error(t('validation_return_before'))
    }
    try {
      await api.put(`/vehicles/logs/${returnModal.id}`, { return_time: returnTime, return_date: returnDate })
      toast.success(t('toast_return_registered')); setReturnModal(null); setReturnTime(format(new Date(), 'HH:mm')); setReturnDate(format(new Date(), 'yyyy-MM-dd')); load()
    } catch (e) { toast.error(e.response?.data?.error || tc('error_generic')) }
  }

  const handleSaveObs = async () => {
    try {
      await api.put(`/vehicles/logs/${obsModal.id}`, { observations: obsText })
      toast.success(t('toast_obs_saved')); setObsModal(null); load()
    } catch (e) { toast.error(tc('error_generic')) }
  }

  const openDepartureModal = () => {
    setForm(f => ({ ...f, departure_time: format(new Date(), 'HH:mm') }))
    setModalOpen(true)
  }

  const openReturnModal = (v) => {
    setReturnModal(v)
    setReturnTime(format(new Date(), 'HH:mm'))
    setReturnDate(format(new Date(), 'yyyy-MM-dd'))
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <input type="date" className="input w-auto" value={date} onChange={e => setDate(e.target.value)} />
{canEdit && (
  <button
    onClick={openDepartureModal}
    disabled={loading}
    className="btn-primary"
  >
    <Plus size={16} />
    {t('register_exit')}
  </button>
)}
        </div>
      </div>

      {data.vehicles_out.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <p className="text-sm font-medium text-orange-800 dark:text-orange-300 mb-2 flex items-center gap-2">
            <Car size={16} /> {t('vehicles_out_now', { count: data.vehicles_out.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            {data.vehicles_out.map(v => {
              const today = format(new Date(), 'yyyy-MM-dd')
              const vDateStr = toDateStr(v.date)
              const depTime = String(v.departure_time).substring(0, 5)
              const saiu = vDateStr !== today
                ? format(new Date(vDateStr + 'T00:00:00'), 'dd/MM', { locale: dateLocale }) + ' ' + depTime
                : t('today_at', { time: depTime })
              return (
                <button key={v.id}
                  onClick={() => canEdit && openReturnModal(v)}
                  className="bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700 rounded-lg px-3 py-1.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/30 flex items-center gap-2">
                  <span className="font-mono font-bold dark:text-white">{v.plate}</span>
                  <span className="text-gray-500 dark:text-gray-400">{v.model}</span>
                  <span className="text-xs text-orange-600">{t('saiu_at', { value: saiu })}</span>
                  {canEdit && <span className="badge-yellow">{t('register_return')}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>{t('column_vehicle')}</th><th>{t('column_exit')}</th><th>{t('column_return')}</th><th>{t('column_driver')}</th><th>{t('column_reason')}</th><th>{t('column_passengers_obs')}</th><th>{t('column_actions')}</th><th>{t('column_status')}</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={9} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : data.logs.length === 0
              ? <tr><td colSpan={9} className="text-center py-8 text-gray-400">{t('empty_no_records')}</td></tr>
              : data.logs.map(log => {
                  const multiDay = log.return_date && toDateStr(log.return_date) !== toDateStr(log.date)
                  const departureStr = fmtVehicleTime(log.departure_time, log.date, multiDay ? log.return_date : null, dateLocale)
                  const returnStr = fmtVehicleTime(log.return_time, log.return_date || log.date, multiDay ? log.date : null, dateLocale)
                  return (
                    <tr key={log.id}>
                      <td><p className="font-mono font-bold dark:text-white">{log.plate}</p><p className="text-xs text-gray-400">{log.model}</p></td>
                      <td className={`font-mono text-sm${multiDay ? ' text-orange-600 dark:text-orange-400' : ''}`}>{departureStr}</td>
                      <td className={`font-mono text-sm${multiDay ? ' text-orange-600 dark:text-orange-400' : ''}`}>
                        {returnStr || <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-sm">{log.driver || '—'}</td>
                      <td className="text-sm max-w-[120px] truncate">{log.reason || '—'}</td>
                      <td className="text-sm max-w-[120px] truncate text-gray-500 dark:text-gray-400">{log.observations || log.passengers || '—'}</td>
                      <td>
                        {canEdit && (
                          <button onClick={() => { setObsModal(log); setObsText(log.observations || '') }}
                            className="btn-secondary btn-sm"><Pencil size={12} /> Obs.</button>
                        )}
                      </td>
                      <td></td>
                      <td>
                        <button onClick={() => setDetail(log)} className="btn-secondary btn-sm" title={tc('view_details')}><Eye size={13} /></button>
                      </td>
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {/* New departure modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setForm(f => ({ ...f, departure_time: format(new Date(), 'HH:mm') })) }} title={t('modal_exit_title')}
        footer={<><button onClick={() => { setModalOpen(false); setForm(f => ({ ...f, departure_time: format(new Date(), 'HH:mm') })) }} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSubmit} className="btn-primary">{tc('register')}</button></>}>
        <div className="space-y-4">
          <div className="form-group">
            <label className="label">{t('field_vehicle_required')}</label>
            <select className="input" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">{tc('select_option')}</option>
              {vehicles.map(v => {
                const isOut = data.vehicles_out.some(o => String(o.vehicle_id) === String(v.id))
                return (
                  <option key={v.id} value={v.id} disabled={isOut}>
                    {v.model} — {v.plate}{isOut ? t('option_out_waiting') : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group"><label className="label">{t('field_exit_time_required')}</label>
              <input type="time" className="input" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} />
            </div>
            <div className="form-group"><label className="label">{t('field_driver')}</label>
              <input className="input" value={form.driver} onChange={e => setForm({ ...form, driver: e.target.value })} />
            </div>
          </div>
          <div className="form-group"><label className="label">{t('field_reason')}</label>
            <input className="input" placeholder={t('placeholder_reason')} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="form-group"><label className="label">{t('field_passengers')}</label>
            <input className="input" value={form.passengers} onChange={e => setForm({ ...form, passengers: e.target.value })} />
          </div>
          <div className="form-group"><label className="label">{t('field_observations')}</label>
            <textarea className="input" rows={2} value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* Return modal */}
      <Modal open={!!returnModal} onClose={() => setReturnModal(null)} title={t('modal_return_title')}
        footer={<><button onClick={() => setReturnModal(null)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleReturn} className="btn-success"><CheckCircle size={16} />{tc('confirm')}</button></>}>
        {returnModal && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <p className="font-mono font-bold text-lg dark:text-white">{returnModal.plate}</p>
              <p className="text-gray-500 dark:text-gray-400">{returnModal.model}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('left_at', {
                  date: format(new Date(toDateStr(returnModal.date) + 'T00:00:00'), 'dd/MM/yyyy', { locale: dateLocale }),
                  time: String(returnModal.departure_time).substring(0, 5)
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group"><label className="label">{t('field_return_date')}</label>
                <input type="date" className="input" value={returnDate} onChange={e => setReturnDate(e.target.value)} />
              </div>
              <div className="form-group"><label className="label">{t('field_return_time')}</label>
                <input type="time" className="input" value={returnTime} onChange={e => setReturnTime(e.target.value)} />
              </div>
            </div>
            {(() => {
              if (!returnTime) return null
              const depDateStr = returnModal.date instanceof Date
                ? returnModal.date.toISOString().split('T')[0]
                : String(returnModal.date).substring(0, 10)
              const depTimeStr = String(returnModal.departure_time).substring(0, 5)
              const retDateStr = returnDate || format(new Date(), 'yyyy-MM-dd')
              const invalid = new Date(`${retDateStr}T${returnTime}:00`) < new Date(`${depDateStr}T${depTimeStr}:00`)
              if (!invalid) return null
              return (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {t('validation_return_before_detail', {
                    date: format(new Date(depDateStr + 'T00:00:00'), 'dd/MM/yyyy', { locale: dateLocale }),
                    time: depTimeStr
                  })}
                </p>
              )
            })()}
          </div>
        )}
      </Modal>

      <DetailModal open={!!detail} onClose={() => setDetail(null)} type="vehicle_log" record={detail} />

      {/* Edit observations modal */}
      <Modal open={!!obsModal} onClose={() => setObsModal(null)} title={t('modal_obs_title')}
        footer={<><button onClick={() => setObsModal(null)} className="btn-secondary">{tc('cancel')}</button><button onClick={handleSaveObs} className="btn-primary">{tc('save')}</button></>}>
        {obsModal && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('label_vehicle', { plate: obsModal.plate, model: obsModal.model })}
            </p>
            <div className="form-group">
              <label className="label">{t('field_obs_passengers')}</label>
              <textarea className="input" rows={4}
                placeholder={t('placeholder_obs')}
                value={obsText} onChange={e => setObsText(e.target.value)} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
