import { useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'
import { BarChart2, Download } from 'lucide-react'

const REPORT_TYPES = [
  { value: 'employee_attendance', label: 'Ponto de Funcionários' },
  { value: 'outsourced_attendance', label: 'Ponto de Terceirizados' },
  { value: 'vehicles', label: 'Controle de Veículos' },
  { value: 'providers', label: 'Prestadores de Serviço' },
  { value: 'consular', label: 'Atendimentos Consulares' },
  { value: 'packages', label: 'Encomendas' },
]

const COLUMNS = {
  employee_attendance: ['Data', 'Funcionário', 'Setor', 'Entrada', 'Saída Almoço', 'Retorno', 'Saída'],
  outsourced_attendance: ['Data', 'Nome', 'Função', 'Empresa', 'Entrada', 'Saída'],
  vehicles: ['Data', 'Placa', 'Modelo', 'Saída', 'Retorno', 'Condutor', 'Motivo'],
  providers: ['Data/Hora', 'Nome', 'Empresa', 'Motivo', 'Funcionário', 'Entrada', 'Saída'],
  consular: ['Data', 'Visitante', 'Motivo', 'Funcionário', 'Agendado', 'Entrada', 'Saída'],
  packages: ['Data', 'Destinatário', 'Empresa', 'Rastreio', 'Entregue a', 'Status'],
}

function getRowValues(type, row) {
  switch (type) {
    case 'employee_attendance': return [row.date, row.name, row.department || '—', row.entry_time || '—', row.lunch_out_time || '—', row.lunch_return_time || '—', row.exit_time || '—']
    case 'outsourced_attendance': return [row.date, row.name, row.role, row.company || '—', row.entry_time || '—', row.exit_time || '—']
    case 'vehicles': return [row.date, row.plate, row.model, row.departure_time, row.return_time || '—', row.driver || '—', row.reason || '—']
    case 'providers': return [row.entry_time ? format(new Date(row.entry_time), 'dd/MM/yyyy HH:mm') : '—', row.name, row.company || '—', row.reason || '—', row.employee_name || '—', row.entry_time ? format(new Date(row.entry_time), 'HH:mm') : '—', row.exit_time ? format(new Date(row.exit_time), 'HH:mm') : '—']
    case 'consular': return [row.date, row.visitor_name, row.visit_reason || '—', row.employee_name || '—', row.scheduled_time || '—', row.entry_time ? format(new Date(row.entry_time), 'HH:mm') : '—', row.exit_time ? format(new Date(row.exit_time), 'HH:mm') : '—']
    case 'packages': return [row.received_at ? format(new Date(row.received_at), 'dd/MM/yyyy HH:mm') : '—', row.recipient_name || row.recipient_name_emp || '—', row.delivery_company, row.tracking_code || '—', row.delivered_to_name || row.delivered_to_emp || '—', row.status === 'delivered' ? 'Entregue' : 'Pendente']
    default: return []
  }
}

export default function Reports() {
  const [type, setType] = useState('employee_attendance')
  const [start, setStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/${type}?start=${start}&end=${end}`)
      setData(res.data)
    } catch (e) { toast.error('Erro ao gerar relatório') }
    finally { setLoading(false) }
  }

  const exportCSV = () => {
    if (!data?.data?.length) return
    const cols = COLUMNS[type]
    const rows = data.data.map(row => getRowValues(type, row).map(v => `"${v}"`).join(','))
    const csv = [cols.join(','), ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `relatorio_${type}_${start}_${end}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm">Exportação por período e tipo</p>
      </div>

      <div className="card card-body">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="label">Tipo de Relatório</label>
            <select className="input" value={type} onChange={e => setType(e.target.value)}>
              {REPORT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="label">Data Inicial</label>
            <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="form-group mb-0">
            <label className="label">Data Final</label>
            <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={load} disabled={loading} className="btn-primary flex-1">
              <BarChart2 size={16} /> {loading ? 'Gerando...' : 'Gerar'}
            </button>
            {data?.data?.length > 0 && (
              <button onClick={exportCSV} className="btn-secondary">
                <Download size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-900">{data.count}</span> registros de{' '}
              <span className="font-medium">{REPORT_TYPES.find(t => t.value === data.type)?.label}</span>{' '}
              entre {data.start} e {data.end}
            </p>
          </div>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>{COLUMNS[type].map(c => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {data.data.length === 0 ? (
                  <tr><td colSpan={COLUMNS[type].length} className="text-center py-8 text-gray-400">Nenhum registro no período</td></tr>
                ) : data.data.map((row, i) => (
                  <tr key={i}>{getRowValues(type, row).map((v, j) => <td key={j} className="text-sm">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
