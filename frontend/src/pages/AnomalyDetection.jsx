import { useEffect, useState } from 'react'
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
    getAnomalyKpis, getAnomalySummary, getAnomalyDetail,
    getAnomalyChart, getAnomalyBilling, getAnomalyMetrics,
    resolveAnomaly, exportAnomalyUrl, getAnomalyAIExplain
} from '../api.js'

const VM_LIST = ['vm-05', 'vm-09', 'vm-12', 'vm-07', 'vm-06']

const SEV_BADGE = {
    HIGH: 'badge badge-red',
    MEDIUM: 'badge badge-amber',
}

const ANOMALY_LABELS = {
    'vm-05': 'Cost Spike — No CPU Change',
    'vm-09': 'Orphaned Billing Gap',
    'vm-12': 'Gradual Cost Creep',
    'vm-07': 'Reservation Not Applied',
    'vm-06': 'Resize — No Cost Drop',
}

export default function AnomalyDetection() {
    const [kpis, setKpis] = useState(null)
    const [summary, setSummary] = useState([])
    const [selectedVm, setSelectedVm] = useState('vm-05')
    const [detail, setDetail] = useState(null)
    const [chartData, setChartData] = useState(null)
    const [billing, setBilling] = useState(null)
    const [metrics, setMetrics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [detailLoad, setDetailLoad] = useState(false)
    const [aiData, setAiData] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [toast, setToast] = useState('')
    const [actionInfo, setActionInfo] = useState({})
    const [showBilling, setShowBilling] = useState(false)
    const [showMetrics, setShowMetrics] = useState(false)
    const [fixFlow, setFixFlow] = useState(null) // null | 'ask' | 'proceed' | 'review' | 'chat'
    const [chatInput, setChatInput] = useState('')
    const [chatReply, setChatReply] = useState('')
    const [chatLoading, setChatLoading] = useState(false)

    // Load KPIs and summary once
    useEffect(() => {
        Promise.all([
            getAnomalyKpis().then(setKpis),
            getAnomalySummary().then(data => setSummary([...data].sort((a, b) => b.saving - a.saving))),
        ]).catch(console.error).finally(() => setLoading(false))
    }, [])

    // Load detail when VM changes
    useEffect(() => {
        setDetailLoad(true)
        setDetail(null)
        setChartData(null)
        setBilling(null)
        setMetrics(null)
        setActionInfo({})
        setShowBilling(false)
        setShowMetrics(false)
        setAiData(null)
        setAiLoading(true)
        setFixFlow(null)
        setChatInput('')
        setChatReply('')


        Promise.all([
            getAnomalyDetail(selectedVm).then(setDetail),
            getAnomalyChart(selectedVm).then(setChartData),
        ]).catch(console.error).finally(() => setDetailLoad(false))

        // Load AI explanation separately (may take a few seconds)
        getAnomalyAIExplain(selectedVm)
            .then(setAiData)
            .catch(() => setAiData(null))
            .finally(() => setAiLoading(false))
    }, [selectedVm])

    function showToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(''), 3500)
    }

    async function handleResolve() {
        try {
            const res = await resolveAnomaly(selectedVm)
            showToast(`✅ ${res.message}`)
        } catch (e) {
            showToast('❌ Failed to resolve. Check backend.')
        }
    }

    async function handleAuditBilling() {
        if (billing) { setShowBilling(s => !s); return }
        const res = await getAnomalyBilling(selectedVm)
        setBilling(res)
        setShowBilling(true)
        setActionInfo(s => ({ ...s, audit: detail?.action_audit }))
    }

    async function handleAuditMetrics() {
        if (metrics) { setShowMetrics(s => !s); return }
        const res = await getAnomalyMetrics(selectedVm)
        setMetrics(res)
        setShowMetrics(true)
    }

    function handleAlertOwner() {
        setActionInfo(s => ({ ...s, email: detail?.action_email }))
        showToast('📧 Alert drafted for VM owner')
    }

    function handleFix() {
        setFixFlow('ask')
        setActionInfo(s => ({ ...s, fix: detail?.action_fix }))
    }

    async function handleFixProceed() {
        setFixFlow('proceed')
        showToast('✅ Action initiated by AI')
    }

    function handleFixReview() {
        setFixFlow('review')
        setShowBilling(true)
        if (!billing) {
            getAnomalyBilling(selectedVm).then(res => {
                setBilling(res)
            })
        }
    }

    async function handleAskMore() {
        if (!chatInput.trim()) return
        setChatLoading(true)
        try {
            const res = await fetch('http://127.0.0.1:8000/api/anomalies/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vm_id: selectedVm,
                    question: chatInput,
                    context: detail?.explanation
                })
            })
            const data = await res.json()
            setChatReply(data.reply)
        } catch (e) {
            setChatReply('Could not get a response. Please check backend.')
        }
        setChatLoading(false)
    }

    // Build chart data arrays
    function buildTimeseriesData(chart) {
        if (!chart?.data) return []
        const { billing, metrics } = chart.data
        if (!billing || !metrics) return []
        // Sample every 6th billing point to keep chart readable
        return billing.timestamps
            .filter((_, i) => i % 6 === 0)
            .map((ts, i) => ({
                time: ts.slice(5, 16), // "MM-DD HH:MM"
                cost: parseFloat(billing.cost[i * 6]?.toFixed(4) ?? 0),
                cpu: parseFloat(metrics.cpu[i * 4]?.toFixed(1) ?? 0),
                netIn: parseFloat(metrics.network_in[i * 4]?.toFixed(1) ?? 0),
            }))
    }

    function buildWeeklyData(chart) {
        if (!chart?.data) return []
        const { weeks, cost } = chart.data
        return weeks.map((w, i) => ({ week: w, cost: parseFloat(cost[i]?.toFixed(4) ?? 0) }))
    }

    const isWeekly = chartData?.type === 'weekly_creep'
    const tsData = !isWeekly ? buildTimeseriesData(chartData) : []
    const weeklyData = isWeekly ? buildWeeklyData(chartData) : []

    if (loading) return <div className="loading"><div className="spinner" /> Loading anomaly data...</div>

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">🔍 Spend Anomaly Detection</h1>
                <p className="page-subtitle">
                    Azure FinOps AI · 17 VMs · January 2026 · Spend anomaly detection powered by statistical distributions
                </p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-teal">
                    <div className="kpi-label">Anomaly Types</div>
                    <div className="kpi-value">{kpis?.total_anomaly_types ?? '—'}</div>
                    <div className="kpi-sub">Active anomaly patterns</div>
                </div>
                <div className="kpi-card kpi-red">
                    <div className="kpi-label">🔴 HIGH</div>
                    <div className="kpi-value">{kpis?.high_severity ?? '—'}</div>
                    <div className="kpi-sub">vm-05, vm-09, vm-06</div>
                </div>
                <div className="kpi-card kpi-amber">
                    <div className="kpi-label">🟠 MEDIUM</div>
                    <div className="kpi-value">{kpis?.medium_severity ?? '—'}</div>
                    <div className="kpi-sub">vm-12, vm-07</div>
                </div>
                <div className="kpi-card kpi-red">
                    <div className="kpi-label">Est. Monthly Loss</div>
                    <div className="kpi-value">${kpis?.estimated_monthly_loss ?? '—'}</div>
                    <div className="kpi-sub">Cost at risk</div>
                </div>
                <div className="kpi-card kpi-blue">
                    <div className="kpi-label">VMs Affected</div>
                    <div className="kpi-value">{kpis?.vms_affected ?? '—'} / {kpis?.total_vms ?? '—'}</div>
                    <div className="kpi-sub">Out of 17 total VMs</div>
                </div>
            </div>

            {/* Overview table */}
            <div className="card mb-28">
                <div className="card-title">📋 All Detected Anomalies — Overview</div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>VM</th>
                                <th>Anomaly Type</th>
                                <th>Severity</th>
                                <th>Dates / Scope</th>
                                <th>Confidence</th>
                                <th>Est. Monthly Saving</th>
                                <th>Owner</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map(r => (
                                <tr
                                    key={r.vm_id}
                                    style={{ cursor: 'pointer', background: selectedVm === r.vm_id ? 'rgba(46,117,182,0.1)' : '' }}
                                    onClick={() => setSelectedVm(r.vm_id)}
                                >
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                            {r.vm_id}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{r.title}</td>
                                    <td><span className={SEV_BADGE[r.severity]}>{r.severity}</span></td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.dates}</td>
                                    <td style={{ whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 100,
                                                height: 9,
                                                borderRadius: 6,
                                                background: '#64748B',
                                                overflow: 'hidden',
                                                flexShrink: 0,
                                            }}>
                                                <div style={{
                                                    width: `${r.confidence * 100}%`,
                                                    height: '100%',
                                                    borderRadius: 6,
                                                    background: '#4A9FD4',
                                                }} />
                                            </div>
                                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>
                                                {Math.round(r.confidence * 100)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--teal)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                        ${r.saving}/mo
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{r.owner}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
                    👆 Click any row to drill down into that anomaly
                </p>
            </div>

            {/* Drill-down section */}
            <div className="page-header" style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
                    🔎 Drill Down — Select VM
                </h2>
            </div>

            <div className="select-wrap">
                <select value={selectedVm} onChange={e => setSelectedVm(e.target.value)}>
                    {VM_LIST.map(vm => (
                        <option key={vm} value={vm}>{vm} — {ANOMALY_LABELS[vm]}</option>
                    ))}
                </select>
                <span className="select-arrow">▾</span>
            </div>

            {detailLoad && <div className="loading"><div className="spinner" /> Loading anomaly detail...</div>}

            {detail && !detailLoad && (
                <>
                    {/* Anomaly hero */}
                    <div className={`anomaly-hero ${detail.severity?.toLowerCase()}`}>
                        <div className="anomaly-hero-title">{detail.title}</div>
                        <div className="anomaly-hero-meta">
                            <span><strong>VM:</strong> {selectedVm}</span>
                            <span><strong>Severity:</strong> {detail.severity}</span>
                            <span><strong>Dates:</strong> {detail.dates}</span>
                            <span><strong>Anomaly Flag:</strong> <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{detail.flag}</span></span>
                            <span><strong>Owner:</strong> {detail.owner}</span>
                            <span><strong>Confidence:</strong> {Math.round(detail.confidence * 100)}%</span>
                        </div>
                    </div>

                    <div className="grid-2 mb-28">
                        {/* Left — Chart */}
                        <div className="card">
                            <div className="card-title">📈 Chart</div>

                            {!chartData ? (
                                <div className="loading" style={{ padding: 40 }}>
                                    <div className="spinner" /> Loading chart...
                                </div>

                            ) : isWeekly ? (
                                <>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
                                        Weekly average cost — +8% creep visible week over week
                                    </p>
                                    <ResponsiveContainer width="100%" height={240}>
                                        <BarChart data={weeklyData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} />
                                            <Tooltip formatter={v => [`$${v}`, 'Avg Cost/hr']} />
                                            <Bar dataKey="cost" fill="#D97706" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </>

                            ) : tsData.length > 0 ? (
                                <>
                                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                                        {selectedVm === 'vm-05' && 'Cost spikes 3× while CPU stays flat — classic billing anomaly'}
                                        {selectedVm === 'vm-09' && 'CPU active ~72% while cost drops to $0 — orphaned billing gap'}
                                        {selectedVm === 'vm-07' && 'Cost jumps 40% on dates when reservation not applied'}
                                        {selectedVm === 'vm-06' && 'CPU drops at reboot (Jan 04) — billing unchanged after resize'}
                                    </p>

                                    {/* Cost USD chart */}
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#E53E3E', marginBottom: 4 }}>
                                        💰 Cost (USD / hr)
                                    </div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={tsData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                            <XAxis
                                                dataKey="time"
                                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                interval={Math.floor(tsData.length / 5)}
                                                label={{ value: 'Date (Jan 2026)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748B' }}
                                                height={36}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                tickFormatter={v => `$${v}`}
                                                label={{ value: 'USD/hr', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748B' }}
                                                width={48}
                                            />
                                            <Tooltip
                                                formatter={(v) => [`$${v}`, 'Cost USD/hr']}
                                                labelFormatter={(l) => `Time: ${l}`}
                                                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Line type="monotone" dataKey="cost" stroke="#E53E3E" dot={false} strokeWidth={2} name="Cost USD" />
                                        </LineChart>
                                    </ResponsiveContainer>

                                    {/* CPU % chart */}
                                    <div style={{ fontSize: 12, fontWeight: 600, color: '#059669', margin: '16px 0 4px' }}>
                                        🖥️ CPU Utilisation (%)
                                    </div>
                                    <ResponsiveContainer width="100%" height={160}>
                                        <LineChart data={tsData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                            <XAxis
                                                dataKey="time"
                                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                interval={Math.floor(tsData.length / 5)}
                                                label={{ value: 'Date (Jan 2026)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748B' }}
                                                height={36}
                                            />
                                            <YAxis
                                                tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                domain={[0, 100]}
                                                tickFormatter={v => `${v}%`}
                                                label={{ value: 'CPU %', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748B' }}
                                                width={48}
                                            />
                                            <Tooltip
                                                formatter={(v) => [`${v}%`, 'CPU Utilisation']}
                                                labelFormatter={(l) => `Time: ${l}`}
                                                contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                            />
                                            <Line type="monotone" dataKey="cpu" stroke="#059669" dot={false} strokeWidth={2} name="CPU %" />
                                        </LineChart>
                                    </ResponsiveContainer>

                                    {/* Network In chart — only for vm-05 */}
                                    {selectedVm === 'vm-05' && (
                                        <>
                                            <div style={{ fontSize: 12, fontWeight: 600, color: '#7C3AED', margin: '16px 0 4px' }}>
                                                🌐 Network In (MB) — Surge visible Jan 03–05
                                            </div>
                                            <ResponsiveContainer width="100%" height={140}>
                                                <LineChart data={tsData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis
                                                        dataKey="time"
                                                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                        interval={Math.floor(tsData.length / 5)}
                                                        height={36}
                                                        label={{ value: 'Date (Jan 2026)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#64748B' }}
                                                    />
                                                    <YAxis
                                                        tick={{ fontSize: 10, fill: '#94A3B8' }}
                                                        tickFormatter={v => `${v}MB`}
                                                        width={70}
                                                    />
                                                    <Tooltip
                                                        formatter={(v) => [`${v} MB`, 'Network In']}

                                                        labelFormatter={(l) => `Time: ${l}`}
                                                        contentStyle={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                                                    />
                                                    <Line type="monotone" dataKey="netIn" stroke="#7C3AED" dot={false} strokeWidth={2} name="Network In MB" />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </>
                                    )}
                                </>

                            ) : (
                                <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                                    No chart data available for this anomaly.
                                </div>
                            )}
                        </div>


                        {/* Right — AI Explanation + Recommended Actions */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div className="card-title">🤖 AI Explanation</div>
                                {aiLoading ? (
                                    <div className="loading" style={{ padding: 20 }}>
                                        <div className="spinner" /> Generating AI analysis...
                                    </div>
                                ) : aiData ? (
                                    <>
                                        <div className="explanation-box" style={{ marginBottom: 0 }}>
                                            {aiData.explanation}
                                        </div>
                                        {aiData.root_cause && (
                                            <div style={{
                                                fontSize: 13,
                                                color: '#1406d9ff',
                                                fontStyle: 'italic',
                                                padding: '10px 14px',
                                                background: 'rgba(255,255,255,0.03)',
                                                borderRadius: 8,
                                                borderLeft: '3px solid #1406d9ff'
                                            }}>
                                                <strong style={{ color: 'var(--text)', fontStyle: 'normal' }}>Root Cause:</strong> {aiData.root_cause}
                                            </div>
                                        )}
                                        {aiData.alternative && (
                                            <div style={{
                                                fontSize: 13,
                                                color: '#D97706',
                                                padding: '10px 14px',
                                                background: 'rgba(217,119,6,0.06)',
                                                borderRadius: 8,
                                                borderLeft: '3px solid #D97706',
                                            }}>
                                                <strong style={{ color: 'var(--text)', fontStyle: 'normal' }}>💡 Alternative:</strong> {aiData.alternative}
                                            </div>
                                        )}
                                        {aiData.confidence_note && (
                                            <div style={{
                                                fontSize: 13,
                                                color: '#4A9FD4',
                                                padding: '10px 14px',
                                                background: 'rgba(74,159,212,0.06)',
                                                borderRadius: 8,
                                                borderLeft: '3px solid #4A9FD4',
                                            }}>
                                                <strong style={{ color: 'var(--text)', fontStyle: 'normal' }}>
                                                    📊 Confidence ({Math.round(detail.confidence * 100)}%):
                                                </strong> {aiData.confidence_note}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="explanation-box">{detail.explanation}</div>
                                )}
                            </div>


                            {/* Recommended Actions */}
                            <div className="card">
                                <div className="card-title">⚡ Recommended Actions</div>
                                {aiLoading ? (
                                    <div className="loading" style={{ padding: 12 }}>
                                        <div className="spinner" /> Generating recommendations...
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {(aiData?.actions || [
                                            detail.action_audit,
                                            detail.action_email,
                                            detail.action_fix,
                                        ]).map((action, i) => (
                                            <div key={i} style={{
                                                display: 'flex', gap: 12, alignItems: 'flex-start',
                                                padding: '10px 14px',
                                                background: 'rgba(74,159,212,0.05)',
                                                borderRadius: 8,
                                                border: '1px solid rgba(74,159,212,0.2)',
                                            }}>
                                                <span style={{
                                                    minWidth: 24, height: 24, borderRadius: '50%',
                                                    background: '#2E75B6', color: '#fff',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                                                }}>{i + 1}</span>
                                                <span style={{ fontSize: 14, color: '#0F172A', lineHeight: 1.6 }}>{action}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ⚡ ACTION BUTTONS */}
                    <div className="card">
                        <div className="btn-row" style={{ flexWrap: 'wrap', gap: 8 }}>
                            <button className="btn btn-amber" style={{ fontSize: 14, padding: '5px 10px' }} onClick={handleFix}>
                                🛠️ Recommended Fix
                            </button>
                            <button className="btn btn-primary" style={{ fontSize: 14, padding: '5px 10px' }} onClick={handleAuditBilling}>
                                🔎 {showBilling ? 'Hide' : 'Audit'} Billing Rows
                            </button>
                            <button className="btn btn-ghost" style={{ fontSize: 14, padding: '5px 10px' }} onClick={handleAuditMetrics}>
                                📊 {showMetrics ? 'Hide' : 'View'} Metric Rows
                            </button>
                            <button className="btn btn-purple" style={{ fontSize: 14, padding: '5px 10px' }} onClick={handleAlertOwner}>
                                📧 Alert VM Owner ({detail.owner})
                            </button>

                            <button className="btn btn-green" style={{ fontSize: 14, padding: '5px 10px' }} onClick={handleResolve}>
                                ✅ Mark as Resolved
                            </button>
                            <a className="btn btn-ghost" style={{ fontSize: 14, padding: '5px 10px' }} href={exportAnomalyUrl(selectedVm)} download={`anomaly_report_${selectedVm}.csv`}>
                                📥 Export CSV Report
                            </a>
                        </div>
                    </div>

                    {/* Action result panels — appear below buttons */}
                    {actionInfo.audit && (
                        <div className="action-result mb-28" style={{ color: '#0F172A', borderColor: 'rgba(74,159,212,0.4)', background: 'rgba(74,159,212,0.08)' }}>
                            <strong>🔎 Audit:</strong> {actionInfo.audit}
                        </div>
                    )}
                    {actionInfo.email && (
                        <div className="action-result mb-28" style={{ color: '#5B21B6', borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.08)' }}>
                            <strong>📧 Alert to {detail.owner}:</strong> {actionInfo.email}
                        </div>
                    )}
                    {actionInfo.fix && fixFlow && (
                        <div style={{
                            border: '1px solid rgba(217,119,6,0.3)',
                            borderRadius: 12,
                            overflow: 'hidden',
                            marginBottom: 20,
                        }}>
                            {/* Fix text */}
                            <div style={{ padding: '16px 20px', background: 'rgba(217,119,6,0.06)' }}>
                                <div style={{ fontWeight: 700, color: '#92400E', marginBottom: 6, fontSize: 13 }}>
                                    🛠️ Recommended Fix
                                </div>
                                <div style={{ fontSize: 13, color: '#78350F', lineHeight: 1.7 }}>
                                    {actionInfo.fix}
                                </div>
                            </div>

                            {/* AI question — Shall I proceed? */}
                            {fixFlow === 'ask' && (
                                <div style={{ padding: '16px 20px', background: '#FFFBEB', borderTop: '1px solid rgba(217,119,6,0.15)' }}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 12 }}>
                                        🤖 AI Assistant: Shall I go ahead and do this for you?
                                    </div>
                                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                        <button
                                            onClick={handleFixProceed}
                                            style={{ padding: '8px 18px', background: '#065F46', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                        >
                                            ✅ Yes, Proceed
                                        </button>
                                        <button
                                            onClick={handleFixReview}
                                            style={{ padding: '8px 18px', background: '#1E40AF', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                        >
                                            🔍 No, Let me Review
                                        </button>
                                        <button
                                            onClick={() => setFixFlow('chat')}
                                            style={{ padding: '8px 18px', background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                        >
                                            💬 No, I want to Ask More
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Yes Proceed — confirmation report */}
                            {fixFlow === 'proceed' && (
                                <div style={{ padding: '16px 20px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0' }}>
                                    <div style={{ fontWeight: 700, color: '#065F46', marginBottom: 10, fontSize: 13 }}>
                                        ✅ Action Initiated — Confirmation Report
                                    </div>
                                    <div style={{ fontSize: 13, color: '#065F46', lineHeight: 1.8 }}>
                                        <div>📌 <strong>VM:</strong> {selectedVm}</div>
                                        <div>🔖 <strong>Anomaly:</strong> {detail?.title}</div>
                                        <div>⚡ <strong>Action:</strong> {actionInfo.fix}</div>
                                        <div>💰 <strong>Estimated Monthly Saving:</strong> ${detail?.saving}/mo</div>
                                        <div>👤 <strong>Owner Notified:</strong> {detail?.owner}</div>
                                        <div>📋 <strong>Status:</strong> Flagged for resolution — ticket raised</div>
                                    </div>
                                    <div style={{ marginTop: 12, fontSize: 12, color: '#6B7280', fontStyle: 'italic' }}>
                                        Note: In V2 with real Azure API integration, this will execute the action directly.
                                    </div>
                                </div>
                            )}

                            {/* Ask More — chat input */}
                            {fixFlow === 'chat' && (
                                <div style={{ padding: '16px 20px', background: '#F5F3FF', borderTop: '1px solid #DDD6FE' }}>
                                    <div style={{ fontWeight: 700, color: '#5B21B6', marginBottom: 10, fontSize: 13 }}>
                                        💬 Ask AI anything about this anomaly
                                    </div>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAskMore()}
                                            placeholder="e.g. What caused this spike? How long has this been happening?"
                                            style={{
                                                flex: 1, padding: '9px 14px', borderRadius: 8,
                                                border: '1px solid #DDD6FE', fontSize: 13,
                                                fontFamily: 'inherit', outline: 'none',
                                                background: '#fff', color: '#1E293B'
                                            }}
                                        />
                                        <button
                                            onClick={handleAskMore}
                                            disabled={chatLoading}
                                            style={{ padding: '9px 18px', background: '#5B21B6', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                                        >
                                            {chatLoading ? '...' : 'Ask'}
                                        </button>
                                    </div>
                                    {chatReply && (
                                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#fff', border: '1px solid #DDD6FE', borderRadius: 8, fontSize: 13, color: '#1E293B', lineHeight: 1.7 }}>
                                            <strong style={{ color: '#5B21B6' }}>🤖 AI:</strong> {chatReply}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Billing rows table */}
                    {showBilling && billing && (
                        <div className="card mb-28">
                            <div className="card-title">🔎 Flagged Billing Rows — {billing.count} rows</div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>Cost USD</th>
                                            <th>Reservation Applied</th>
                                            <th>Anomaly Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {billing.rows.slice(0, 20).map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.Timestamp}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#0F766E', fontWeight: 600 }}>${r.CostUSD}</td>
                                                <td>
                                                    <span className={r.ReservationApplied === 'Yes' ? 'badge badge-green' : 'badge badge-red'}>
                                                        {r.ReservationApplied}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                                                        {r.AnomalyFlag}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {billing.count > 20 && (
                                <p style={{ fontSize: 12, color: '#64748B', marginTop: 8 }}>
                                    Showing first 20 of {billing.count} rows. Download full report below.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Metric rows table */}
                    {showMetrics && metrics && (
                        <div className="card mb-28">
                            <div className="card-title">📊 Flagged Metric Rows — {metrics.count} rows</div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Timestamp</th>
                                            <th>CPU %</th>
                                            <th>Memory %</th>
                                            <th>NetworkIn MB</th>
                                            <th>NetworkOut MB</th>
                                            <th>Flag</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {metrics.rows.slice(0, 20).map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.Timestamp}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{r.CPU_Percent}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{r.Memory_Percent}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{r.NetworkIn_MB}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: '#0F172A' }}>{r.NetworkOut_MB}</td>
                                                <td>
                                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#DC2626', fontWeight: 600 }}>
                                                        {r.AnomalyFlag}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Toast */}
            {toast && <div className="toast">{toast}</div>}
        </div>
    )
}