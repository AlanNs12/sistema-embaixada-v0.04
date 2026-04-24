import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import Modal from '../../components/Modal'
import { RefreshCw, Eye } from 'lucide-react'

const ACTION_COLORS = {
  LOGIN: 'badge-blue', CREATE: 'badge-green',
  UPDATE: 'badge-yellow', UPSERT: 'badge-yellow', DELETE: 'badge-red',
}

const ENTITY_PT = {
  auth: 'Login', user: 'Usuário', employee: 'Funcionário',
  employee_attendance: 'Ponto Funcionário', outsourced_worker: 'Terceirizado',
  outsourced_attendance: 'Ponto Terceirizado', vehicle: 'Veículo',
  vehicle_log: 'Saída de Veículo', service_provider: 'Prestador Cadastrado',
  provider_visit: 'Visita de Prestador', consular_appointment: 'Atend. Consular',
  package: 'Encomenda', embassy_info: 'Info Embaixada', visitor: 'Visitante',
}
const ACTION_PT = { LOGIN: 'Entrou no sistema', CREATE: 'Criou', UPDATE: 'Editou', UPSERT: 'Registrou', DELETE: 'Removeu' }

// Traduz nomes de campos técnicos para português amigável
const FIELD_PT = {
  vehicle_id: 'Veículo (ID)',
  employee_id: 'Funcionário (ID)',
  worker_id: 'Terceirizado (ID)',
  provider_id: 'Prestador (ID)',
  created_by: 'Registrado por (ID)',
  delivered_to_id: 'Entregue a (ID)',
  recipient_employee_id: 'Destinatário (ID)',
  departure_time: 'Horário de Saída',
  return_time: 'Horário de Retorno',
  entry_time: 'Horário de Entrada',
  exit_time: 'Horário de Saída',
  lunch_out_time: 'Saída para Almoço',
  lunch_return_time: 'Retorno do Almoço',
  visitor_name: 'Nome do Visitante',
  visit_reason: 'Motivo da Visita',
  delivery_company: 'Empresa Entregadora',
  tracking_code: 'Código de Rastreio',
  recipient_name: 'Nome do Destinatário',
  delivered_to_name: 'Entregue para',
  delivered_at: 'Data de Entrega',
  document_number: 'Número do Documento',
  scheduled_time: 'Horário Agendado',
  observations: 'Observações',
  passengers: 'Passageiros',
  driver: 'Condutor',
  reason: 'Motivo',
  notes: 'Observações',
  date: 'Data',
  name: 'Nome',
  email: 'Email',
  role: 'Perfil',
  active: 'Ativo',
  plate: 'Placa',
  model: 'Modelo',
  company: 'Empresa',
  category: 'Categoria',
  label: 'Rótulo',
  value: 'Valor',
  description: 'Descrição',
  position: 'Cargo',
  department: 'Setor',
  phone: 'Telefone',
  action: 'Ação',
  status: 'Status',
}

const ROLE_PT = { super_admin: 'Super Admin', admin: 'Admin', porteiro: 'Porteiro', viewer: 'Visualizador' }
const BOOL_PT = { true: 'Sim', false: 'Não' }

function translateValue(key, value, vehicles) {
  if (value === null || value === undefined || value === '') return '—'
  if (key === 'vehicle_id') {
    const v = vehicles.find(v => v.id === parseInt(value))
    return v ? `${v.model} — ${v.plate}` : `ID ${value}`
  }
  if (key === 'role') return ROLE_PT[value] || value
  if (key === 'active') return value === true || value === 'true' ? 'Sim' : 'Não'
  if (key === 'status') return value === 'delivered' ? 'Entregue' : value === 'pending' ? 'Pendente' : value
  if (key === 'action') return value === 'deliver' ? 'Registrar entrega' : value
  return String(value)
}

function humanDescription(log) {
  const action = ACTION_PT[log.action] || log.action
  const entity = ENTITY_PT[log.entity] || log.entity
  try {
    const d = log.details ? JSON.parse(log.details) : {}
    const body = d.body || {}
    switch (log.entity) {
      case 'auth': return 'Entrou no sistema'
      case 'employee_attendance': {
        const parts = []
        if (body.entry_time)         parts.push(`entrada às ${body.entry_time}`)
        if (body.lunch_out_time)     parts.push(`saída almoço às ${body.lunch_out_time}`)
        if (body.lunch_return_time)  parts.push(`retorno almoço às ${body.lunch_return_time}`)
        if (body.exit_time)          parts.push(`saída às ${body.exit_time}`)
        if (body.notes)              parts.push(`observação: "${body.notes}"`)
        return parts.length ? `Registrou ponto: ${parts.join(', ')}` : 'Registrou ponto de funcionário'
      }
      case 'outsourced_attendance': {
        const parts = []
        if (body.entry_time) parts.push(`entrada às ${body.entry_time}`)
        if (body.exit_time)  parts.push(`saída às ${body.exit_time}`)
        return parts.length ? `Registrou ponto de terceirizado: ${parts.join(', ')}` : 'Registrou ponto de terceirizado'
      }
      case 'vehicle_log': {
        if (body.return_time) return `Registrou retorno do veículo às ${body.return_time}`
        if (body.departure_time) return `Registrou saída de veículo às ${body.departure_time}${body.reason ? ` — motivo: ${body.reason}` : ''}`
        if (body.observations !== undefined) return 'Editou observações da saída de veículo'
        return `${action} saída de veículo`
      }
      case 'vehicle':          return body.plate ? `${action} veículo ${body.plate}${body.model ? ` (${body.model})` : ''}` : `${action} veículo`
      case 'employee':         return body.name ? `${action} funcionário: ${body.name}` : `${action} funcionário`
      case 'user':             return body.name ? `${action} usuário: ${body.name}${body.role ? ` (${ROLE_PT[body.role] || body.role})` : ''}` : `${action} usuário`
      case 'service_provider': return body.name ? `${action} prestador: ${body.name}` : `${action} prestador`
      case 'provider_visit':   return body.exit_time !== undefined ? 'Registrou saída de prestador' : body.visitor_name ? `Registrou entrada de prestador: ${body.visitor_name}${body.company ? ` (${body.company})` : ''}` : 'Registrou entrada de prestador'
      case 'consular_appointment': return body.exit_time !== undefined ? 'Registrou saída de atendimento consular' : body.visitor_name ? `Registrou atendimento consular de: ${body.visitor_name}` : 'Registrou atendimento consular'
      case 'visitor':          return body.exit_time !== undefined ? 'Registrou saída de visitante' : body.visitor_name ? `Registrou entrada de visitante: ${body.visitor_name}` : 'Registrou entrada de visitante'
      case 'package': {
        if (body.action === 'deliver') return `Registrou entrega de encomenda para: ${body.delivered_to_name || 'destinatário'}`
        if (body.delivery_company)     return `Registrou encomenda de: ${body.delivery_company}${body.recipient_name ? ` para ${body.recipient_name}` : ''}`
        return 'Editou encomenda'
      }
      case 'embassy_info': return body.label ? `${action} informação: ${body.label}` : `${action} informação da embaixada`
      default:             return `${action} ${entity}${log.entity_id ? ` #${log.entity_id}` : ''}`
    }
  } catch { return `${action} ${entity}` }
}

// Campos que NÃO devem aparecer nos detalhes (técnicos/irrelevantes)
const HIDDEN_FIELDS = new Set(['created_by', 'updated_at', 'created_at', 'password', 'password_hash', 'document_photo'])

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '' })
  const [detail, setDetail] = useState(null)

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
    } catch (e) { toast.error('Erro ao carregar logs') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [filters])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Log de Ações</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Histórico de todas as ações realizadas</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={14} /> Atualizar</button>
      </div>

      <div>
        <label className="label">Filtrar por usuário</label>
        <select className="input w-52" value={filters.user_id}
          onChange={e => setFilters({ ...filters, user_id: e.target.value })}>
          <option value="">Todos os usuários</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Data/Hora</th><th>Usuário</th><th>O que foi feito</th><th>Tipo</th><th></th></tr>
          </thead>
          <tbody>
            {loading
              ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : logs.length === 0
              ? <tr><td colSpan={5} className="text-center py-8 text-gray-400">Nenhum registro</td></tr>
              : logs.map(log => (
                <tr key={log.id}>
                  <td className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap font-mono">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </td>
                  <td className="font-medium text-sm dark:text-white">{log.user_name}</td>
                  <td className="text-sm dark:text-gray-200 max-w-xs">{humanDescription(log)}</td>
                  <td>
                    <span className={ACTION_COLORS[log.action] || 'badge-gray'}>
                      {ENTITY_PT[log.entity] || log.entity}
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
      <p className="text-xs text-gray-400 text-center">Últimos 100 registros</p>

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Detalhes da Ação"
        footer={<button onClick={() => setDetail(null)} className="btn-secondary">Fechar</button>}>
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
                  {humanDescription(detail)}
                </p>
                <p className="text-blue-600 dark:text-blue-400 text-xs">
                  Por <strong>{detail.user_name}</strong> em {format(new Date(detail.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Tipo de registro',  ENTITY_PT[detail.entity] || detail.entity],
                  ['Ação realizada',    ACTION_PT[detail.action]  || detail.action],
                  ['ID do registro',    detail.entity_id || '—'],
                  ['IP de acesso',      detail.ip_address || '—'],
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
                    Dados registrados
                  </p>
                  <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {visibleFields.map(([k, v]) => (
                      <div key={k} className="flex gap-3 px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50">
                        <span className="text-xs text-gray-400 dark:text-gray-500 w-40 shrink-0 capitalize self-center">
                          {FIELD_PT[k] || k.replace(/_/g, ' ')}
                        </span>
                        <span className="text-sm text-gray-900 dark:text-gray-100 break-all font-medium">
                          {translateValue(k, v, vehicles)}
                        </span>
                      </div>
                    ))}
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
