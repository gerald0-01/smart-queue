'use client'
import ErrorCard from "@/components/ErrorCard"
import { useSession } from "next-auth/react"
import axios from "axios"
import { useEffect, useState } from "react"
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType } from "docx"
import { saveAs } from "file-saver"

type RequestStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'COMPLETED' | 'REJECTED'

interface Request {
  id: string; queueNumber: number; status: RequestStatus; purpose: string
  notes?: string; message?: string; availablePickUp?: string
  createdAt: string; processedAt?: string
  documentType: { name: string }
  user: { name: string; idNumber: string; email: string; college?: string; course?: string }
}

interface ReportData {
  date: string
  summary: { total: number; pending: number; processing: number; ready: number; completed: number; rejected: number }
  requests: Request[]
}

const SL: Record<RequestStatus, string> = { PENDING:'Pending', PROCESSING:'Processing', READY:'Ready', COMPLETED:'Completed', REJECTED:'Rejected' }
const SB: Record<RequestStatus, string> = { PENDING:'badge badge-pending', PROCESSING:'badge badge-processing', READY:'badge badge-ready', COMPLETED:'badge badge-completed', REJECTED:'badge badge-rejected' }
const NS: Record<RequestStatus, RequestStatus | null> = { PENDING:'PROCESSING', PROCESSING:'READY', READY:'COMPLETED', COMPLETED:null, REJECTED:null }
const SC: Record<string, string> = { PENDING:'#92400E', PROCESSING:'#1E40AF', READY:'#065F46', COMPLETED:'#5B21B6', REJECTED:'#991B1B' }

type Tab = 'requests' | 'analytics'

function buildReportHTML(report: ReportData): string {
  const date = new Date(report.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  const collegeMap: Record<string, number> = {}
  const courseMap: Record<string, number> = {}
  for (const r of report.requests) {
    const col = r.user.college || 'N/A'
    const crs = r.user.course  || 'N/A'
    collegeMap[col] = (collegeMap[col] ?? 0) + 1
    courseMap[crs]  = (courseMap[crs]  ?? 0) + 1
  }
  const colleges = Object.entries(collegeMap).sort((a,b) => b[1]-a[1])
  const courses  = Object.entries(courseMap).sort((a,b) => b[1]-a[1]).slice(0, 10)
  const maxCol = colleges[0]?.[1] ?? 1
  const maxCrs = courses[0]?.[1] ?? 1

  const bar = (pct: number, color: string) =>
    `<div style="height:8px;border-radius:99px;background:#F3F4F6;overflow:hidden;margin-top:4px">
       <div style="height:100%;width:${pct}%;background:${color};border-radius:99px"></div>
     </div>`

  const collegeRows = colleges.map(([col, cnt]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
        <span style="font-weight:600;color:#374151">${col}</span>
        <span style="font-weight:800;color:#800020">${cnt}</span>
      </div>
      ${bar(Math.round((cnt/maxCol)*100), '#800020')}
    </div>`).join('')

  const courseRows = courses.map(([crs, cnt]) => `
    <div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:2px">
        <span style="font-weight:600;color:#374151">${crs}</span>
        <span style="font-weight:800;color:#800020">${cnt}</span>
      </div>
      ${bar(Math.round((cnt/maxCrs)*100), '#D4AF37')}
    </div>`).join('')

  const statusColors: Record<string, string> = { PENDING:'#92400E', PROCESSING:'#1E40AF', READY:'#065F46', COMPLETED:'#5B21B6', REJECTED:'#991B1B' }
  const statusBg:     Record<string, string> = { PENDING:'#FEF3C7', PROCESSING:'#DBEAFE', READY:'#D1FAE5', COMPLETED:'#EDE9FE', REJECTED:'#FEE2E2' }

  const statusBars = (['PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as const).map(s => {
    const count = report.requests.filter(r => r.status === s).length
    const pct   = report.summary.total > 0 ? Math.round((count / report.summary.total) * 100) : 0
    return `
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
          <div style="display:flex;align-items:center;gap:6px">
            <div style="width:8px;height:8px;border-radius:50%;background:${statusColors[s]}"></div>
            <span style="font-size:11px;font-weight:700;color:${statusColors[s]}">${s.charAt(0)+s.slice(1).toLowerCase()}</span>
          </div>
          <span style="font-size:11px;font-weight:800;color:#374151">${count} <span style="color:#9CA3AF;font-weight:400">(${pct}%)</span></span>
        </div>
        ${bar(pct, statusColors[s])}
      </div>`
  }).join('')

  const tableRows = report.requests.map((r, i) => `
    <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
      <td style="padding:7px 10px;font-weight:700;color:#800020">#${r.queueNumber}</td>
      <td style="padding:7px 10px;font-weight:600">${r.user.name}</td>
      <td style="padding:7px 10px;font-family:monospace;font-size:10px">${r.user.idNumber}</td>
      <td style="padding:7px 10px;font-size:10px">${r.user.college ?? '—'}</td>
      <td style="padding:7px 10px;font-size:10px">${r.user.course ?? '—'}</td>
      <td style="padding:7px 10px">${r.documentType.name}</td>
      <td style="padding:7px 10px;color:#6B7280;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.purpose}</td>
      <td style="padding:7px 10px">
        <span style="display:inline-block;padding:2px 8px;border-radius:99px;font-size:9px;font-weight:700;text-transform:uppercase;background:${statusBg[r.status]};color:${statusColors[r.status]}">${r.status}</span>
      </td>
      <td style="padding:7px 10px;font-size:10px;color:#9CA3AF">${new Date(r.createdAt).toLocaleTimeString()}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html lang="en"><head>
  <meta charset="UTF-8"/>
  <title>Smart Queue Report — ${date}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,Helvetica,sans-serif;color:#1F2937;background:#fff;padding:24px;font-size:12px}
    @page{size:A4 landscape;margin:12mm}
    @media print{body{padding:0}}
  </style>
</head><body>

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #800020;padding-bottom:12px;margin-bottom:20px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div style="width:32px;height:32px;background:#D4AF37;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#800020">SQ</div>
        <span style="font-size:20px;font-weight:900;color:#800020">Smart Queue</span>
      </div>
      <div style="font-size:10px;color:#6B7280">MSU-IIT Document Request System — Daily Report</div>
    </div>
    <div style="text-align:right;font-size:11px;color:#6B7280">
      <div style="font-weight:700;color:#374151">${date}</div>
      <div>Generated: ${new Date().toLocaleString()}</div>
    </div>
  </div>

  <!-- Summary -->
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin-bottom:20px">
    ${[
      ['Total',      report.summary.total,      '#800020'],
      ['Pending',    report.summary.pending,    '#92400E'],
      ['Processing', report.summary.processing, '#1E40AF'],
      ['Ready',      report.summary.ready,      '#065F46'],
      ['Completed',  report.summary.completed,  '#5B21B6'],
      ['Rejected',   report.summary.rejected,   '#991B1B'],
    ].map(([l,v,c]) => `
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:10px;text-align:center;border-top:3px solid ${c}">
        <div style="font-size:22px;font-weight:900;color:${c}">${v}</div>
        <div style="font-size:9px;color:#6B7280;text-transform:uppercase;letter-spacing:.05em;margin-top:2px">${l}</div>
      </div>`).join('')}
  </div>

  <!-- Charts row -->
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px">
      <div style="font-size:11px;font-weight:800;color:#800020;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">Status Breakdown</div>
      ${statusBars}
    </div>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px">
      <div style="font-size:11px;font-weight:800;color:#800020;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">By College</div>
      ${collegeRows || '<div style="color:#9CA3AF;font-size:11px">No data</div>'}
    </div>
    <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px">
      <div style="font-size:11px;font-weight:800;color:#800020;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px">By Course (Top 10)</div>
      ${courseRows || '<div style="color:#9CA3AF;font-size:11px">No data</div>'}
    </div>
  </div>

  <!-- Requests table -->
  <div style="font-size:11px;font-weight:800;color:#800020;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">
    Requests (${report.requests.length})
  </div>
  ${report.requests.length === 0
    ? `<div style="text-align:center;padding:24px;color:#9CA3AF;background:#F9FAFB;border-radius:10px">No requests for this date.</div>`
    : `<table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead>
          <tr style="background:#800020;color:#fff">
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Queue #</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Student</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">ID</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">College</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Course</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Document</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Purpose</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Status</th>
            <th style="padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase">Time</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>`}

  <div style="margin-top:20px;font-size:9px;color:#9CA3AF;text-align:center;border-top:1px solid #E5E7EB;padding-top:10px">
    Smart Queue — MSU-IIT Document Request System · Confidential
  </div>
</body></html>`
}

export default function StaffDashboard() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<RequestStatus | 'ALL'>('ALL')
  const [selected, setSelected] = useState<Request | null>(null)
  const [actionMsg, setActionMsg] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [updating, setUpdating] = useState(false)
  const [rejectMode, setRejectMode] = useState(false)
  const [tab, setTab] = useState<Tab>('requests')
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const fetchRequests = async () => {
    setLoading(true); setError(null)
    try { const r = await axios.get("/api/staff/requests"); setRequests(r.data.data || []) }
    catch { setError("Failed to load requests.") }
    finally { setLoading(false) }
  }

  const fetchReport = async (date: string) => {
    setReportLoading(true); setReportError(null)
    try { const r = await axios.get(`/api/staff/report?date=${date}`); setReport(r.data.data) }
    catch { setReportError("Failed to load report.") }
    finally { setReportLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])
  useEffect(() => { if (tab === 'analytics') fetchReport(reportDate) }, [tab, reportDate])

  const filtered = filter === 'ALL' ? requests : requests.filter(r => r.status === filter)
  const recent = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5)

  const openModal = (req: Request) => { setSelected(req); setActionMsg(req.message || ''); setPickupDate(req.availablePickUp ? req.availablePickUp.slice(0,10) : ''); setRejectMode(false) }
  const closeModal = () => { setSelected(null); setRejectMode(false) }

  const handleUpdate = async (newStatus: RequestStatus) => {
    if (!selected) return
    setUpdating(true)
    try {
      await axios.patch(`/api/staff/requests/${selected.id}`, { status: newStatus, message: actionMsg || undefined, availablePickUp: pickupDate ? new Date(pickupDate).toISOString() : undefined })
      await fetchRequests(); closeModal()
    } catch { alert("Failed to update request.") }
    finally { setUpdating(false) }
  }

  const counts = { ALL: requests.length, PENDING: requests.filter(r=>r.status==='PENDING').length, PROCESSING: requests.filter(r=>r.status==='PROCESSING').length, READY: requests.filter(r=>r.status==='READY').length, COMPLETED: requests.filter(r=>r.status==='COMPLETED').length, REJECTED: requests.filter(r=>r.status==='REJECTED').length }
  const today = new Date().toDateString()
  const todayCount = requests.filter(r => new Date(r.createdAt).toDateString() === today).length

  // ── Export helpers ──────────────────────────────────────────────────────────

  // PDF: generate and download PDF using jsPDF
  const handleDownloadPDF = async () => {
    if (!report) return
    setExporting(true)
    try {
      const { default: jsPDF } = await import('jspdf')
      const html = buildReportHTML(report)
      
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;height:900px;border:none;visibility:hidden'
      document.body.appendChild(iframe)
      const iDoc = iframe.contentDocument!
      iDoc.open()
      iDoc.write(html)
      iDoc.close()
      await new Promise(r => setTimeout(r, 600))
      
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(iDoc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      document.body.removeChild(iframe)
      
      const imgData = canvas.toDataURL('image/png')
      const pdfWidth = 273 // A4 landscape width minus margins (297 - 24)
      const pdfHeight = 186 // A4 landscape height minus margins (210 - 24)
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = pdfWidth / imgWidth
      const scaledHeight = imgHeight * ratio
      
      const pdf = new jsPDF('l', 'mm', 'a4')
      
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 12, 12, pdfWidth, scaledHeight)
      } else {
        const img = new Image()
        img.src = imgData
        await new Promise(resolve => { img.onload = resolve })
        
        const totalPages = Math.ceil(scaledHeight / pdfHeight)
        
        for (let page = 0; page < totalPages; page++) {
          if (page > 0) {
            pdf.addPage()
          }
          
          const yMm = page * pdfHeight
          const sourceY = (yMm / scaledHeight) * imgHeight
          const heightMm = Math.min(pdfHeight, scaledHeight - yMm)
          const sourceHeight = (heightMm / scaledHeight) * imgHeight
          
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = imgWidth
          sliceCanvas.height = Math.ceil(sourceHeight)
          const sliceCtx = sliceCanvas.getContext('2d')!
          sliceCtx.drawImage(img, 0, sourceY, imgWidth, sourceHeight, 0, 0, imgWidth, sourceHeight)
          
          const sliceImgData = sliceCanvas.toDataURL('image/png')
          const sliceScaledHeight = heightMm
          
          pdf.addImage(sliceImgData, 'PNG', 12, 12, pdfWidth, sliceScaledHeight)
        }
      }
      
      pdf.save(`smart-queue-report-${reportDate}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to export PDF. Please try again.')
    }
    setExporting(false)
  }

  // Print: open clean HTML in new tab, user prints from there
  const handlePrint = () => {
    if (!report) return
    const html = buildReportHTML(report).replace(
      '</body>',
      `<script>
        window.addEventListener('load', function() {
          setTimeout(function() { window.print(); }, 500);
        });
      <\/script></body>`
    )
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
  }

  // PNG: render clean HTML in a hidden iframe, screenshot with html2canvas
  const handleDownloadImage = async () => {
    if (!report) return
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1200px;height:900px;border:none;visibility:hidden'
      document.body.appendChild(iframe)
      const iDoc = iframe.contentDocument!
      iDoc.open()
      iDoc.write(buildReportHTML(report))
      iDoc.close()
      await new Promise(r => setTimeout(r, 600))
      const canvas = await html2canvas(iDoc.body, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
      document.body.removeChild(iframe)
      canvas.toBlob(blob => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `smart-queue-report-${reportDate}.png`
        a.click()
      }, 'image/png')
    } catch (err) {
      console.error('PNG export error:', err)
      alert('Failed to export PNG. Please try again.')
    }
    setExporting(false)
  }

  const handleDownloadDocx = async () => {
    if (!report) return
    setExporting(true)
    try {
      const date = new Date(report.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      const collegeMap: Record<string, number> = {}
      const courseMap: Record<string, number> = {}
      for (const r of report.requests) {
        const col = r.user.college || 'N/A'
        const crs = r.user.course || 'N/A'
        collegeMap[col] = (collegeMap[col] ?? 0) + 1
        courseMap[crs] = (courseMap[crs] ?? 0) + 1
      }
      const colleges = Object.entries(collegeMap).sort((a, b) => b[1] - a[1])
      const courses = Object.entries(courseMap).sort((a, b) => b[1] - a[1]).slice(0, 10)

      const children: any[] = [
        new Paragraph({ children: [new TextRun({ text: 'SMART QUEUE - ANALYTICS REPORT', bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
        new Paragraph({ children: [new TextRun({ text: 'MSU-IIT Document Request System', size: 24, color: '666666' })], alignment: AlignmentType.CENTER, spacing: { after: 400 } }),
        new Paragraph({ children: [new TextRun({ text: `Report Date: ${date}`, size: 22 })], spacing: { after: 300 } }),
        new Paragraph({ children: [new TextRun({ text: 'SUMMARY', bold: true, size: 24 })], spacing: { after: 200 } })
      ]

      const summaryRows = [
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Status')] }), new TableCell({ children: [new Paragraph('Count')] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Total')] }), new TableCell({ children: [new Paragraph(String(report.summary.total))] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Pending')] }), new TableCell({ children: [new Paragraph(String(report.summary.pending))] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Processing')] }), new TableCell({ children: [new Paragraph(String(report.summary.processing))] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Ready')] }), new TableCell({ children: [new Paragraph(String(report.summary.ready))] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Completed')] }), new TableCell({ children: [new Paragraph(String(report.summary.completed))] })] }),
        new TableRow({ children: [new TableCell({ children: [new Paragraph('Rejected')] }), new TableCell({ children: [new Paragraph(String(report.summary.rejected))] })] })
      ]
      children.push(new Table({ rows: summaryRows, width: { size: 100, type: WidthType.PERCENTAGE } }))
      children.push(new Paragraph({ text: '', spacing: { before: 400 } }))

      if (colleges.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'BY COLLEGE', bold: true, size: 24 })], spacing: { after: 200 } }))
        const collegeRows = colleges.map(([col, cnt]) => new TableRow({ children: [new TableCell({ children: [new Paragraph(col)] }), new TableCell({ children: [new Paragraph(String(cnt))] })] }))
        children.push(new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph('College')] }), new TableCell({ children: [new Paragraph('Count')] })] }), ...collegeRows], width: { size: 100, type: WidthType.PERCENTAGE } }))
        children.push(new Paragraph({ text: '', spacing: { before: 400 } }))
      }

      if (courses.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'BY COURSE (Top 10)', bold: true, size: 24 })], spacing: { after: 200 } }))
        const courseRows = courses.map(([crs, cnt]) => new TableRow({ children: [new TableCell({ children: [new Paragraph(crs)] }), new TableCell({ children: [new Paragraph(String(cnt))] })] }))
        children.push(new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph('Course')] }), new TableCell({ children: [new Paragraph('Count')] })] }), ...courseRows], width: { size: 100, type: WidthType.PERCENTAGE } }))
        children.push(new Paragraph({ text: '', spacing: { before: 400 } }))
      }

      if (report.requests.length > 0) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'REQUESTS', bold: true, size: 24 })], spacing: { after: 200 } }))
        const requestHeaderRow = new TableRow({ children: [new TableCell({ children: [new Paragraph('Queue #')] }), new TableCell({ children: [new Paragraph('Student')] }), new TableCell({ children: [new Paragraph('ID Number')] }), new TableCell({ children: [new Paragraph('Document')] }), new TableCell({ children: [new Paragraph('Status')] })] })
        const requestRows = report.requests.map(r => new TableRow({ children: [new TableCell({ children: [new Paragraph(String(r.queueNumber))] }), new TableCell({ children: [new Paragraph(r.user.name)] }), new TableCell({ children: [new Paragraph(r.user.idNumber)] }), new TableCell({ children: [new Paragraph(r.documentType.name)] }), new TableCell({ children: [new Paragraph(r.status)] })] }))
        children.push(new Table({ rows: [requestHeaderRow, ...requestRows], width: { size: 100, type: WidthType.PERCENTAGE } }))
      }

      const doc = new Document({ sections: [{ children }] })
      const blob = await Packer.toBlob(doc)
      saveAs(blob, `smart-queue-report-${reportDate}.docx`)
    } catch (err) {
      console.error('DOCX export error:', err)
      alert('Failed to export DOCX. Please try again.')
    }
    setExporting(false)
  }

  const handleDownloadCSV = () => {
    if (!report) return
    const header = 'Queue #,Name,ID Number,College,Course,Document,Purpose,Status,Time\n'
    const rows = report.requests.map(r =>
      `${r.queueNumber},"${r.user.name}",${r.user.idNumber},${r.user.college??''},${r.user.course??''},"${r.documentType.name}","${r.purpose}",${r.status},${new Date(r.createdAt).toLocaleTimeString()}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `smart-queue-report-${reportDate}.csv`; a.click()
  }

  return (
    <>
    <div className="min-h-[calc(100vh-5rem)] px-3 sm:px-4 py-6 sm:py-8 max-w-6xl mx-auto fade-in">
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Staff Portal</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Request Management</h1>
          <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Welcome, {session?.user.name}</p>
        </div>
        <div className="card px-4 sm:px-5 py-3 text-center w-full sm:w-auto" style={{ borderTop: '3px solid var(--color-tertiary)' }}>
          <div className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>{todayCount}</div>
          <div className="text-xs font-semibold" style={{ color: '#6B7280' }}>Today&apos;s Queue</div>
        </div>
      </div>

      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: '#F3F4F6' }}>
        {(['requests', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 sm:px-5 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap"
            style={{ backgroundColor: tab===t?'#fff':'transparent', color: tab===t?'var(--color-secondary)':'#6B7280', boxShadow: tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none', border:'none', cursor:'pointer' }}>
            {t === 'requests' ? '📋 Requests' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {tab === 'requests' && (
        <>
          <div className="overflow-x-auto mb-6 -mx-3 px-3">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 min-w-125 sm:min-w-0">
              {(['ALL','PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as const).map(s => (
                <button key={s} onClick={() => setFilter(s)} className="card p-3 sm:p-4 text-center cursor-pointer transition-all hover:shadow-md"
                  style={{ borderTop: filter===s ? '3px solid var(--color-secondary)' : '3px solid transparent' }}>
                  <div className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>{counts[s]}</div>
                  <div className="text-xs font-semibold mt-1" style={{ color: '#6B7280' }}>{s==='ALL'?'Total':SL[s]}</div>
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>
          ) : error ? (
            <ErrorCard message={error} onRetry={fetchRequests} />
          ) : filtered.length === 0 ? (
            <div className="card p-8 sm:p-12 text-center"><div className="text-4xl mb-3">📭</div><p className="font-semibold text-sm sm:text-base" style={{ color:'#6B7280' }}>No requests found.</p></div>
          ) : (
            <div className="card overflow-hidden mb-8">
              <div className="overflow-x-auto -mx-3 px-3 sm:mx-0 sm:px-0">
                <div className="block sm:hidden space-y-3 p-3">
                  {filtered.map((req, i) => (
                    <div key={req.id} className="p-4 rounded-lg border" style={{ borderColor: 'var(--color-border)', backgroundColor: i%2===0?'#fff':'rgba(0,0,0,0.01)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-lg" style={{ color:'var(--color-secondary)' }}>#{req.queueNumber}</span>
                        <span className={SB[req.status]}>{SL[req.status]}</span>
                      </div>
                      <div className="text-sm font-semibold mb-1">{req.user.name}</div>
                      <div className="text-xs mb-2" style={{ color:'#9CA3AF' }}>{req.user.idNumber} · {req.documentType.name}</div>
                      <div className="text-xs mb-3" style={{ color:'#6B7280' }}>{req.purpose}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color:'#9CA3AF' }}>{new Date(req.createdAt).toLocaleDateString()}</span>
                        <button onClick={() => openModal(req)} className="btn btn-outline text-xs px-3 py-1.5">Manage</button>
                      </div>
                    </div>
                  ))}
                </div>
                <table className="hidden sm:table w-full text-sm">
                  <thead>
                    <tr style={{ backgroundColor:'rgba(128,0,32,0.05)', borderBottom:'1px solid var(--color-border)' }}>
                      {['Queue #','Student','Document','Purpose','Status','Submitted','Action'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color:'var(--color-secondary)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((req, i) => (
                      <tr key={req.id} style={{ borderBottom:'1px solid var(--color-border)', backgroundColor: i%2===0?'#fff':'rgba(0,0,0,0.01)' }} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold" style={{ color:'var(--color-secondary)' }}>#{req.queueNumber}</td>
                        <td className="px-4 py-3"><div className="font-semibold">{req.user.name}</div><div className="text-xs" style={{ color:'#9CA3AF' }}>{req.user.idNumber}</div></td>
                        <td className="px-4 py-3 font-medium">{req.documentType.name}</td>
                        <td className="px-4 py-3 max-w-xs truncate" style={{ color:'#6B7280' }}>{req.purpose}</td>
                        <td className="px-4 py-3"><span className={SB[req.status]}>{SL[req.status]}</span></td>
                        <td className="px-4 py-3 text-xs" style={{ color:'#9CA3AF' }}>{new Date(req.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3"><button onClick={() => openModal(req)} className="btn btn-outline text-xs px-3 py-1.5">Manage</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && recent.length > 0 && (
            <div className="card p-6">
              <h2 className="font-extrabold text-base mb-4" style={{ color:'var(--color-secondary)' }}>Recent Activity</h2>
              <div className="flex flex-col gap-2">
                {recent.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor:'#F9FAFB' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0"
                        style={{ backgroundColor:'rgba(128,0,32,0.08)', color:'var(--color-secondary)' }}>#{req.queueNumber}</div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color:'#374151' }}>{req.user.name} — {req.documentType.name}</p>
                        <p className="text-xs" style={{ color:'#9CA3AF' }}>{new Date(req.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</p>
                      </div>
                    </div>
                    <span className={SB[req.status]}>{SL[req.status]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'analytics' && (
        <div style={{ backgroundColor: '#fff', padding: '0.5rem' }}>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color:'#374151' }}>Report Date</label>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                style={{ padding:'0.5rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleDownloadPDF} disabled={exporting} className="btn btn-primary text-xs px-4 py-2">
                {exporting ? '⏳...' : '📥 PDF'}
              </button>
              <button onClick={handlePrint} disabled={exporting} className="btn btn-outline text-xs px-4 py-2">
                🖨 Print
              </button>
              <button onClick={handleDownloadImage} disabled={exporting} className="btn btn-outline text-xs px-4 py-2">
                🖼 PNG
              </button>
              <button onClick={handleDownloadDocx} disabled={exporting} className="btn btn-outline text-xs px-4 py-2">
                📄 DOCX
              </button>
              <button onClick={handleDownloadCSV} disabled={exporting} className="btn btn-outline text-xs px-4 py-2">
                📊 CSV
              </button>
            </div>
          </div>

          {reportLoading && <div className="flex justify-center py-16"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>}
          {reportError && <ErrorCard message={reportError} onRetry={() => fetchReport(reportDate)} />}

          {report && !reportLoading && (
            <>
              {/* Summary stat cards */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {([
                  ['total',      report.summary.total,      '#800020', '📋'],
                  ['pending',    report.summary.pending,    '#92400E', '⏳'],
                  ['processing', report.summary.processing, '#1E40AF', '⚙️'],
                  ['ready',      report.summary.ready,      '#065F46', '✅'],
                  ['completed',  report.summary.completed,  '#5B21B6', '🎉'],
                  ['rejected',   report.summary.rejected,   '#991B1B', '✕'],
                ] as [string, number, string, string][]).map(([k, v, c, icon]) => (
                  <div key={k} className="stat-card text-center">
                    <div className="text-lg mb-1">{icon}</div>
                    <div className="text-2xl font-black" style={{ color: c }}>{v}</div>
                    <div className="text-xs font-semibold capitalize mt-0.5" style={{ color:'#6B7280' }}>{k}</div>
                  </div>
                ))}
              </div>

              <div className="card p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-black text-base" style={{ color:'var(--color-secondary)' }}>Status Breakdown</h2>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ backgroundColor:'rgba(128,0,32,0.07)', color:'var(--color-secondary)' }}>
                    {report.summary.total} total
                  </span>
                </div>
                <div className="flex flex-col gap-4">
                  {(['PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as RequestStatus[]).map(s => {
                    const count = report.requests.filter(r => r.status === s).length
                    const pct = report.summary.total > 0 ? Math.round((count / report.summary.total) * 100) : 0
                    return (
                      <div key={s}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: SC[s] }} />
                            <span className="text-xs font-bold" style={{ color: SC[s] }}>{SL[s]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black" style={{ color:'#374151' }}>{count}</span>
                            <span className="text-xs" style={{ color:'#9CA3AF' }}>({pct}%)</span>
                          </div>
                        </div>
                        <div className="chart-bar">
                          <div className="chart-bar-fill" style={{ width:`${pct}%`, backgroundColor: SC[s] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {report.requests.length > 0 && (() => {
                const collegeMap: Record<string, number> = {}
                const courseMap: Record<string, number> = {}
                for (const r of report.requests) {
                  const col = r.user.college || 'N/A'
                  const crs = r.user.course  || 'N/A'
                  collegeMap[col] = (collegeMap[col] ?? 0) + 1
                  courseMap[crs]  = (courseMap[crs]  ?? 0) + 1
                }
                const colleges = Object.entries(collegeMap).sort((a,b) => b[1]-a[1])
                const courses  = Object.entries(courseMap).sort((a,b) => b[1]-a[1]).slice(0, 10)
                const maxCol = colleges[0]?.[1] ?? 1
                const maxCrs = courses[0]?.[1] ?? 1
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                    <div className="card p-6">
                      <h2 className="font-black text-base mb-4" style={{ color:'var(--color-secondary)' }}>By College</h2>
                      <div className="flex flex-col gap-3">
                        {colleges.map(([col, cnt]) => (
                          <div key={col}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold" style={{ color:'#374151' }}>{col}</span>
                              <span className="text-xs font-black" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="chart-bar">
                              <div className="chart-bar-fill" style={{ width:`${Math.round((cnt/maxCol)*100)}%`, background:'linear-gradient(90deg, var(--color-secondary), var(--color-dark))' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-6">
                      <h2 className="font-black text-base mb-4" style={{ color:'var(--color-secondary)' }}>
                        By Course <span className="text-xs font-normal" style={{ color:'#9CA3AF' }}>(top 10)</span>
                      </h2>
                      <div className="flex flex-col gap-3">
                        {courses.map(([crs, cnt]) => (
                          <div key={crs}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-xs font-bold" style={{ color:'#374151' }}>{crs}</span>
                              <span className="text-xs font-black" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="chart-bar">
                              <div className="chart-bar-fill" style={{ width:`${Math.round((cnt/maxCrs)*100)}%`, background:'linear-gradient(90deg, var(--color-tertiary), var(--color-highlighted))' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}

              {report.requests.length === 0 ? (
                <div className="card p-12 text-center"><div className="text-4xl mb-3">📭</div><p className="font-semibold" style={{ color:'#6B7280' }}>No requests for this date.</p></div>
              ) : (
                <div className="card overflow-hidden">
                  <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom:'1px solid var(--color-border)' }}>
                    <h2 className="font-extrabold text-sm" style={{ color:'var(--color-secondary)' }}>
                      Requests — {new Date(report.date).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
                    </h2>
                    <span className="text-xs" style={{ color:'#9CA3AF' }}>{report.requests.length} total</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr style={{ backgroundColor:'rgba(128,0,32,0.05)', borderBottom:'1px solid var(--color-border)' }}>
                          {['Queue #','Student','ID','College','Course','Document','Purpose','Status','Time'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide" style={{ color:'var(--color-secondary)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {report.requests.map((req, i) => (
                          <tr key={req.id} style={{ borderBottom:'1px solid var(--color-border)', backgroundColor: i%2===0?'#fff':'rgba(0,0,0,0.01)' }}>
                            <td className="px-4 py-3 font-bold" style={{ color:'var(--color-secondary)' }}>#{req.queueNumber}</td>
                            <td className="px-4 py-3 font-semibold">{req.user.name}</td>
                            <td className="px-4 py-3 font-mono text-xs">{req.user.idNumber}</td>
                            <td className="px-4 py-3 text-xs">{req.user.college ?? '—'}</td>
                            <td className="px-4 py-3 text-xs">{req.user.course ?? '—'}</td>
                            <td className="px-4 py-3">{req.documentType.name}</td>
                            <td className="px-4 py-3 max-w-xs truncate" style={{ color:'#6B7280' }}>{req.purpose}</td>
                            <td className="px-4 py-3"><span className={SB[req.status]}>{SL[req.status]}</span></td>
                            <td className="px-4 py-3 text-xs" style={{ color:'#9CA3AF' }}>{new Date(req.createdAt).toLocaleTimeString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>

    {selected && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor:'rgba(0,0,0,0.5)' }}
        onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
        <div className="card w-full max-w-lg p-6 fade-in">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-extrabold" style={{ color:'var(--color-secondary)' }}>Queue #{selected.queueNumber} — {selected.documentType.name}</h2>
              <p className="text-sm mt-0.5" style={{ color:'#6B7280' }}>{selected.user.name} · {selected.user.idNumber}</p>
            </div>
            <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
          </div>
          <div className="flex flex-col gap-3 mb-5 text-sm">
            <div className="p-3 rounded-lg" style={{ backgroundColor:'rgba(128,0,32,0.04)' }}>
              <span className="font-semibold" style={{ color:'var(--color-secondary)' }}>Purpose: </span>{selected.purpose}
            </div>
            {selected.notes && <div className="p-3 rounded-lg" style={{ backgroundColor:'#F9FAFB' }}><span className="font-semibold">Notes: </span>{selected.notes}</div>}
            <div className="flex items-center gap-2"><span className="font-semibold">Status:</span><span className={SB[selected.status]}>{SL[selected.status]}</span></div>
          </div>
          <div className="flex flex-col gap-1 mb-3">
            <label className="text-xs font-semibold" style={{ color:'#374151' }}>Message to student (optional)</label>
            <textarea value={actionMsg} onChange={e => setActionMsg(e.target.value)} placeholder="Add a note for the student..." className="resize-none" rows={2}
              style={{ padding:'0.65rem 0.9rem', border:'1.5px solid var(--color-border)', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }} />
          </div>
          {(selected.status === 'PROCESSING' || selected.status === 'READY') && (
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-semibold" style={{ color:'#374151' }}>Available Pick-up Date</label>
              <input type="date" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                style={{ padding:'0.65rem 0.9rem', border:'1.5px solid var(--color-border)', borderRadius:'8px', fontSize:'0.9rem', outline:'none', width:'100%' }} />
            </div>
          )}
          <div className="flex flex-wrap gap-2 justify-end">
            {!rejectMode && NS[selected.status] && (
              <button onClick={() => handleUpdate(NS[selected.status]!)} className="btn btn-primary" disabled={updating}>
                {updating ? 'Updating...' : `Mark as ${SL[NS[selected.status]!]}`}
              </button>
            )}
            {selected.status !== 'REJECTED' && selected.status !== 'COMPLETED' && !rejectMode && (
              <button onClick={() => setRejectMode(true)} className="btn" style={{ backgroundColor:'#FEE2E2', color:'#991B1B', border:'none' }}>Reject</button>
            )}
            {rejectMode && (
              <>
                <p className="w-full text-sm font-medium" style={{ color:'#991B1B' }}>Confirm rejection?</p>
                <button onClick={() => handleUpdate('REJECTED')} className="btn" style={{ backgroundColor:'#991B1B', color:'#fff', border:'none' }} disabled={updating}>
                  {updating ? 'Rejecting...' : 'Yes, Reject'}
                </button>
                <button onClick={() => setRejectMode(false)} className="btn btn-outline">Cancel</button>
              </>
            )}
            <button onClick={closeModal} className="btn btn-outline">Close</button>
          </div>
        </div>
      </div>
    )}
    </>
  )
}