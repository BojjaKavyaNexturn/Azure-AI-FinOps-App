import pandas as pd
from functools import lru_cache
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "final updated dataset.xlsx")

@lru_cache(maxsize=1)
def load_all():
    """Load all sheets once and cache in memory."""
    xl = pd.ExcelFile(DATA_PATH)
    return {
        "platform_metrics":       xl.parse("Platform_Metrics",       parse_dates=["Timestamp"]),
        "billing_data":           xl.parse("Billing_Data",            parse_dates=["Timestamp"]),
        "resource_metadata":      xl.parse("Resource_Metadata"),
        "ai_recommendations":     xl.parse("AI_Recommendations"),
        "ai_tagging_suggestions": xl.parse("AI_Tagging_Suggestions"),
        "integrated_tagging":     xl.parse("Tagging_Summary"),
        "anomaly_summary":        xl.parse("Anomaly_Summary"),
        "tagging_summary":        xl.parse("Tagging_Summary"),
    }

def get_pm():
    return load_all()["platform_metrics"]

def get_bd():
    return load_all()["billing_data"]

def get_meta():
    return load_all()["resource_metadata"]

def get_recommendations():
    return load_all()["ai_recommendations"]

def get_tagging_suggestions():
    return load_all()["ai_tagging_suggestions"]

def get_integrated_tagging():
    return load_all()["integrated_tagging"]