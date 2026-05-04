from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.grok_service import generate_anomaly_explanation
from services.data_loader import get_pm, get_bd
from services.anomaly_engine import (
    get_summary, get_kpis, get_detail,
    get_flagged_billing, get_flagged_metrics,
    get_chart_data, get_weekly_cost, ANOMALY_META
)
import io
import csv

router = APIRouter()


@router.get("/kpis")
def kpis():
    """Top-level KPI cards for home dashboard."""
    return get_kpis()


@router.get("/summary")
def summary():
    """All 5 anomalies overview table."""
    return get_summary()


@router.get("/{vm_id}")
def anomaly_detail(vm_id: str):
    """Full detail for one VM anomaly — explanation, actions, severity."""
    detail = get_detail(vm_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found in anomaly registry")
    return detail


@router.get("/{vm_id}/chart")
def chart_data(vm_id: str):
    """Time series chart data for cost + metrics."""
    if vm_id not in ANOMALY_META:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    pm = get_pm()
    bd = get_bd()
    if vm_id == "vm-12":
        return {"type": "weekly_creep", "data": get_weekly_cost(bd, vm_id)}
    return {"type": "timeseries", "data": get_chart_data(pm, bd, vm_id)}


@router.get("/{vm_id}/rows/billing")
def flagged_billing(vm_id: str):
    """Flagged billing rows for a VM — for audit view."""
    if vm_id not in ANOMALY_META:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    bd = get_bd()
    rows = get_flagged_billing(bd, vm_id)
    return {"vm_id": vm_id, "count": len(rows), "rows": rows}


@router.get("/{vm_id}/rows/metrics")
def flagged_metrics(vm_id: str):
    """Flagged metric rows for a VM — for audit view."""
    if vm_id not in ANOMALY_META:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    pm = get_pm()
    rows = get_flagged_metrics(pm, vm_id)
    return {"vm_id": vm_id, "count": len(rows), "rows": rows}


@router.get("/{vm_id}/export")
def export_report(vm_id: str):
    """Download CSV anomaly report for a VM."""
    if vm_id not in ANOMALY_META:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    bd   = get_bd()
    rows = get_flagged_billing(bd, vm_id)
    if not rows:
        raise HTTPException(status_code=404, detail="No flagged rows found")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=anomaly_report_{vm_id}.csv"}
    )


@router.get("/{vm_id}/ai-explain")
def ai_explain(vm_id: str):
    """Generate real AI explanation + recommended actions using Grok (xAI)."""
    detail = get_detail(vm_id)
    if not detail:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    return generate_anomaly_explanation(vm_id, detail)

@router.post("/{vm_id}/resolve")
def resolve_anomaly(vm_id: str):
    """Mark an anomaly as resolved."""
    if vm_id not in ANOMALY_META:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    from datetime import datetime
    return {
        "vm_id":      vm_id,
        "status":     "resolved",
        "resolved_at": datetime.utcnow().isoformat(),
        "message":    f"Anomaly {ANOMALY_META[vm_id]['flag']} on {vm_id} marked as resolved.",
    }