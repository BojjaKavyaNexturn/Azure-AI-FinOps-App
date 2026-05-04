import pandas as pd
from functools import lru_cache
import os

DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "final updated dataset.xlsx"))

@lru_cache(maxsize=1)
def load_all():
    if not os.path.exists(DATA_PATH):
        raise FileNotFoundError(f"Dataset not found at: {DATA_PATH}")

    xl = pd.ExcelFile(DATA_PATH)
    print(f"[data_loader] Available sheets: {xl.sheet_names}")

    # Platform_Metrics — row 0=title, row 1=subtitle, row 2=headers
    pm = xl.parse("Platform_Metrics", header=2)
    pm.columns = pm.columns.str.strip()
    pm["Timestamp"] = pd.to_datetime(pm["Timestamp"], errors="coerce")

    # Billing_Data — row 0=title, row 1=footnote, row 2=headers
    bd = xl.parse("Billing_Data", header=2)
    bd.columns = bd.columns.str.strip()
    bd["Timestamp"] = pd.to_datetime(bd["Timestamp"], errors="coerce")

    print(f"[data_loader] PM columns: {pm.columns.tolist()}")
    print(f"[data_loader] BD columns: {bd.columns.tolist()}")
    print(f"[data_loader] PM rows: {len(pm)} | BD rows: {len(bd)}")

    return {
        "platform_metrics":       pm,
        "billing_data":           bd,
        "resource_metadata":      xl.parse("Resource_Metadata",      header=1),
        "ai_recommendations":     xl.parse("AI_Recommendations",     header=1),
        "ai_tagging_suggestions": xl.parse("AI_Tagging_Suggestions", header=1),
        "integrated_tagging":     xl.parse("Tagging_Summary",        header=1),
        "anomaly_summary":        xl.parse("Anomaly_Summary",        header=1),
        "tagging_summary":        xl.parse("Tagging_Summary",        header=1),
        "anomaly_shortlist":      xl.parse("Anomaly_Shortlist",      header=1),
        "activity_logs":          xl.parse(" Activity_Logs",         header=1),
        "dataset_metadata":       xl.parse("Dataset_Metadata",       header=1),
    }

def get_pm():                  return load_all()["platform_metrics"]
def get_bd():                  return load_all()["billing_data"]
def get_meta():                return load_all()["resource_metadata"]
def get_recommendations():     return load_all()["ai_recommendations"]
def get_tagging_suggestions(): return load_all()["ai_tagging_suggestions"]
def get_integrated_tagging():  return load_all()["integrated_tagging"]