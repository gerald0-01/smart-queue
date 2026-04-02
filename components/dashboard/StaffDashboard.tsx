'use client'
import ErrorCard from "@/components/ErrorCard"
import { useSession } from "next-auth/react"
import axios from "axios"
import { useEffect, useState } from "react"

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

function buildPrintHTML(report: ReportData): string {
  const date = new Date(report.date).toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' })

  // College breakdown
  const collegeMap: Record<string, number> = {}
  const courseMap: Record<string, number> = {}
  for (const r of report.requests) {
    const col = r.user.college || 'N/A'
    const crs = r.user.course || 'N/A'
    collegeMap[col] = (collegeMap[col] ?? 0) + 1
    courseMap[crs] = (courseMap[crs] ?? 0) + 1
  }
  const collegeRows = Object.entries(collegeMap).sort((a,b) => b[1]-a[1])
    .map(([k,v]) => `<tr><td>${k}</td><td style="text-align:right;font-weight:700">${v}</td></tr>`).join('')
  const courseRows = Object.entries(courseMap).sort((a,b) => b[1]-a[1]).slice(0,10)
    .map(([k,v]) => `<tr><td>${k}</td><td style="text-align:right;font-weight:700">${v}</td></tr>`).join('')

  const rows = report.requests.map((r, i) => `
    <tr style="background:${i%2===0?'#fff':'#f9fafb'}">
      <td>#${r.queueNumber}</td>
      <td>${r.user.name}</td>
      <td>${r.user.idNumber}</td>
      <td>${r.user.college ?? '—'}</td>
      <td>${r.user.course ?? '—'}</td>
      <td>${r.documentType.name}</td>
      <td>${r.purpose}</td>
      <td>${r.status}</td>
      <td>${new Date(r.createdAt).toLocaleTimeString()}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><title>Smart Queue Report — ${date}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:Arial,sans-serif;margin:32px;color:#1f2937;font-size:13px}
    h2{color:#800020;font-size:13px;font-weight:900;margin:24px 0 8px;text-transform:uppercase;letter-spacing:.5px}
    .header{display:table;width:100%;border-bottom:3px solid #800020;padding-bottom:12px;margin-bottom:20px}
    .header-left{display:table-cell;vertical-align:middle}
    .header-right{display:table-cell;vertical-align:middle;text-align:right;font-size:11px;color:#6b7280}
    .brand{font-size:20px;font-weight:900;color:#800020}
    .sub{font-size:10px;color:#6b7280;margin-top:2px}
    .summary{display:table;width:100%;margin-bottom:20px;border-spacing:8px}
    .summary-row{display:table-row}
    .stat{display:table-cell;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center;width:16.6%}
    .stat-val{font-size:20px;font-weight:900;color:#800020}
    .stat-lbl{font-size:9px;color:#6b7280;text-transform:uppercase;margin-top:2px}
    .two-col{display:table;width:100%;margin-bottom:20px}
    .col{display:table-cell;width:50%;vertical-align:top;padding-right:12px}
    .col:last-child{padding-right:0;padding-left:12px}
    table.data{width:100%;border-collapse:collapse;font-size:11px}
    table.data th{background:#800020;color:#fff;padding:7px 9px;text-align:left;font-size:10px;text-transform:uppercase}
    table.data td{padding:6px 9px;border-bottom:1px solid #e5e7eb}
    table.mini{width:100%;border-collapse:collapse;font-size:11px}
    table.mini th{background:#f3f4f6;color:#374151;padding:6px 8px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase}
    table.mini td{padding:5px 8px;border-bottom:1px solid #f3f4f6}
    .footer{margin-top:24px;font-size:10px;color:#9ca3af;text-align:center;border-top:1px solid #e5e7eb;padding-top:12px}
    @media print{
      body{margin:16px}
      @page{size:A4 landscape;margin:16mm}
      button{display:none!important}
    }
  </style></head><body>
  <div class="header">
    <div class="header-left">
      <div class="brand">Smart Queue</div>
      <div class="sub">MSU-IIT Document Request System — Daily Report</div>
    </div>
    <div class="header-right">${date}<br/>Generated: ${new Date().toLocaleString()}</div>
  </div>

  <h2>Summary</h2>
  <table style="width:100%;border-collapse:separate;border-spacing:8px;margin-bottom:16px">
    <tr>
      ${[['Total',report.summary.total,'#800020'],['Pending',report.summary.pending,'#92400e'],['Processing',report.summary.processing,'#1e40af'],['Ready',report.summary.ready,'#065f46'],['Completed',report.summary.completed,'#5b21b6'],['Rejected',report.summary.rejected,'#991b1b']]
        .map(([l,v,c]) => `<td style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:20px;font-weight:900;color:${c}">${v}</div>
          <div style="font-size:9px;color:#6b7280;text-transform:uppercase;margin-top:2px">${l}</div>
        </td>`).join('')}
    </tr>
  </table>

  <div class="two-col">
    <div class="col">
      <h2>By College</h2>
      <table class="mini"><thead><tr><th>College</th><th style="text-align:right">Count</th></tr></thead>
      <tbody>${collegeRows || '<tr><td colspan="2" style="color:#9ca3af">No data</td></tr>'}</tbody></table>
    </div>
    <div class="col">
      <h2>By Course (Top 10)</h2>
      <table class="mini"><thead><tr><th>Course</th><th style="text-align:right">Count</th></tr></thead>
      <tbody>${courseRows || '<tr><td colspan="2" style="color:#9ca3af">No data</td></tr>'}</tbody></table>
    </div>
  </div>

  <h2>Requests</h2>
  <table class="data">
    <thead><tr><th>Queue #</th><th>Student</th><th>ID Number</th><th>College</th><th>Course</th><th>Document</th><th>Purpose</th><th>Status</th><th>Time</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9" style="text-align:center;color:#9ca3af;padding:20px">No requests for this date.</td></tr>'}</tbody>
  </table>
  <div class="footer">Smart Queue — MSU-IIT Document Request System</div>
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
  // Analytics
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState<ReportData | null>(null)
  const [reportLoading, setReportLoading] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

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

  // Today's count
  const today = new Date().toDateString()
  const todayCount = requests.filter(r => new Date(r.createdAt).toDateString() === today).length

  // ── Export helpers ──────────────────────────────────────────────────────────
  const handlePrint = () => {
    if (!report) return
    const win = window.open('', '_blank')!
    win.document.write(buildPrintHTML(report))
    win.document.close()
    win.focus()
    win.print()
  }

  const handleDownloadDocx = () => {
    if (!report) return
    const date = new Date(report.date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })
    const rows = report.requests.map(r =>
      `${r.queueNumber}\t${r.user.name}\t${r.user.idNumber}\t${r.user.college??'—'}\t${r.user.course??'—'}\t${r.documentType.name}\t${r.purpose}\t${r.status}\t${new Date(r.createdAt).toLocaleTimeString()}`
    ).join('\n')
    const text = `SMART QUEUE — DAILY REPORT\nMSU-IIT Document Request System\nDate: ${date}\n\nSUMMARY\nTotal: ${report.summary.total}\tPending: ${report.summary.pending}\tProcessing: ${report.summary.processing}\tReady: ${report.summary.ready}\tCompleted: ${report.summary.completed}\tRejected: ${report.summary.rejected}\n\nREQUESTS\nQueue #\tName\tID Number\tCollege\tCourse\tDocument\tPurpose\tStatus\tTime\n${rows}`
    const blob = new Blob([text], { type: 'application/msword' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `smart-queue-report-${reportDate}.doc`; a.click()
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

  const handleDownloadPDF = () => {
    if (!report) return
    const win = window.open('', '_blank')!
    const html = buildPrintHTML(report)
    // Inject auto-print + close so "Save as PDF" dialog opens immediately
    const withAutoprint = html.replace('</body>', `<script>window.onload=function(){window.print();window.onafterprint=function(){window.close()}}<\/script></body>`)
    win.document.write(withAutoprint)
    win.document.close()
  }

  return (
    <>
    <div className="min-h-[calc(100vh-5rem)] px-4 py-8 max-w-6xl mx-auto fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-tertiary)' }}>Staff Portal</p>
          <h1 className="text-3xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>Request Management</h1>
          <div className="gold-divider mt-2" style={{ margin: '0.5rem 0 0' }} />
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>Welcome, {session?.user.name}</p>
        </div>
        {/* Today's queue count */}
        <div className="card px-5 py-3 text-center" style={{ borderTop: '3px solid var(--color-tertiary)' }}>
          <div className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>{todayCount}</div>
          <div className="text-xs font-semibold" style={{ color: '#6B7280' }}>Today&apos;s Queue</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ backgroundColor: '#F3F4F6' }}>
        {(['requests', 'analytics'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{ backgroundColor: tab===t?'#fff':'transparent', color: tab===t?'var(--color-secondary)':'#6B7280', boxShadow: tab===t?'0 1px 4px rgba(0,0,0,0.08)':'none', border:'none', cursor:'pointer' }}>
            {t === 'requests' ? '📋 Requests' : '📊 Analytics'}
          </button>
        ))}
      </div>

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <>
          {/* Status filter cards */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
            {(['ALL','PENDING','PROCESSING','READY','COMPLETED','REJECTED'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} className="card p-4 text-center cursor-pointer transition-all hover:shadow-md"
                style={{ borderTop: filter===s ? '3px solid var(--color-secondary)' : '3px solid transparent' }}>
                <div className="text-2xl font-extrabold" style={{ color: 'var(--color-secondary)' }}>{counts[s]}</div>
                <div className="text-xs font-semibold mt-1" style={{ color: '#6B7280' }}>{s==='ALL'?'Total':SL[s]}</div>
              </button>
            ))}
          </div>

          {/* Requests table */}
          {loading ? (
            <div className="flex justify-center py-16"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>
          ) : error ? (
            <ErrorCard message={error} onRetry={fetchRequests} />
          ) : filtered.length === 0 ? (
            <div className="card p-12 text-center"><div className="text-4xl mb-3">📭</div><p className="font-semibold" style={{ color:'#6B7280' }}>No requests found.</p></div>
          ) : (
            <div className="card overflow-hidden mb-8">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
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

          {/* Recent activity */}
          {!loading && recent.length > 0 && (
            <div className="card p-6">
              <h2 className="font-extrabold text-base mb-4" style={{ color:'var(--color-secondary)' }}>Recent Activity</h2>
              <div className="flex flex-col gap-2">
                {recent.map(req => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor:'#F9FAFB' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold flex-shrink-0"
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

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <div>
          {/* Date picker + export */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold" style={{ color:'#374151' }}>Report Date</label>
              <input type="date" value={reportDate} onChange={e => setReportDate(e.target.value)}
                style={{ padding:'0.5rem 0.75rem', border:'1.5px solid var(--color-border)', borderRadius:'8px', fontSize:'0.9rem', outline:'none' }} />
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={handleDownloadPDF} className="btn btn-primary text-xs px-4 py-2">📥 PDF</button>
              <button onClick={handlePrint} className="btn btn-outline text-xs px-4 py-2">🖨 Print</button>
              <button onClick={handleDownloadDocx} className="btn btn-outline text-xs px-4 py-2">📄 DOC</button>
              <button onClick={handleDownloadCSV} className="btn btn-outline text-xs px-4 py-2">📊 CSV</button>
            </div>
          </div>

          {reportLoading && <div className="flex justify-center py-16"><div className="spinner" style={{ width:'2.5rem', height:'2.5rem', borderWidth:'4px' }} /></div>}
          {reportError && <ErrorCard message={reportError} onRetry={() => fetchReport(reportDate)} />}

          {report && !reportLoading && (
            <>
              {/* Summary cards */}
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

              {/* Bar chart */}
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

              {/* College & Course breakdown */}
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

    {/* ── MANAGE MODAL ── */}
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
