import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format, subDays, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart2, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const REPORT_TYPES = [
  { value: 'employee_attendance',   label: 'Ponto de Funcionários',    hasEmployeeFilter: true },
  { value: 'outsourced_attendance', label: 'Ponto de Terceirizados' },
  { value: 'vehicles',              label: 'Controle de Veículos' },
  { value: 'providers',             label: 'Prestadores de Serviço' },
  { value: 'consular',              label: 'Atendimentos Consulares' },
  { value: 'packages',              label: 'Encomendas' },
  { value: 'visitors',              label: 'Visitantes' },
]

const COLUMNS = {
  employee_attendance:  ['Data', 'Funcionário', 'Setor', 'Entrada', 'Saída Almoço', 'Retorno', 'Saída', 'Observação'],
  outsourced_attendance:['Data', 'Nome', 'Função', 'Empresa', 'Entrada', 'Saída'],
  vehicles:             ['Data', 'Placa', 'Modelo', 'Saída', 'Retorno', 'Condutor', 'Motivo', 'Observações'],
  providers:            ['Data/Hora', 'Nome', 'Empresa', 'Motivo', 'Funcionário', 'Entrada', 'Saída'],
  consular:             ['Data', 'Visitante', 'Motivo', 'Funcionário', 'Agendado', 'Entrada', 'Saída'],
  packages:             ['Data', 'Destinatário', 'Empresa', 'Rastreio', 'Entregue a', 'Status'],
  visitors:             ['Data', 'Visitante', 'Documento', 'Motivo', 'Funcionário', 'Entrada', 'Saída'],
}

// Formata data sem fuso horário
const fmtDate = (v) => {
  if (!v) return '—'
  try {
    // se for string tipo "2024-01-15" ou "2024-01-15T..." parse manualmente
    const s = typeof v === 'string' ? v.substring(0, 10) : format(new Date(v), 'yyyy-MM-dd')
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  } catch { return v }
}
const fmtTime = (v) => {
  if (!v) return '—'
  try {
    if (typeof v === 'string' && v.includes('T')) {
      return v.substring(11, 16)
    }
    return v.substring(0, 5)
  } catch { return v }
}

function getRow(type, row) {
  switch (type) {
    case 'employee_attendance':
      return [fmtDate(row.date), row.name, row.department||'—', row.entry_time||'—', row.lunch_out_time||'—', row.lunch_return_time||'—', row.exit_time||'—', row.notes||'—']
    case 'outsourced_attendance':
      return [fmtDate(row.date), row.name, row.role, row.company||'—', row.entry_time||'—', row.exit_time||'—']
    case 'vehicles':
      return [fmtDate(row.date), row.plate, row.model, row.departure_time||'—', row.return_time||'—', row.driver||'—', row.reason||'—', row.observations||'—']
    case 'providers':
      return [row.entry_time ? `${fmtDate(row.entry_time)} ${fmtTime(row.entry_time)}` : '—', row.name, row.company||'—', row.reason||'—', row.employee_name||'—', fmtTime(row.entry_time), fmtTime(row.exit_time)]
    case 'consular':
      return [fmtDate(row.date), row.visitor_name, row.visit_reason||'—', row.employee_name||'—', row.scheduled_time||'—', fmtTime(row.entry_time), fmtTime(row.exit_time)]
    case 'packages':
      return [`${fmtDate(row.received_at)} ${fmtTime(row.received_at)}`, row.recipient_name||row.recipient_name_emp||'—', row.delivery_company, row.tracking_code||'—', row.delivered_to_name||row.delivered_to_emp||'—', row.status==='delivered'?'Entregue':'Pendente']
    case 'visitors':
      return [fmtDate(row.date), row.visitor_name, row.document_number||'—', row.reason||'—', row.employee_name||'—', fmtTime(row.entry_time), fmtTime(row.exit_time)]
    default: return []
  }
}

function addPDFHeader(doc, label, start, end, count) {
  doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175)
  doc.text('Sistema de Controle — Embaixada', 14, 16)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80)
  doc.text(`Relatório: ${label}`, 14, 23)
  doc.text(`Período: ${fmtDate(start)} a ${fmtDate(end)}  |  Total: ${count} registros`, 14, 29)
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 35)
  doc.setDrawColor(200, 200, 200); doc.line(14, 38, doc.internal.pageSize.width - 14, 38)
}

export default function Reports() {
  const [type, setType] = useState('employee_attendance')
  const [start, setStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [filterEmployee, setFilterEmployee] = useState('')

  const currentType = REPORT_TYPES.find(t => t.value === type)

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/${type}?start=${start}&end=${end}`)
      setData(res.data)
    } catch (e) { toast.error('Erro ao gerar relatório') }
    finally { setLoading(false) }
  }

  // Aplica filtro de funcionário no frontend
  const filteredData = () => {
    if (!data?.data) return []
    if (!filterEmployee || type !== 'employee_attendance') return data.data
    const emp = employees.find(e => String(e.id) === filterEmployee)
    if (!emp) return data.data
    return data.data.filter(r => r.name === emp.name || r.employee_id === parseInt(filterEmployee))
  }

  const rows = filteredData()
  const typeLabel = currentType?.label || type

  const exportCSV = () => {
    if (!rows.length) return
    const csv = [COLUMNS[type].join(','), ...rows.map(r => getRow(type, r).map(v => `"${String(v).replace(/"/g,'""')}"`).join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `relatorio_${type}_${start}_${end}.csv`; a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportPDF = () => {
    if (!rows.length) return toast.error('Nenhum dado para exportar')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    if (type === 'employee_attendance' && filterEmployee) {
      // Modo: um funcionário por página
      const emp = employees.find(e => String(e.id) === filterEmployee)
      const empName = emp?.name || 'Funcionário'
      const empRows = rows

      doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175)
      doc.text('Sistema de Controle — Embaixada', 14, 16)
      doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
      doc.text(`Funcionário: ${empName}`, 14, 24)
      doc.text(`Período: ${fmtDate(start)} a ${fmtDate(end)}  |  ${empRows.length} registros`, 14, 30)
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 36)
      doc.setDrawColor(200,200,200); doc.line(14,39,doc.internal.pageSize.width-14,39)

      autoTable(doc, {
        startY: 43,
        head: [COLUMNS[type]],
        body: empRows.map(r => getRow(type, r)),
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { left: 14, right: 14 },
      })
    } else if (type === 'employee_attendance' && !filterEmployee) {
      // Modo: todos os funcionários, um por página
      const byEmployee = {}
      rows.forEach(r => {
        const key = r.name || 'Sem nome'
        if (!byEmployee[key]) byEmployee[key] = []
        byEmployee[key].push(r)
      })
      const empNames = Object.keys(byEmployee).sort()

      empNames.forEach((empName, idx) => {
        if (idx > 0) doc.addPage()
        const empRows = byEmployee[empName]

        doc.setFontSize(15); doc.setFont('helvetica', 'bold'); doc.setTextColor(30, 64, 175)
        doc.text('Sistema de Controle — Embaixada', 14, 16)
        doc.setFontSize(11); doc.setFont('helvetica', 'normal'); doc.setTextColor(60, 60, 60)
        doc.text(`Funcionário: ${empName}`, 14, 24)
        doc.text(`Período: ${fmtDate(start)} a ${fmtDate(end)}  |  ${empRows.length} registros`, 14, 30)
        doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 36)
        doc.setDrawColor(200,200,200); doc.line(14,39,doc.internal.pageSize.width-14,39)

        autoTable(doc, {
          startY: 43,
          head: [COLUMNS[type]],
          body: empRows.map(r => getRow(type, r)),
          theme: 'striped',
          headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
          bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
          alternateRowStyles: { fillColor: [239, 246, 255] },
          margin: { left: 14, right: 14 },
        })

        // Rodapé com número de página
        const pageCount = doc.internal.getNumberOfPages()
        doc.setFontSize(7); doc.setTextColor(150,150,150)
        doc.text(`Página ${idx+1} de ${empNames.length}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 5)
      })
    } else {
      // Relatório padrão
      addPDFHeader(doc, typeLabel, start, end, rows.length)
      autoTable(doc, {
        startY: 42,
        head: [COLUMNS[type]],
        body: rows.map(r => getRow(type, r)),
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
        alternateRowStyles: { fillColor: [239, 246, 255] },
        margin: { left: 14, right: 14 },
      })
    }

    doc.save(`relatorio_${type}_${start}_${end}.pdf`)
    toast.success('PDF gerado!')
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Exportação por período — CSV e PDF</p>
      </div>

      <div className="card card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="label">Tipo</label>
            <select className="input" value={type} onChange={e => { setType(e.target.value); setFilterEmployee(''); setData(null) }}>
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
            {rows.length > 0 && (<>
              <button onClick={exportCSV} className="btn-secondary" title="Exportar CSV"><Download size={16} /></button>
              <button onClick={exportPDF} className="btn-danger" title="Exportar PDF"><FileText size={16} /></button>
            </>)}
          </div>
        </div>

        {/* Filtro por funcionário (só para ponto de funcionários) */}
        {currentType?.hasEmployeeFilter && data && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="form-group mb-0 flex-1 min-w-48">
                <label className="label">Filtrar por funcionário</label>
                <select className="input" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">Todos os funcionários</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="flex items-end gap-2 mt-5">
                {rows.length > 0 && (<>
                  <button onClick={exportPDF} className="btn-danger btn-sm">
                    <FileText size={14} />
                    {!filterEmployee ? 'PDF por funcionário' : 'PDF individual'}
                  </button>
                </>)}
              </div>
            </div>
            {!filterEmployee && data && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                💡 O PDF vai gerar uma página separada para cada funcionário
              </p>
            )}
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{rows.length}</span> registros
            {filterEmployee && employees.find(e => String(e.id) === filterEmployee) && (
              <span className="ml-1">de <strong className="text-gray-800 dark:text-white">{employees.find(e => String(e.id) === filterEmployee)?.name}</strong></span>
            )}
          </p>
          <div className="table-container">
            <table className="table">
              <thead><tr>{COLUMNS[type].map(c => <th key={c}>{c}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={COLUMNS[type].length} className="text-center py-8 text-gray-400">Nenhum registro no período</td></tr>
                  : rows.map((row, i) => (
                    <tr key={i}>{getRow(type, row).map((v, j) => <td key={j} className="text-sm dark:text-gray-300">{v}</td>)}</tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
