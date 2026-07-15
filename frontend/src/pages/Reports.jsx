import { useEffect, useState } from 'react'
import api from '../api'
import toast from 'react-hot-toast'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { BarChart2, Download, FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const PDF_COLORS = {
  corTitulo: [30, 64, 175],
  corCabecalhoTabela: [30, 64, 175],
  corLinhaAlternada: [239, 246, 255],
}

const PDF_LAYOUT = {
  orientacao: 'landscape',
  logo: '/images/logo-emblem.png',
  logoTamanho: [18, 18],
}

let _logoCache = null
async function loadLogo() {
  if (!PDF_LAYOUT.logo) return null
  if (_logoCache) return _logoCache
  return new Promise((resolve) => {
    const img = new Image()
    img.src = PDF_LAYOUT.logo
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width  = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)
      _logoCache = canvas.toDataURL('image/png')
      resolve(_logoCache)
    }
    img.onerror = () => {
      console.warn('[Reports] Logo not found at:', PDF_LAYOUT.logo)
      resolve(null)
    }
  })
}

const fmtDateIso = (v) => {
  if (!v) return ''
  try {
    const s = typeof v === 'string' ? v.substring(0, 10) : new Date(v).toISOString().substring(0, 10)
    return s
  } catch { return String(v) }
}

const fmtTimeRaw = (v) => {
  if (!v) return ''
  try {
    if (typeof v === 'string' && v.includes('T')) return v.substring(11, 16)
    return v.substring(0, 5)
  } catch { return v }
}

function getRow(type, row, labels) {
  const dash = '—'
  const fd = (v, loc) => {
    if (!v) return dash
    try {
      const d = typeof v === 'string' ? new Date(v.includes('T') ? v : v + 'T00:00:00') : new Date(v)
      return format(d, 'P', { locale: loc })
    } catch { return String(v) }
  }

  switch (type) {
    case 'employee_attendance':
      return [fd(row.date, labels.locale), row.name, row.department||dash, row.entry_time||dash, row.lunch_out_time||dash, row.lunch_return_time||dash, row.exit_time||dash, row.notes||dash]
    case 'outsourced_attendance':
      return [fd(row.date, labels.locale), row.name, row.role, row.company||dash, row.entry_time||dash, row.exit_time||dash]
    case 'vehicles': {
      const multiDay = row.return_date && fmtDateIso(row.return_date) !== fmtDateIso(row.date)
      const dep = multiDay ? `${fd(row.date, labels.locale)} ${fmtTimeRaw(row.departure_time)}` : (row.departure_time || dash)
      const ret = row.return_time
        ? (multiDay ? `${fd(row.return_date, labels.locale)} ${fmtTimeRaw(row.return_time)}` : row.return_time)
        : dash
      return [fd(row.date, labels.locale), row.plate, row.model, dep, ret, row.driver||dash, row.passengers||dash, row.observations||dash]
    }
    case 'providers':
      return [row.entry_time ? `${fd(row.entry_time, labels.locale)} ${fmtTimeRaw(row.entry_time)}` : dash, row.name, row.company||dash, row.reason||dash, row.employee_name||dash, fmtTimeRaw(row.entry_time), fmtTimeRaw(row.exit_time)]
    case 'consular':
      return [fd(row.date, labels.locale), row.visitor_name, row.visit_reason||dash, row.employee_name||dash, row.scheduled_time||dash, fmtTimeRaw(row.entry_time), fmtTimeRaw(row.exit_time)]
    case 'packages':
      return [`${fd(row.received_at, labels.locale)} ${fmtTimeRaw(row.received_at)}`, row.recipient_name||row.recipient_name_emp||dash, row.delivery_company, row.tracking_code||dash, row.delivered_to_name||row.delivered_to_emp||dash, row.status==='delivered' ? labels.pdf_status_delivered : labels.pdf_status_pending]
    case 'visitors':
      return [fd(row.date, labels.locale), row.visitor_name, row.document_number||dash, row.reason||dash, row.employee_name||dash, fmtTimeRaw(row.entry_time), fmtTimeRaw(row.exit_time)]
    default: return []
  }
}

function drawHeader(doc, { label, start, end, count, extraLine, logo, labels }) {
  const W = doc.internal.pageSize.width
  const [logoW, logoH] = PDF_LAYOUT.logoTamanho

  if (logo) {
    doc.addImage(logo, 'PNG', 14, 4, logoW, logoH)
  }

  const xTexto = logo ? 14 + logoW + 4 : 14

  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...PDF_COLORS.corTitulo)
  doc.text(labels.pdf_title, xTexto, 11)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(120, 120, 120)
  doc.text(labels.pdf_subtitle, xTexto, 17)

  doc.setFontSize(7.5)
  doc.setTextColor(160, 160, 160)
  doc.text(
    labels.pdf_generated_at.replace('{{datetime}}', format(new Date(), "P 'at' p", { locale: labels.locale })),
    W - 14, 9, { align: 'right' }
  )

  const sepY = logo ? Math.max(logoH + 6, 22) : 22
  doc.setDrawColor(220, 220, 220)
  doc.setLineWidth(0.3)
  doc.line(14, sepY, W - 14, sepY)

  let infoY = sepY + 6
  doc.setFontSize(9)
  doc.setTextColor(60, 60, 60)

  doc.setFont('helvetica', 'bold')
  doc.text(labels.pdf_report_label, 14, infoY)
  doc.setFont('helvetica', 'normal')
  doc.text(label, 14 + doc.getTextWidth(labels.pdf_report_label), infoY)

  if (extraLine) {
    infoY += 5
    doc.setFont('helvetica', 'bold')
    doc.text(labels.pdf_employee_label, 14, infoY)
    doc.setFont('helvetica', 'normal')
    doc.text(extraLine, 14 + doc.getTextWidth(labels.pdf_employee_label), infoY)
  }

  infoY += 5
  doc.setTextColor(100, 100, 100)
  const fdStart = (() => { try { return format(new Date(start + 'T00:00:00'), 'P', { locale: labels.locale }) } catch { return start } })()
  const fdEnd = (() => { try { return format(new Date(end + 'T00:00:00'), 'P', { locale: labels.locale }) } catch { return end } })()
  doc.text(labels.pdf_period.replace('{{start}}', fdStart).replace('{{end}}', fdEnd), 14, infoY)
  if (count !== undefined) {
    doc.text(labels.pdf_total.replace('{{count}}', count), W - 14, infoY, { align: 'right' })
  }

  const lineY = infoY + 4
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  doc.line(14, lineY, W - 14, lineY)

  return lineY + 3
}

const tableStyle = {
  theme: 'striped',
  headStyles: {
    fillColor: PDF_COLORS.corCabecalhoTabela,
    textColor: 255,
    fontStyle: 'bold',
    fontSize: 8,
  },
  bodyStyles: {
    fontSize: 7.5,
    textColor: [40, 40, 40],
  },
  alternateRowStyles: {
    fillColor: PDF_COLORS.corLinhaAlternada,
  },
  margin: { left: 14, right: 14 },
}

function drawFooters(doc, totalPages, labels) {
  if (!labels.pdf_footer) return
  const W = doc.internal.pageSize.width
  const H = doc.internal.pageSize.height
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(6.5)
    doc.setTextColor(180, 180, 180)
    doc.text(labels.pdf_footer, 14, H - 5)
    doc.text(labels.pdf_page.replace('{{current}}', i).replace('{{total}}', totalPages), W - 14, H - 5, { align: 'right' })
  }
}

export default function Reports() {
  const { t, i18n } = useTranslation('reports')
  const { t: tc } = useTranslation('common')
  const dateLocale = i18n.language === 'en-US' ? enUS : ptBR

  const REPORT_TYPES = [
    { value: 'employee_attendance',   label: t('type_employee_attendance'),   hasEmployeeFilter: true },
    { value: 'outsourced_attendance', label: t('type_outsourced_attendance') },
    { value: 'vehicles',              label: t('type_vehicles') },
    { value: 'providers',             label: t('type_providers') },
    { value: 'consular',              label: t('type_consular') },
    { value: 'packages',              label: t('type_packages') },
    { value: 'visitors',              label: t('type_visitors') },
  ]

  const PDF_COLUMNS = {
    employee_attendance:  [tc('date'), t('column_employee'), t('column_department'), t('column_entry'), t('column_lunch_out'), t('column_lunch_return'), t('column_exit'), tc('observations_field')],
    outsourced_attendance:[tc('date'), tc('name'), t('column_role'), tc('company'), t('column_entry'), t('column_exit')],
    vehicles:             [tc('date'), t('column_plate'), t('column_model'), t('column_departure'), t('column_return'), t('column_driver'), t('column_passengers'), t('column_obs')],
    providers:            [t('column_datetime'), tc('name'), tc('company'), tc('reason'), tc('employee'), t('column_entry'), t('column_exit')],
    consular:             [tc('date'), t('column_visitor'), t('column_reason'), t('column_employee'), t('column_scheduled'), t('column_entry'), t('column_exit')],
    packages:             [t('column_datetime'), t('column_recipient'), t('column_company'), t('column_tracking'), t('column_delivered'), t('column_status')],
    visitors:             [tc('date'), t('column_visitor'), t('column_document'), t('column_reason'), t('column_employee'), t('column_entry'), t('column_exit')],
  }

  const pdfLabels = {
    locale: dateLocale,
    pdf_title: t('pdf_title'),
    pdf_subtitle: t('pdf_subtitle'),
    pdf_footer: t('pdf_footer'),
    pdf_generated_at: t('pdf_generated_at'),
    pdf_report_label: t('pdf_report_label'),
    pdf_employee_label: t('pdf_employee_label'),
    pdf_period: t('pdf_period'),
    pdf_total: t('pdf_total'),
    pdf_page: t('pdf_page'),
    pdf_sem_nome: t('pdf_sem_nome'),
    pdf_status_delivered: t('pdf_status_delivered'),
    pdf_status_pending: t('pdf_status_pending'),
  }

  const [type, setType] = useState('employee_attendance')
  const [start, setStart] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'))
  const [end, setEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [employees, setEmployees] = useState([])
  const [filterEmployee, setFilterEmployee] = useState('')

  const currentType = REPORT_TYPES.find(rt => rt.value === type)

  useEffect(() => {
    api.get('/employees').then(r => setEmployees(r.data)).catch(() => {})
  }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/reports/${type}?start=${start}&end=${end}`)
      setData(res.data)
    } catch (e) { toast.error(t('toast_generation_error')) }
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
      PDF_COLUMNS[type].join(','),
      ...rows.map(r => getRow(type, r, pdfLabels).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `relatorio_${type}_${start}_${end}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const exportPDF = async () => {
    if (!rows.length) return toast.error(t('toast_no_data'))

    const logo = await loadLogo()

    const doc = new jsPDF({
      orientation: PDF_LAYOUT.orientacao,
      unit: 'mm',
      format: 'a4',
    })

    if (type === 'employee_attendance') {
      const byEmployee = {}
      rows.forEach(r => {
        const key = r.name || pdfLabels.pdf_sem_nome
        if (!byEmployee[key]) byEmployee[key] = []
        byEmployee[key].push(r)
      })

      const empName = filterEmployee
        ? employees.find(e => String(e.id) === filterEmployee)?.name
        : null

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
          labels: pdfLabels,
        })
        autoTable(doc, {
          ...tableStyle,
          startY,
          head: [PDF_COLUMNS[type]],
          body: empRows.map(r => getRow(type, r, pdfLabels)),
        })
      })
    } else {
      const startY = drawHeader(doc, { label: typeLabel, start, end, count: rows.length, logo, labels: pdfLabels })
      autoTable(doc, {
        ...tableStyle,
        startY,
        head: [PDF_COLUMNS[type]],
        body: rows.map(r => getRow(type, r, pdfLabels)),
      })
    }

    drawFooters(doc, doc.internal.getNumberOfPages(), pdfLabels)
    doc.save(`relatorio_${type}_${start}_${end}.pdf`)
    toast.success(t('toast_pdf_generated'))
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t('subtitle')}</p>
      </div>

      <div className="card card-body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="form-group mb-0">
            <label className="label">{t('field_type')}</label>
            <select className="input" value={type} onChange={e => { setType(e.target.value); setFilterEmployee(''); setData(null) }}>
              {REPORT_TYPES.map(rt => <option key={rt.value} value={rt.value}>{rt.label}</option>)}
            </select>
          </div>
          <div className="form-group mb-0">
            <label className="label">{t('field_start_date')}</label>
            <input type="date" className="input" value={start} onChange={e => setStart(e.target.value)} />
          </div>
          <div className="form-group mb-0">
            <label className="label">{t('field_end_date')}</label>
            <input type="date" className="input" value={end} onChange={e => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={load} disabled={loading} className="btn-primary flex-1">
              <BarChart2 size={16} /> {loading ? t('generating') : t('generate')}
            </button>
            {rows.length > 0 && (<>
              <button onClick={exportCSV} className="btn-secondary" title={t('export_csv')}><Download size={16} /></button>
              <button onClick={exportPDF} className="btn-danger" title={t('export_pdf')}><FileText size={16} /></button>
            </>)}
          </div>
        </div>

        {currentType?.hasEmployeeFilter && data && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="form-group mb-0 flex-1 min-w-48">
                <label className="label">{t('filter_by_employee')}</label>
                <select className="input" value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                  <option value="">{t('all_employees')}</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {rows.length > 0 && (
                <div className="flex items-end mt-5">
                  <button onClick={exportPDF} className="btn-danger btn-sm">
                    <FileText size={14} />
                    {!filterEmployee ? t('pdf_per_employee') : t('pdf_individual')}
                  </button>
                </div>
              )}
            </div>
            {!filterEmployee && data && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                {t('pdf_hint')}
              </p>
            )}
          </div>
        )}
      </div>

      {data && (
        <div className="space-y-3">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            <span className="font-semibold text-gray-900 dark:text-white">{rows.length}</span>{' '}
            {t('records_count', { count: rows.length })}
            {filterEmployee && employees.find(e => String(e.id) === filterEmployee) && (
              <span className="ml-1">{t('of_employee', { name: employees.find(e => String(e.id) === filterEmployee)?.name })}</span>
            )}
          </p>
          <div className="table-container">
            <table className="table">
              <thead><tr>{PDF_COLUMNS[type].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>
                {rows.length === 0
                  ? <tr><td colSpan={PDF_COLUMNS[type].length} className="text-center py-8 text-gray-400">{t('empty_no_records')}</td></tr>
                  : rows.map((row, i) => (
                    <tr key={i}>{getRow(type, row, pdfLabels).map((v, j) => <td key={j} className="text-sm dark:text-gray-300">{v}</td>)}</tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
