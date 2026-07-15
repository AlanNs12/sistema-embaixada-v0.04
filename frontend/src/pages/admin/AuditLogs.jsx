import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR, enUS } from 'date-fns/locale'
import Modal from '../../components/Modal'
import { RefreshCw, Eye } from 'lucide-react'

const ACTION_COLORS = {
  LOGIN: 'badge-blue', CREATE: 'badge-green',
  UPDATE: 'badge-yellow', UPSERT: 'badge-yellow', DELETE: 'badge-red',
}

// Campos que NÃO devem aparecer nos detalhes (técnicos/irrelevantes)
const HIDDEN_FIELDS = new Set(['created_by', 'updated_at', 'created_at', 'password', 'password_hash', 'document_photo'])

function translateValue(key, value, vehicles, t) {
  if (value === null || value === undefined || value === '') return '\u2014'
  if (key === 'vehicle_id') {
    const v = vehicles.find(v => v.id === parseInt(value))
    return v ? `${v.model} \u2014 ${v.plate}` : `ID ${value}`
  }
  if (key === 'role') return t(`role_${value}`) || value
  if (key === 'active') return t(`bool_${value === true || value === 'true'}`)
  if (key === 'status') return t(`status_${value}`) || value
  if (key === 'action') return t('desc_deliver_action')
  return String(value)
}

function humanDescription(log, t) {
  const action = t(`action_${log.action}`) || log.action
  const entity = t(`entity_${log.entity}`) || log.entity
  try {
    const d = log.details ? JSON.parse(log.details) : {}
    const body = d.body || {}
    switch (log.entity) {
      case 'auth':
        return t('desc_auth')
      case 'employee_attendance': {
        const parts = []
        if (body.entry_time) parts.push(t('desc_time_entry', { time: body.entry_time }))
        if (body.lunch_out_time) parts.push(t('desc_time_lunch_out', { time: body.lunch_out_time }))
        if (body.lunch_return_time) parts.push(t('desc_time_lunch_return', { time: body.lunch_return_time }))
        if (body.exit_time) parts.push(t('desc_time_exit', { time: body.exit_time }))
        if (body.notes) parts.push(t('desc_observation', { text: body.notes }))
        return parts.length ? t('desc_employee_attendance_points', { parts: parts.join(', ') }) : t('desc_employee_attendance_basic')
      }
      case 'outsourced_attendance': {
        const parts = []
        if (body.entry_time) parts.push(t('desc_time_entry', { time: body.entry_time }))
        if (body.exit_time) parts.push(t('desc_time_exit', { time: body.exit_time }))
        return parts.length ? t('desc_outsourced_attendance_points', { parts: parts.join(', ') }) : t('desc_outsourced_attendance_basic')
      }
      case 'vehicle_log': {
        if (body.return_time) return t('desc_vehicle_return', { time: body.return_time })
        if (body.departure_time) return t('desc_vehicle_exit', { time: body.departure_time, reason: body.reason ? t('desc_vehicle_reason', { reason: body.reason }) : '' })
        if (body.observations !== undefined) return t('desc_vehicle_edit_obs')
        return t('desc_default', { action, entity, id: '' })
      }
      case 'vehicle':
        if (body.plate) return t('desc_vehicle_action', { action, detail: t('desc_vehicle_plate_model', { plate: body.plate, model: body.model || '' }) })
        return t('desc_default', { action, entity, id: '' })
      case 'employee':
        return body.name ? t('desc_employee_action', { action, name: body.name }) : t('desc_employee_action_generic', { action })
      case 'user':
        return body.name ? t('desc_user_action', { action, name: body.name, role: body.role ? t('desc_company', { company: t(`role_${body.role}`) || body.role }) : '' }) : t('desc_user_action_generic', { action })
      case 'service_provider':
        return body.name ? t('desc_provider_action', { action, name: body.name }) : t('desc_provider_action_generic', { action })
      case 'provider_visit':
        if (body.exit_time !== undefined) return t('desc_provider_visit_exit')
        return body.visitor_name ? t('desc_provider_visit_entry', { name: body.visitor_name, company: body.company ? t('desc_company', { company: body.company }) : '' }) : t('desc_provider_visit_entry_generic')
      case 'consular_appointment':
        if (body.exit_time !== undefined) return t('desc_consular_exit')
        return body.visitor_name ? t('desc_consular_entry', { name: body.visitor_name }) : t('desc_consular_entry_generic')
      case 'visitor':
        if (body.exit_time !== undefined) return t('desc_visitor_exit')
        return body.visitor_name ? t('desc_visitor_entry', { name: body.visitor_name }) : t('desc_visitor_entry_generic')
      case 'package': {
        if (body.action === 'deliver') return t('desc_package_deliver', { name: body.delivered_to_name || t('desc_recipient_unknown') })
        if (body.delivery_company) return t('desc_package_receive', { company: body.delivery_company, recipient: body.recipient_name ? t('desc_recipient_for', { name: body.recipient_name }) : '' })
        return t('desc_package_edit')
      }
      case 'embassy_info':
        return body.label ? t('desc_embassy_info', { action, label: body.label }) : t('desc_embassy_info_generic', { action })
      default:
        return t('desc_default', { action, entity, id: log.entity_id ? t('desc_with_id', { id: log.entity_id }) : '' })
    }
  } catch {
    return `${action} ${entity}${log.entity_id ? t('desc_with_id', { id: log.entity_id }) : ''}`
  }
}

export default function AuditLogs() {
  const { t, i18n } = useTranslation('audit')
  const { t: tc } = useTranslation('common')

  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '' })
  const [detail, setDetail] = useState(null)

  const locale = i18n.language === 'pt-BR' ? ptBR : enUS
  const dateFormat = i18n.language === 'pt-BR' ? "dd/MM/yyyy 'às' HH:mm" : "MM/dd/yyyy 'at' HH:mm"

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100, ...filters })
      const [logsRes, usersRes, vehiclesRes] = await Promise.all([
        api.get(`/users/audit-logs?${params}`),
        api.get('/users'),
        api.get('/vehicles'),
      ])
      setLogs(logsRes.data)
      setUsers(usersRes.data)
      setVehicles(vehiclesRes.data)
    } catch (e) { toast.error(tc('error_loading')) }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filters])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={14} /> {tc('update')}</button>
      </div>

      <div>
        <label className="label">{t('filter_by_user')}</label>
        <select className="input w-52" value={filters.user_id}
          onChange={e => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">{t('all_users')}</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>{t('column_datetime')}</th>
              <th>{t('column_user')}</th>
              <th>{t('column_action')}</th>
              <th>{t('column_type')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">{tc('loading')}</td></tr>
              : logs.length === 0
              ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">{t('empty_no_records')}</td></tr>
              : logs.map(log => (
                <tr key={log.id}>
                  <td className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale })}
                  </td>
                  <td className="font-medium text-sm dark:text-white">{log.user_name}</td>
                  <td className="text-sm dark:text-gray-200 max-w-xs">{humanDescription(log, t)}</td>
                  <td>
                    <span className={ACTION_COLORS[log.action] || 'badge-gray'}>
                      {t(`entity_${log.entity}`) || log.entity}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setDetail(log)} className="btn-secondary btn-sm">
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 text-center">{t('footer_last_100')}</p>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={t('modal_title')}
        footer={<button onClick={() => setDetail(null)} className="btn-secondary">{tc('close')}</button>}>
        {detail && (() => {
          let bodyData = {}
          try { bodyData = JSON.parse(detail.details || '{}').body || {} } catch {}
          const visibleFields = Object.entries(bodyData).filter(([k, v]) =>
            !HIDDEN_FIELDS.has(k) && v !== null && v !== undefined && v !== ''
          )
          return (
            <div className="space-y-4 text-sm">
              {/* Descrição amigável */}
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl p-4">
                <p className="font-semibold text-blue-900 dark:text-blue-200 text-base mb-1">
                  {humanDescription(detail, t)}
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  {t('modal_by_user_at', {
                    user: detail.user_name,
                    date: format(new Date(detail.created_at), dateFormat, { locale })
                  })}
                </p>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  [t('modal_metadata_type'),  t(`entity_${detail.entity}`) || detail.entity],
                  [t('modal_metadata_action'),  t(`action_${detail.action}`)  || detail.action],
                  [t('modal_metadata_id'),    detail.entity_id || '\u2014'],
                  [t('modal_metadata_ip'),      detail.ip_address || '\u2014'],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{val}</p>
                  </div>
                ))}
              </div>

              {/* Dados da ação — traduzidos */}
              {visibleFields.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {t('modal_section_data')}
                  </p>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {visibleFields.map(([k, v]) => {
                      const fieldKey = `field_${k}`
                      const translatedField = t(fieldKey)
                      return (
                        <div key={k} className="flex gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                          <span className="text-xs text-gray-400 dark:text-gray-500 w-40 shrink-0 capitalize self-center">
                            {translatedField !== fieldKey ? translatedField : k.replace(/_/g, ' ')}
                          </span>
                          <span className="text-sm text-gray-900 dark:text-gray-100 break-all font-medium">
                            {translateValue(k, v, vehicles, t)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
