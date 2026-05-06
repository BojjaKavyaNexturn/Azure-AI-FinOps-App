# import pandas as pd

# def get_tagging_summary(integrated_tagging):
#     """Return tag status for all VMs."""
#     df = integrated_tagging.copy()
#     df = df.fillna("")
#     return df.to_dict("records")


# def get_tagging_kpis(integrated_tagging):
#     df = integrated_tagging.copy()
#     total    = len(df)
#     complete = len(df[df["TagStatus"] == "Complete"])
#     incomplete = total - complete
#     return {
#         "total_vms":   total,
#         "complete":    complete,
#         "incomplete":  incomplete,
#         "pct_complete": round(complete / total * 100, 1),
#     }


# def get_vm_tag_detail(vm_id: str, tagging_suggestions, resource_metadata):
#     """Return full tag detail + AI suggestion for one VM."""
#     meta_row = resource_metadata[resource_metadata["ResourceID"] == vm_id]
#     if meta_row.empty:
#         return None

#     meta = meta_row.iloc[0].to_dict()
#     suggestions = tagging_suggestions[
#         tagging_suggestions["ResourceID"] == vm_id
#     ].to_dict("records")

#     # Build confidence breakdown (same logic as Likhith's engine)
#     owner   = str(meta.get("Owner", ""))
#     svc     = str(meta.get("ServiceName", ""))
#     env     = str(meta.get("Environment", ""))
#     signals = {
#         "Owner":       owner,
#         "Service":     svc,
#         "Environment": env,
#     }

#     # Infer department from owner/service
#     dept = ""
#     confidence = 0.0
#     reasoning  = ""
#     alternative = ""

#     if "Payments" in owner or "Payments" in svc:
#         dept       = "Finance"
#         confidence = 0.84
#         reasoning  = (f"Department inferred as Finance because Owner is {owner} "
#                       f"and ServiceName is {svc}, both strongly related to Payments/Finance.")
#         alternative = "Could also be Payments department specifically if a sub-department tag exists."
#     elif "Infra" in owner or "Infra" in svc:
#         dept       = "Infra"
#         confidence = 0.88
#         reasoning  = (f"Department inferred as Infra because Owner is {owner} "
#                       f"and ServiceName is {svc}.")
#         alternative = "Could be Platform or DevOps if the org uses those department names."
#     elif "ML" in owner or "ML" in svc:
#         dept       = "ML"
#         confidence = 0.82
#         reasoning  = (f"Department inferred as ML because Owner is {owner} "
#                       f"and ServiceName is {svc}.")
#         alternative = "Could be Data Science or AI depending on org taxonomy."
#     elif "Search" in owner or "Search" in svc:
#         dept       = "Search"
#         confidence = 0.86
#         reasoning  = (f"Department inferred as Search because Owner is {owner} "
#                       f"and ServiceName is {svc}.")
#         alternative = "Could be Platform if Search is hosted under platform team."
#     else:
#         dept       = "Unknown"
#         confidence = 0.50
#         reasoning  = "Could not infer department from available signals."
#         alternative = "Manual tagging required."

#     confidence_breakdown = {
#         "Owner":       0.40,
#         "Service":     0.30,
#         "Environment": 0.20,
#         "CPU":         0.10,
#     }

#     return {
#         "vm_id":               vm_id,
#         "resource_context":    meta,
#         "signals_used":        signals,
#         "suggested_department": dept,
#         "suggested_cost_center": meta.get("CostCenter", ""),
#         "confidence":          confidence,
#         "confidence_breakdown": confidence_breakdown,
#         "reasoning":           reasoning,
#         "alternative":         alternative,
#         "action":              f"Assign DepartmentTag={dept} and verify resource utilisation aligns with {dept} team budget.",
#         "existing_suggestions": suggestions,
#     }


# def apply_tag(vm_id: str, tag_name: str, tag_value: str):
#     """Simulate applying a tag — in production this calls Azure Resource Manager API."""
#     return {
#         "vm_id":     vm_id,
#         "tag_name":  tag_name,
#         "tag_value": tag_value,
#         "status":    "applied",
#         "message":   f"Tag {tag_name}={tag_value} successfully applied to {vm_id}.",
#         "note":      "In production this calls Azure Resource Manager PATCH /tags endpoint."
#     }


# def bulk_approve(tagging_suggestions, threshold: float = 0.85):
#     """Return all suggestions above confidence threshold."""
#     df = tagging_suggestions[tagging_suggestions["Confidence"] >= threshold].copy()
#     return df.to_dict("records")

"""
backend/services/tagging_engine.py
────────────────────────────────────
Context-Based Auto-Tagging Engine — Groq LLM powered.
Upgraded for demo: intelligent secretary persona, strong recommended_action,
quantified business_impact, owner-verification guardrail, approval demarcation.

Author: Likhith Nariyam
"""

import os
import json
import pandas as pd
from groq import Groq
from dotenv import load_dotenv
from typing import Optional
load_dotenv()

# ── Groq client ───────────────────────────────────────────────────────────────
client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL  = "llama-3.3-70b-versatile"

# ── Allowed departments ───────────────────────────────────────────────────────
VALID_DEPARTMENTS = [
    "Finance",
    "Infrastructure",
    "Research and Development",
    "Platform Engineering",
    "Security",
    "Payments",
    "Data Engineering",
]


# ── Confidence engine (identical to Streamlit app — do not modify) ─────────────

def compute_confidence_and_breakdown(row: dict) -> tuple[float, dict]:
    """
    Rule-based confidence scorer — identical to Likhith's Streamlit engine.
    Returns (score 0.0–1.0, breakdown dict).
    """
    breakdown = {}
    score = 0.0

    # Owner signal — 40 pts
    owner = str(row.get("Owner", "") or "")
    if owner and owner not in ["Unknown", "nan", "None", ""]:
        breakdown["Owner"] = 0.40
        score += 0.40
    else:
        breakdown["Owner"] = 0.0

    # Service name signal — 20 pts
    service = str(row.get("ServiceName", "") or "").lower()
    if any(k in service for k in ["payment", "ml", "infra", "search", "data", "security"]):
        breakdown["Service"] = 0.20
        score += 0.20
    else:
        breakdown["Service"] = 0.0

    # Environment signal — 10 pts
    env = str(row.get("Environment", "") or "")
    if env in ["Prod", "Dev", "Test"]:
        breakdown["Environment"] = 0.10
        score += 0.10
    else:
        breakdown["Environment"] = 0.0

    # CPU signal — 10 pts
    try:
        cpu = float(row.get("Avg_CPU_Percent", 0) or 0)
    except (ValueError, TypeError):
        cpu = 0.0
    if cpu > 40:
        breakdown["CPU"] = 0.10
        score += 0.10
    else:
        breakdown["CPU"] = 0.0

    return round(min(score, 1.0), 2), breakdown


# ── LLM tag suggestion ─────────────────────────────────────────────────────────

def generate_tag_suggestion(vm_id: str, row: dict) -> dict:
    """
    Call Groq LLM to produce a professional, mentor-grade tag suggestion.
    Acts as an intelligent FinOps secretary — strong recommended_action,
    quantified business_impact, owner-verification guardrail, approval gate.
    Falls back gracefully on failure.
    """
    try:
        cpu = float(row.get("Avg_CPU_Percent", 0) or 0)
    except (ValueError, TypeError):
        cpu = 0.0

    env     = str(row.get("Environment", "Unknown"))
    owner   = str(row.get("Owner", "Unknown"))
    service = str(row.get("ServiceName", "Unknown"))

    # CPU pressure hint — helps LLM produce a quantified business_impact
    if cpu < 10:
        cost_hint = (
            f"CPU utilisation is critically low at {cpu:.1f}%. "
            f"This VM may be idle or abandoned — strong decommission candidate."
        )
    elif cpu < 25:
        cost_hint = (
            f"CPU utilisation is low at {cpu:.1f}%. "
            f"This VM appears underutilised — rightsizing recommended."
        )
    elif cpu > 80:
        cost_hint = (
            f"CPU utilisation is high at {cpu:.1f}%. "
            f"This VM may be undersized or carrying unexpected load."
        )
    else:
        cost_hint = f"CPU utilisation is moderate at {cpu:.1f}% — within normal operating range."

    prompt = f"""You are an expert Azure FinOps AI assistant acting as an intelligent secretary
for a cloud cost governance team. Your role is to analyse Azure VM metadata and produce
professional, actionable tagging recommendations that a FinOps lead can act on immediately.

Think of yourself as a trusted advisor who surfaces clear insights, recommends specific
actions in plain language, and always defers final decisions to the human team.

════════════════════════════════════════════════════════════
RESOURCE UNDER REVIEW
════════════════════════════════════════════════════════════
ResourceID:   {vm_id}
Owner:        {owner}
ServiceName:  {service}
Environment:  {env}
CPU Signal:   {cost_hint}

════════════════════════════════════════════════════════════
YOUR TASK
════════════════════════════════════════════════════════════

1. DEPARTMENT — Infer from the ALLOWED LIST ONLY. Use Owner and ServiceName as primary
   signals. Environment and CPU as secondary signals.

2. COST CENTER — Format: CC-<ABBREV>-<ENV> e.g. CC-PAY-PROD, CC-INFRA-DEV.

3. REASONING — 2–3 sentences explaining EXACTLY which signals drove your department
   decision. You MUST end with: "Note: Owner must be verified and confirmed by the
   FinOps team before this tag is applied — AI will not auto-fill ownership."

4. RECOMMENDED_ACTION — Write in first-person assistant voice. Be specific to this VM,
   this environment, and these signals. Quantify impact if possible. End with an
   approval prompt: "Shall I proceed?" or "Please confirm to apply."
   Example: "I recommend tagging {vm_id} under Payments (CC-PAY-PROD) based on the
   payment-gateway owner and service signals. This will restore cost attribution for
   an estimated $320–$480/month of untagged spend. Shall I proceed?"

5. BUSINESS_IMPACT — 1–2 sentences. Use CPU and environment to estimate monthly cost
   at risk or potential savings. Be specific with dollar ranges where possible.
   Example: "With CPU at 8.3% in a Prod environment, this VM represents an estimated
   $200–$450/month in idle compute spend if left untagged and unmonitored."

6. ALTERNATIVE — 1 sentence naming the next most likely department and why.

7. ACTION — 1 sentence: the single most important next step for the FinOps team.

════════════════════════════════════════════════════════════
ALLOWED DEPARTMENTS — use EXACT spelling, one only:
{chr(10).join(f"  • {d}" for d in VALID_DEPARTMENTS)}

════════════════════════════════════════════════════════════
CRITICAL RULES:
- Never auto-fill or guess the Owner. Always flag for human verification.
- AI suggests; the FinOps team approves. Make this demarcation clear.
- Do not use generic phrases like "misconfiguration" — be specific to this VM.
- business_impact must reference actual signals (CPU %, environment, service name).

════════════════════════════════════════════════════════════
Return ONLY valid JSON — no markdown, no backticks, no preamble:

{{
  "department":          "<exactly one department from the allowed list>",
  "cost_center":         "<CC-ABBREV-ENV>",
  "reasoning":           "<2–3 sentences + owner verification note>",
  "recommended_action":  "<2–3 sentences, first-person, VM-specific, ends with approval prompt>",
  "business_impact":     "<1–2 sentences with quantified cost estimate>",
  "alternative":         "<1 sentence: next most likely department and reason>",
  "action":              "<1 sentence: single most important next step>"
}}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=700,
        )
        content = response.choices[0].message.content.strip()
        content = content.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        result  = json.loads(content)

        # Validate department — never let an invalid value reach the frontend
        dept = result.get("department", "")
        if dept not in VALID_DEPARTMENTS:
            dept = _fallback_department(row)
        result["department"] = dept

        # Patch any missing keys so the frontend never gets a KeyError
        result.setdefault(
            "recommended_action",
            f"I recommend reviewing {vm_id} and applying the suggested tags after owner verification. Please confirm to apply."
        )
        result.setdefault(
            "business_impact",
            "Business impact could not be quantified — manual cost review recommended."
        )
        result.setdefault(
            "alternative",
            "Platform Engineering if this workload is shared across multiple teams."
        )
        result.setdefault(
            "action",
            f"Verify Owner, then apply DepartmentTag={dept} via Azure Resource Manager."
        )
        result.setdefault(
            "reasoning",
            (
                f"Department inferred as {dept} from ServiceName and Owner signals. "
                f"Note: Owner must be verified and confirmed by the FinOps team before "
                f"this tag is applied — AI will not auto-fill ownership."
            )
        )

        return result

    except Exception as e:
        print(f"[tagging_engine] Groq error for {vm_id}: {e}")
        return _fallback_response(vm_id, row, cpu, env)


def _fallback_department(row: dict) -> str:
    """Keyword fallback when LLM returns an invalid department value."""
    text = f"{row.get('Owner', '')} {row.get('ServiceName', '')}".lower()
    if any(k in text for k in ["payment", "finance", "billing", "invoice"]):
        return "Payments"
    if any(k in text for k in ["infra", "platform", "devops", "network"]):
        return "Infrastructure"
    if any(k in text for k in ["ml", "ai", "research", "model", "train"]):
        return "Research and Development"
    if any(k in text for k in ["data", "analytics", "pipeline", "etl", "warehouse"]):
        return "Data Engineering"
    if any(k in text for k in ["security", "sec", "iam", "auth", "cert"]):
        return "Security"
    return "Platform Engineering"


def _fallback_response(vm_id: str, row: dict, cpu: float, env: str) -> dict:
    """Full structured fallback used when Groq is entirely unavailable."""
    dept = _fallback_department(row)
    abbrev_map = {
        "Finance": "FIN",
        "Infrastructure": "INFRA",
        "Research and Development": "RND",
        "Platform Engineering": "PLAT",
        "Security": "SEC",
        "Payments": "PAY",
        "Data Engineering": "DE",
    }
    abbrev    = abbrev_map.get(dept, "PLAT")
    env_short = env[:4].upper() if env not in ["Unknown", ""] else "UNK"

    if cpu < 10:
        waste_note = (
            f"CPU utilisation is critically low at {cpu:.1f}% — this VM may be idle. "
            f"Estimated monthly waste: $250–$550 if the resource is untagged and unmonitored."
        )
    elif cpu < 25:
        waste_note = (
            f"CPU utilisation is low at {cpu:.1f}%, suggesting underutilisation. "
            f"Potential rightsizing savings: $100–$300/month."
        )
    else:
        waste_note = (
            f"CPU utilisation is {cpu:.1f}% — within normal range. "
            f"Primary risk is cost misattribution due to missing DepartmentTag."
        )

    return {
        "department":  dept,
        "cost_center": f"CC-{abbrev}-{env_short}",
        "reasoning": (
            f"Department inferred as {dept} based on ServiceName '{row.get('ServiceName', '')}' "
            f"and Owner '{row.get('Owner', '')}' (LLM unavailable — keyword fallback applied). "
            f"Note: Owner must be verified and confirmed by the FinOps team before this tag is "
            f"applied — AI will not auto-fill ownership."
        ),
        "recommended_action": (
            f"I recommend tagging {vm_id} under {dept} "
            f"(Cost Center: CC-{abbrev}-{env_short}) based on available metadata signals. "
            f"Please verify the Owner field is correct before applying — "
            f"this is the FinOps team's responsibility to confirm. Shall I proceed?"
        ),
        "business_impact": waste_note,
        "alternative":     "Platform Engineering if this workload is shared across multiple teams.",
        "action": (
            f"Verify Owner, confirm department as {dept}, then apply "
            f"DepartmentTag and CostCenterTag via Azure Resource Manager PATCH /tags."
        ),
    }


# ── Public API (function signatures unchanged) ─────────────────────────────────

def get_tagging_kpis(integrated_tagging: pd.DataFrame) -> dict:
    df    = integrated_tagging.copy()
    total = len(df)
    complete = int((df.get("TagStatus", pd.Series(dtype=str)) == "Complete").sum())
    return {
        "total_vms":    total,
        "complete":     complete,
        "incomplete":   total - complete,
        "pct_complete": round(complete / total * 100, 1) if total else 0,
    }


def get_tagging_summary(integrated_tagging: pd.DataFrame) -> list[dict]:
    df = integrated_tagging.copy().fillna("")
    return df.to_dict("records")


def get_vm_tag_detail(vm_id: str, tagging_suggestions: pd.DataFrame, resource_metadata: pd.DataFrame) -> Optional[dict]:
    """
    Full AI tag suggestion for one VM — powered by Groq LLM.
    Response shape matches exactly what AutoTagging.jsx expects.
    Two new fields added: recommended_action, business_impact.
    """
    meta_row = resource_metadata[resource_metadata["ResourceID"] == vm_id]
    if meta_row.empty:
        return None

    row = meta_row.iloc[0].to_dict()

    # Merge avg CPU from tagging_suggestions if absent in metadata
    ts_rows = tagging_suggestions[tagging_suggestions["ResourceID"] == vm_id]
    if not ts_rows.empty:
        ts = ts_rows.iloc[0].to_dict()
        if not row.get("Avg_CPU_Percent"):
            row["Avg_CPU_Percent"] = ts.get("Avg_CPU_Percent", 0)

    # ── Groq LLM call ──────────────────────────────────────────────────────────
    llm = generate_tag_suggestion(vm_id, row)

    # ── Rule-based confidence (identical to Streamlit) ──────────────────────
    confidence, breakdown = compute_confidence_and_breakdown(row)

    # ── Clean resource_context (no NaN) ───────────────────────────────────────
    context = {
        k: ("" if (isinstance(v, float) and pd.isna(v)) else str(v))
        for k, v in row.items()
    }

    return {
        "resource_context":      context,
        "suggested_department":  llm["department"],
        "suggested_cost_center": llm["cost_center"],
        "confidence":            confidence,
        "confidence_breakdown":  breakdown,
        "signals_used": {
            "Owner":       str(row.get("Owner", "")),
            "Service":     str(row.get("ServiceName", "")),
            "Environment": str(row.get("Environment", "")),
            "CPU":         str(row.get("Avg_CPU_Percent", "")),
        },
        "reasoning":           llm["reasoning"],
        "alternative":         llm["alternative"],
        "action":              llm["action"],
        # ── New mentor-required fields ────────────────────────────────────────
        "recommended_action":  llm["recommended_action"],
        "business_impact":     llm["business_impact"],
    }


def apply_tag(vm_id: str, tag_name: str, tag_value: str) -> dict:
    """Simulate applying a tag. In production calls Azure Resource Manager PATCH /tags."""
    from datetime import datetime
    return {
        "vm_id":      vm_id,
        "tag_name":   tag_name,
        "tag_value":  tag_value,
        "status":     "applied",
        "applied_at": datetime.utcnow().isoformat(),
        "message":    f"Tag {tag_name}={tag_value} successfully applied to {vm_id}.",
        "note":       "In production this calls Azure Resource Manager PATCH /tags endpoint.",
    }


def bulk_approve(tagging_suggestions: pd.DataFrame, threshold: float = 0.85) -> list[dict]:
    """
    Approve all VMs whose rule-based confidence meets the threshold.
    Re-computes confidence from raw signals to stay consistent with the detail view.
    Owner verification note is appended to every Reason field.
    """
    approved = []
    for _, r in tagging_suggestions.iterrows():
        row_dict   = r.to_dict()
        confidence, _ = compute_confidence_and_breakdown(row_dict)

        if confidence >= threshold:
            dept     = str(row_dict.get("AI_SuggestedDept") or row_dict.get("SuggestedDepartment") or "Platform Engineering")
            dept_tag = str(row_dict.get("DepartmentTag") or "")
            cc_tag   = str(row_dict.get("CostCenterTag") or "")

            missing = ""
            if dept_tag in ["", "nan", "None"]:
                missing = "DepartmentTag"
            elif cc_tag in ["", "nan", "None"]:
                missing = "CostCenterTag"

            if missing:
                approved.append({
                    "ResourceID":     str(row_dict.get("ResourceID", "")),
                    "MissingTag":     missing,
                    "SuggestedValue": dept,
                    "Confidence":     confidence,
                    "Reason": (
                        f"Confidence {round(confidence * 100)}% ≥ {round(threshold * 100)}% threshold. "
                        f"Owner must be verified by the FinOps team before this tag is applied."
                    ),
                })

    return approved