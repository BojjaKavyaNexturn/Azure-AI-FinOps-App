


import { useEffect, useState } from 'react'
import {
    getTaggingKpis, getTaggingSummary, getVmTagDetail,
    applyTag, bulkApprove, exportTaggingUrl
} from '../api.js'

const VM_LIST = [
    'vm-01', 'vm-02', 'vm-03', 'vm-04', 'vm-05', 'vm-06', 'vm-07', 'vm-08', 'vm-09',
    'vm-10', 'vm-11', 'vm-12', 'vm-13', 'vm-14', 'vm-15', 'vm-16', 'vm-17'
]

// ── Light-theme color tokens ─────────────────────────────────────────────────
const C = {
    text: '#0F172A',
    textMid: '#334155',
    textMuted: '#64748B',
    border: '#E2E8F0',
    bgCard: '#FFFFFF',
    bgRow: '#F8FAFC',
    bgHover: 'rgba(99,102,241,0.06)',
    blue: '#1D4ED8',
    blueLight: '#3B82F6',
    green: '#059669',
    greenLight: '#D1FAE5',
    greenText: '#065F46',
    red: '#DC2626',
    redLight: '#FEE2E2',
    redText: '#991B1B',
    amber: '#D97706',
    amberLight: '#FEF3C7',
    amberText: '#92400E',
    teal: '#0D9488',
    tealLight: '#CCFBF1',
    tealText: '#134E4A',
    purple: '#7C3AED',
    purpleLight: '#EDE9FE',
    purpleText: '#4C1D95',
}

export default function AutoTagging() {
    const [kpis, setKpis] = useState(null)
    const [summary, setSummary] = useState([])
    const [selectedVm, setSelectedVm] = useState('vm-03')
    const [detail, setDetail] = useState(null)
    const [loading, setLoading] = useState(true)
    const [detailLoad, setDetailLoad] = useState(false)
    const [toast, setToast] = useState('')
    const [applied, setApplied] = useState({})
    const [bulkResult, setBulkResult] = useState(null)

    useEffect(() => {
        Promise.all([
            getTaggingKpis().then(setKpis),
            getTaggingSummary().then(setSummary),
        ]).catch(console.error).finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        setDetailLoad(true)
        setDetail(null)
        setApplied({})  // ← add this line
        getVmTagDetail(selectedVm)
            .then(setDetail)
            .catch(console.error)
            .finally(() => setDetailLoad(false))
    }, [selectedVm])

    function showToast(msg) {
        setToast(msg)
        setTimeout(() => setToast(''), 3500)
    }


    async function handleApplyTag(tagName, tagValue) {
        try {
            const res = await applyTag(selectedVm, tagName, tagValue)
            setApplied(s => ({ ...s, [tagName]: tagValue }))
            showToast(`✅ ${res.message}`)

            // Update summary table immediately
            setSummary(prev => prev.map(r => {
                if (r.ResourceID !== selectedVm) return r
                const updatedRow = { ...r }
                if (tagName === 'DepartmentTag') {
                    updatedRow.DeptTag = tagValue
                    updatedRow.MissingTag = r.MissingTag === 'DepartmentTag' ? null : r.MissingTag
                }
                if (tagName === 'CostCenterTag') {
                    updatedRow.CostCenterTag = tagValue
                    updatedRow.MissingTag = r.MissingTag === 'CostCenterTag' ? null : r.MissingTag
                }
                const deptOk = updatedRow.DeptTag && updatedRow.DeptTag !== '— missing —'
                const ccOk = updatedRow.CostCenterTag && updatedRow.CostCenterTag !== '— missing —'
                updatedRow.TagStatus = (deptOk && ccOk) ? 'Complete' : 'Incomplete'
                return updatedRow
            }))

            // ← ADD THIS — update KPI cards live
            setKpis(prev => {
                if (!prev) return prev
                const updatedSummary = summary.map(r => {
                    if (r.ResourceID !== selectedVm) return r
                    const updatedRow = { ...r }
                    if (tagName === 'DepartmentTag') updatedRow.DeptTag = tagValue
                    if (tagName === 'CostCenterTag') updatedRow.CostCenterTag = tagValue
                    const deptOk = updatedRow.DeptTag
                    const ccOk = updatedRow.CostCenterTag
                    updatedRow.TagStatus = (deptOk && ccOk) ? 'Complete' : 'Incomplete'
                    return updatedRow
                })
                const complete = updatedSummary.filter(r => r.TagStatus === 'Complete').length
                const incomplete = updatedSummary.filter(r => r.TagStatus === 'Incomplete').length
                const pct = Math.round((complete / updatedSummary.length) * 100 * 10) / 10
                return { ...prev, complete, incomplete, pct_complete: pct }
            })

        } catch (e) {
            showToast('❌ Failed to apply tag. Check backend.')
        }
    }

    async function handleBulkApprove() {
        try {
            const res = await bulkApprove()
            setBulkResult(res)
            showToast(`✅ ${res.message}`)
        } catch (e) {
            showToast('❌ Bulk approve failed.')
        }
    }

    const confColor = (c) => {
        if (c >= 0.85) return C.green
        if (c >= 0.75) return C.amber
        return C.red
    }

    const Badge = ({ type, children }) => {
        const styles = {
            green: { background: C.greenLight, color: C.greenText, border: `1px solid ${C.green}30` },
            red: { background: C.redLight, color: C.redText, border: `1px solid ${C.red}30` },
            amber: { background: C.amberLight, color: C.amberText, border: `1px solid ${C.amber}30` },
            teal: { background: C.tealLight, color: C.tealText, border: `1px solid ${C.teal}30` },
            blue: { background: '#DBEAFE', color: C.blue, border: `1px solid ${C.blue}30` },
            purple: { background: C.purpleLight, color: C.purpleText, border: `1px solid ${C.purple}30` },
        }
        return (
            <span style={{
                ...styles[type] || styles.blue,
                padding: '2px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                display: 'inline-block',
            }}>{children}</span>
        )
    }

    const TagChip = ({ children }) => (
        <span style={{
            background: '#EFF6FF',
            color: C.blue,
            border: `1px solid #BFDBFE`,
            padding: '3px 12px',
            borderRadius: 8,
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'monospace',
        }}>{children}</span>
    )

    const InfoBox = ({ children, color = C.blue, bg, border }) => (
        <div style={{
            fontSize: 13,
            color: color,
            lineHeight: 1.7,
            padding: '12px 16px',
            background: bg || `${color}10`,
            border: `1px solid ${border || color + '30'}`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 8,
        }}>{children}</div>
    )

    if (loading) return <div className="loading"><div className="spinner" /> Loading tagging data...</div>

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">🏷️ Context-Based Auto-Tagging Engine</h1>
                <p className="page-subtitle">
                    Azure FinOps AI · Context-Based Auto-Tagging · Jan 2026 · 17 VMs
                </p>
            </div>

            {/* KPIs */}
            {kpis && (
                <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
                    <div className="kpi-card">
                        <div className="kpi-label">Total VMs</div>
                        <div className="kpi-value">{kpis.total_vms}</div>
                        <div className="kpi-sub">Azure resources</div>
                    </div>
                    <div className="kpi-card kpi-green">
                        <div className="kpi-label">✅ Fully Tagged</div>
                        <div className="kpi-value">{kpis.complete}</div>
                        <div className="kpi-sub">All tags present</div>
                    </div>
                    <div className="kpi-card kpi-red">
                        <div className="kpi-label">❌ Missing Tags</div>
                        <div className="kpi-value">{kpis.incomplete}</div>
                        <div className="kpi-sub">Need tagging</div>
                    </div>
                    <div className="kpi-card kpi-blue">
                        <div className="kpi-label">Completion Rate</div>
                        <div className="kpi-value">{kpis.pct_complete}%</div>
                        <div className="kpi-sub">
                            <div className="progress-bar" style={{ marginTop: 4 }}>
                                <div className="progress-fill" style={{
                                    width: `${kpis.pct_complete}%`,
                                    background: 'linear-gradient(90deg,var(--blue),#6EE7B7)',
                                }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tagging summary table */}
            <div className="card mb-28">
                <div className="card-title">📋 All VMs — Tag Status</div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                {['Resource ID', 'Department Tag', 'Environment', 'Cost Center', 'Missing Tag', 'AI Suggested Value', 'Tag Status', 'Shutdown Candidate'].map(h => (
                                    <th key={h} style={{ color: C.textMid, background: '#F1F5F9', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map(r => (
                                <tr
                                    key={r.ResourceID}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedVm === r.ResourceID ? 'rgba(99,102,241,0.07)' : '',
                                        borderLeft: selectedVm === r.ResourceID ? `3px solid ${C.purple}` : '3px solid transparent',
                                    }}
                                    onClick={() => setSelectedVm(r.ResourceID)}
                                >
                                    <td>
                                        <span style={{ fontFamily: 'monospace', color: C.blue, fontWeight: 600 }}>
                                            {r.ResourceID}
                                        </span>
                                    </td>
                                    <td style={{ color: C.text, fontSize: 13 }}>
                                        {r.DeptTag
                                            ? <span style={{ color: '#065F46', fontWeight: 600 }}>{r.DeptTag}</span>
                                            : <span style={{ color: C.textMuted, fontStyle: 'italic' }}>— missing —</span>
                                        }
                                    </td>
                                    <td><Badge type="teal">{r.EnvTag}</Badge></td>
                                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: C.textMid }}>{r.CostCenterTag}</td>
                                    <td>
                                        {r.MissingTag
                                            ? <span style={{ color: C.red, fontSize: 12, fontFamily: 'monospace' }}>{r.MissingTag}</span>
                                            : <span style={{ color: C.green, fontSize: 12 }}>—</span>
                                        }
                                    </td>
                                    <td>
                                        {r.AI_SuggestedDept ? <TagChip>{r.AI_SuggestedDept}</TagChip> : <span style={{ color: C.textMuted }}>—</span>}
                                    </td>
                                    <td>
                                        <Badge type={r.TagStatus === 'Complete' ? 'green' : 'red'}>{r.TagStatus}</Badge>
                                    </td>
                                    <td>
                                        <Badge type={r.ShutdownCandidate === 'Yes' ? 'amber' : 'teal'}>{r.ShutdownCandidate}</Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: 12, color: C.textMuted, marginTop: 10 }}>
                    👆 Click any row to see AI tag suggestion and drill-down
                </p>
            </div>

            {/* VM Drill-down */}
            <div className="page-header" style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
                    🔎 Select ResourceID — AI Tag Suggestion
                </h2>
            </div>

            <div className="select-wrap">
                <select value={selectedVm} onChange={e => setSelectedVm(e.target.value)}>
                    {VM_LIST.map(vm => (
                        <option key={vm} value={vm}>{vm}</option>
                    ))}
                </select>
                <span className="select-arrow">▾</span>
            </div>

            {detailLoad && <div className="loading"><div className="spinner" /> Loading tag detail...</div>}

            {detail && !detailLoad && (
                <div className="grid-2 mb-28">

                    {/* Left — Resource Context */}
                    <div className="card">
                        <div className="card-title">🗂️ Resource Context</div>
                        <div className="table-wrap">
                            <table>
                                <tbody>
                                    {Object.entries(detail.resource_context)
                                        .filter(([k]) => !['__index__'].includes(k))
                                        .map(([k, v], i) => (
                                            <tr key={k} style={{ background: i % 2 === 0 ? C.bgRow : C.bgCard }}>
                                                <td style={{ color: C.textMuted, fontSize: 12, width: 180, fontWeight: 500 }}>{k}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: 12, color: C.text }}>
                                                    {k === 'PolicyCompliance' || k === 'comp'
                                                        ? <Badge type={v === 'Compliant' ? 'green' : 'red'}>{v}</Badge>
                                                        : String(v) || <span style={{ color: C.textMuted, fontStyle: 'italic' }}>—</span>
                                                    }
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Right — Tag Decision */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                        {/* Tag decision */}
                        <div className="card">
                            <div className="card-title">🧠 Tag Decision</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: C.bgRow, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                    <span style={{ color: C.textMid, fontSize: 13, fontWeight: 500 }}>Department</span>
                                    <TagChip>{detail.suggested_department}</TagChip>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: C.bgRow, borderRadius: 8, border: `1px solid ${C.border}` }}>
                                    <span style={{ color: C.textMid, fontSize: 13, fontWeight: 500 }}>Cost Center</span>
                                    <TagChip>{detail.suggested_cost_center}</TagChip>
                                </div>
                            </div>

                            {/* Confidence */}
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                                    <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>Confidence Score</span>
                                    <span style={{
                                        background: confColor(detail.confidence) + '20',
                                        color: confColor(detail.confidence),
                                        border: `1px solid ${confColor(detail.confidence)}40`,
                                        padding: '2px 10px', borderRadius: 20,
                                        fontSize: 12, fontWeight: 700,
                                    }}>
                                        {Math.round(detail.confidence * 100)}%
                                    </span>
                                </div>
                                <div style={{ height: 8, background: '#E2E8F0', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${detail.confidence * 100}%`,
                                        height: '100%',
                                        background: confColor(detail.confidence),
                                        borderRadius: 4,
                                        transition: 'width 0.5s ease',
                                    }} />
                                </div>
                            </div>

                            {/* Confidence Breakdown */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 12, color: C.textMuted, fontWeight: 600, marginBottom: 8 }}>
                                    🧮 Confidence Breakdown
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {Object.entries(detail.confidence_breakdown).map(([key, val]) => (
                                        <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span style={{ fontSize: 11, color: C.textMid, width: 90, flexShrink: 0 }}>{key}</span>
                                            <div style={{ flex: 1, height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                                                <div style={{ width: `${val * 100}%`, height: '100%', background: C.blue, borderRadius: 3 }} />
                                            </div>
                                            <span style={{ fontSize: 11, color: C.textMid, width: 32, textAlign: 'right' }}>{Math.round(val * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Signals */}
                        <div className="card">
                            <div className="card-title">🔎 Signals Used</div>
                            <div style={{
                                background: '#1E293B',
                                borderRadius: 8,
                                padding: '12px 16px',
                                fontFamily: 'monospace',
                                fontSize: 12,
                                lineHeight: 1.8,
                                color: '#E2E8F0',
                            }}>
                                {'{'}
                                {Object.entries(detail.signals_used).map(([k, v]) => (
                                    <div key={k} style={{ paddingLeft: 16 }}>
                                        <span style={{ color: '#F6C90E' }}>"{k}"</span>
                                        <span style={{ color: '#E2E8F0' }}> : </span>
                                        <span style={{ color: '#98C379' }}>"{v}"</span>
                                    </div>
                                ))}
                                {'}'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detail && !detailLoad && (
                <>
                    <div className="grid-2 mb-28">
                        {/* Reasoning */}
                        <div className="card">
                            <div className="card-title">📝 Reasoning</div>
                            <InfoBox color={C.textMid} bg="#F8FAFC" border={C.border}>
                                {detail.reasoning}
                            </InfoBox>
                        </div>

                        {/* Alternative + Action */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card">
                                <div className="card-title">🔄 Alternative</div>
                                <InfoBox color={C.purpleText} bg={C.purpleLight} border={C.purple + '40'}>
                                    {detail.alternative}
                                </InfoBox>
                            </div>
                            <div className="card">
                                <div className="card-title">⚡ Action</div>
                                <InfoBox color={C.greenText} bg={C.greenLight} border={C.green + '40'}>
                                    {detail.action}
                                </InfoBox>
                            </div>
                        </div>
                    </div>

                    {detail.recommended_action && (
                        <div className="card mb-28">
                            <div className="card-title">🤖 AI Recommended Action</div>
                            <InfoBox color={C.blue} bg="#EFF6FF" border="#BFDBFE">
                                {detail.recommended_action}
                            </InfoBox>
                            <p style={{ fontSize: 11, color: C.textMuted, marginTop: 8, fontStyle: 'italic' }}>
                                ⚠️ AI suggests — FinOps team approves. Owner verification is required before any tag is applied.
                            </p>
                        </div>
                    )}

                    {detail.business_impact && (
                        <div className="card mb-28">
                            <div className="card-title">💰 Business Impact</div>
                            <InfoBox color={C.greenText} bg={C.greenLight} border={C.green + '40'}>
                                {detail.business_impact}
                            </InfoBox>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="card mb-28">
                        <div className="card-title">⚡ Actions</div>
                        <div className="btn-row">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleApplyTag('DepartmentTag', detail.suggested_department)}
                                disabled={!!applied['DepartmentTag']}
                            >
                                🚀 Apply DepartmentTag={detail.suggested_department}
                            </button>
                            <button
                                className="btn btn-green"
                                onClick={() => handleApplyTag('CostCenterTag', detail.suggested_cost_center)}
                                disabled={!!applied['CostCenterTag']}
                            >
                                ✅ Apply CostCenterTag={detail.suggested_cost_center}
                            </button>
                            <button className="btn btn-purple" onClick={handleBulkApprove}>
                                🔄 Bulk Approve All ≥85% Confidence
                            </button>
                            <a className="btn btn-ghost" href={exportTaggingUrl()} download="tagging_report.csv">
                                📥 Export Tagging Report CSV
                            </a>
                        </div>
                        {applied['DepartmentTag'] && (
                            <div style={{ marginTop: 12, padding: '8px 14px', background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: 8, fontSize: 13, color: C.greenText }}>
                                ✅ DepartmentTag = <strong>{applied['DepartmentTag']}</strong> applied to {selectedVm}
                            </div>
                        )}
                        {applied['CostCenterTag'] && (
                            <div style={{ marginTop: 8, padding: '8px 14px', background: C.greenLight, border: `1px solid ${C.green}40`, borderRadius: 8, fontSize: 13, color: C.greenText }}>
                                ✅ CostCenterTag = <strong>{applied['CostCenterTag']}</strong> applied to {selectedVm}
                            </div>
                        )}
                    </div>

                    {bulkResult && (
                        <div className="card mb-28">
                            <div className="card-title">🔄 Bulk Approve Results — {bulkResult.approved_count} tags approved</div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            {['Resource ID', 'Missing Tag', 'Suggested Value', 'Confidence', 'Reason'].map(h => (
                                                <th key={h} style={{ color: C.textMid, background: '#F1F5F9', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkResult.approved.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: 'monospace', color: C.blue, fontWeight: 600 }}>{r.ResourceID}</td>
                                                <td style={{ fontFamily: 'monospace', fontSize: 12, color: C.textMid }}>{r.MissingTag}</td>
                                                <td><TagChip>{r.SuggestedValue}</TagChip></td>
                                                <td><Badge type="green">{Math.round(r.Confidence * 100)}%</Badge></td>
                                                <td style={{ fontSize: 12, color: C.textMid }}>{r.Reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* System Evaluation */}
                    <div className="card">
                        <div className="card-title">📊 System Evaluation Dashboard</div>
                        {kpis && (
                            <div className="grid-3">
                                {[
                                    { label: 'Total VMs Analysed', val: kpis.total_vms, color: C.text },
                                    { label: 'Tags Completed', val: kpis.complete, color: C.greenText },
                                    { label: 'Tags Still Missing', val: kpis.incomplete, color: C.redText },
                                    { label: 'Completion Rate', val: kpis.pct_complete + '%', color: C.blue },
                                    { label: 'High Confidence (≥85%)', val: '7 suggestions', color: C.greenText },
                                    { label: 'Est. Cost Unattributed', val: 'Unknown', color: C.amberText },
                                ].map(({ label, val, color }) => (
                                    <div key={label} style={{
                                        background: C.bgRow,
                                        borderRadius: 8,
                                        padding: 16,
                                        border: `1px solid ${C.border}`,
                                    }}>
                                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6, fontWeight: 500 }}>{label}</div>
                                        <div style={{ fontSize: 22, fontWeight: 800, color }}>{val}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    )
}