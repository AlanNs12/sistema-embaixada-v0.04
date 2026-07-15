import { useEffect, useState } from 'react'
import { X, Camera, Loader, Clock, User, Building2, FileText, Calendar } from 'lucide-react'
import api from '../api'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import i18n from '../i18n'

const dateLocale = () => i18n.language === 'en-US' ? enUS : ptBR

const fmtTime = (v) => {
  if (!v) return null
  if (typeof v === 'string' && v.includes('T')) return format(new Date(v), 'HH:mm')
  return String(v).substring(0, 5)
}

const fmtDateTime = (v) => {
  if (!v) return null
  try {
    const isEn = i18n.language === 'en-US'
    const fmt = isEn ? "MM/dd/yyyy 'at' HH:mm" : "dd/MM/yyyy 'às' HH:mm"
    return format(new Date(v), fmt, { locale: dateLocale() })
  } catch { return v }
}

const fmtDate = (v) => {
  if (!v) return null
  try {
    const s = typeof v === 'string' ? v.substring(0, 10) : format(new Date(v), 'yyyy-MM-dd')
    const [y, m, d] = s.split('-')
    if (i18n.language === 'en-US') return `${m}/${d}/${y}`
    return `${d}/${m}/${y}`
  } catch { return v }
}

function InfoRow({ icon: Icon, label, value, mono = false, highlight = false }) {
  if (!value && value !== 0) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-900 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={15} className="text-gray-400 dark:text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm break-words ${mono ? 'font-mono' : 'font-medium'} ${
          highlight ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
        }`}>{value}</p>
      </div>
    </div>
  )
}

function TimelineRow({ label, time, done, color = 'blue' }) {
  const dot = {
    blue:   'bg-blue-500',
    green:  'bg-green-500',
    orange: 'bg-orange-400',
    red:    'bg-red-500',
    gray:   'bg-gray-300 dark:bg-gray-600',
  }
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${done ? dot[color] : dot.gray}`} />
      <span className={`flex-1 text-sm ${done ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-600'}`}>
        {label}
      </span>
      <span className={`text-sm font-mono font-medium ${done ? 'text-gray-900 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>
        {time || '—'}
      </span>
    </div>
  )
}

function DocPhotoSection({ entityType, entityId, imageId }) {
  const { t } = useTranslation('detailModal')
  const { t: tc } = useTranslation('common')
  const [src, setSrc]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    if (!entityId && !imageId) { setLoading(false); return }

    const endpoint = imageId
      ? `/images/id/${imageId}`
      : `/images/${entityType}/${entityId}`

    api.get(endpoint)
      .then(res => setSrc(res.data?.src || null))
      .catch(() => setSrc(null))
      .finally(() => setLoading(false))
  }, [entityType, entityId, imageId])

  if (loading) return (
    <div className="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-900 rounded-xl">
      <Loader size={20} className="animate-spin text-gray-400" />
    </div>
  )

  if (!src) return (
    <div className="flex flex-col items-center justify-center h-32 bg-gray-50 dark:bg-gray-900 rounded-xl gap-2 border-2 border-dashed border-gray-200 dark:border-gray-700">
      <Camera size={24} className="text-gray-300 dark:text-gray-600" />
      <p className="text-xs text-gray-400 dark:text-gray-600">{t('no_document_photo')}</p>
    </div>
  )

  return (
    <>
      <button
        onClick={() => setFullscreen(true)}
        className="w-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 hover:opacity-90 transition-opacity group relative"
      >
        <img src={src} alt={tc('document')} className="w-full h-48 object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-lg">
            {t('enlarge')}
          </span>
        </div>
      </button>

      {fullscreen && (
        <div
          className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
            <img src={src} alt={tc('document')} className="w-full rounded-xl shadow-2xl" />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute -top-3 -right-3 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-full w-9 h-9 flex items-center justify-center shadow-lg"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default function DetailModal({ open, onClose, type, record }) {
  const { t } = useTranslation('detailModal')
  const { t: tc } = useTranslation('common')

  if (!open || !record) return null

  const configs = {
    consular: {
      title: t('title_consular'),
      status: () => record.exit_time
        ? { label: t('status_consular_closed'),      cls: 'badge-gray' }
        : record.entry_time
        ? { label: t('status_consular_attending'), cls: 'badge-blue' }
        : { label: t('status_consular_waiting'),     cls: 'badge-yellow' },
      content: () => (
        <>
          <DocPhotoSection entityType="consular" entityId={record.id} imageId={record.image_id} />
          <div className="mt-4">
            <InfoRow icon={User}      label={t('label_visitor')}         value={record.visitor_name} />
            <InfoRow icon={FileText}  label={t('label_visit_reason')}  value={record.visit_reason} />
            <InfoRow icon={User}      label={t('label_employee')}       value={record.employee_name} />
            <InfoRow icon={Calendar}  label={t('label_date')}              value={fmtDate(record.date)} />
            <InfoRow icon={Clock}     label={t('label_scheduled_time')}  value={fmtTime(record.scheduled_time)} mono />
            <InfoRow icon={FileText}  label={t('label_observations')}       value={record.notes} />
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_times')}</p>
            <TimelineRow label={t('timeline_entry')} time={fmtTime(record.entry_time)} done={!!record.entry_time} color="green" />
            <TimelineRow label={t('timeline_exit')}   time={fmtTime(record.exit_time)}  done={!!record.exit_time}  color="red" />
          </div>
        </>
      ),
    },

    provider_visit: {
      title: t('title_provider_visit'),
      status: () => record.exit_time
        ? { label: t('status_provider_left'),           cls: 'badge-gray' }
        : { label: t('status_provider_inside'),   cls: 'badge-purple' },
      content: () => (
        <>
          <DocPhotoSection entityType="provider_visit" entityId={record.id} imageId={record.image_id} />
          <div className="mt-4">
            <InfoRow icon={User}      label={t('label_name')}             value={record.visitor_name} />
            <InfoRow icon={Building2} label={t('label_company')}          value={record.company} />
            <InfoRow icon={FileText}  label={t('label_reason')}           value={record.reason} />
            <InfoRow icon={User}      label={t('label_employee')}      value={record.employee_name} />
            <InfoRow icon={Calendar}  label={t('label_date')}             value={fmtDate(record.entry_time || record.date)} />
            <InfoRow icon={FileText}  label={t('label_observations')}      value={record.notes} />
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_times')}</p>
            <TimelineRow label={t('timeline_entry')} time={fmtTime(record.entry_time)} done={!!record.entry_time} color="green" />
            <TimelineRow label={t('timeline_exit')}   time={fmtTime(record.exit_time)}  done={!!record.exit_time}  color="red" />
          </div>
        </>
      ),
    },

    visitor: {
      title: t('title_visitor'),
      status: () => record.exit_time
        ? { label: t('status_visitor_left'),         cls: 'badge-gray' }
        : { label: t('status_visitor_inside'), cls: 'badge-green' },
      content: () => (
        <>
          <DocPhotoSection entityType="visitor" entityId={record.id} imageId={record.image_id} />
          <div className="mt-4">
            <InfoRow icon={User}      label={t('label_name')}             value={record.visitor_name} />
            <InfoRow icon={FileText}  label={t('label_document_number')}     value={record.document_number} mono />
            <InfoRow icon={FileText}  label={t('label_reason')}           value={record.reason} />
            <InfoRow icon={User}      label={t('label_employee')}      value={record.employee_name} />
            <InfoRow icon={Calendar}  label={t('label_date')}             value={fmtDate(record.date)} />
            <InfoRow icon={FileText}  label={t('label_observations')}      value={record.notes} />
          </div>
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_times')}</p>
            <TimelineRow label={t('timeline_entry')} time={fmtTime(record.entry_time)} done={!!record.entry_time} color="green" />
            <TimelineRow label={t('timeline_exit')}   time={fmtTime(record.exit_time)}  done={!!record.exit_time}  color="red" />
          </div>
        </>
      ),
    },

    vehicle_log: {
      title: t('title_vehicle_log'),
      status: () => record.return_time
        ? { label: t('status_vehicle_returned'), cls: 'badge-green' }
        : { label: t('status_vehicle_out'),     cls: 'badge-yellow' },
      content: () => (
        <>
          <div className="flex items-center gap-4 p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl mb-4">
            <div>
              <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white tracking-widest">{record.plate}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{record.model}</p>
            </div>
          </div>
          <InfoRow icon={User}     label={t('label_driver')}     value={record.driver} />
          <InfoRow icon={User}     label={t('label_passengers')}  value={record.passengers} />
          <InfoRow icon={FileText} label={t('label_reason')}       value={record.reason} />
          <InfoRow icon={Calendar} label={t('label_date')}         value={fmtDate(record.date)} />
          <InfoRow icon={FileText} label={t('label_observations')}  value={record.observations} />
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_times')}</p>
            <TimelineRow label={t('timeline_departure')}   time={record.departure_time} done={!!record.departure_time} color="orange" />
            <TimelineRow label={t('timeline_return')} time={record.return_time}    done={!!record.return_time}    color="green" />
          </div>
        </>
      ),
    },

    employee_attendance: {
      title: t('title_employee_attendance'),
      status: () => record.exit_time
        ? { label: t('status_employee_left'),    cls: 'badge-gray' }
        : record.lunch_out_time && !record.lunch_return_time
        ? { label: t('status_employee_lunch'),  cls: 'badge-yellow' }
        : record.entry_time
        ? { label: t('status_employee_present'),cls: 'badge-green' }
        : { label: t('status_employee_absent'), cls: 'badge-red' },
      content: () => (
        <>
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{record.employee_name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{record.employee_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{record.position || record.department || '—'}</p>
            </div>
          </div>
          <InfoRow icon={Calendar} label={t('label_date')}        value={fmtDate(record.date)} />
          <InfoRow icon={FileText} label={t('label_observations')} value={record.notes} />
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_timeline')}</p>
            <TimelineRow label={t('timeline_entry')}           time={record.entry_time}         done={!!record.entry_time}        color="green" />
            <TimelineRow label={t('timeline_lunch_out')}   time={record.lunch_out_time}     done={!!record.lunch_out_time}    color="orange" />
            <TimelineRow label={t('timeline_lunch_return')} time={record.lunch_return_time}  done={!!record.lunch_return_time} color="blue" />
            <TimelineRow label={t('timeline_exit')}             time={record.exit_time}          done={!!record.exit_time}         color="red" />
          </div>
        </>
      ),
    },

    outsourced_attendance: {
      title: t('title_outsourced_attendance'),
      status: () => record.exit_time
        ? { label: t('status_outsourced_left'),    cls: 'badge-gray' }
        : record.entry_time
        ? { label: t('status_outsourced_present'),cls: 'badge-green' }
        : { label: t('status_outsourced_absent'), cls: 'badge-red' },
      content: () => (
        <>
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-lg">{record.worker_name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">{record.worker_name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{record.worker_role} · {record.company || '—'}</p>
            </div>
          </div>
          <InfoRow icon={Calendar} label={t('label_date')}        value={fmtDate(record.date)} />
          <InfoRow icon={FileText} label={t('label_observations')} value={record.notes} />
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl space-y-3">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('section_times')}</p>
            <TimelineRow label={t('timeline_entry')} time={record.entry_time} done={!!record.entry_time} color="green" />
            <TimelineRow label={t('timeline_exit')}   time={record.exit_time}  done={!!record.exit_time}  color="red" />
          </div>
        </>
      ),
    },

    package: {
      title: t('title_package'),
      status: () => record.status === 'delivered'
        ? { label: t('status_package_delivered'), cls: 'badge-green' }
        : { label: t('status_package_pending'), cls: 'badge-yellow' },
      content: () => (
        <>
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl mb-4">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-1">{t('label_recipient')}</p>
            <p className="font-bold text-gray-900 dark:text-white text-lg">
              {record.recipient_name || record.recipient_employee_name || t('label_not_informed')}
            </p>
          </div>
          <InfoRow icon={Building2} label={t('label_delivery_company')} value={record.delivery_company} />
          <InfoRow icon={FileText}  label={t('label_tracking_code')}  value={record.tracking_code} mono highlight />
          <InfoRow icon={Calendar}  label={t('label_received_at')}         value={fmtDateTime(record.received_at)} />
          <InfoRow icon={FileText}  label={t('label_observations')}         value={record.notes} />
          {record.status === 'delivered' && (
            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-1">
              <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2">{t('delivery_confirmed')}</p>
              <InfoRow icon={User}     label={t('delivery_delivered_to')} value={record.delivered_to_name || record.delivered_to_employee_name} />
              <InfoRow icon={Calendar} label={t('delivery_delivered_at')}   value={fmtDateTime(record.delivered_at)} />
            </div>
          )}
        </>
      ),
    },
  }

  const cfg = configs[type]
  if (!cfg) return null
  const status = cfg.status()

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{cfg.title}</h2>
              <span className={`${status.cls} mt-1`}>{status.label}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          {cfg.content()}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 shrink-0">
          <button onClick={onClose} className="btn-secondary w-full justify-center">{t('close_button')}</button>
        </div>
      </div>
    </div>
  )
}
