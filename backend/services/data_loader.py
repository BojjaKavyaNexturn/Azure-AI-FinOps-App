# import pandas as pd
# from functools import lru_cache
# import os

# DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "final updated dataset.xlsx"))

# @lru_cache(maxsize=1)
# def load_all():
#     if not os.path.exists(DATA_PATH):
#         raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

#     xl = pd.ExcelFile(DATA_PATH)
#     print(f"[data_loader] Available sheets: {xl.sheet_names}")

#     # Platform_Metrics — row 0=title, row 1=subtitle, row 2=headers
#     pm = xl.parse("Platform_Metrics", header=2)
#     pm.columns = pm.columns.str.strip()
#     pm["Timestamp"] = pd.to_datetime(pm["Timestamp"], errors="coerce")

#     # Billing_Data — row 0=title, row 1=footnote, row 2=headers
#     bd = xl.parse("Billing_Data", header=2)
#     bd.columns = bd.columns.str.strip()
#     bd["Timestamp"] = pd.to_datetime(bd["Timestamp"], errors="coerce")

#     print(f"[data_loader] PM columns: {pm.columns.tolist()}")
#     print(f"[data_loader] BD columns: {bd.columns.tolist()}")
#     print(f"[data_loader] PM rows: {len(pm)} | BD rows: {len(bd)}")

#     return {
#         "platform_metrics":       pm,
#         "billing_data":           bd,
#         "resource_metadata":      xl.parse("Resource_Metadata",      header=1),
#         "ai_recommendations":     xl.parse("AI_Recommendations",     header=1),
#         "ai_tagging_suggestions": xl.parse("AI_Tagging_Suggestions", header=1),
#         "integrated_tagging":     xl.parse("Tagging_Summary",        header=1),
#         "anomaly_summary":        xl.parse("Anomaly_Summary",        header=1),
#         "tagging_summary":        xl.parse("Tagging_Summary",        header=1),
#         "anomaly_shortlist":      xl.parse("Anomaly_Shortlist",      header=1),
#         "activity_logs":          xl.parse(" Activity_Logs",         header=1),
#         "dataset_metadata":       xl.parse("Dataset_Metadata",       header=1),
#     }

# def get_pm():                  return load_all()["platform_metrics"]
# def get_bd():                  return load_all()["billing_data"]
# def get_meta():                return load_all()["resource_metadata"]
# def get_recommendations():     return load_all()["ai_recommendations"]
# def get_tagging_suggestions(): return load_all()["ai_tagging_suggestions"]
# def get_integrated_tagging():  return load_all()["integrated_tagging"]

"""
backend/services/data_loader.py
────────────────────────────────
Single source of truth for all Excel sheet loading.
Header rows verified by direct sheet inspection.
"""

import os
import pandas as pd
from functools import lru_cache

# ── Find dataset ──────────────────────────────────────────────────────────────
_DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))

_POSSIBLE_NAMES = [
    "final updated dataset.xlsx",
    "final_updated_dataset.xlsx",
    "Azure_FinOps_Final_v6.xlsx",
    "Azure_FinOps_Final_v5__1_.xlsx",
]

def _find_dataset() -> str:
    for name in _POSSIBLE_NAMES:
        path = os.path.join(_DATA_DIR, name)
        if os.path.exists(path):
            print(f"[data_loader] ✅ Found: {name}")
            return path
    if os.path.exists(_DATA_DIR):
        for f in os.listdir(_DATA_DIR):
            if f.endswith(".xlsx"):
                print(f"[data_loader] ✅ Fallback: {f}")
                return os.path.join(_DATA_DIR, f)
    raise FileNotFoundError(
        f"\n❌ No dataset found in: {_DATA_DIR}\n"
        f"Put your Excel file there. Accepted names: {_POSSIBLE_NAMES}\n"
    )

DATA_PATH = _find_dataset()


def _safe_parse(xl, name, header=1):
    """Parse sheet by name or name with leading space."""
    for n in [name, name.strip(), " " + name.strip()]:
        if n in xl.sheet_names:
            df = xl.parse(n, header=header)
            df.columns = [str(c).strip().replace("\n", " ") for c in df.columns]
            return df
    return pd.DataFrame()


@lru_cache(maxsize=1)
def load_all() -> dict:
    xl = pd.ExcelFile(DATA_PATH)
    print(f"[data_loader] Sheets: {xl.sheet_names}")

    # ── Platform_Metrics — header row 2 ──────────────────────────────────────
    pm = xl.parse("Platform_Metrics", header=2)
    pm.columns = [str(c).strip() for c in pm.columns]
    pm["Timestamp"] = pd.to_datetime(pm["Timestamp"], errors="coerce")
    if "AnomalyFlag" not in pm.columns:
        pm["AnomalyFlag"] = ""
    pm = pm[pm["ResourceID"].astype(str).str.startswith("vm-", na=False)].copy()
    print(f"[data_loader] Platform_Metrics: {len(pm)} rows")

    # ── Billing_Data — header row 2 ───────────────────────────────────────────
    bd = xl.parse("Billing_Data", header=2)
    bd.columns = [str(c).strip() for c in bd.columns]
    bd["Timestamp"] = pd.to_datetime(bd["Timestamp"], errors="coerce")
    if "AnomalyFlag" not in bd.columns:
        bd["AnomalyFlag"] = ""
    if "ReservationApplied" not in bd.columns:
        bd["ReservationApplied"] = "Yes"
    bd = bd[bd["ResourceID"].astype(str).str.startswith("vm-", na=False)].copy()
    print(f"[data_loader] Billing_Data: {len(bd)} rows")

    # ── Resource_Metadata — header row 1 ──────────────────────────────────────
    meta = xl.parse("Resource_Metadata", header=1)
    meta.columns = [str(c).strip() for c in meta.columns]
    meta = meta[
        meta["ResourceID"].astype(str).str.startswith("vm-", na=False)
    ].reset_index(drop=True)

    # Rename PolicyCompliance* → PolicyCompliance (remove asterisk)
    meta.columns = [c.replace("*", "").strip() for c in meta.columns]

    # Add Avg_CPU_Percent — computed from Platform_Metrics, needed by tagging engine
    # We compute it here after pm is loaded (pm is loaded above this block)
    try:
        avg_cpu = pm.groupby("ResourceID")["CPU_Percent"].mean().round(2).reset_index()
        avg_cpu.columns = ["ResourceID", "Avg_CPU_Percent"]
        meta = meta.merge(avg_cpu, on="ResourceID", how="left")
        meta["Avg_CPU_Percent"] = meta["Avg_CPU_Percent"].fillna(0.0)
    except Exception as e:
        print(f"[data_loader] ⚠️ Could not compute Avg_CPU_Percent: {e}")
        meta["Avg_CPU_Percent"] = 0.0

    print(f"[data_loader] Resource_Metadata: {len(meta)} rows, Avg_CPU_Percent added")

    # ── Tagging_Summary — header row 4, data rows 5–25 (vm-01 to vm-17) ─────
    #
    # Verified structure:
    #   Row 0 → title text
    #   Row 1 → subtitle
    #   Row 2 → stats (17 total, 7 tagged, 10 missing, 12 shutdown)
    #   Row 3 → empty
    #   Row 4 → column headers  ← header=4
    #   Row 5–25 → VM data (some VMs have 2 rows for 2 missing tags)
    #   Row 26 → empty
    #   Row 27 → legend
    #
    ts_raw = xl.parse("Tagging_Summary", header=4)
    ts_raw.columns = [str(c).strip().replace("\n", " ") for c in ts_raw.columns]

    # Keep only real VM rows
    ts_vm = ts_raw[
        ts_raw["Resource"].astype(str).str.startswith("vm-", na=False)
    ].copy()

    # Aggregate duplicate rows (one VM can have 2 rows — one per missing tag)
    # Keep 1 row per VM, merge MissingTag and AI Suggested Value
    records = []
    for vm_id, group in ts_vm.groupby("Resource", sort=False):
        first = group.iloc[0].to_dict()
        if len(group) > 1:
            missing = [
                t for t in group["Missing Tag"].dropna().astype(str).tolist()
                if t not in ["nan", ""]
            ]
            first["Missing Tag"] = ", ".join(missing)
            suggested = [
                s for s in group["AI Suggested Value"].dropna().astype(str).tolist()
                if s not in ["nan", ""]
            ]
            first["AI Suggested Value"] = ", ".join(suggested)
        records.append(first)

    ts = pd.DataFrame(records)

    # Rename to frontend-expected column names
    ts = ts.rename(columns={
        "Resource":           "ResourceID",
        "Dept Tag":           "DeptTag",
        "Env Tag":            "EnvTag",
        "Cost Center Tag":    "CostCenterTag",
        "Missing Tag":        "MissingTag",
        "AI Suggested Value": "AI_SuggestedDept",
        "Confidence":         "Confidence",
        "Reason":             "Reason",
        "Existing Dept Tag":  "ExistingDeptTag",
        "Shutdown Candidate": "ShutdownCandidate",
        "Tag Status":         "TagStatus",
    })

    # Clean "— missing —" placeholders
    for col in ["DeptTag", "CostCenterTag"]:
        if col in ts.columns:
            ts[col] = ts[col].replace("— missing —", "").fillna("")

    # Ensure all expected frontend columns exist
    for col in ["ResourceID", "DeptTag", "EnvTag", "CostCenterTag", "MissingTag",
                "AI_SuggestedDept", "AI_SuggestedCC", "TagStatus", "ShutdownCandidate"]:
        if col not in ts.columns:
            ts[col] = ""

    ts = ts.fillna("")
    print(f"[data_loader] Tagging_Summary: {len(ts)} VMs — {list(ts['ResourceID'])}")

    # ── AI_Tagging_Suggestions — header row 1 ────────────────────────────────
    sug = xl.parse("AI_Tagging_Suggestions", header=1)
    sug.columns = [str(c).strip() for c in sug.columns]
    if "Confidence" in sug.columns:
        sug["Confidence"] = pd.to_numeric(sug["Confidence"], errors="coerce").fillna(0.8)
    if "ResourceID" in sug.columns:
        sug = sug[sug["ResourceID"].astype(str).str.startswith("vm-", na=False)].copy()
    print(f"[data_loader] AI_Tagging_Suggestions: {len(sug)} rows")

    # ── Other sheets ──────────────────────────────────────────────────────────
    ai_rec  = _safe_parse(xl, "AI_Recommendations",  header=1)
    an_sum  = _safe_parse(xl, "Anomaly_Summary",      header=1)
    an_list = _safe_parse(xl, "Anomaly_Shortlist",    header=1)
    act_log = _safe_parse(xl, " Activity_Logs",       header=1)
    ds_meta = _safe_parse(xl, "Dataset_Metadata",     header=1)

    print("[data_loader] ✅ All sheets loaded successfully!")

    return {
        "platform_metrics":       pm,
        "billing_data":           bd,
        "resource_metadata":      meta,
        "ai_tagging_suggestions": sug,
        "integrated_tagging":     ts,   # 17 rows, 1 per VM from Tagging_Summary
        "tagging_summary":        ts,
        "ai_recommendations":     ai_rec,
        "anomaly_summary":        an_sum,
        "anomaly_shortlist":      an_list,
        "activity_logs":          act_log,
        "dataset_metadata":       ds_meta,
    }


# ── Convenience accessors ─────────────────────────────────────────────────────
def get_pm():                  return load_all()["platform_metrics"]
def get_bd():                  return load_all()["billing_data"]
def get_meta():                return load_all()["resource_metadata"]
def get_recommendations():     return load_all()["ai_recommendations"]
def get_tagging_suggestions(): return load_all()["ai_tagging_suggestions"]
def get_integrated_tagging():  return load_all()["integrated_tagging"]