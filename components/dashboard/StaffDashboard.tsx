'use client'
import ErrorCard from "@/components/ErrorCard"
import { useSession } from "next-auth/react"
import axios from "axios"
import { useEffect, useState, useRef } from "react"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"
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
  const analyticsRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [showWatermark, setShowWatermark] = useState(false)

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

  // Export functions
  const handlePrint = async () => {
    if (!analyticsRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(analyticsRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.autoPrint()
      window.open(pdf.output('bloburl'), '_blank')
    } catch (err) {
      console.error('Print error:', err)
      alert('Failed to print. Please try again.')
    }
    setExporting(false)
  }

  const handleDownloadPDF = async () => {
    if (!analyticsRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(analyticsRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= 297
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= 297
      }
      pdf.save(`smart-queue-analytics-${reportDate}.pdf`)
    } catch (err) {
      console.error('PDF export error:', err)
      alert('Failed to export PDF. Please try again.')
    }
    setExporting(false)
  }

  const handleDownloadImage = async () => {
    if (!analyticsRef.current) return
    setExporting(true)
    try {
      const canvas = await html2canvas(analyticsRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      canvas.toBlob((blob) => { if (blob) { saveAs(blob, `smart-queue-analytics-${reportDate}.png`) } }, 'image/png')
    } catch (err) {
      console.error('Image export error:', err)
      alert('Failed to export image. Please try again.')
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 min-w-[500px] sm:min-w-0">
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
        <div ref={analyticsRef} style={{ backgroundColor: '#fff', padding: '1rem', position: 'relative' }}>
          {showWatermark && (
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', 
              fontSize: '4rem', fontWeight: 'bold', color: 'rgba(128, 0, 32, 0.1)', 
              whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 999 }}>
              SMART QUEUE • CONFIDENTIAL
            </div>
          )}
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
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
                {(['total','pending','processing','ready','completed','rejected'] as const).map(k => (
                  <div key={k} className="card p-4 text-center">
                    <div className="text-2xl font-extrabold" style={{ color: k==='total'?'var(--color-secondary)':SC[k.toUpperCase()] ?? 'var(--color-secondary)' }}>
                      {report.summary[k]}
                    </div>
                    <div className="text-xs font-semibold mt-1 capitalize" style={{ color:'#6B7280' }}>{k}</div>
                  </div>
                ))}
              </div>

              <div className="card p-6 mb-6">
                <h2 className="font-extrabold text-base mb-4" style={{ color:'var(--color-secondary)' }}>Status Breakdown</h2>
                <div className="flex flex-col gap-3">
                  {(['PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as RequestStatus[]).map(s => {
                    const count = report.requests.filter(r => r.status === s).length
                    const pct = report.summary.total > 0 ? Math.round((count / report.summary.total) * 100) : 0
                    return (
                      <div key={s}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold" style={{ color: SC[s] }}>{SL[s]}</span>
                          <span className="text-xs font-bold" style={{ color:'#374151' }}>{count} ({pct}%)</span>
                        </div>
                        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor:'#F3F4F6' }}>
                          <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, backgroundColor: SC[s] }} />
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
                      <h2 className="font-extrabold text-base mb-4" style={{ color:'var(--color-secondary)' }}>By College</h2>
                      <div className="flex flex-col gap-3">
                        {colleges.map(([col, cnt]) => (
                          <div key={col}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold" style={{ color:'#374151' }}>{col}</span>
                              <span className="text-xs font-bold" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor:'#F3F4F6' }}>
                              <div className="h-full rounded-full" style={{ width:`${Math.round((cnt/maxCol)*100)}%`, backgroundColor:'var(--color-secondary)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="card p-6">
                      <h2 className="font-extrabold text-base mb-4" style={{ color:'var(--color-secondary)' }}>
                        By Course <span className="text-xs font-normal" style={{ color:'#9CA3AF' }}>(top 10)</span>
                      </h2>
                      <div className="flex flex-col gap-3">
                        {courses.map(([crs, cnt]) => (
                          <div key={crs}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold" style={{ color:'#374151' }}>{crs}</span>
                              <span className="text-xs font-bold" style={{ color:'var(--color-secondary)' }}>{cnt}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor:'#F3F4F6' }}>
                              <div className="h-full rounded-full" style={{ width:`${Math.round((cnt/maxCrs)*100)}%`, backgroundColor:'var(--color-tertiary)' }} />
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