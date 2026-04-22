import { useEffect, useState } from 'react'
import api from '../api'
import { Users, Car, Package, Truck, UserCog, RefreshCw, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function StatCard({ icon: Icon, label, count, color }) {
  return (
    <div className={`card p-5 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon size={20} className="text-gray-400" />
      </div>
      <p className="text-3xl font-bold text-gray-900">{count}</p>
    </div>
  )
}

const emptyData = {
  employees_inside: [],
  employees_out_today: [],
  vehicles_out: [],
  providers_inside: [],
  consular_inside: [],
  pending_packages: [],
  outsourced_inside: [],
  summary: { employees_in: 0, vehicles_out: 0, providers_inside: 0, pending_packages: 0 },
}

export default function Dashboard() {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get('/dashboard')
      setData(res.data || emptyData)
    } catch (e) {
      console.error('Dashboard error:', e)
      setError(e.response?.data?.error || 'Erro ao carregar dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const now = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm capitalize">{now}</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">Erro ao carregar dados</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            <button onClick={load} className="text-xs text-red-700 underline mt-1">Tentar novamente</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Funcionários na Embaixada" count={data.summary?.employees_in ?? 0} color="border-blue-500" />
        <StatCard icon={Car} label="Veículos na Rua" count={data.summary?.vehicles_out ?? 0} color="border-orange-500" />
        <StatCard icon={Truck} label="Prestadores Dentro" count={data.summary?.providers_inside ?? 0} color="border-purple-500" />
        <StatCard icon={Package} label="Encomendas Pendentes" count={data.summary?.pending_packages ?? 0} color="border-yellow-500" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-600" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Employees inside */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={18} className="text-blue-600" /> Funcionários Presentes
              </h2>
              <span className="badge-blue">{data.employees_inside?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {!data.employees_inside?.length ? (
                <p className="px-6 py-4 text-gray-400 text-sm">Nenhum funcionário no momento</p>
              ) : data.employees_inside.map((e) => (
                <div key={e.id || e.employee_id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.name}</p>
                    <p className="text-xs text-gray-400">{e.position || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-green">Presente</span>
                    <p className="text-xs text-gray-400 mt-1">
                      <Clock size={10} className="inline mr-1" />
                      Entrou {e.entry_time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vehicles out */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Car size={18} className="text-orange-600" /> Veículos na Rua
              </h2>
              <span className="badge-yellow">{data.vehicles_out?.length ?? 0}</span>
            </div>
            <div className="divide-y divide-gray-50">
              {!data.vehicles_out?.length ? (
                <p className="px-6 py-4 text-gray-400 text-sm">Nenhum veículo fora</p>
              ) : data.vehicles_out.map((v) => (
                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{v.model} — <span className="font-mono">{v.plate}</span></p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.reason || 'Sem motivo informado'}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-yellow">Fora</span>
                    <p className="text-xs text-gray-400 mt-1">Saiu {v.departure_time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Providers inside */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Truck size={18} className="text-purple-600" /> Prestadores na Embaixada
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {!data.providers_inside?.length ? (
                <p className="px-6 py-4 text-gray-400 text-sm">Nenhum prestador no momento</p>
              ) : data.providers_inside.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.company || '—'}</p>
                  </div>
                  <span className="badge-blue">Dentro</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pending packages */}
          <div className="card">
            <div className="card-header">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package size={18} className="text-yellow-600" /> Encomendas Pendentes
              </h2>
            </div>
            <div className="divide-y divide-gray-50">
              {!data.pending_packages?.length ? (
                <p className="px-6 py-4 text-gray-400 text-sm">Nenhuma encomenda pendente</p>
              ) : data.pending_packages.map((p) => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{p.recipient_name || p.recipient_employee_name || 'Destinatário não informado'}</p>
                    <p className="text-xs text-gray-400">{p.delivery_company}</p>
                  </div>
                  <span className="badge-yellow">Aguardando</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Outsourced inside */}
      {!!data.outsourced_inside?.length && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCog size={18} className="text-green-600" /> Terceirizados Presentes
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 p-6">
            {data.outsourced_inside.map((w) => (
              <div key={w.id} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <span className="badge-green capitalize">{w.role}</span>
                <span className="text-sm font-medium">{w.name}</span>
                <span className="text-xs text-gray-400">entrou {w.entry_time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
