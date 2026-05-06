// import { useEffect, useState } from 'react'
// import {
//     getTaggingKpis, getTaggingSummary, getVmTagDetail,
//     applyTag, bulkApprove, exportTaggingUrl
// } from '../api.js'

// const VM_LIST = [
//     'vm-01', 'vm-02', 'vm-03', 'vm-04', 'vm-05', 'vm-06', 'vm-07', 'vm-08', 'vm-09',
//     'vm-10', 'vm-11', 'vm-12', 'vm-13', 'vm-14', 'vm-15', 'vm-16', 'vm-17'
// ]

// export default function AutoTagging() {
//     const [kpis, setKpis] = useState(null)
//     const [summary, setSummary] = useState([])
//     const [selectedVm, setSelectedVm] = useState('vm-03')
//     const [detail, setDetail] = useState(null)
//     const [loading, setLoading] = useState(true)
//     const [detailLoad, setDetailLoad] = useState(false)
//     const [toast, setToast] = useState('')
//     const [applied, setApplied] = useState({})
//     const [bulkResult, setBulkResult] = useState(null)

//     useEffect(() => {
//         Promise.all([
//             getTaggingKpis().then(setKpis),
//             getTaggingSummary().then(setSummary),
//         ]).catch(console.error).finally(() => setLoading(false))
//     }, [])

//     useEffect(() => {
//         setDetailLoad(true)
//         setDetail(null)
//         getVmTagDetail(selectedVm)
//             .then(setDetail)
//             .catch(console.error)
//             .finally(() => setDetailLoad(false))
//     }, [selectedVm])

//     function showToast(msg) {
//         setToast(msg)
//         setTimeout(() => setToast(''), 3500)
//     }

//     async function handleApplyTag(tagName, tagValue) {
//         try {
//             const res = await applyTag(selectedVm, tagName, tagValue)
//             setApplied(s => ({ ...s, [tagName]: tagValue }))
//             showToast(`✅ ${res.message}`)
//         } catch (e) {
//             showToast('❌ Failed to apply tag. Check backend.')
//         }
//     }

//     async function handleBulkApprove() {
//         try {
//             const res = await bulkApprove()
//             setBulkResult(res)
//             showToast(`✅ ${res.message}`)
//         } catch (e) {
//             showToast('❌ Bulk approve failed.')
//         }
//     }

//     const confColor = (c) => {
//         if (c >= 0.85) return '#6EE7B7'
//         if (c >= 0.75) return '#FCD34D'
//         return '#FC8181'
//     }

//     const confBadge = (c) => {
//         if (c >= 0.85) return 'badge badge-green'
//         if (c >= 0.75) return 'badge badge-amber'
//         return 'badge badge-red'
//     }

//     if (loading) return <div className="loading"><div className="spinner" /> Loading tagging data...</div>

//     return (
//         <div className="page">
//             <div className="page-header">
//                 <h1 className="page-title">🏷️ Context-Based Auto-Tagging Engine</h1>
//                 <p className="page-subtitle">
//                     Azure FinOps · Likhith Nariyam · AI infers missing Department and CostCenter tags
//                     from owner, service name, environment, and CPU signals
//                 </p>
//             </div>

//             {/* KPIs */}
//             {kpis && (
//                 <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
//                     <div className="kpi-card">
//                         <div className="kpi-label">Total VMs</div>
//                         <div className="kpi-value">{kpis.total_vms}</div>
//                         <div className="kpi-sub">Azure resources</div>
//                     </div>
//                     <div className="kpi-card kpi-green">
//                         <div className="kpi-label">✅ Fully Tagged</div>
//                         <div className="kpi-value">{kpis.complete}</div>
//                         <div className="kpi-sub">All tags present</div>
//                     </div>
//                     <div className="kpi-card kpi-red">
//                         <div className="kpi-label">❌ Missing Tags</div>
//                         <div className="kpi-value">{kpis.incomplete}</div>
//                         <div className="kpi-sub">Need tagging</div>
//                     </div>
//                     <div className="kpi-card kpi-blue">
//                         <div className="kpi-label">Completion Rate</div>
//                         <div className="kpi-value">{kpis.pct_complete}%</div>
//                         <div className="kpi-sub">
//                             <div className="progress-bar" style={{ marginTop: 4 }}>
//                                 <div className="progress-fill" style={{
//                                     width: `${kpis.pct_complete}%`,
//                                     background: 'linear-gradient(90deg,var(--blue),#6EE7B7)',
//                                 }} />
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {/* Tagging summary table */}
//             <div className="card mb-28">
//                 <div className="card-title">📋 All VMs — Tag Status</div>
//                 <div className="table-wrap">
//                     <table>
//                         <thead>
//                             <tr>
//                                 <th>Resource ID</th>
//                                 <th>Department Tag</th>
//                                 <th>Environment</th>
//                                 <th>Cost Center</th>
//                                 <th>Missing Tag</th>
//                                 <th>AI Suggested Value</th>
//                                 <th>Tag Status</th>
//                                 <th>Shutdown Candidate</th>
//                             </tr>
//                         </thead>
//                         <tbody>
//                             {summary.map(r => (
//                                 <tr
//                                     key={r.ResourceID}
//                                     style={{
//                                         cursor: 'pointer',
//                                         background: selectedVm === r.ResourceID ? 'rgba(124,58,237,0.1)' : ''
//                                     }}
//                                     onClick={() => setSelectedVm(r.ResourceID)}
//                                 >
//                                     <td>
//                                         <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)', fontWeight: 600 }}>
//                                             {r.ResourceID}
//                                         </span>
//                                     </td>
//                                     <td>{r.DeptTag || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>— missing —</span>}</td>
//                                     <td><span className="badge badge-teal">{r.EnvTag}</span></td>
//                                     <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.CostCenterTag}</td>
//                                     <td>
//                                         {r.MissingTag
//                                             ? <span style={{ color: '#FC8181', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{r.MissingTag}</span>
//                                             : <span style={{ color: '#6EE7B7', fontSize: 12 }}>—</span>
//                                         }
//                                     </td>
//                                     <td>
//                                         {r.AI_SuggestedDept
//                                             ? <span className="tag-chip">{r.AI_SuggestedDept}</span>
//                                             : '—'
//                                         }
//                                     </td>
//                                     <td>
//                                         <span className={r.TagStatus === 'Complete' ? 'badge badge-green' : 'badge badge-red'}>
//                                             {r.TagStatus}
//                                         </span>
//                                     </td>
//                                     <td>
//                                         <span className={r.ShutdownCandidate === 'Yes' ? 'badge badge-amber' : 'badge badge-teal'}>
//                                             {r.ShutdownCandidate}
//                                         </span>
//                                     </td>
//                                 </tr>
//                             ))}
//                         </tbody>
//                     </table>
//                 </div>
//                 <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
//                     👆 Click any row to see AI tag suggestion and drill-down
//                 </p>
//             </div>

//             {/* VM Drill-down */}
//             <div className="page-header" style={{ marginBottom: 16 }}>
//                 <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--white)' }}>
//                     🔎 Select ResourceID — AI Tag Suggestion
//                 </h2>
//             </div>

//             <div className="select-wrap">
//                 <select value={selectedVm} onChange={e => setSelectedVm(e.target.value)}>
//                     {VM_LIST.map(vm => (
//                         <option key={vm} value={vm}>{vm}</option>
//                     ))}
//                 </select>
//                 <span className="select-arrow">▾</span>
//             </div>

//             {detailLoad && <div className="loading"><div className="spinner" /> Loading tag detail...</div>}

//             {detail && !detailLoad && (
//                 <div className="grid-2 mb-28">

//                     {/* Left — Resource Context */}
//                     <div className="card">
//                         <div className="card-title">🗂️ Resource Context</div>
//                         <div className="table-wrap">
//                             <table>
//                                 <tbody>
//                                     {Object.entries(detail.resource_context)
//                                         .filter(([k]) => !['__index__'].includes(k))
//                                         .map(([k, v]) => (
//                                             <tr key={k}>
//                                                 <td style={{ color: 'var(--text-muted)', fontSize: 12, width: 160 }}>{k}</td>
//                                                 <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
//                                                     {k === 'comp'
//                                                         ? <span className={v === 'Compliant' ? 'badge badge-green' : 'badge badge-red'}>{v}</span>
//                                                         : String(v) || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
//                                                     }
//                                                 </td>
//                                             </tr>
//                                         ))}
//                                 </tbody>
//                             </table>
//                         </div>
//                     </div>

//                     {/* Right — Tag Decision */}
//                     <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

//                         {/* Tag decision */}
//                         <div className="card">
//                             <div className="card-title">🧠 Tag Decision</div>
//                             <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                     <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Department</span>
//                                     <span className="tag-chip">{detail.suggested_department}</span>
//                                 </div>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                     <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cost Center</span>
//                                     <span className="tag-chip">{detail.suggested_cost_center}</span>
//                                 </div>
//                             </div>

//                             {/* Confidence */}
//                             <div style={{ marginTop: 16 }}>
//                                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
//                                     <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence (System)</span>
//                                     <span className={confBadge(detail.confidence)}>
//                                         {Math.round(detail.confidence * 100)}%
//                                     </span>
//                                 </div>
//                                 <div className="progress-bar">
//                                     <div className="progress-fill" style={{
//                                         width: `${detail.confidence * 100}%`,
//                                         background: confColor(detail.confidence),
//                                     }} />
//                                 </div>
//                             </div>

//                             {/* Confidence Breakdown */}
//                             <div style={{ marginTop: 14 }}>
//                                 <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
//                                     🧮 Confidence Breakdown
//                                 </div>
//                                 <div className="conf-breakdown">
//                                     {Object.entries(detail.confidence_breakdown).map(([key, val]) => (
//                                         <div className="conf-row" key={key}>
//                                             <span className="conf-key">{key}</span>
//                                             <div className="progress-bar" style={{ flex: 1 }}>
//                                                 <div className="progress-fill" style={{
//                                                     width: `${val * 100}%`,
//                                                     background: 'var(--blue)',
//                                                 }} />
//                                             </div>
//                                             <span className="conf-pct">{Math.round(val * 100)}%</span>
//                                         </div>
//                                     ))}
//                                 </div>
//                             </div>
//                         </div>

//                         {/* Signals */}
//                         <div className="card">
//                             <div className="card-title">🔎 Signals Used</div>
//                             <div className="json-box">
//                                 {'{'}
//                                 {Object.entries(detail.signals_used).map(([k, v]) => (
//                                     <div key={k} style={{ paddingLeft: 12 }}>
//                                         <span style={{ color: '#F6C90E' }}>"{k}"</span>
//                                         {' : '}
//                                         <span style={{ color: '#98C379' }}>"{v}"</span>
//                                     </div>
//                                 ))}
//                                 {'}'}
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             )}

//             {detail && !detailLoad && (
//                 <>
//                     <div className="grid-2 mb-28">
//                         {/* Reasoning */}
//                         <div className="card">
//                             <div className="card-title">📝 Reasoning</div>
//                             <div className="explanation-box">{detail.reasoning}</div>
//                         </div>

//                         {/* Alternative + Action */}
//                         <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
//                             <div className="card">
//                                 <div className="card-title">🔄 Alternative</div>
//                                 <div className="explanation-box" style={{ background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.2)' }}>
//                                     {detail.alternative}
//                                 </div>
//                             </div>
//                             <div className="card">
//                                 <div className="card-title">⚡ Action</div>
//                                 <div className="explanation-box" style={{ background: 'rgba(5,150,105,0.07)', borderColor: 'rgba(5,150,105,0.2)' }}>
//                                     {detail.action}
//                                 </div>
//                             </div>
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="card mb-28">
//                         <div className="card-title">⚡ Actions</div>
//                         <div className="btn-row">
//                             <button
//                                 className="btn btn-primary"
//                                 onClick={() => handleApplyTag('DepartmentTag', detail.suggested_department)}
//                                 disabled={!!applied['DepartmentTag']}
//                             >
//                                 🚀 Apply DepartmentTag={detail.suggested_department}
//                             </button>

//                             <button
//                                 className="btn btn-green"
//                                 onClick={() => handleApplyTag('CostCenterTag', detail.suggested_cost_center)}
//                                 disabled={!!applied['CostCenterTag']}
//                             >
//                                 ✅ Apply CostCenterTag={detail.suggested_cost_center}
//                             </button>

//                             <button className="btn btn-purple" onClick={handleBulkApprove}>
//                                 🔄 Bulk Approve All ≥85% Confidence
//                             </button>

//                             <a
//                                 className="btn btn-ghost"
//                                 href={exportTaggingUrl()}
//                                 download="tagging_report.csv"
//                             >
//                                 📥 Export Tagging Report CSV
//                             </a>
//                         </div>

//                         {applied['DepartmentTag'] && (
//                             <div className="action-result" style={{ marginTop: 12 }}>
//                                 ✅ DepartmentTag = <strong>{applied['DepartmentTag']}</strong> applied to {selectedVm}
//                             </div>
//                         )}
//                         {applied['CostCenterTag'] && (
//                             <div className="action-result">
//                                 ✅ CostCenterTag = <strong>{applied['CostCenterTag']}</strong> applied to {selectedVm}
//                             </div>
//                         )}
//                     </div>

//                     {/* Bulk approve result */}
//                     {bulkResult && (
//                         <div className="card mb-28">
//                             <div className="card-title">🔄 Bulk Approve Results — {bulkResult.approved_count} tags approved</div>
//                             <div className="table-wrap">
//                                 <table>
//                                     <thead>
//                                         <tr>
//                                             <th>Resource ID</th>
//                                             <th>Missing Tag</th>
//                                             <th>Suggested Value</th>
//                                             <th>Confidence</th>
//                                             <th>Reason</th>
//                                         </tr>
//                                     </thead>
//                                     <tbody>
//                                         {bulkResult.approved.map((r, i) => (
//                                             <tr key={i}>
//                                                 <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)' }}>{r.ResourceID}</td>
//                                                 <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.MissingTag}</td>
//                                                 <td><span className="tag-chip">{r.SuggestedValue}</span></td>
//                                                 <td><span className="badge badge-green">{Math.round(r.Confidence * 100)}%</span></td>
//                                                 <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.Reason}</td>
//                                             </tr>
//                                         ))}
//                                     </tbody>
//                                 </table>
//                             </div>
//                         </div>
//                     )}

//                     {/* System evaluation */}
//                     <div className="card">
//                         <div className="card-title">📊 System Evaluation Dashboard</div>
//                         {kpis && (
//                             <div className="grid-3">
//                                 {[
//                                     { label: 'Total VMs Analysed', val: kpis.total_vms, color: 'var(--text)' },
//                                     { label: 'Tags Completed', val: kpis.complete, color: '#6EE7B7' },
//                                     { label: 'Tags Still Missing', val: kpis.incomplete, color: '#FC8181' },
//                                     { label: 'Completion Rate', val: kpis.pct_complete + '%', color: 'var(--blue-xlight)' },
//                                     { label: 'High Confidence (≥85%)', val: '7 suggestions', color: '#6EE7B7' },
//                                     { label: 'Est. Cost Unattributed', val: 'Unknown', color: '#FCD34D' },
//                                 ].map(({ label, val, color }) => (
//                                     <div key={label} style={{
//                                         background: 'rgba(255,255,255,0.03)',
//                                         borderRadius: 'var(--radius-sm)',
//                                         padding: 16,
//                                         border: '1px solid var(--border)',
//                                     }}>
//                                         <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
//                                         <div style={{
//                                             fontSize: 22, fontFamily: 'var(--font-display)',
//                                             fontWeight: 800, color,
//                                         }}>{val}</div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </>
//             )}

//             {toast && <div className="toast">{toast}</div>}
//         </div>
//     )
// }

import { useEffect, useState } from 'react'
import {
    getTaggingKpis, getTaggingSummary, getVmTagDetail,
    applyTag, bulkApprove, exportTaggingUrl
} from '../api.js'

const VM_LIST = [
    'vm-01', 'vm-02', 'vm-03', 'vm-04', 'vm-05', 'vm-06', 'vm-07', 'vm-08', 'vm-09',
    'vm-10', 'vm-11', 'vm-12', 'vm-13', 'vm-14', 'vm-15', 'vm-16', 'vm-17'
]

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
        if (c >= 0.85) return '#6EE7B7'
        if (c >= 0.75) return '#FCD34D'
        return '#FC8181'
    }

    const confBadge = (c) => {
        if (c >= 0.85) return 'badge badge-green'
        if (c >= 0.75) return 'badge badge-amber'
        return 'badge badge-red'
    }

    if (loading) return <div className="loading"><div className="spinner" /> Loading tagging data...</div>

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">🏷️ Context-Based Auto-Tagging Engine</h1>
                <p className="page-subtitle">
                    Azure FinOps · Likhith Nariyam · AI infers missing Department and CostCenter tags
                    from owner, service name, environment, and CPU signals
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
                                <th>Resource ID</th>
                                <th>Department Tag</th>
                                <th>Environment</th>
                                <th>Cost Center</th>
                                <th>Missing Tag</th>
                                <th>AI Suggested Value</th>
                                <th>Tag Status</th>
                                <th>Shutdown Candidate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {summary.map(r => (
                                <tr
                                    key={r.ResourceID}
                                    style={{
                                        cursor: 'pointer',
                                        background: selectedVm === r.ResourceID ? 'rgba(124,58,237,0.1)' : ''
                                    }}
                                    onClick={() => setSelectedVm(r.ResourceID)}
                                >
                                    <td>
                                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)', fontWeight: 600 }}>
                                            {r.ResourceID}
                                        </span>
                                    </td>
                                    <td>{r.DeptTag || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>— missing —</span>}</td>
                                    <td><span className="badge badge-teal">{r.EnvTag}</span></td>
                                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.CostCenterTag}</td>
                                    <td>
                                        {r.MissingTag
                                            ? <span style={{ color: '#FC8181', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{r.MissingTag}</span>
                                            : <span style={{ color: '#6EE7B7', fontSize: 12 }}>—</span>
                                        }
                                    </td>
                                    <td>
                                        {r.AI_SuggestedDept
                                            ? <span className="tag-chip">{r.AI_SuggestedDept}</span>
                                            : '—'
                                        }
                                    </td>
                                    <td>
                                        <span className={r.TagStatus === 'Complete' ? 'badge badge-green' : 'badge badge-red'}>
                                            {r.TagStatus}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={r.ShutdownCandidate === 'Yes' ? 'badge badge-amber' : 'badge badge-teal'}>
                                            {r.ShutdownCandidate}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 10 }}>
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
                                        .map(([k, v]) => (
                                            <tr key={k}>
                                                <td style={{ color: 'var(--text-muted)', fontSize: 12, width: 160 }}>{k}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                                                    {k === 'comp'
                                                        ? <span className={v === 'Compliant' ? 'badge badge-green' : 'badge badge-red'}>{v}</span>
                                                        : String(v) || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Department</span>
                                    <span className="tag-chip">{detail.suggested_department}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Cost Center</span>
                                    <span className="tag-chip">{detail.suggested_cost_center}</span>
                                </div>
                            </div>

                            {/* Confidence */}
                            <div style={{ marginTop: 16 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Confidence (System)</span>
                                    <span className={confBadge(detail.confidence)}>
                                        {Math.round(detail.confidence * 100)}%
                                    </span>
                                </div>
                                <div className="progress-bar">
                                    <div className="progress-fill" style={{
                                        width: `${detail.confidence * 100}%`,
                                        background: confColor(detail.confidence),
                                    }} />
                                </div>
                            </div>

                            {/* Confidence Breakdown */}
                            <div style={{ marginTop: 14 }}>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                                    🧮 Confidence Breakdown
                                </div>
                                <div className="conf-breakdown">
                                    {Object.entries(detail.confidence_breakdown).map(([key, val]) => (
                                        <div className="conf-row" key={key}>
                                            <span className="conf-key">{key}</span>
                                            <div className="progress-bar" style={{ flex: 1 }}>
                                                <div className="progress-fill" style={{
                                                    width: `${val * 100}%`,
                                                    background: 'var(--blue)',
                                                }} />
                                            </div>
                                            <span className="conf-pct">{Math.round(val * 100)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Signals */}
                        <div className="card">
                            <div className="card-title">🔎 Signals Used</div>
                            <div className="json-box">
                                {'{'}
                                {Object.entries(detail.signals_used).map(([k, v]) => (
                                    <div key={k} style={{ paddingLeft: 12 }}>
                                        <span style={{ color: '#F6C90E' }}>"{k}"</span>
                                        {' : '}
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
                            <div className="explanation-box">{detail.reasoning}</div>
                        </div>

                        {/* Alternative + Action */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div className="card">
                                <div className="card-title">🔄 Alternative</div>
                                <div className="explanation-box" style={{ background: 'rgba(124,58,237,0.07)', borderColor: 'rgba(124,58,237,0.2)' }}>
                                    {detail.alternative}
                                </div>
                            </div>
                            <div className="card">
                                <div className="card-title">⚡ Action</div>
                                <div className="explanation-box" style={{ background: 'rgba(5,150,105,0.07)', borderColor: 'rgba(5,150,105,0.2)' }}>
                                    {detail.action}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── NEW: AI Recommended Action (mentor requirement) ── */}
                    {detail.recommended_action && (
                        <div className="card mb-28">
                            <div className="card-title">🤖 AI Recommended Action</div>
                            <div className="explanation-box" style={{
                                background: 'rgba(46,117,182,0.07)',
                                borderColor: 'rgba(46,117,182,0.35)',
                                borderLeft: '3px solid var(--blue)',
                                fontStyle: 'normal',
                                lineHeight: 1.8,
                                fontSize: 14,
                            }}>
                                {detail.recommended_action}
                            </div>
                            <p style={{
                                fontSize: 11,
                                color: 'var(--text-muted)',
                                marginTop: 8,
                                fontStyle: 'italic',
                            }}>
                                ⚠️ AI suggests — FinOps team approves. Owner verification is required before any tag is applied.
                            </p>
                        </div>
                    )}

                    {/* ── NEW: Business Impact (mentor requirement) ── */}
                    {detail.business_impact && (
                        <div className="card mb-28">
                            <div className="card-title">💰 Business Impact</div>
                            <div className="explanation-box" style={{
                                background: 'rgba(5,150,105,0.07)',
                                borderColor: 'rgba(5,150,105,0.3)',
                                borderLeft: '3px solid #059669',
                                fontStyle: 'normal',
                                lineHeight: 1.8,
                                fontSize: 14,
                            }}>
                                {detail.business_impact}
                            </div>
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

                            <a
                                className="btn btn-ghost"
                                href={exportTaggingUrl()}
                                download="tagging_report.csv"
                            >
                                📥 Export Tagging Report CSV
                            </a>
                        </div>

                        {applied['DepartmentTag'] && (
                            <div className="action-result" style={{ marginTop: 12 }}>
                                ✅ DepartmentTag = <strong>{applied['DepartmentTag']}</strong> applied to {selectedVm}
                            </div>
                        )}
                        {applied['CostCenterTag'] && (
                            <div className="action-result">
                                ✅ CostCenterTag = <strong>{applied['CostCenterTag']}</strong> applied to {selectedVm}
                            </div>
                        )}
                    </div>

                    {/* Bulk approve result */}
                    {bulkResult && (
                        <div className="card mb-28">
                            <div className="card-title">🔄 Bulk Approve Results — {bulkResult.approved_count} tags approved</div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Resource ID</th>
                                            <th>Missing Tag</th>
                                            <th>Suggested Value</th>
                                            <th>Confidence</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {bulkResult.approved.map((r, i) => (
                                            <tr key={i}>
                                                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--blue-light)' }}>{r.ResourceID}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{r.MissingTag}</td>
                                                <td><span className="tag-chip">{r.SuggestedValue}</span></td>
                                                <td><span className="badge badge-green">{Math.round(r.Confidence * 100)}%</span></td>
                                                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.Reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* System evaluation */}
                    <div className="card">
                        <div className="card-title">📊 System Evaluation Dashboard</div>
                        {kpis && (
                            <div className="grid-3">
                                {[
                                    { label: 'Total VMs Analysed', val: kpis.total_vms, color: 'var(--text)' },
                                    { label: 'Tags Completed', val: kpis.complete, color: '#6EE7B7' },
                                    { label: 'Tags Still Missing', val: kpis.incomplete, color: '#FC8181' },
                                    { label: 'Completion Rate', val: kpis.pct_complete + '%', color: 'var(--blue-xlight)' },
                                    { label: 'High Confidence (≥85%)', val: '7 suggestions', color: '#6EE7B7' },
                                    { label: 'Est. Cost Unattributed', val: 'Unknown', color: '#FCD34D' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} style={{
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: 'var(--radius-sm)',
                                        padding: 16,
                                        border: '1px solid var(--border)',
                                    }}>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
                                        <div style={{
                                            fontSize: 22, fontFamily: 'var(--font-display)',
                                            fontWeight: 800, color,
                                        }}>{val}</div>
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
