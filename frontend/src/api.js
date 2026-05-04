const BASE = '/api'

async function apiFetch(path) {
    const res = await fetch(`${BASE}${path}`)
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
    return res.json()
}

async function apiPost(path, body = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
    return res.json()
}

// Anomaly endpoints
export const getAnomalyKpis = () => apiFetch('/anomalies/kpis')
export const getAnomalySummary = () => apiFetch('/anomalies/summary')
export const getAnomalyDetail = (vm) => apiFetch(`/anomalies/${vm}`)
export const getAnomalyChart = (vm) => apiFetch(`/anomalies/${vm}/chart`)
export const getAnomalyBilling = (vm) => apiFetch(`/anomalies/${vm}/rows/billing`)
export const getAnomalyMetrics = (vm) => apiFetch(`/anomalies/${vm}/rows/metrics`)
export const resolveAnomaly = (vm) => apiPost(`/anomalies/${vm}/resolve`)
export const exportAnomalyUrl = (vm) => `${BASE}/anomalies/${vm}/export`
export const getAnomalyAIExplain = (vm) => apiFetch(`/anomalies/${vm}/ai-explain`)

// Tagging endpoints
export const getTaggingKpis = () => apiFetch('/tagging/kpis')
export const getTaggingSummary = () => apiFetch('/tagging/summary')
export const getVmTagDetail = (vm) => apiFetch(`/tagging/${vm}`)
export const applyTag = (vm, tag_name, tag_value) => apiPost(`/tagging/${vm}/apply`, { tag_name, tag_value })
export const bulkApprove = () => apiPost('/tagging/bulk-approve')
export const exportTaggingUrl = () => `${BASE}/tagging/export/report`