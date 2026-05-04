from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from services.data_loader import get_meta, get_tagging_suggestions, get_integrated_tagging
from services.tagging_engine import (
    get_tagging_summary, get_tagging_kpis,
    get_vm_tag_detail, apply_tag, bulk_approve
)
from pydantic import BaseModel
import io, csv

router = APIRouter()


class ApplyTagRequest(BaseModel):
    tag_name:  str
    tag_value: str


@router.get("/kpis")
def tagging_kpis():
    """Tag completion KPIs for home dashboard."""
    it = get_integrated_tagging()
    return get_tagging_kpis(it)


@router.get("/summary")
def tagging_summary():
    """All VMs tag status summary."""
    it = get_integrated_tagging()
    return get_tagging_summary(it)


@router.get("/{vm_id}")
def vm_tag_detail(vm_id: str):
    """Full AI tag suggestion for one VM — reasoning, confidence, signals."""
    ts   = get_tagging_suggestions()
    meta = get_meta()
    detail = get_vm_tag_detail(vm_id, ts, meta)
    if not detail:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    return detail


@router.post("/{vm_id}/apply")
def apply_vm_tag(vm_id: str, req: ApplyTagRequest):
    """Apply a suggested tag to a VM."""
    meta = get_meta()
    if meta[meta["ResourceID"] == vm_id].empty:
        raise HTTPException(status_code=404, detail=f"{vm_id} not found")
    return apply_tag(vm_id, req.tag_name, req.tag_value)


@router.post("/bulk-approve")
def bulk_approve_tags():
    """Approve all tag suggestions with confidence >= 0.85."""
    ts      = get_tagging_suggestions()
    approved = bulk_approve(ts, threshold=0.85)
    return {
        "approved_count": len(approved),
        "approved":       approved,
        "message":        f"{len(approved)} high-confidence tags approved.",
    }


@router.get("/export/report")
def export_tagging_report():
    """Download CSV of all tag suggestions."""
    ts   = get_tagging_suggestions()
    rows = ts.to_dict("records")
    if not rows:
        raise HTTPException(status_code=404, detail="No tagging data found")

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=tagging_report.csv"}
    )