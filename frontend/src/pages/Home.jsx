import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getAnomalyKpis, getAnomalySummary, getTaggingKpis } from '../api.js'

const SEV_BADGE = {
    HIGH: 'badge badge-red',
    MEDIUM: 'badge badge-amber',
}

export default function Home() {
    const [aKpis, setAKpis] = useState(null)
    const [tKpis, setTKpis] = useState(null)
    const [summary, setSummary] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        Promise.all([
            getAnomalyKpis().then(setAKpis),
            getTaggingKpis().then(setTKpis),
            getAnomalySummary().then(data => setSummary([...data].sort((a, b) => b.saving - a.saving))),
        ])
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <div className="loading"><div className="spinner" /> Loading dashboard...</div>

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">🏠 Home Dashboard</h1>
                <p className="page-subtitle">
                    Azure FinOps AI · 17 Azure VMs · January 2026 · Spend Anomaly Detection + Context-Based Auto-Tagging
                </p>
            </div>

            {/* KPIs */}
            <div className="kpi-grid">
                <div className="kpi-card kpi-teal">
                    <div className="kpi-label">Total VMs</div>
                    <div className="kpi-value">{aKpis?.total_vms ?? '—'}</div>
                    <div className="kpi-sub">Resources monitored</div>
                </div>
                <div className="kpi-card kpi-red">
                    <div className="kpi-label">🔴 HIGH Severity</div>
                    <div className="kpi-value">{aKpis?.high_severity ?? '—'}</div>
                    <div className="kpi-sub">Action required</div>
                </div>
                <div className="kpi-card kpi-amber">
                    <div className="kpi-label">🟠 MEDIUM Severity</div>
                    <div className="kpi-value">{aKpis?.medium_severity ?? '—'}</div>
                    <div className="kpi-sub">Review this week</div>
                </div>
                <div className="kpi-card kpi-red">
                    <div className="kpi-label">Est. Monthly Loss</div>
                    <div className="kpi-value">${aKpis?.estimated_monthly_loss ?? '—'}</div>
                    <div className="kpi-sub">Cost at risk</div>
                </div>
                <div className="kpi-card kpi-purple">
                    <div className="kpi-label">Tags Incomplete</div>
                    <div className="kpi-value">{tKpis?.incomplete ?? '—'}</div>
                    <div className="kpi-sub">Tags missing</div>
                </div>
            </div>

            <div className="grid-2 mb-28">

                {/* Anomaly module */}
                <div className="card">
                    <div className="card-title">🔍 Anomaly Detection</div>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>VM</th>
                                    <th>Anomaly Type</th>
                                    <th>Severity</th>
                                    <th>Est. Saving</th>
                                </tr>
                            </thead>
                            <tbody>
                                {summary.map(r => (
                                    <tr
                                        key={r.vm_id}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => navigate('/anomalies')}
                                    >
                                        <td style={{ whiteSpace: 'nowrap' }}>
                                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)', whiteSpace: 'nowrap' }}>
                                                {r.vm_id}
                                            </span>
                                        </td>
                                        <td style={{ minWidth: 160 }}>{r.title}</td>
                                        <td style={{ whiteSpace: 'nowrap' }}><span className={SEV_BADGE[r.severity]}>{r.severity}</span></td>
                                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--teal)', whiteSpace: 'nowrap', fontWeight: 700 }}>
                                            ${r.saving}/mo
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="btn-row">
                        <button className="btn" style={{ background: '#2E75B6', color: '#FFFFFF', border: 'none', fontWeight: 600 }} onClick={() => navigate('/anomalies')}>
                            Go to Anomaly Detection <ArrowRight size={14} />
                        </button>
                    </div>
                </div>

                {/* Tagging module */}
                <div className="card">
                    <div className="card-title">🏷️ Auto-Tagging</div>
                    {tKpis && (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
                                {[
                                    { label: 'Total VMs', val: tKpis.total_vms, color: 'var(--text)' },
                                    { label: '✅ Complete', val: tKpis.complete, color: '#6EE7B7' },
                                    { label: '❌ Incomplete', val: tKpis.incomplete, color: '#FC8181' },
                                    { label: '% Complete', val: tKpis.pct_complete + '%', color: 'var(--blue-xlight)' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: '14px',
                                        border: '1px solid var(--border)',
                                    }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                                        <div style={{
                                            fontSize: 24, fontFamily: 'var(--font-display)',
                                            fontWeight: 800, color,
                                        }}>{val}</div>
                                    </div>
                                ))}
                            </div>

                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                                Tag Completion Rate
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{
                                    width: `${tKpis.pct_complete}%`,
                                    background: 'linear-gradient(90deg, var(--blue), #6EE7B7)',
                                }} />
                            </div>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12 }}>
                                {tKpis.incomplete} VMs have missing Department or CostCenter tags —
                                costs cannot be attributed to teams without these tags.
                            </p>
                        </>
                    )}
                    <div className="btn-row">
                        <button className="btn" style={{ background: '#2E75B6', color: '#FFFFFF', border: 'none', fontWeight: 600 }} onClick={() => navigate('/tagging')}>
                            Go to Auto-Tagging <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* About section */}
            <div className="card">
                <div className="card-title">📋 About This Application</div>
                <div className="grid-2" style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.75 }}>
                    <div>
                        <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
                            🔍 Spend Anomaly Detection
                        </p>
                        <p>
                            Detects 5 realistic anomaly patterns from Azure billing and platform metrics using
                            correct statistical distributions — Log-normal for CPU and Network, Gaussian for
                            Memory, Pareto for Cost. Shows severity, AI explanation, interactive charts,
                            and real action buttons including export and mark-as-resolved.
                        </p>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text)', fontWeight: 700, marginBottom: 10, fontSize: 16 }}>
                            🏷️ Context-Based Auto-Tagging
                        </p>
                        <p>
                            Infers missing resource tags — Department and CostCenter — using AI reasoning
                            from owner, service name, environment, and CPU signals. Provides confidence
                            scores, full reasoning, alternative possibilities, and applies tags with one click.
                            Bulk approval available for high-confidence suggestions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}