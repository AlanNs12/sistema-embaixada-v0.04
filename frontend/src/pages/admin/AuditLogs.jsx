import { useEffect, useState } from 'react'
import api from '../../api'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { ScrollText, RefreshCw } from 'lucide-react'

const ACTION_COLORS = {
  LOGIN: 'badge-blue',
  CREATE: 'badge-green',
  UPDATE: 'badge-yellow',
  UPSERT: 'badge-yellow',
  DELETE: 'badge-red',
}

const ENTITY_LABELS = {
  auth: 'Login',
  user: 'Usuário',
  employee: 'Funcionário',
  employee_attendance: 'Ponto Func.',
  outsourced_worker: 'Terceirizado',
  outsourced_attendance: 'Ponto Terc.',
  vehicle: 'Veículo',
  vehicle_log: 'Log Veículo',
  service_provider: 'Prestador',
  provider_visit: 'Visita Prestador',
  consular_appointment: 'Atend. Consular',
  package: 'Encomenda',
  embassy_info: 'Info Embaixada',
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ user_id: '', page: 1 })

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: 100, ...filters })
      const [logsRes, usersRes] = await Promise.all([
        api.get(`/users/audit-logs?${params}`),
        api.get('/users'),
      ])
      setLogs(logsRes.data)
      setUsers(usersRes.data)
    } catch (e) { toast.error('Erro ao carregar logs') }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Log de Auditoria</h1>
          <p className="text-gray-500 text-sm">Registro de todas as ações do sistema</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm"><RefreshCw size={14} /> Atualizar</button>
      </div>

      <div className="flex gap-3">
        <div>
          <label className="label">Filtrar por usuário</label>
          <select className="input w-48" value={filters.user_id} onChange={e => setFilters({ ...filters, user_id: e.target.value, page: 1 })}>
            <option value="">Todos os usuários</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr><th>Data/Hora</th><th>Usuário</th><th>Ação</th><th>Entidade</th><th>ID</th><th>IP</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Carregando...</td></tr>
              : logs.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">Nenhum log encontrado</td></tr>
              : logs.map(log => (
                <tr key={log.id}>
                  <td className="text-xs font-mono text-gray-500 whitespace-nowrap">
                    {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td>
                    <p className="font-medium text-sm">{log.user_name}</p>
                    <p className="text-xs text-gray-400">{log.email}</p>
                  </td>
                  <td>
                    <span className={ACTION_COLORS[log.action] || 'badge-gray'}>{log.action}</span>
                  </td>
                  <td className="text-sm text-gray-600">{ENTITY_LABELS[log.entity] || log.entity}</td>
                  <td className="text-xs font-mono text-gray-400">{log.entity_id || '—'}</td>
                  <td className="text-xs font-mono text-gray-400">{log.ip_address || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 text-center">Exibindo os últimos 100 registros. Use o filtro por usuário para refinar.</p>
    </div>
  )
}
