import { useEffect, useState } from 'react'
import api from '../api'
import { Users, Car, Package, Truck, UserCog, RefreshCw, Clock, AlertCircle, ChevronDown, ChevronUp, UserCheck } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const emptyData = {
  employees_inside: [], employees_out_today: [], vehicles_out: [],
  providers_inside: [], consular_inside: [], pending_packages: [],
  outsourced_inside: [], visitors_inside: [],
  summary: { employees_in: 0, vehicles_out: 0, providers_inside: 0, pending_packages: 0 },
}

function CollapsibleCard({ title, icon: Icon, iconColor, badge, badgeClass = 'badge-blue', defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="card">
      <button className="card-header w-full text-left" onClick={() => setOpen(o => !o)}>
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Icon size={18} className={iconColor} /> {title}
        </h2>
        <div className="flex items-center gap-2">
          <span className={badgeClass}>{badge}</span>
          {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </button>
      {open && <div className="divide-y divide-gray-50 dark:divide-gray-700">{children}</div>}
    </div>
  )
}

function EmptyRow({ msg }) {
  return <p className="px-6 py-4 text-gray-400 text-sm">{msg}</p>
}

export default function Dashboard() {
  const [data, setData] = useState(emptyData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true); setError(null)
    try {
      const res = await api.get('/dashboard')
      setData({ ...emptyData, ...res.data, summary: { ...emptyData.summary, ...res.data.summary } })
    } catch (e) {
      setError(e.response?.data?.error || 'Erro ao carregar dashboard')
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const now = format(new Date(), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">{now}</p>
        </div>
        <button onClick={load} className="btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">Erro ao carregar dados</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">{error}</p>
            <button onClick={load} className="text-xs text-red-700 dark:text-red-400 underline mt-1">Tentar novamente</button>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users,     label: 'Funcionários Presentes', count: data.summary.employees_in,    border: 'border-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   ic: 'text-blue-600' },
          { icon: Car,       label: 'Veículos na Rua',        count: data.summary.vehicles_out,    border: 'border-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20',ic: 'text-orange-500' },
          { icon: Truck,     label: 'Prestadores Dentro',     count: data.summary.providers_inside,border: 'border-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20',ic: 'text-purple-600' },
          { icon: Package,   label: 'Encomendas Pendentes',   count: data.summary.pending_packages,border: 'border-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20',ic: 'text-yellow-600' },
        ].map(({ icon: Icon, label, count, border, bg, ic }) => (
          <div key={label} className={`card p-5 border-l-4 ${border}`}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-tight">{label}</p>
              <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={18} className={ic} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{count}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <RefreshCw className="animate-spin text-blue-600" size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CollapsibleCard title="Funcionários Presentes" icon={Users} iconColor="text-blue-600"
            badge={data.employees_inside.length} badgeClass="badge-blue">
            {!data.employees_inside.length ? <EmptyRow msg="Nenhum funcionário no momento" />
              : data.employees_inside.map(e => (
                <div key={e.employee_id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{e.name}</p>
                    <p className="text-xs text-gray-400">{e.position || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-green">Presente</span>
                    <p className="text-xs text-gray-400 mt-1"><Clock size={10} className="inline mr-1" />Entrou {e.entry_time}</p>
                  </div>
                </div>
              ))}
          </CollapsibleCard>

          <CollapsibleCard title="Veículos na Rua" icon={Car} iconColor="text-orange-600"
            badge={data.vehicles_out.length} badgeClass="badge-yellow">
            {!data.vehicles_out.length ? <EmptyRow msg="Nenhum veículo fora" />
              : data.vehicles_out.map(v => (
                <div key={v.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{v.model} — <span className="font-mono">{v.plate}</span></p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{v.reason || 'Sem motivo informado'}</p>
                  </div>
                  <div className="text-right">
                    <span className="badge-yellow">Fora</span>
                    <p className="text-xs text-gray-400 mt-1">Saiu {v.departure_time}</p>
                  </div>
                </div>
              ))}
          </CollapsibleCard>

          <CollapsibleCard title="Prestadores / Visitantes" icon={Truck} iconColor="text-purple-600"
            badge={(data.providers_inside.length || 0) + (data.consular_inside.length || 0)} badgeClass="badge-purple">
            {!data.providers_inside.length && !data.consular_inside.length
              ? <EmptyRow msg="Ninguém no momento" />
              : [...(data.providers_inside||[]).map(p => ({ ...p, tipo: 'Prestador' })),
                 ...(data.consular_inside||[]).map(c => ({ ...c, name: c.visitor_name, tipo: 'Consular' }))
                ].map(p => (
                <div key={`${p.tipo}-${p.id}`} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{p.name || p.visitor_name}</p>
                    <p className="text-xs text-gray-400">{p.company || p.employee_name || '—'}</p>
                  </div>
                  <span className="badge-purple">{p.tipo}</span>
                </div>
              ))}
          </CollapsibleCard>

          <CollapsibleCard title="Encomendas Pendentes" icon={Package} iconColor="text-yellow-600"
            badge={data.pending_packages.length} badgeClass="badge-yellow">
            {!data.pending_packages.length ? <EmptyRow msg="Nenhuma encomenda pendente" />
              : data.pending_packages.map(p => (
                <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm dark:text-white">{p.recipient_name || p.recipient_employee_name || 'Sem destinatário'}</p>
                    <p className="text-xs text-gray-400">{p.delivery_company}</p>
                  </div>
                  <span className="badge-yellow">Aguardando</span>
                </div>
              ))}
          </CollapsibleCard>
        </div>
      )}

      {!!data.outsourced_inside?.length && (
        <CollapsibleCard title="Terceirizados Presentes" icon={UserCog} iconColor="text-green-600"
          badge={data.outsourced_inside.length} badgeClass="badge-green" defaultOpen={false}>
          <div className="flex flex-wrap gap-3 p-6">
            {data.outsourced_inside.map(w => (
              <div key={w.id} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                <span className="badge-green capitalize">{w.role}</span>
                <span className="text-sm font-medium dark:text-white">{w.name}</span>
                <span className="text-xs text-gray-400">entrou {w.entry_time}</span>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      )}
    </div>
  )
}
