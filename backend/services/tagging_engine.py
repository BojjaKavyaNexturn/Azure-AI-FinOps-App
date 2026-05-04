import pandas as pd

def get_tagging_summary(integrated_tagging):
    """Return tag status for all VMs."""
    df = integrated_tagging.copy()
    df = df.fillna("")
    return df.to_dict("records")


def get_tagging_kpis(integrated_tagging):
    df = integrated_tagging.copy()
    total    = len(df)
    complete = len(df[df["TagStatus"] == "Complete"])
    incomplete = total - complete
    return {
        "total_vms":   total,
        "complete":    complete,
        "incomplete":  incomplete,
        "pct_complete": round(complete / total * 100, 1),
    }


def get_vm_tag_detail(vm_id: str, tagging_suggestions, resource_metadata):
    """Return full tag detail + AI suggestion for one VM."""
    meta_row = resource_metadata[resource_metadata["ResourceID"] == vm_id]
    if meta_row.empty:
        return None

    meta = meta_row.iloc[0].to_dict()
    suggestions = tagging_suggestions[
        tagging_suggestions["ResourceID"] == vm_id
    ].to_dict("records")

    # Build confidence breakdown (same logic as Likhith's engine)
    owner   = str(meta.get("Owner", ""))
    svc     = str(meta.get("ServiceName", ""))
    env     = str(meta.get("Environment", ""))
    signals = {
        "Owner":       owner,
        "Service":     svc,
        "Environment": env,
    }

    # Infer department from owner/service
    dept = ""
    confidence = 0.0
    reasoning  = ""
    alternative = ""

    if "Payments" in owner or "Payments" in svc:
        dept       = "Finance"
        confidence = 0.84
        reasoning  = (f"Department inferred as Finance because Owner is {owner} "
                      f"and ServiceName is {svc}, both strongly related to Payments/Finance.")
        alternative = "Could also be Payments department specifically if a sub-department tag exists."
    elif "Infra" in owner or "Infra" in svc:
        dept       = "Infra"
        confidence = 0.88
        reasoning  = (f"Department inferred as Infra because Owner is {owner} "
                      f"and ServiceName is {svc}.")
        alternative = "Could be Platform or DevOps if the org uses those department names."
    elif "ML" in owner or "ML" in svc:
        dept       = "ML"
        confidence = 0.82
        reasoning  = (f"Department inferred as ML because Owner is {owner} "
                      f"and ServiceName is {svc}.")
        alternative = "Could be Data Science or AI depending on org taxonomy."
    elif "Search" in owner or "Search" in svc:
        dept       = "Search"
        confidence = 0.86
        reasoning  = (f"Department inferred as Search because Owner is {owner} "
                      f"and ServiceName is {svc}.")
        alternative = "Could be Platform if Search is hosted under platform team."
    else:
        dept       = "Unknown"
        confidence = 0.50
        reasoning  = "Could not infer department from available signals."
        alternative = "Manual tagging required."

    confidence_breakdown = {
        "Owner":       0.40,
        "Service":     0.30,
        "Environment": 0.20,
        "CPU":         0.10,
    }

    return {
        "vm_id":               vm_id,
        "resource_context":    meta,
        "signals_used":        signals,
        "suggested_department": dept,
        "suggested_cost_center": meta.get("CostCenter", ""),
        "confidence":          confidence,
        "confidence_breakdown": confidence_breakdown,
        "reasoning":           reasoning,
        "alternative":         alternative,
        "action":              f"Assign DepartmentTag={dept} and verify resource utilisation aligns with {dept} team budget.",
        "existing_suggestions": suggestions,
    }


def apply_tag(vm_id: str, tag_name: str, tag_value: str):
    """Simulate applying a tag — in production this calls Azure Resource Manager API."""
    return {
        "vm_id":     vm_id,
        "tag_name":  tag_name,
        "tag_value": tag_value,
        "status":    "applied",
        "message":   f"Tag {tag_name}={tag_value} successfully applied to {vm_id}.",
        "note":      "In production this calls Azure Resource Manager PATCH /tags endpoint."
    }


def bulk_approve(tagging_suggestions, threshold: float = 0.85):
    """Return all suggestions above confidence threshold."""
    df = tagging_suggestions[tagging_suggestions["Confidence"] >= threshold].copy()
    return df.to_dict("records")