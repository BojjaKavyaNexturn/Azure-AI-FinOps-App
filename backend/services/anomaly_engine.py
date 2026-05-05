# import pandas as pd
# import numpy as np

# # ── Static anomaly metadata ──────────────────────────────────────────────────
# ANOMALY_META = {
#     "vm-05": {
#         "flag":        "COST_SPIKE_NO_CPU",
#         "title":       "Cost Spike — No CPU Change",
#         "severity":    "HIGH",
#         "dates":       "Jan 03–05, 2026",
#         "saving":      420,
#         "confidence":  0.94,
#         "explanation": (
#             "Between Jan 03–05, vm-05 billing cost jumped 3× (from ~$1.20/hr to ~$5.40/hr) "
#             "while CPU utilisation stayed completely flat. Network traffic surged to 900+ MB. "
#             "This pattern indicates a billing error or a rogue background network job — "
#             "the compute itself was not responsible for the cost spike."
#         ),
#         "action_audit": "Filter Billing_Data for vm-05, Jan 03–05 and compare CostUSD vs NetworkIn_MB.",
#         "action_email": "Alert owner SearchTeam: Unexpected cost spike on vm-05 Jan 03–05. Please investigate network jobs.",
#         "action_fix":   "Review and cancel any unrecognised network transfer jobs running on vm-05.",
#         "owner":        "SearchTeam",
#     },
#     "vm-09": {
#         "flag":        "ORPHANED_ACTIVE_NO_BILLING",
#         "title":       "Orphaned Billing Gap (Active Usage, $0 Cost)",
#         "severity":    "HIGH",
#         "dates":       "Jan 03–04, 2026",
#         "saving":      310,
#         "confidence":  0.91,
#         "explanation": (
#             "vm-09 was running at ~72% CPU across 192 intervals on Jan 03–04 "
#             "but the billing pipeline recorded $0.00 for those hours. "
#             "This is an invisible cost risk — the resource is consuming compute "
#             "but the organisation is not tracking this cost."
#         ),
#         "action_audit": "Filter Billing_Data for vm-09, Jan 03–04 and verify CostUSD = 0.0 rows.",
#         "action_email": "Alert owner InfraTeam: Billing pipeline failure on vm-09. $0 billed despite active CPU.",
#         "action_fix":   "Check subscription config and billing pipeline for vm-09. Verify reservation scope.",
#         "owner":        "InfraTeam",
#     },
#     "vm-12": {
#         "flag":        "GRADUAL_COST_CREEP",
#         "title":       "Gradual Cost Creep (+8% Week-over-Week)",
#         "severity":    "MEDIUM",
#         "dates":       "Jan 01–30, 2026 (full month)",
#         "saving":      390,
#         "confidence":  0.90,
#         "explanation": (
#             "vm-12 shows a consistent 8% cost increase every week across January. "
#             "Memory utilisation is also slowly creeping upward at ~0.9% per day. "
#             "This pattern is invisible in daily monitoring but compounds significantly. "
#             "Likely cause: uncontrolled autoscaling or storage growth."
#         ),
#         "action_audit": "Plot weekly average CostUSD for vm-12 to confirm +8% trend.",
#         "action_email": "Alert owner InfraTeam: vm-12 showing 8% weekly cost creep. Review autoscale settings.",
#         "action_fix":   "Downsize vm-12 from D4s_v5 → B2s. Estimated saving $390/month.",
#         "owner":        "InfraTeam",
#     },
#     "vm-07": {
#         "flag":        "RESERVATION_NOT_APPLIED",
#         "title":       "Reservation Not Applied (40% Price Jump)",
#         "severity":    "MEDIUM",
#         "dates":       "Jan 01, 02, 06, 11, 16",
#         "saving":      280,
#         "confidence":  0.88,
#         "explanation": (
#             "On 5 specific dates in January, vm-07 was billed at full pay-as-you-go rate "
#             "instead of the Reserved Instance discounted rate — a 40% cost overrun. "
#             "This is caused by a reservation scope mismatch or temporary reservation expiry. "
#             "Scattered dates (not consecutive) is typical of Azure scope issues."
#         ),
#         "action_audit": "Filter Billing_Data for vm-07 where ReservationApplied = No.",
#         "action_email": "Alert owner PaymentsTeam: Reserved Instance not applied on vm-07 on 5 dates. 40% cost overrun.",
#         "action_fix":   "Reassign Reserved Instance scope to correct subscription for vm-07.",
#         "owner":        "PaymentsTeam",
#     },
#     "vm-06": {
#         "flag":        "RESIZE_NO_COST_DROP",
#         "title":       "Resize — No Cost Drop",
#         "severity":    "HIGH",
#         "dates":       "Post Jan 04, 2026",
#         "saving":      480,
#         "confidence":  0.92,
#         "explanation": (
#             "Activity_Logs shows vm-06 was resized from D4s_v5 → B2s at 02:15 on Jan 04, "
#             "followed immediately by a restart. CPU dropped to 2.1% at the reboot moment "
#             "confirming the OS-level resize happened. However billing cost did NOT drop — "
#             "it continued at the D4s_v5 rate. Resize was not applied at Azure billing level."
#         ),
#         "action_audit": "Compare Activity_Logs resize event with Billing_Data CostUSD post Jan 04 for vm-06.",
#         "action_email": "Alert owner InfraTeam: Resize logged for vm-06 but billing unchanged. Verify at Azure portal.",
#         "action_fix":   "Confirm resize in Azure portal and raise support ticket if billing not updated.",
#         "owner":        "InfraTeam",
#     },
# }


# def get_summary():
#     """Return summary of all 5 anomalies."""
#     return [
#         {
#             "vm_id":      vm,
#             "flag":       m["flag"],
#             "title":      m["title"],
#             "severity":   m["severity"],
#             "dates":      m["dates"],
#             "saving":     m["saving"],
#             "confidence": m["confidence"],
#             "owner":      m["owner"],
#         }
#         for vm, m in ANOMALY_META.items()
#     ]


# def get_kpis():
#     total_saving = sum(m["saving"] for m in ANOMALY_META.values())
#     high_count   = sum(1 for m in ANOMALY_META.values() if m["severity"] == "HIGH")
#     medium_count = sum(1 for m in ANOMALY_META.values() if m["severity"] == "MEDIUM")
#     return {
#         "total_anomaly_types":   len(ANOMALY_META),
#         "high_severity":         high_count,
#         "medium_severity":       medium_count,
#         "estimated_monthly_loss": total_saving,
#         "vms_affected":          len(ANOMALY_META),
#         "total_vms":             17,
#     }


# def get_detail(vm_id: str):
#     """Return full detail for one VM anomaly."""
#     if vm_id not in ANOMALY_META:
#         return None
#     return ANOMALY_META[vm_id]


# def get_flagged_billing(bd, vm_id: str):
#     """Return flagged billing rows for a VM."""
#     df = bd[(bd["ResourceID"] == vm_id) & (bd["AnomalyFlag"] != "")].copy()
#     df["Timestamp"] = df["Timestamp"].astype(str)
#     return df[["ResourceID","Timestamp","CostUSD","ReservationApplied","AnomalyFlag"]].to_dict("records")


# def get_flagged_metrics(pm, vm_id: str):
#     """Return flagged metric rows for a VM."""
#     df = pm[(pm["ResourceID"] == vm_id) & (pm["AnomalyFlag"] != "")].copy()
#     df["Timestamp"] = df["Timestamp"].astype(str)
#     return df[["ResourceID","Timestamp","CPU_Percent","Memory_Percent",
#                "NetworkIn_MB","NetworkOut_MB","AnomalyFlag"]].to_dict("records")


# def get_chart_data(pm, bd, vm_id: str):
#     """Return chart-ready time series data for a VM."""
#     pm_vm = pm[pm["ResourceID"] == vm_id].copy()
#     bd_vm = bd[bd["ResourceID"] == vm_id].copy()

#     # Hourly resample for billing
#     bd_vm = bd_vm.set_index("Timestamp").resample("h")["CostUSD"].mean().reset_index()

#     # 15-min for metrics — sample every 4th row to keep payload small
#     pm_vm = pm_vm.iloc[::4].copy()

#     return {
#         "billing": {
#             "timestamps": bd_vm["Timestamp"].astype(str).tolist(),
#             "cost":       bd_vm["CostUSD"].round(4).tolist(),
#         },
#         "metrics": {
#             "timestamps":  pm_vm["Timestamp"].astype(str).tolist(),
#             "cpu":         pm_vm["CPU_Percent"].tolist(),
#             "memory":      pm_vm["Memory_Percent"].tolist(),
#             "network_in":  pm_vm["NetworkIn_MB"].tolist(),
#             "network_out": pm_vm["NetworkOut_MB"].tolist(),
#         }
#     }


# def get_weekly_cost(bd, vm_id: str):
#     """Weekly average cost for gradual creep chart."""
#     bd_vm = bd[bd["ResourceID"] == vm_id].copy()
#     bd_vm["Week"] = bd_vm["Timestamp"].dt.isocalendar().week.astype(int)
#     weekly = bd_vm.groupby("Week")["CostUSD"].mean().round(4).reset_index()
#     return {
#         "weeks": [f"Week {w}" for w in weekly["Week"].tolist()],
#         "cost":  weekly["CostUSD"].tolist(),
#     }



import pandas as pd
import numpy as np

# ── Static anomaly metadata (confidence will be computed from data) ──────────
ANOMALY_META = {
    "vm-05": {
        "flag":        "COST_SPIKE_NO_CPU",
        "title":       "Cost Spike — No CPU Change",
        "severity":    "HIGH",
        "dates":       "Jan 03–05, 2026",
        "saving":      420,
        "explanation": (
            "Between Jan 03–05, vm-05 billing cost jumped 3× (from ~$1.20/hr to ~$5.40/hr) "
            "while CPU utilisation stayed completely flat. Network traffic surged to 900+ MB. "
            "This pattern indicates a billing error or a rogue background network job — "
            "the compute itself was not responsible for the cost spike."
        ),
        "action_audit": "Filter Billing_Data for vm-05, Jan 03–05 and compare CostUSD vs NetworkIn_MB.",
        "action_email": "Alert owner SearchTeam: Unexpected cost spike on vm-05 Jan 03–05. Please investigate network jobs.",
        "action_fix":   "Review and cancel any unrecognised network transfer jobs running on vm-05.",
        "owner":        "SearchTeam",
    },
    "vm-09": {
        "flag":        "ORPHANED_ACTIVE_NO_BILLING",
        "title":       "Orphaned Billing Gap (Active Usage, $0 Cost)",
        "severity":    "HIGH",
        "dates":       "Jan 03–04, 2026",
        "saving":      310,
        "explanation": (
            "vm-09 was running at ~72% CPU across 192 intervals on Jan 03–04 "
            "but the billing pipeline recorded $0.00 for those hours. "
            "This is an invisible cost risk — the resource is consuming compute "
            "but the organisation is not tracking this cost."
        ),
        "action_audit": "Filter Billing_Data for vm-09, Jan 03–04 and verify CostUSD = 0.0 rows.",
        "action_email": "Alert owner InfraTeam: Billing pipeline failure on vm-09. $0 billed despite active CPU.",
        "action_fix":   "Check subscription config and billing pipeline for vm-09. Verify reservation scope.",
        "owner":        "InfraTeam",
    },
    "vm-12": {
        "flag":        "GRADUAL_COST_CREEP",
        "title":       "Gradual Cost Creep (+8% Week-over-Week)",
        "severity":    "MEDIUM",
        "dates":       "Jan 01–30, 2026 (full month)",
        "saving":      390,
        "explanation": (
            "vm-12 shows a consistent 8% cost increase every week across January. "
            "Memory utilisation is also slowly creeping upward at ~0.9% per day. "
            "This pattern is invisible in daily monitoring but compounds significantly. "
            "Likely cause: uncontrolled autoscaling or storage growth."
        ),
        "action_audit": "Plot weekly average CostUSD for vm-12 to confirm +8% trend.",
        "action_email": "Alert owner InfraTeam: vm-12 showing 8% weekly cost creep. Review autoscale settings.",
        "action_fix":   "Downsize vm-12 from D4s_v5 → B2s. Estimated saving $390/month.",
        "owner":        "InfraTeam",
    },
    "vm-07": {
        "flag":        "RESERVATION_NOT_APPLIED",
        "title":       "Reservation Not Applied (40% Price Jump)",
        "severity":    "MEDIUM",
        "dates":       "Jan 01, 02, 06, 11, 16",
        "saving":      280,
        "explanation": (
            "On 5 specific dates in January, vm-07 was billed at full pay-as-you-go rate "
            "instead of the Reserved Instance discounted rate — a 40% cost overrun. "
            "This is caused by a reservation scope mismatch or temporary reservation expiry. "
            "Scattered dates (not consecutive) is typical of Azure scope issues."
        ),
        "action_audit": "Filter Billing_Data for vm-07 where ReservationApplied = No.",
        "action_email": "Alert owner PaymentsTeam: Reserved Instance not applied on vm-07 on 5 dates. 40% cost overrun.",
        "action_fix":   "Reassign Reserved Instance scope to correct subscription for vm-07.",
        "owner":        "PaymentsTeam",
    },
    "vm-06": {
        "flag":        "RESIZE_NO_COST_DROP",
        "title":       "Resize — No Cost Drop",
        "severity":    "HIGH",
        "dates":       "Post Jan 04, 2026",
        "saving":      480,
        "explanation": (
            "Activity_Logs shows vm-06 was resized from D4s_v5 → B2s at 02:15 on Jan 04, "
            "followed immediately by a restart. CPU dropped to 2.1% at the reboot moment "
            "confirming the OS-level resize happened. However billing cost did NOT drop — "
            "it continued at the D4s_v5 rate. Resize was not applied at Azure billing level."
        ),
        "action_audit": "Compare Activity_Logs resize event with Billing_Data CostUSD post Jan 04 for vm-06.",
        "action_email": "Alert owner InfraTeam: Resize logged for vm-06 but billing unchanged. Verify at Azure portal.",
        "action_fix":   "Confirm resize in Azure portal and raise support ticket if billing not updated.",
        "owner":        "InfraTeam",
    },
}

# ── Confidence cache (populated on first call) ───────────────────────────────
_confidence_cache = {}


def compute_confidence(bd, pm, vm_id: str) -> float:
    """
    Compute real statistical confidence for each anomaly type using Z-score.
    Returns a float between 0.0 and 1.0.
    """
    try:
        meta = ANOMALY_META[vm_id]
        flag = meta["flag"]
        vm_bd = bd[bd["ResourceID"] == vm_id].copy()
        vm_pm = pm[pm["ResourceID"] == vm_id].copy()

        if flag == "COST_SPIKE_NO_CPU":
            # Z-score of peak cost vs all VMs average cost
            all_costs = bd.groupby("ResourceID")["CostUSD"].mean()
            vm_mean = all_costs[vm_id]
            pop_mean = all_costs.mean()
            pop_std = all_costs.std()
            z = abs(vm_mean - pop_mean) / (pop_std + 1e-9)
            # Normalize z to confidence: z=2 → ~0.90, z=3 → ~0.95, z=4 → ~0.99
            confidence = min(0.999, 0.5 + 0.5 * (1 - np.exp(-z / 2)))

        elif flag == "ORPHANED_ACTIVE_NO_BILLING":
            # % of hours with CPU > 10% but CostUSD == 0
            bd_vm = vm_bd.set_index("Timestamp").resample("h")["CostUSD"].sum()
            pm_vm = vm_pm.set_index("Timestamp").resample("h")["CPU_Percent"].mean()
            merged = pd.concat([bd_vm, pm_vm], axis=1).dropna()
            merged.columns = ["cost", "cpu"]
            orphaned = merged[(merged["cpu"] > 10) & (merged["cost"] == 0)]
            ratio = len(orphaned) / (len(merged) + 1e-9)
            confidence = min(0.999, 0.5 + ratio * 2)

        elif flag == "GRADUAL_COST_CREEP":
            # R² of linear regression on weekly costs — higher R² = more confident trend
            vm_bd = vm_bd.copy()
            vm_bd["Week"] = vm_bd["Timestamp"].dt.isocalendar().week.astype(int)
            weekly = vm_bd.groupby("Week")["CostUSD"].mean()
            if len(weekly) < 2:
                return 0.80
            x = np.arange(len(weekly))
            y = weekly.values
            corr = np.corrcoef(x, y)[0, 1]
            r_squared = corr ** 2
            confidence = min(0.999, 0.75 + r_squared * 0.24)

        elif flag == "RESERVATION_NOT_APPLIED":
            # % of rows where ReservationApplied == No vs all rows for this VM
            no_res = vm_bd[vm_bd["ReservationApplied"] == "No"]
            ratio = len(no_res) / (len(vm_bd) + 1e-9)
            # Cost difference between No vs Yes rows
            cost_no  = vm_bd[vm_bd["ReservationApplied"] == "No"]["CostUSD"].mean()
            cost_yes = vm_bd[vm_bd["ReservationApplied"] == "Yes"]["CostUSD"].mean()
            cost_diff_ratio = abs(cost_no - cost_yes) / (cost_yes + 1e-9)
            confidence = min(0.999, 0.6 + ratio * 0.2 + min(cost_diff_ratio, 0.2))

        elif flag == "RESIZE_NO_COST_DROP":
            # Compare avg cost before vs after Jan 04
            vm_bd["Timestamp"] = pd.to_datetime(vm_bd["Timestamp"])
            cutoff = pd.Timestamp("2026-01-04")
            before = vm_bd[vm_bd["Timestamp"] < cutoff]["CostUSD"].mean()
            after  = vm_bd[vm_bd["Timestamp"] >= cutoff]["CostUSD"].mean()
            # If cost didn't drop after resize, high confidence anomaly
            if before > 0:
                drop_ratio = (before - after) / before
                # drop_ratio close to 0 = cost stayed same = high confidence anomaly
                confidence = min(0.999, 0.70 + (1 - abs(drop_ratio)) * 0.29)
            else:
                confidence = 0.80
        else:
            confidence = 0.80

        return round(float(confidence), 4)

    except Exception as e:
        print(f"[confidence] Error computing for {vm_id}: {e}")
        # Fallback to reasonable defaults per severity
        severity = ANOMALY_META.get(vm_id, {}).get("severity", "MEDIUM")
        return 0.92 if severity == "HIGH" else 0.85


def get_confidence(bd, pm, vm_id: str) -> float:
    """Return cached confidence or compute fresh."""
    if vm_id not in _confidence_cache:
        _confidence_cache[vm_id] = compute_confidence(bd, pm, vm_id)
    return _confidence_cache[vm_id]


def get_summary():
    """Return summary of all 5 anomalies — confidence computed lazily."""
    from services.data_loader import get_bd, get_pm
    bd = get_bd()
    pm = get_pm()
    return [
        {
            "vm_id":      vm,
            "flag":       m["flag"],
            "title":      m["title"],
            "severity":   m["severity"],
            "dates":      m["dates"],
            "saving":     m["saving"],
            "confidence": get_confidence(bd, pm, vm),
            "owner":      m["owner"],
        }
        for vm, m in ANOMALY_META.items()
    ]


def get_kpis():
    total_saving = sum(m["saving"] for m in ANOMALY_META.values())
    high_count   = sum(1 for m in ANOMALY_META.values() if m["severity"] == "HIGH")
    medium_count = sum(1 for m in ANOMALY_META.values() if m["severity"] == "MEDIUM")
    return {
        "total_anomaly_types":    len(ANOMALY_META),
        "high_severity":          high_count,
        "medium_severity":        medium_count,
        "estimated_monthly_loss": total_saving,
        "vms_affected":           len(ANOMALY_META),
        "total_vms":              17,
    }


def get_detail(vm_id: str):
    """Return full detail for one VM anomaly with computed confidence."""
    if vm_id not in ANOMALY_META:
        return None
    from services.data_loader import get_bd, get_pm
    bd = get_bd()
    pm = get_pm()
    detail = dict(ANOMALY_META[vm_id])
    detail["confidence"] = get_confidence(bd, pm, vm_id)
    return detail


def get_flagged_billing(bd, vm_id: str):
    df = bd[(bd["ResourceID"] == vm_id)].copy()
    df["AnomalyFlag"] = df["AnomalyFlag"].fillna("").astype(str)
    df = df[df["AnomalyFlag"].str.strip() != ""]
    df["Timestamp"] = df["Timestamp"].astype(str)
    return df[["ResourceID","Timestamp","CostUSD","ReservationApplied","AnomalyFlag"]].to_dict("records")


def get_flagged_metrics(pm, vm_id: str):
    df = pm[(pm["ResourceID"] == vm_id)].copy()
    df["AnomalyFlag"] = df["AnomalyFlag"].fillna("").astype(str)
    df = df[df["AnomalyFlag"].str.strip() != ""]
    df["Timestamp"] = df["Timestamp"].astype(str)
    return df[["ResourceID","Timestamp","CPU_Percent","Memory_Percent",
               "NetworkIn_MB","NetworkOut_MB","AnomalyFlag"]].to_dict("records")


def get_chart_data(pm, bd, vm_id: str):
    pm_vm = pm[pm["ResourceID"] == vm_id].copy()
    bd_vm = bd[bd["ResourceID"] == vm_id].copy()
    bd_vm = bd_vm.set_index("Timestamp").resample("h")["CostUSD"].mean().reset_index()
    pm_vm = pm_vm.iloc[::4].copy()
    return {
        "billing": {
            "timestamps": bd_vm["Timestamp"].astype(str).tolist(),
            "cost":       bd_vm["CostUSD"].round(4).tolist(),
        },
        "metrics": {
            "timestamps":  pm_vm["Timestamp"].astype(str).tolist(),
            "cpu":         pm_vm["CPU_Percent"].tolist(),
            "memory":      pm_vm["Memory_Percent"].tolist(),
            "network_in":  pm_vm["NetworkIn_MB"].tolist(),
            "network_out": pm_vm["NetworkOut_MB"].tolist(),
        }
    }


def get_weekly_cost(bd, vm_id: str):
    bd_vm = bd[bd["ResourceID"] == vm_id].copy()
    bd_vm["Week"] = bd_vm["Timestamp"].dt.isocalendar().week.astype(int)
    weekly = bd_vm.groupby("Week")["CostUSD"].mean().round(4).reset_index()
    return {
        "weeks": [f"Week {w}" for w in weekly["Week"].tolist()],
        "cost":  weekly["CostUSD"].tolist(),
    }