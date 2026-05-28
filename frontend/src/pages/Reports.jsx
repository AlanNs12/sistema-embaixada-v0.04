import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { BarChart2, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ================================================================
//  ✏️  CONFIGURAÇÕES DO CABEÇALHO DO PDF
//  Edite as linhas abaixo para personalizar os relatórios em PDF.
//  Após editar, salve o arquivo e rode: npm run build
// ================================================================

const PDF_CONFIG = {
  // Nome principal que aparece no topo de todos os PDFs
  titulo: 'Gestão Portaria',

  // Segunda linha do cabeçalho (nome da instituição, país, etc.)
  subtitulo: 'Embassy of the Philippines in Brazil',

  // Cor do título principal em formato RGB [R, G, B]
  corTitulo: [30, 64, 175],

  // Cor do cabeçalho das tabelas (linha de títulos das colunas)
  corCabecalhoTabela: [30, 64, 175],

  // Cor das linhas alternadas da tabela
  // Para desativar use: [255, 255, 255]
  corLinhaAlternada: [239, 246, 255],

  // Texto do rodapé de cada página. Use null para não exibir.
  rodape: 'Documento gerado automaticamente pelo Sistema de Gestão da Portaria',

  // Orientação: 'landscape' (horizontal) ou 'portrait' (vertical)
  orientacao: 'landscape',

  // Caminho da logo dentro de frontend/public/
  // Ex: '/logo.png' ou '/images/logo-emblem.png'
  // Use null para não exibir logo
  logo: '/images/logo-emblem.png',

  // Tamanho da logo no PDF em milímetros [largura, altura]
  logoTamanho: [18, 18],
}

// ================================================================
//  FIM DAS CONFIGURAÇÕES — não edite abaixo desta linha
//  a menos que saiba o que está fazendo
// ================================================================

// Carrega e cacheia a logo uma única vez
let _logoCache = null
async function loadLogo() {
  if (!PDF_CONFIG.logo) return null
  if (_logoCache) return _logoCache
  return new Promise((resolve) => {
    const img = new Image()
    img.src = PDF_CONFIG.logo
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      _logoCache = canvas.toDataURL('image/png')
      resolve(_logoCache)
    }
    img.onerror = () => {
      console.warn('[Reports] Logo não encontrada em:', PDF_CONFIG.logo)
      resolve(null)
    }
  })
}

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
  vehicles:             ['Data', 'Placa', 'Modelo', 'Saída', 'Retorno', 'Condutor', 'Passageiros', 'Observações'],
  providers:            ['Data/Hora', 'Nome', 'Empresa', 'Motivo', 'Funcionário', 'Entrada', 'Saída'],
  consular:             ['Data', 'Visitante', 'Motivo', 'Funcionário', 'Agendado', 'Entrada', 'Saída'],
  packages:             ['Data', 'Destinatário', 'Empresa', 'Rastreio', 'Entregue a', 'Status'],
  visitors:             ['Data', 'Visitante', 'Documento', 'Motivo', 'Funcionário', 'Entrada', 'Saída'],
}

const fmtDate = (v) => {
  if (!v) return '—'
  try {
    // Usa toISOString() para datas não-string (Date objects retornados pelo pg)
    // evitando que o fuso horário UTC-3 desloque as datas 1 dia para trás
    const s = typeof v === 'string' ? v.substring(0, 10) : new Date(v).toISOString().substring(0, 10)
    const [y, m, d] = s.split('-')
    return `${d}/${m}/${y}`
  } catch { return String(v) }
}
const fmtTime = (v) => {
  if (!v) return '—'
  try {
    if (typeof v === 'string' && v.includes('T')) return v.substring(11, 16)
    return v.substring(0, 5)
  } catch { return v }
}

function getRow(type, row) {
  switch (type) {
    case 'employee_attendance':
      return [fmtDate(row.date), row.name, row.department||'—', row.entry_time||'—', row.lunch_out_time||'—', row.lunch_return_time||'—', row.exit_time||'—', row.notes||'—']
    case 'outsourced_attendance':
      return [fmtDate(row.date), row.name, row.role, row.company||'—', row.entry_time||'—', row.exit_time||'—']
    case 'vehicles': {
      const multiDay = row.return_date && row.return_date !== row.date
      const dep = multiDay ? `${fmtDate(row.date)} ${fmtTime(row.departure_time)}` : (row.departure_time || '—')
      const ret = row.return_time
        ? (multiDay ? `${fmtDate(row.return_date)} ${fmtTime(row.return_time)}` : row.return_time)
        : '—'
      return [fmtDate(row.date), row.plate, row.model, dep, ret, row.driver||'—', row.passengers||'—', row.observations||'—']
    }
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

// Desenha o cabeçalho em qualquer página e retorna o Y onde a tabela começa
function drawHeader(doc, { label, start, end, count, extraLine, logo }) {
  const W = doc.internal.pageSize.width
  const [logoW, logoH] = PDF_CONFIG.logoTamanho

  // ── Logo (se existir) ─────────────────────────────────────
  if (logo) {
    doc.addImage(logo, 'PNG', 14, 4, logoW, logoH)
  }

  // Textos deslocam para a direita quando há logo
  const xTexto = logo ? 14 + logoW + 4 : 14

  // ── Título principal ──────────────────────────────────────
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_CONFIG.corTitulo)
  doc.text(PDF_CONFIG.titulo, xTexto, 11)

  // ── Subtítulo ─────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(PDF_CONFIG.subtitulo, xTexto, 17)

  // ── Data de geração (canto superior direito) ──────────────
  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.text(
    `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
    W - 14, 9, { align: 'right' }
  )

  // ── Linha separadora ──────────────────────────────────────
  const sepY = logo ? Math.max(logoH + 6, 22) : 22
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(14, sepY, W - 14, sepY)

  // ── Informações do relatório ──────────────────────────────
  let infoY = sepY + 6
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)

  // Linha "Relatório: Ponto de Funcionários"
  doc.setFont('helvetica', 'bold')
  doc.text('Relatório: ', 14, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(label, 14 + doc.getTextWidth('Relatório: '), infoY)

  // Linha "Funcionário: Nome" (só no relatório por funcionário)
  if (extraLine) {
    infoY += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Funcionário: ', 14, infoY)
    doc.setFont('helvetica', 'normal')
    doc.text(extraLine, 14 + doc.getTextWidth('Funcionário: '), infoY)
  }

  // Linha de período + total
  infoY += 5
  doc.setTextColor(100, 100, 100)
  doc.text(`Período: ${fmtDate(start)} a ${fmtDate(end)}`, 14, infoY)
  if (count !== undefined) {
    doc.text(`Total: ${count} registros`, W - 14, infoY, { align: 'right' })
  }

  // ── Linha divisória final ─────────────────────────────────
  const lineY = infoY + 4
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(14, lineY, W - 14, lineY)

  return lineY + 3 // Y onde a tabela começa
}

// Configuração visual das tabelas
const tableStyle = {
  theme: 'striped',
  headStyles: {
    fillColor: PDF_CONFIG.corCabecalhoTabela,
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 8,
  },
  bodyStyles: {
    fontSize: 7.5,
    textColor: [40, 40, 40],
  },
  alternateRowStyles: {
    fillColor: PDF_CONFIG.corLinhaAlternada,
  },
  margin: { left: 14, right: 14 },
}

// Escreve rodapé em todas as páginas
function drawFooters(doc, totalPages) {
  if (!PDF_CONFIG.rodape) return
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(6.5)
    doc.setTextColor(180, 180, 180)
    doc.text(PDF_CONFIG.rodape, 14, H - 5)
    doc.text(`Página ${i} de ${totalPages}`, W - 14, H - 5, { align: 'right' })
  }
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
    const csv = [
      COLUMNS[type].join(','),
      ...rows.map(r => getRow(type, r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relatorio_${type}_${start}_${end}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // exportPDF é async para aguardar o carregamento da logo
  const exportPDF = async () => {
    if (!rows.length) return toast.error('Nenhum dado para exportar')

    const logo = await loadLogo()

    const doc = new jsPDF({
      orientation: PDF_CONFIG.orientacao,
      unit: 'mm',
      format: 'a4',
    })

    if (type === 'employee_attendance') {
      // ── Uma página por funcionário ────────────────────────
      const byEmployee = {}
      rows.forEach(r => {
        const key = r.name || 'Sem nome'
        if (!byEmployee[key]) byEmployee[key] = []
        byEmployee[key].push(r)
      })

      const empName = filterEmployee
        ? employees.find(e => String(e.id) === filterEmployee)?.name
        : null

      // Usa a ordem definida pelo admin (sort_order); empregados sem registro no período ficam no final
      const orderedByApi = employees
        .filter(e => byEmployee[e.name])
        .map(e => e.name)
      const remaining = Object.keys(byEmployee).filter(n => !orderedByApi.includes(n))
      const names = empName ? [empName] : [...orderedByApi, ...remaining]

      names.forEach((name, idx) => {
        if (idx > 0) doc.addPage()
        const empRows = byEmployee[name] || rows
        const startY = drawHeader(doc, {
          label: typeLabel,
          start, end,
          count: empRows.length,
          extraLine: name,
          logo,
        })
        autoTable(doc, {
          ...tableStyle,
          startY,
          head: [COLUMNS[type]],
          body: empRows.map(r => getRow(type, r)),
        })
      })
    } else {
      // ── Relatório padrão ──────────────────────────────────
      const startY = drawHeader(doc, { label: typeLabel, start, end, count: rows.length, logo })
      autoTable(doc, {
        ...tableStyle,
        startY,
        head: [COLUMNS[type]],
        body: rows.map(r => getRow(type, r)),
      })
    }

    drawFooters(doc, doc.internal.getNumberOfPages())
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
              {rows.length > 0 && (
                <div className="flex items-end mt-5">
                  <button onClick={exportPDF} className="btn-danger btn-sm">
                    <FileText size={14} />
                    {!filterEmployee ? 'PDF por funcionário' : 'PDF individual'}
                  </button>
                </div>
              )}
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
              <span className="ml-1">de <strong className="dark:text-white">{employees.find(e => String(e.id) === filterEmployee)?.name}</strong></span>
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