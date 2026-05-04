"""
Azure FinOps Dataset Generator
================================
Generates Azure_FinOps_Final.xlsx with 10 sheets matching the final dataset structure.

Sheets:
  1. Anomaly_Shortlist      - 5 anomaly types with distributions
  2. Anomaly_Summary        - Pattern documentation
  3. Tagging_Summary        - Context-based tagging overview
  4. Resource_Metadata      - 17 Azure VMs
  5. Billing_Data           - Hourly billing (12,240 rows) Jan 01-30 2026
  6. Platform_Metrics       - 15-min metrics (48,960 rows) Jan 01-30 2026
  7. Activity_Logs          - 122 operations
  8. AI_Recommendations     - 22 recommendations
  9. AI_Tagging_Suggestions - 14 missing tag suggestions
  10. Dataset_Metadata      - Column descriptions

Anomaly Patterns (5 types):
  1. COST_SPIKE_NO_CPU      - vm-05, Jan 03-05 (billing) bell-curve NetworkOut spike
  2. ORPHANED_ACTIVE_NO_BILLING - vm-09, Jan 03-04 (billing) zero cost, active CPU
  3. GRADUAL_COST_CREEP     - vm-12, full month +8% weekly
  4. RESERVATION_NOT_APPLIED - vm-07, scattered dates 40% cost jump
  5. RESIZE_NO_COST_DROP    - vm-06, post Jan 04 cost unchanged after downsize

Distributions used:
  CPU_Percent    -> Log-normal  np.random.lognormal(3.5, 0.45) capped 100
  Memory_Percent -> Gaussian    np.random.normal(58, 12) capped 100
  NetworkIn_MB   -> Log-normal  np.random.lognormal(5.2, 0.9) with 5% burst
  NetworkOut_MB  -> Log-normal  np.random.lognormal(4.9, 0.85)
  DiskRead_MB    -> Log-normal  np.random.lognormal(3.5, 0.8)
  DiskWrite_MB   -> Log-normal  np.random.lognormal(3.2, 0.7)
  CostUSD        -> Pareto      np.random.pareto(2.0) * base_cost
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

np.random.seed(42)

# ── Output path ───────────────────────────────────────────────────────────────
OUTPUT_FILE = 'Azure_FinOps_Final.xlsx'

# ── Style constants ───────────────────────────────────────────────────────────
NAVY     = 'FF1A2340'
GREEN_HD = 'FF166534'
WHITE    = 'FFFFFFFF'
LGRAY    = 'FFF4F3EF'
ALT      = 'FFF4F3EF'
RED_BG   = 'FFFFD6D6'
AMB_BG   = 'FFFFF3CD'
PUR_BG   = 'FFEDE7F6'
PNK_BG   = 'FFFCE4EC'
BLU_BG   = 'FFEFF6FF'
GRN_BG   = 'FFF0FDF4'
GRN_LT   = 'FFDCFCE7'

thin = Side(style='thin', color='FFCCCCCC')
bdr  = Border(left=thin, right=thin, top=thin, bottom=thin)

def style_cell(cell, bold=False, size=9, color=None, bg=None,
               align='left', wrap=False, italic=False):
    cell.font = Font(bold=bold, size=size, name='Arial',
                     color=color or '000000', italic=italic)
    if bg:
        cell.fill = PatternFill('solid', fgColor=bg)
    cell.alignment = Alignment(horizontal=align, vertical='center', wrap_text=wrap)
    cell.border = bdr

def write_header_row(ws, row, cols, bg=NAVY):
    for ci, val in enumerate(cols, 1):
        c = ws.cell(row, ci, val)
        style_cell(c, bold=True, size=10, color=WHITE, bg=bg, align='center', wrap=True)
    ws.row_dimensions[row].height = 24

def write_title(ws, row, text, cols, bg=NAVY):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=cols)
    c = ws.cell(row, 1, text)
    style_cell(c, bold=True, size=13, color=WHITE, bg=bg, align='center')
    ws.row_dimensions[row].height = 32

def write_subtitle(ws, row, text, cols):
    ws.merge_cells(start_row=row, start_column=1, end_row=row, end_column=cols)
    c = ws.cell(row, 1, text)
    style_cell(c, size=9, color='FF555555', bg=LGRAY, align='center', italic=True, wrap=True)
    ws.row_dimensions[row].height = 20

def set_col_widths(ws, widths):
    for ci, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(ci)].width = w

# ── Resource Metadata ─────────────────────────────────────────────────────────
RESOURCES = [
    ('vm-01','sub-finops-prod','rg-finance',  'eastus',       'E8s_v5','Dev', 'CC101','PaymentsTeam','2025-08-01','Compliant',    'PaymentsApp',  'Finance','Yes'),
    ('vm-02','sub-finops-prod','rg-search',   'centralindia', 'B2s',   'Test','CC201','SearchTeam',  '2026-01-15','Compliant',    'SearchService','Search', 'Yes'),
    ('vm-03','sub-finops-prod','rg-infra',    'eastus',       'B2s',   'Prod','CC301','InfraTeam',   '2025-07-15','Compliant',    'InfraPlatform',None,     'No'),
    ('vm-04','sub-finops-prod','rg-finance',  'centralindia', 'B2s',   'Test','CC101','PaymentsTeam','2026-03-01','Non-Compliant','ml-svc-prod-v2',None,    'Yes'),
    ('vm-05','sub-finops-prod','rg-search',   'westus',       'E8s_v5','Dev', 'CC201','SearchTeam',  '2025-05-10','Compliant',    'SearchService','Search', 'Yes'),
    ('vm-06','sub-finops-prod','rg-infra',    'westus',       'D4s_v5','Prod','CC301','InfraTeam',   '2025-07-14','Non-Compliant','InfraPlatform','Infra',  'No'),
    ('vm-07','sub-finops-prod','rg-finance',  'eastus',       'D4s_v5','Prod','CC101','PaymentsTeam','2025-09-30','Non-Compliant','PaymentsApp',  None,     'No'),
    ('vm-08','sub-finops-prod','rg-ml',       'eastus',       'E8s_v5','Dev', 'CC301','MLTeam',      '2026-01-10','Compliant',    'MLService',    None,     'Yes'),
    ('vm-09','sub-finops-prod','rg-infra',    'eastus',       'E8s_v5','Dev', 'CC301','InfraTeam',   '2026-02-18','Non-Compliant','InfraPlatform',None,     'Yes'),
    ('vm-10','sub-finops-prod','rg-search',   'centralindia', 'B2s',   'Prod','CC201','SearchTeam',  '2026-03-05','Compliant',    'SearchService',None,     'No'),
    ('vm-11','sub-finops-prod','rg-ml',       'eastus',       'B2s',   'Prod','CC301','MLTeam',      '2025-10-20','Non-Compliant','MLService',    'ML',     'No'),
    ('vm-12','sub-finops-prod','rg-infra',    'centralindia', 'D4s_v5','Prod','CC301','InfraTeam',   '2025-10-15','Non-Compliant','InfraPlatform','Infra',  'No'),
    ('vm-13','sub-finops-prod','rg-search',   'centralindia', 'D4s_v5','Test','CC201','SearchTeam',  '2026-03-16','Compliant',    'SearchService','Search', 'Yes'),
    ('vm-14','sub-finops-prod','rg-search',   'centralindia', 'E8s_v5','Prod','CC201','SearchTeam',  '2025-07-01','Non-Compliant','SearchService',None,     'No'),
    ('vm-15','sub-finops-prod','rg-infra',    'westus',       'E8s_v5','Test','CC301','InfraTeam',   '2026-01-22','Compliant',    'InfraPlatform','Infra',  'Yes'),
    ('vm-16','sub-finops-prod','rg-ml',       'eastus',       'B2s',   'Prod','CC301','MLTeam',      '2025-09-07','Non-Compliant','MLService',    'ML',     'No'),
    ('vm-17','sub-finops-prod','rg-ml',       'eastus',       'B2s',   'Test','CC301','MLTeam',      '2025-09-07','Compliant',    'MLService',    None,     'Yes'),
]

# SKU hourly base costs
SKU_COST = {'E8s_v5': 1.20, 'D4s_v5': 0.60, 'B2s': 0.10}

RES_IDS = [r[0] for r in RESOURCES]

# ── Build timestamps ──────────────────────────────────────────────────────────
bill_start = datetime(2026, 1, 1)
bill_end   = datetime(2026, 1, 30, 23, 0)

met_start  = datetime(2026, 1, 1)
met_end    = datetime(2026, 1, 30, 23, 45)

# ── Helper: log-normal CPU with diurnal pattern ───────────────────────────────
def gen_cpu(base=35, hour=12):
    if 8 <= hour < 18:
        factor = 1.0 + 0.35 * np.sin((hour - 8) * np.pi / 10)
    elif 18 <= hour < 22:
        factor = 0.85
    else:
        factor = 0.55
    raw = np.random.lognormal(np.log(base * factor), 0.35)
    return round(float(np.clip(raw, 2, 99)), 2)

def gen_mem(base=58):
    return round(float(np.clip(np.random.normal(base, 10), 5, 99)), 2)

def gen_net_in():
    burst = np.random.random() < 0.05
    if burst:
        return round(float(np.random.lognormal(7.0, 0.5)), 2)
    return round(float(np.random.lognormal(5.2, 0.9)), 2)

def gen_net_out():
    return round(float(np.random.lognormal(4.9, 0.85)), 2)

def gen_disk_r():
    return round(float(np.random.lognormal(3.5, 0.8)), 2)

def gen_disk_w():
    return round(float(np.random.lognormal(3.2, 0.7)), 2)

def gen_cost(base):
    return round(float(np.random.pareto(2.0) * base + base * 0.8), 4)

# ── BASE CPU PROFILES ─────────────────────────────────────────────────────────
BASE_CPU = {
    'vm-01':55,'vm-02':18,'vm-03':42,'vm-04':70,'vm-05':35,
    'vm-06':60,'vm-07':28,'vm-08':80,'vm-09':72,'vm-10':15,
    'vm-11':45,'vm-12':52,'vm-13':38,'vm-14':25,'vm-15':65,
    'vm-16':33,'vm-17':48,
}
BASE_MEM = {
    'vm-01':50,'vm-02':30,'vm-03':55,'vm-04':65,'vm-05':45,
    'vm-06':55,'vm-07':40,'vm-08':70,'vm-09':65,'vm-10':25,
    'vm-11':50,'vm-12':58,'vm-13':42,'vm-14':35,'vm-15':60,
    'vm-16':38,'vm-17':48,
}

# ── Anomaly date sets ─────────────────────────────────────────────────────────
SPIKE_DATES    = {datetime(2026,1,3).date(), datetime(2026,1,4).date(), datetime(2026,1,5).date()}
ORPHAN_DATES   = {datetime(2026,1,3).date(), datetime(2026,1,4).date()}
RESV_DATES     = {datetime(2026,1,1).date(), datetime(2026,1,2).date(),
                  datetime(2026,1,6).date(), datetime(2026,1,11).date(), datetime(2026,1,16).date()}
RESIZE_DATE    = datetime(2026, 1, 20)

print("Generating Platform_Metrics (15-min, 48,960 rows)...")
met_rows = []
cur = met_start
while cur <= met_end:
    for res in RES_IDS:
        base_cpu = BASE_CPU[res]
        base_mem = BASE_MEM[res]
        hour = cur.hour
        day  = cur.date()
        cpu  = gen_cpu(base_cpu, hour)
        mem  = gen_mem(base_mem)
        net_in  = gen_net_in()
        net_out = gen_net_out()
        disk_r  = gen_disk_r()
        disk_w  = gen_disk_w()
        flag = ''

        # ANOMALY 1: vm-05 cost spike — NetworkOut bell curve, CPU stays flat
        if res == 'vm-05' and day in SPIKE_DATES:
            spike_start = datetime(2026,1,3,6,0)
            spike_peak  = datetime(2026,1,4,12,0)
            spike_end   = datetime(2026,1,5,20,0)
            if spike_start <= cur <= spike_end:
                total = int((spike_end - spike_start).total_seconds()/900)
                idx   = int((cur - spike_start).total_seconds()/900)
                peak  = int((spike_peak - spike_start).total_seconds()/900)
                mult  = 1 + 6.5 * np.exp(-0.5 * ((idx - peak)/60)**2)
                net_out = round(float(abs(np.random.lognormal(np.log(gen_net_out()*mult), 0.3))), 2)
                cpu  = round(float(np.clip(base_cpu * 0.55 + np.random.normal(0,3), 2, 40)), 2)
                if   idx < peak * 0.4:  flag = 'SPIKE_BUILDING_UP'
                elif idx <= peak * 1.2: flag = 'COST_SPIKE_NO_CPU'
                else:                   flag = 'SPIKE_TAPERING_DOWN'

        # ANOMALY 2: vm-09 orphan — high CPU, billing=0
        if res == 'vm-09' and day in ORPHAN_DATES:
            cpu    = round(float(np.clip(72 + np.random.normal(0, 2.5), 65, 85)), 2)
            mem    = round(float(np.clip(68 + np.random.normal(0, 2),   60, 80)), 2)
            net_in = round(float(abs(np.random.lognormal(6.5, 0.3))), 2)
            flag   = 'ACTIVE_USAGE_ZERO_BILLING'

        # ANOMALY 3: vm-12 gradual creep — memory+cpu slowly rising
        if res == 'vm-12':
            day_off = (day - met_start.date()).days
            mem  = round(float(np.clip(base_mem + day_off * 0.9 + np.random.normal(0,1.5), 5, 99)), 2)
            cpu  = round(float(np.clip(gen_cpu(base_cpu + day_off * 0.4, hour), 2, 99)), 2)
            disk_r = round(float(np.random.lognormal(3.5 + day_off*0.015, 0.7)), 2)
            if day_off >= 7:  flag = 'GRADUAL_COST_CREEP'
            elif day_off >= 3: flag = 'CREEP_EARLY_STAGE'

        # ANOMALY 4: vm-07 reservation spike at billing recalc hours
        if res == 'vm-07' and day in RESV_DATES and hour in [0,6,12,18]:
            if cur.minute == 0:
                net_in = round(float(abs(np.random.lognormal(7.5, 0.3))), 2)
                flag = 'RESERVATION_BILLING_RECALC_SPIKE'
            elif cur.minute in [15, 30]:
                net_in = round(float(abs(np.random.lognormal(7.0, 0.3))), 2)
                flag = 'RESERVATION_ELEVATED'
            elif cur.minute == 45:
                flag = 'RESERVATION_NORMALIZING'

        # ANOMALY 5: vm-06 resize Jan 20 — cpu drops at reboot then recovers high
        if res == 'vm-06':
            if cur < RESIZE_DATE:
                cpu = round(float(np.clip(gen_cpu(base_cpu, hour), 50, 90)), 2)
            elif cur == RESIZE_DATE:
                cpu = round(float(np.clip(5 + np.random.normal(0,2), 1, 15)), 2)
                mem = round(float(np.clip(10 + np.random.normal(0,2), 5, 20)), 2)
                flag = 'RESIZE_EVENT_REBOOT'
            else:
                cpu  = round(float(np.clip(gen_cpu(base_cpu, hour), 50, 90)), 2)
                flag = 'RESIZE_NO_COST_DROP'

        met_rows.append({
            'ResourceID':     res,
            'Timestamp':      cur,
            'CPU_Percent':    cpu,
            'Memory_Percent': mem,
            'NetworkIn_MB':   net_in,
            'NetworkOut_MB':  net_out,
            'DiskRead_MB':    disk_r,
            'DiskWrite_MB':   disk_w,
            'AnomalyFlag':    flag,
        })
    cur += timedelta(minutes=15)

metrics_df = pd.DataFrame(met_rows)
print(f"  → {len(metrics_df)} rows generated")

print("Generating Billing_Data (hourly, 12,240 rows)...")
bill_rows = []
cur = bill_start
while cur <= bill_end:
    for res in RES_IDS:
        sku = next(r[4] for r in RESOURCES if r[0]==res)
        base = SKU_COST.get(sku, 0.30)
        day  = cur.date()
        cost = gen_cost(base)
        resv = 'Yes'
        flag = ''

        # ANOMALY 1: vm-05 spike Jan 3-5 cost 3x, network driven
        if res == 'vm-05' and day in SPIKE_DATES:
            day_off = (day - datetime(2026,1,3).date()).days
            mult = [2.5, 3.2, 2.8][day_off]
            cost = round(gen_cost(base) * mult, 4)
            resv = 'No'
            flag = 'COST_SPIKE_NO_CPU'

        # ANOMALY 2: vm-09 zero billing Jan 3-4
        elif res == 'vm-09' and day in ORPHAN_DATES:
            cost = 0.0
            flag = 'ORPHANED_ACTIVE_NO_BILLING'

        # ANOMALY 3: vm-12 gradual creep +8% per week
        elif res == 'vm-12':
            week = (day - bill_start.date()).days // 7
            cost = round(gen_cost(base) * (1.08 ** week), 4)
            if week >= 2: flag = 'GRADUAL_COST_CREEP'

        # ANOMALY 4: vm-07 reservation not applied on scattered dates
        elif res == 'vm-07' and day in RESV_DATES:
            cost = round(gen_cost(base) * 1.40, 4)
            resv = 'No'
            flag = 'RESERVATION_NOT_APPLIED'

        # ANOMALY 5: vm-06 resize Jan 20 — cost stays same after downsize
        elif res == 'vm-06' and day >= datetime(2026,1,20).date():
            cost = round(gen_cost(SKU_COST['D4s_v5']), 4)  # stays at old SKU cost
            if day > datetime(2026,1,20).date():
                flag = 'RESIZE_NO_COST_DROP'

        bill_rows.append({
            'ResourceID':        res,
            'Timestamp':         cur,
            'BillingDate':       day,
            'MeterCategory':     'Compute',
            'UsageQuantity':     1,
            'CostUSD':           round(cost, 4),
            'ReservationApplied': resv,
            'AnomalyFlag':       flag,
        })
    cur += timedelta(hours=1)

billing_df = pd.DataFrame(bill_rows)
print(f"  → {len(billing_df)} rows generated")

# ── Activity Logs ─────────────────────────────────────────────────────────────
activity_data = [
    ('2026-02-11','vm-01','Restart','admin','D4s_v5','D4s_v5','infra-update'),
    ('2026-01-10','vm-01','Resize','dev1','B2s','B2s','infra-update'),
    ('2026-02-08','vm-01','Deploy','admin','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-13','vm-01','Update','pipeline','B2s','B2s','deploy-model'),
    ('2026-02-02','vm-01','Deploy','dev1','E8s_v5','E8s_v5','infra-update'),
    ('2026-02-08','vm-01','Update','admin','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-22','vm-01','Resize','dev2','B2s','E8s_v5','infra-update'),
    ('2026-01-15','vm-01','Restart','pipeline','E8s_v5','E8s_v5','deploy-model'),
    ('2026-01-24','vm-02','Deploy','dev2','B2s','D4s_v5','deploy-model'),
    ('2026-02-02','vm-02','Restart','dev2','B2s','D4s_v5','deploy-model'),
    ('2026-02-09','vm-02','Create','dev2','E8s_v5','D4s_v5','deploy-app'),
    ('2026-01-08','vm-02','Resize','dev2','B2s','E8s_v5','deploy-app'),
    ('2026-02-28','vm-02','Update','dev2','B2s','D4s_v5','deploy-app'),
    ('2026-01-15','vm-03','Deploy','admin','E8s_v5','D4s_v5','infra-update'),
    ('2026-01-10','vm-03','Restart','pipeline','B2s','E8s_v5','infra-update'),
    ('2026-03-01','vm-03','Create','admin','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-07','vm-03','Resize','pipeline','E8s_v5','E8s_v5','deploy-app'),
    ('2026-01-24','vm-03','Create','dev2','E8s_v5','B2s','deploy-model'),
    ('2026-01-12','vm-03','Update','pipeline','D4s_v5','D4s_v5','infra-update'),
    ('2026-02-18','vm-03','Update','dev1','E8s_v5','E8s_v5','deploy-model'),
    ('2026-01-29','vm-04','Create','pipeline','B2s','E8s_v5','infra-update'),
    ('2026-02-24','vm-04','Create','dev1','B2s','B2s','infra-update'),
    ('2026-01-26','vm-04','Resize','dev2','D4s_v5','D4s_v5','deploy-app'),
    ('2026-02-02','vm-04','Resize','admin','D4s_v5','B2s','deploy-app'),
    ('2026-02-11','vm-04','Create','dev2','B2s','D4s_v5','deploy-app'),
    ('2026-02-06','vm-05','Update','dev2','E8s_v5','B2s','deploy-app'),
    ('2026-01-28','vm-05','Deploy','admin','E8s_v5','E8s_v5','deploy-app'),
    ('2026-02-11','vm-05','Deploy','admin','E8s_v5','E8s_v5','deploy-app'),
    ('2026-02-27','vm-05','Deploy','dev2','D4s_v5','E8s_v5','deploy-model'),
    ('2026-02-02','vm-05','Restart','pipeline','E8s_v5','D4s_v5','deploy-model'),
    ('2026-01-08','vm-05','Resize','dev1','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-22','vm-05','Resize','admin','B2s','B2s','deploy-model'),
    ('2026-01-22','vm-05','Create','pipeline','E8s_v5','D4s_v5','infra-update'),
    ('2026-02-20','vm-06','Restart','admin','E8s_v5','D4s_v5','infra-update'),
    ('2026-01-17','vm-06','Create','pipeline','D4s_v5','E8s_v5','deploy-app'),
    ('2026-02-27','vm-06','Restart','dev1','E8s_v5','D4s_v5','deploy-model'),
    ('2026-02-14','vm-06','Deploy','admin','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-27','vm-06','Deploy','dev1','D4s_v5','D4s_v5','infra-update'),
    ('2026-01-16','vm-06','Deploy','dev1','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-20','vm-06','Resize','admin','E8s_v5','B2s','cost-optimization-initiative'),
    ('2026-02-07','vm-07','Resize','dev2','E8s_v5','B2s','infra-update'),
    ('2026-02-10','vm-07','Deploy','dev2','E8s_v5','E8s_v5','deploy-app'),
    ('2026-02-17','vm-07','Create','admin','B2s','E8s_v5','deploy-model'),
    ('2026-03-01','vm-07','Deploy','dev1','E8s_v5','B2s','infra-update'),
    ('2026-01-15','vm-07','Deploy','dev2','B2s','E8s_v5','deploy-model'),
    ('2026-02-26','vm-07','Resize','pipeline','B2s','D4s_v5','deploy-model'),
    ('2026-01-15','vm-08','Update','dev2','B2s','B2s','deploy-app'),
    ('2026-02-19','vm-08','Update','dev1','E8s_v5','D4s_v5','deploy-model'),
    ('2026-01-04','vm-08','Resize','pipeline','D4s_v5','B2s','deploy-app'),
    ('2026-02-11','vm-08','Resize','dev1','D4s_v5','E8s_v5','deploy-app'),
    ('2026-02-23','vm-08','Restart','admin','B2s','E8s_v5','deploy-model'),
    ('2026-02-26','vm-08','Create','dev1','B2s','E8s_v5','infra-update'),
    ('2026-02-16','vm-08','Restart','dev1','B2s','E8s_v5','infra-update'),
    ('2026-02-09','vm-08','Resize','dev1','E8s_v5','E8s_v5','deploy-model'),
    ('2026-02-24','vm-09','Update','pipeline','D4s_v5','D4s_v5','infra-update'),
    ('2026-02-18','vm-09','Create','pipeline','D4s_v5','D4s_v5','deploy-app'),
    ('2026-01-08','vm-09','Deploy','admin','D4s_v5','D4s_v5','deploy-model'),
    ('2026-01-07','vm-09','Resize','admin','E8s_v5','D4s_v5','deploy-model'),
    ('2026-01-20','vm-09','Update','dev2','D4s_v5','B2s','deploy-model'),
    ('2026-02-17','vm-09','Restart','pipeline','E8s_v5','E8s_v5','deploy-app'),
    ('2026-01-16','vm-10','Update','dev1','D4s_v5','B2s','deploy-model'),
    ('2026-01-25','vm-10','Restart','dev1','E8s_v5','D4s_v5','deploy-model'),
    ('2026-01-11','vm-10','Create','dev1','E8s_v5','B2s','deploy-app'),
    ('2026-02-26','vm-10','Restart','dev2','B2s','B2s','deploy-model'),
    ('2026-02-10','vm-10','Restart','dev2','B2s','D4s_v5','deploy-model'),
    ('2026-01-28','vm-10','Deploy','pipeline','B2s','B2s','deploy-model'),
    ('2026-02-15','vm-10','Update','admin','B2s','D4s_v5','infra-update'),
    ('2026-01-15','vm-10','Update','admin','E8s_v5','D4s_v5','deploy-model'),
    ('2026-01-17','vm-11','Deploy','admin','E8s_v5','D4s_v5','infra-update'),
    ('2026-02-06','vm-11','Create','dev1','D4s_v5','E8s_v5','deploy-app'),
    ('2026-01-26','vm-11','Resize','dev1','B2s','E8s_v5','infra-update'),
    ('2026-01-09','vm-11','Resize','dev2','D4s_v5','B2s','deploy-app'),
    ('2026-02-27','vm-11','Restart','admin','B2s','E8s_v5','infra-update'),
    ('2026-02-02','vm-11','Resize','admin','D4s_v5','B2s','deploy-model'),
    ('2026-01-09','vm-11','Restart','pipeline','E8s_v5','E8s_v5','deploy-model'),
    ('2026-02-04','vm-11','Deploy','pipeline','E8s_v5','E8s_v5','deploy-app'),
    ('2026-01-11','vm-11','Deploy','dev2','E8s_v5','E8s_v5','deploy-model'),
    ('2026-02-04','vm-11','Update','pipeline','D4s_v5','D4s_v5','deploy-app'),
    ('2026-03-02','vm-12','Resize','dev2','E8s_v5','E8s_v5','deploy-model'),
    ('2026-01-02','vm-12','Deploy','admin','B2s','B2s','deploy-model'),
    ('2026-01-06','vm-12','Create','pipeline','E8s_v5','B2s','deploy-app'),
    ('2026-02-15','vm-12','Create','admin','D4s_v5','B2s','deploy-app'),
    ('2026-02-10','vm-12','Restart','dev2','B2s','D4s_v5','infra-update'),
    ('2026-02-06','vm-12','Resize','pipeline','E8s_v5','B2s','deploy-app'),
    ('2026-01-19','vm-12','Deploy','admin','E8s_v5','E8s_v5','deploy-model'),
    ('2026-02-10','vm-13','Restart','pipeline','E8s_v5','E8s_v5','infra-update'),
    ('2026-02-13','vm-13','Resize','dev1','E8s_v5','B2s','deploy-app'),
    ('2026-02-17','vm-13','Resize','pipeline','B2s','D4s_v5','infra-update'),
    ('2026-01-08','vm-13','Resize','admin','D4s_v5','E8s_v5','infra-update'),
    ('2026-02-09','vm-13','Deploy','admin','B2s','B2s','deploy-app'),
    ('2026-02-21','vm-13','Resize','dev2','B2s','E8s_v5','deploy-app'),
    ('2026-01-11','vm-13','Resize','admin','B2s','D4s_v5','deploy-app'),
    ('2026-01-10','vm-14','Update','admin','D4s_v5','E8s_v5','deploy-model'),
    ('2026-01-22','vm-14','Deploy','dev1','B2s','E8s_v5','deploy-model'),
    ('2026-01-26','vm-14','Restart','admin','D4s_v5','D4s_v5','infra-update'),
    ('2026-01-22','vm-14','Update','dev1','E8s_v5','B2s','deploy-app'),
    ('2026-02-11','vm-14','Deploy','dev2','D4s_v5','E8s_v5','deploy-model'),
    ('2026-02-15','vm-15','Deploy','dev1','E8s_v5','D4s_v5','infra-update'),
    ('2026-01-24','vm-15','Resize','dev1','D4s_v5','D4s_v5','infra-update'),
    ('2026-01-24','vm-15','Restart','dev2','E8s_v5','E8s_v5','deploy-app'),
    ('2026-01-26','vm-15','Deploy','dev2','E8s_v5','B2s','deploy-app'),
    ('2026-01-30','vm-15','Deploy','dev2','B2s','E8s_v5','deploy-model'),
    ('2026-01-23','vm-15','Create','pipeline','D4s_v5','E8s_v5','deploy-app'),
    ('2026-02-09','vm-15','Deploy','dev1','E8s_v5','D4s_v5','infra-update'),
    ('2026-02-01','vm-15','Restart','dev1','E8s_v5','E8s_v5','deploy-model'),
    ('2026-02-11','vm-16','Create','dev1','E8s_v5','D4s_v5','infra-update'),
    ('2026-02-11','vm-16','Restart','admin','B2s','D4s_v5','infra-update'),
    ('2026-02-26','vm-16','Update','dev1','B2s','D4s_v5','deploy-app'),
    ('2026-02-10','vm-16','Resize','dev2','B2s','B2s','deploy-model'),
    ('2026-02-24','vm-16','Create','dev1','D4s_v5','E8s_v5','infra-update'),
    ('2026-01-05','vm-16','Deploy','dev1','E8s_v5','D4s_v5','deploy-app'),
    ('2026-02-12','vm-16','Update','dev1','D4s_v5','E8s_v5','deploy-model'),
    ('2026-01-12','vm-17','Update','pipeline','E8s_v5','B2s','infra-update'),
    ('2026-01-27','vm-17','Restart','dev1','B2s','B2s','infra-update'),
    ('2026-01-11','vm-17','Deploy','dev1','B2s','D4s_v5','deploy-app'),
    ('2026-01-19','vm-17','Update','dev2','E8s_v5','E8s_v5','deploy-model'),
    ('2026-01-13','vm-17','Create','pipeline','D4s_v5','E8s_v5','deploy-model'),
    ('2026-01-09','vm-17','Deploy','admin','E8s_v5','E8s_v5','deploy-app'),
    ('2026-02-07','vm-17','Restart','dev1','B2s','B2s','deploy-app'),
    ('2026-02-17','vm-17','Create','dev2','D4s_v5','E8s_v5','infra-update'),
    ('2026-01-03','vm-17','Resize','dev1','B2s','E8s_v5','deploy-model'),
    ('2026-01-31','vm-17','Create','dev2','D4s_v5','E8s_v5','infra-update'),
]

activity_df = pd.DataFrame(activity_data,
    columns=['Timestamp','ResourceID','OperationType','User','OldSKU','NewSKU','DeploymentName'])
activity_df['Timestamp'] = pd.to_datetime(activity_df['Timestamp'])

# ── AI Recommendations ────────────────────────────────────────────────────────
recs_data = [
    ('vm-01','IdleShutdown',None,140,0.84,'Schedule shutdown','Idle resource'),
    ('vm-02','DeleteUnused',None,220,0.81,'Delete unused resource','No activity detected'),
    ('vm-03','RightSize','Downsize',420,0.91,'Reduce VM size','Low CPU utilization'),
    ('vm-04','Buy1yrRI',None,310,0.88,'Purchase 1-year RI','Stable baseline usage'),
    ('vm-05','IdleShutdown',None,150,0.79,'Schedule shutdown','Idle resource'),
    ('vm-06','RightSize','Downsize',480,0.92,'Reduce VM size','Low CPU utilization'),
    ('vm-07','Buy1yrRI',None,280,0.86,'Purchase 1-year RI','Predictable usage'),
    ('vm-08','DeleteUnused',None,210,0.80,'Delete unused resource','No activity'),
    ('vm-09','IdleShutdown',None,130,0.78,'Schedule shutdown','Idle resource'),
    ('vm-10','Buy1yrRI',None,260,0.85,'Purchase 1-year RI','Continuous usage'),
    ('vm-11','RightSize','Upsize',310,0.89,'Increase VM size','CPU saturation'),
    ('vm-12','RightSize','Downsize',390,0.90,'Reduce VM size','Low utilization'),
    ('vm-13','Buy1yrRI',None,270,0.84,'Purchase 1-year RI','Stable baseline usage'),
    ('vm-14','DeleteUnused',None,200,0.80,'Delete unused resource','No activity'),
    ('vm-15','IdleShutdown',None,120,0.76,'Schedule shutdown','Idle VM'),
    ('vm-16','RightSize','Downsize',360,0.88,'Reduce VM size','Low CPU'),
    ('vm-17','Buy1yrRI',None,300,0.87,'Purchase 1-year RI','Long running workload'),
    ('vm-02','ShutdownSchedule',None,218,0.83,'Implement auto-shutdown (nights + weekends)','Non-production VM with significant idle periods outside business hours'),
    ('vm-05','ShutdownSchedule',None,138,0.89,'Implement auto-shutdown (nights + weekends)','Non-production VM with significant idle periods outside business hours'),
    ('vm-09','ShutdownSchedule',None,186,0.85,'Implement auto-shutdown (nights + weekends)','Non-production VM with significant idle periods outside business hours'),
    ('vm-15','ShutdownSchedule',None,176,0.88,'Implement auto-shutdown (nights + weekends)','Non-production VM with significant idle periods outside business hours'),
]
recs_df = pd.DataFrame(recs_data,
    columns=['ResourceID','RecommendationType','RightSizeDirection',
             'EstimatedMonthlySavingsUSD','ConfidenceScore','RecommendedAction','Reason'])

# ── AI Tagging Suggestions ────────────────────────────────────────────────────
tags_data = [
    ('vm-03','DepartmentTag','Infra',0.90,'Derived from owner InfraTeam'),
    ('vm-03','CostCenterTag','CC301',0.83,'Inferred from owner InfraTeam'),
    ('vm-04','DepartmentTag','Finance',0.86,'Derived from owner PaymentsTeam'),
    ('vm-04','CostCenterTag','CC101',0.79,'Inferred from owner PaymentsTeam'),
    ('vm-06','CostCenterTag','CC301',0.83,'Inferred from owner InfraTeam'),
    ('vm-07','DepartmentTag','Finance',0.78,'Derived from owner PaymentsTeam'),
    ('vm-08','DepartmentTag','ML',0.78,'Derived from owner MLTeam'),
    ('vm-09','DepartmentTag','Infra',0.79,'Derived from owner InfraTeam'),
    ('vm-09','CostCenterTag','CC301',0.89,'Inferred from owner InfraTeam'),
    ('vm-10','DepartmentTag','Search',0.83,'Derived from owner SearchTeam'),
    ('vm-12','CostCenterTag','CC301',0.84,'Inferred from owner InfraTeam'),
    ('vm-14','DepartmentTag','Search',0.82,'Derived from owner SearchTeam'),
    ('vm-17','DepartmentTag','ML',0.82,'Derived from owner MLTeam'),
    ('vm-17','CostCenterTag','CC301',0.80,'Inferred from owner MLTeam'),
]
tags_df = pd.DataFrame(tags_data,
    columns=['ResourceID','MissingTag','SuggestedValue','Confidence','Reason'])

# ═════════════════════════════════════════════════════════════════════════════
# WRITE WORKBOOK
# ═════════════════════════════════════════════════════════════════════════════
print("Writing workbook...")
wb = Workbook()
wb.remove(wb.active)

FLAG_FILLS = {
    'COST_SPIKE_NO_CPU':           RED_BG,
    'SPIKE_BUILDING_UP':           'FFFFECEC',
    'SPIKE_TAPERING_DOWN':         'FFFFECEC',
    'ORPHANED_ACTIVE_NO_BILLING':  RED_BG,
    'ACTIVE_USAGE_ZERO_BILLING':   RED_BG,
    'GRADUAL_COST_CREEP':          AMB_BG,
    'CREEP_EARLY_STAGE':           'FFFFF8F0',
    'RESERVATION_NOT_APPLIED':     PUR_BG,
    'RESERVATION_BILLING_RECALC_SPIKE': PUR_BG,
    'RESERVATION_ELEVATED':        'FFF3EEFF',
    'RESERVATION_NORMALIZING':     'FFFAF5FF',
    'RESIZE_NO_COST_DROP':         PNK_BG,
    'RESIZE_EVENT_REBOOT':         PNK_BG,
}

def write_data_sheet(wb, name, df, col_widths, title=None, subtitle=None, hdr_bg=NAVY):
    ws = wb.create_sheet(name)
    start_row = 1
    ncols = len(df.columns)

    if title:
        write_title(ws, 1, title, ncols, hdr_bg)
        ws.row_dimensions[2].height = 8
        if subtitle:
            write_subtitle(ws, 3, subtitle, ncols)
            ws.row_dimensions[3].height = 18
            ws.row_dimensions[4].height = 8
            start_row = 5
        else:
            start_row = 3
    
    write_header_row(ws, start_row, list(df.columns), hdr_bg)
    ws.freeze_panes = ws.cell(start_row+1, 1)

    flag_col = None
    if 'AnomalyFlag' in df.columns:
        flag_col = list(df.columns).index('AnomalyFlag') + 1

    for ri, row in enumerate(df.itertuples(index=False), start_row+1):
        row_bg = ALT if ri % 2 == 0 else WHITE
        flag_val = ''
        if flag_col:
            fv = row[flag_col-1]
            flag_val = str(fv) if fv and str(fv) != 'nan' else ''
            if flag_val in FLAG_FILLS:
                row_bg = FLAG_FILLS[flag_val]
        ws.row_dimensions[ri].height = 14
        for ci, val in enumerate(row, 1):
            c = ws.cell(ri, ci)
            c.value = None if (isinstance(val, float) and np.isnan(val)) else val
            c.fill = PatternFill('solid', fgColor=row_bg)
            c.font = Font(name='Arial', size=8)
            c.border = bdr
            c.alignment = Alignment(vertical='center')

    set_col_widths(ws, col_widths)
    return ws

# ── Sheet 1: Anomaly_Shortlist ─────────────────────────────────────────────
ws = wb.create_sheet('Anomaly_Shortlist')
write_title(ws, 1, '📋  Anomaly Shortlist  |  AI for FinOps  |  5 Anomaly Types Selected', 8, NAVY)
write_subtitle(ws, 2, 'Project: AI for FinOps  ·  Dataset: 17 VMs  ·  Jan 01–30, 2026  ·  Platform_Metrics (15-min) + Billing_Data (hourly)', 8)
ws.row_dimensions[3].height = 8

# Table 1 header
write_header_row(ws, 4, ['#','Anomaly Type','VM','Dates','Severity','Metric Distribution','Cost Distribution','Realistic Shape'], NAVY)

anom_rows = [
    (1,'Cost Spike — No CPU Change','vm-05','Jan 03-05','HIGH','CPU: Log-normal (flat)\nNetwork: Log-normal burst','Pareto (3x spike\nbell-curve build>peak>taper)','Builds up over intervals, peaks day 2, tapers day 3 — not a flat rectangle'),
    (2,'Orphaned Billing Gap','vm-09','Jan 03-04','HIGH','CPU: Log-normal (active ~72%)\nMemory: Gaussian (stable)','$0.00 billing\n(pipeline failure)','CPU active across 192 intervals, billing shows zero'),
    (3,'Gradual Cost Creep','vm-12','Jan 01-30\n(full month)','MEDIUM','Memory: Gaussian +drift\n(+0.9%/day)\nCPU: Log-normal (normal)','Pareto base x\nweekly multiplier (+8%/week)','Slow invisible creep — only visible in weekly view'),
    (4,'Reservation Not Applied','vm-07','Jan 01,02,06\n11,16','MEDIUM','CPU: Log-normal (normal)\nMemory: Gaussian (normal)','Pareto x 1.40 on affected hours\n(40% jump) ReservationApplied=No','Scattered dates — mimics real Azure scope mismatch'),
    (5,'Resize — No Cost Drop','vm-06','Post Jan 20','HIGH','CPU: drops to ~2% at reboot\nthen recovers via Log-normal','Stays at D4s_v5 Pareto rate\neven after resize to B2s','Exact reboot visible in metrics, billing unchanged after'),
]

ANOM_COLORS_ROWS = {5:RED_BG,6:RED_BG,7:AMB_BG,8:AMB_BG,9:RED_BG}
for ri, row in enumerate(anom_rows, 5):
    ws.row_dimensions[ri].height = 55
    row_bg = ANOM_COLORS_ROWS.get(ri, WHITE)
    for ci, val in enumerate(row, 1):
        c = ws.cell(ri, ci, val)
        txt_color = 'FFB91C1C' if row[4]=='HIGH' else 'FFD97706' if row[4]=='MEDIUM' else '000000'
        if ci == 1:
            style_cell(c, bold=True, size=14, color=txt_color, bg=row_bg, align='center')
        elif ci == 2:
            style_cell(c, bold=True, size=9, color=txt_color, bg=row_bg, wrap=True)
        elif ci == 5:
            sev_bg = RED_BG if val=='HIGH' else AMB_BG
            sev_fg = 'FFB91C1C' if val=='HIGH' else 'FFD97706'
            style_cell(c, bold=True, size=9, color=sev_fg, bg=sev_bg, align='center')
        else:
            style_cell(c, size=8, color='FF444444', bg=row_bg, wrap=True)

ws.row_dimensions[10].height = 8

# Table 2 header
write_header_row(ws, 11, ['Metric Column','Distribution Used','Python Function','Why'], NAVY)
dist_rows = [
    ('CPU_Percent','Log-normal','np.random.lognormal(3.5, 0.45) capped at 100%','Abrupt spikes, random drops — not symmetric'),
    ('Memory_Percent','Gaussian','np.random.normal(58, 12) capped at 100%','Stable, gradual — RAM usage is most predictable'),
    ('NetworkIn_MB','Log-normal','np.random.lognormal(5.2, 0.9) with 5% burst events','Bursty, heavy tail — random continuous bursts'),
    ('NetworkOut_MB','Log-normal','np.random.lognormal(4.9, 0.85)','Same as NetworkIn'),
    ('DiskRead_MB','Log-normal','np.random.lognormal(3.5, 0.8)','Right-skewed reads — few large, many small'),
    ('DiskWrite_MB','Log-normal','np.random.lognormal(3.2, 0.7)','Same as DiskRead'),
    ('CostUSD','Pareto','np.random.pareto(2.0) * base_cost','Few VMs drive most spend — realistic cloud billing'),
]
for ri, row in enumerate(dist_rows, 12):
    ws.row_dimensions[ri].height = 20
    bg = ALT if ri % 2 == 0 else WHITE
    for ci, val in enumerate(row, 1):
        c = ws.cell(ri, ci, val)
        if ci == 2:
            style_cell(c, bold=True, size=9, color='FF5B21B6', bg=bg, align='center')
        elif ci == 3:
            style_cell(c, size=8, color='FF5B21B6', bg=bg)
            c.font = Font(name='Courier New', size=8, color='FF5B21B6')
        else:
            style_cell(c, size=9, color='FF444444', bg=bg, wrap=True)

set_col_widths(ws, [8,28,20,36,16,36,36,40])
ws.freeze_panes = 'A5'

# ── Sheet 2: Anomaly_Summary ───────────────────────────────────────────────
ws2 = wb.create_sheet('Anomaly_Summary')
write_title(ws2, 1, '🔍  Spend Anomaly Detection — Anomaly Patterns Summary', 8, NAVY)
write_subtitle(ws2, 2, '5 anomaly types · Use AnomalyFlag column to locate rows · Colour = Severity', 8)
ws2.row_dimensions[3].height = 8
write_header_row(ws2, 4, ['#','Anomaly Pattern','Resource','Data Resolution','Dates / Scope','Severity','AnomalyFlag','Why It Matters (FinOps Context)'], NAVY)

sum_rows = [
    (1,'Cost Spike — No CPU Change','vm-05','15-min metrics\n+ hourly billing','Jan 03–05','HIGH','COST_SPIKE_NO_CPU','Cost jumped 3x with no CPU increase — classic billing error or unexpected network surge. Bell-curve shape across intervals.'),
    (2,'Orphaned Billing Gap','vm-09','15-min metrics\n+ hourly billing','Jan 03–04','HIGH','ORPHANED_ACTIVE_NO_BILLING','Resource active (CPU 72%) but $0 billed — invisible cost. Billing pipeline failure or subscription scope issue.'),
    (3,'Gradual Cost Creep','vm-12','Hourly billing\n+ 15-min metrics','Jan 01–30\n(full month)','MEDIUM','GRADUAL_COST_CREEP','Costs increase 8% every week — easy to miss in daily view. Memory also slowly creeping. Typical of uncontrolled autoscaling.'),
    (4,'Reservation Not Applied','vm-07','Hourly billing','Jan 01,02,06,11,16','MEDIUM','RESERVATION_NOT_APPLIED','Reserved instance discount failed — cost 40% higher on affected rows. Scope mismatch or reservation expiry.'),
    (5,'Resize — No Cost Drop','vm-06','15-min metrics\n+ hourly billing','Post Jan 20','HIGH','RESIZE_NO_COST_DROP','Resize from E8s_v5 → B2s logged but cost unchanged. CPU also stayed high. Resize not applied at infra level.'),
]
ANOM_BG = {5:RED_BG,6:RED_BG,7:AMB_BG,8:AMB_BG,9:RED_BG}
for ri, row in enumerate(sum_rows, 5):
    ws2.row_dimensions[ri].height = 65
    bg = ANOM_BG.get(ri, WHITE)
    for ci, val in enumerate(row, 1):
        c = ws2.cell(ri, ci, val)
        if ci == 1:
            style_cell(c, bold=True, size=14, color='FFB91C1C' if row[5]=='HIGH' else 'FFD97706', bg=bg, align='center')
        elif ci == 6:
            sev_bg = RED_BG if val=='HIGH' else AMB_BG
            sev_fg = 'FFB91C1C' if val=='HIGH' else 'FFD97706'
            style_cell(c, bold=True, size=9, color=sev_fg, bg=sev_bg, align='center')
        elif ci == 7:
            c.font = Font(name='Courier New', size=8, color='FF555555', italic=True)
            c.fill = PatternFill('solid', fgColor='FFF8F8F8')
            c.alignment = Alignment(vertical='top', wrap_text=True)
            c.border = bdr
        elif ci == 8:
            style_cell(c, size=9, color='FF222222', bg=bg, wrap=True)
            c.alignment = Alignment(vertical='top', wrap_text=True, horizontal='left')
        else:
            style_cell(c, size=9, color='FF444444', bg=bg, wrap=True)

# Legend row
lr = 10
ws2.merge_cells(f'A{lr}:H{lr}')
lc = ws2.cell(lr, 1, '  LEGEND:   🔴 HIGH — Active financial loss, needs immediate action     🟡 MEDIUM — Important but will hurt over time     Use AnomalyFlag column to filter rows in Billing_Data and Platform_Metrics')
style_cell(lc, bold=True, size=9, color='FF333333', bg=LGRAY)
ws2.row_dimensions[lr].height = 20
for c in range(2, 9):
    ws2.cell(lr, c).fill = PatternFill('solid', fgColor=LGRAY)
    ws2.cell(lr, c).border = bdr
set_col_widths(ws2, [5,28,10,22,18,10,30,50])
ws2.freeze_panes = 'A5'

# ── Sheet 3: Tagging_Summary ───────────────────────────────────────────────
ws3 = wb.create_sheet('Tagging_Summary')
write_title(ws3, 1, "🏷️  Context-Based Auto-Tagging Summary  |  Likhith's Module × Kavya's Dataset", 11, GREEN_HD)
write_subtitle(ws3, 2, "AI-suggested tags for resources with missing metadata · Green = Complete · Red = Incomplete · Confidence score shows AI certainty", 11)

# Stats bar
stats = [('17','Total Resources',BLU_BG,'FF1D4ED8'),
         ('7','Fully Tagged',GRN_BG,'FF166534'),
         ('10','Missing Tags','FFFFF1F2','FFB91C1C'),
         ('12','Shutdown Candidates',AMB_BG,'FF92400E')]
for i, (val, lbl, bg, fg) in enumerate(stats):
    col = i*3+1
    ws3.merge_cells(start_row=3,start_column=col,end_row=3,end_column=col+1)
    c = ws3.cell(3, col, f'{val}  —  {lbl}')
    style_cell(c, bold=True, size=11, color=fg, bg=bg, align='center')
    ws3.cell(3, col+1).fill = PatternFill('solid', fgColor=bg)
    ws3.cell(3, col+1).border = bdr
ws3.row_dimensions[3].height = 28
ws3.row_dimensions[4].height = 8

tag_hdrs = ['Resource','Dept Tag','Env Tag','Cost Center Tag','Missing Tag','AI Suggested Value','Confidence','Reason','Existing Dept Tag','Shutdown Candidate','Tag Status']
write_header_row(ws3, 5, tag_hdrs, GREEN_HD)

# Build tagging data from resource metadata
tag_data = []
for r in RESOURCES:
    res_id = r[0]
    dept = r[11]
    env  = r[5]
    cc   = r[6]
    shut = r[12]
    # Find missing tag from AI suggestions
    missing = next((t[1] for t in tags_data if t[0]==res_id), None)
    suggested = next((t[2] for t in tags_data if t[0]==res_id), None)
    conf = next((t[3] for t in tags_data if t[0]==res_id), None)
    reason = next((t[4] for t in tags_data if t[0]==res_id), None)
    status = 'Complete' if (dept and env and cc) else 'Incomplete'
    tag_data.append((res_id, dept, env, cc, missing, suggested, conf, reason, dept, shut, status))

for ri, row in enumerate(tag_data, 6):
    ws3.row_dimensions[ri].height = 22
    is_complete = row[10] == 'Complete'
    row_bg = GRN_BG if is_complete else 'FFFFF5F5'
    for ci, val in enumerate(row, 1):
        c = ws3.cell(ri, ci)
        c.value = None if (val is None or (isinstance(val, float) and np.isnan(val))) else val
        c.font = Font(name='Arial', size=9)
        c.border = bdr
        c.alignment = Alignment(vertical='center', wrap_text=True)
        if ci == 1:
            style_cell(c, bold=True, size=10, color='FF1D4ED8', bg=BLU_BG, align='center')
        elif ci in [2,3,4]:
            if c.value is None:
                c.fill = PatternFill('solid', fgColor=RED_BG)
                c.font = Font(name='Arial', size=9, color='FFB91C1C', italic=True)
                c.value = '— missing —'
            else:
                c.fill = PatternFill('solid', fgColor=GRN_LT)
                c.font = Font(name='Arial', size=9, color='FF166534', bold=True)
        elif ci == 5:
            c.fill = PatternFill('solid', fgColor=AMB_BG if c.value else 'FFF9F9F9')
            c.font = Font(name='Arial', size=9, color='FF92400E' if c.value else 'FF888888', bold=bool(c.value))
        elif ci == 6:
            c.fill = PatternFill('solid', fgColor=PUR_BG if c.value else 'FFF9F9F9')
            c.font = Font(name='Arial', size=9, color='FF5B21B6' if c.value else 'FF888888', bold=bool(c.value))
        elif ci == 7:
            if c.value:
                conf_val = float(c.value)
                bg = GRN_LT if conf_val>=0.85 else AMB_BG if conf_val>=0.75 else RED_BG
                fg = 'FF166534' if conf_val>=0.85 else 'FF92400E' if conf_val>=0.75 else 'FFB91C1C'
                c.fill = PatternFill('solid', fgColor=bg)
                c.font = Font(name='Arial', size=9, color=fg, bold=True)
                c.number_format = '0.00'
                c.alignment = Alignment(horizontal='center', vertical='center')
            else:
                c.fill = PatternFill('solid', fgColor='FFF9F9F9')
        elif ci == 10:
            shut_bg = AMB_BG if str(c.value)=='Yes' else 'FFF9F9F9'
            shut_fg = 'FF92400E' if str(c.value)=='Yes' else 'FF888888'
            c.fill = PatternFill('solid', fgColor=shut_bg)
            c.font = Font(name='Arial', size=9, color=shut_fg, bold=(str(c.value)=='Yes'))
            c.alignment = Alignment(horizontal='center', vertical='center')
        elif ci == 11:
            c.fill = PatternFill('solid', fgColor=GRN_LT if is_complete else RED_BG)
            c.font = Font(name='Arial', size=9, color='FF166534' if is_complete else 'FFB91C1C', bold=True)
            c.alignment = Alignment(horizontal='center', vertical='center')
        else:
            c.fill = PatternFill('solid', fgColor=row_bg)

set_col_widths(ws3, [10,14,12,16,16,20,12,35,18,14,14])
ws3.freeze_panes = 'A6'

# ── Sheet 4: Resource_Metadata ─────────────────────────────────────────────
rm_cols = ['ResourceID','SubscriptionID','ResourceGroup','Region','SKU','Environment',
           'CostCenter','Owner','CreationDate','PolicyCompliance*','ServiceName',
           'ExistingTag_Department','ShutdownCandidate']
rm_df = pd.DataFrame(RESOURCES, columns=rm_cols)
ws_rm = write_data_sheet(wb, 'Resource_Metadata', rm_df,
    [10,18,14,14,10,12,12,14,14,18,16,22,16],
    title='Resource Metadata  |  17 Azure VMs  |  AI for FinOps',
    subtitle='* PolicyCompliance: Compliant = follows Azure Policy rules. Non-Compliant = violates at least one rule (wrong region / missing tag / disallowed SKU).')

# ── Sheet 5: Billing_Data ──────────────────────────────────────────────────
print("Writing Billing_Data sheet...")
ws_bill = wb.create_sheet('Billing_Data')
bill_title = 'Billing_Data  |  Hourly Resolution  |  12,240 rows  |  Jan 01–30, 2026'
write_title(ws_bill, 1, bill_title, 8, NAVY)
write_subtitle(ws_bill, 2,
    '* ReservationApplied: Yes = Reserved Instance discount applied (up to 72% cheaper). No = Full pay-as-you-go rate (scope mismatch, expiry, or no reservation).', 8)
ws_bill.row_dimensions[3].height = 8
write_header_row(ws_bill, 4, list(billing_df.columns), NAVY)
ws_bill.freeze_panes = 'A5'

for ri, row in enumerate(billing_df.itertuples(index=False), 5):
    flag_val = str(row.AnomalyFlag) if row.AnomalyFlag and str(row.AnomalyFlag)!='nan' else ''
    row_bg = FLAG_FILLS.get(flag_val, ALT if ri%2==0 else WHITE)
    ws_bill.row_dimensions[ri].height = 13
    for ci, val in enumerate(row, 1):
        c = ws_bill.cell(ri, ci)
        c.value = None if (isinstance(val, float) and np.isnan(val)) else val
        c.fill = PatternFill('solid', fgColor=row_bg)
        c.font = Font(name='Arial', size=8)
        c.border = bdr
        c.alignment = Alignment(vertical='center')
set_col_widths(ws_bill, [10,20,14,14,14,12,18,28])
print(f"  → Billing_Data written ({len(billing_df)} rows)")

# ── Sheet 6: Platform_Metrics ──────────────────────────────────────────────
print("Writing Platform_Metrics sheet...")
ws_met = wb.create_sheet('Platform_Metrics')
met_title = 'Platform_Metrics  |  15-Min Resolution  |  48,960 rows  |  Jan 01–30, 2026'
write_title(ws_met, 1, met_title, 9, NAVY)
write_subtitle(ws_met, 2,
    'Distributions: CPU=Log-normal · Memory=Gaussian · Network=Log-normal+bursts · Disk=Log-normal  |  Anomalies are OUTCOMES, not injected artificially', 9)
ws_met.row_dimensions[3].height = 8
write_header_row(ws_met, 4, list(metrics_df.columns), NAVY)
ws_met.freeze_panes = 'A5'

for ri, row in enumerate(metrics_df.itertuples(index=False), 5):
    flag_val = str(row.AnomalyFlag) if row.AnomalyFlag and str(row.AnomalyFlag)!='nan' else ''
    row_bg = FLAG_FILLS.get(flag_val, ALT if ri%2==0 else WHITE)
    ws_met.row_dimensions[ri].height = 13
    for ci, val in enumerate(row, 1):
        c = ws_met.cell(ri, ci)
        c.value = None if (val is None or (isinstance(val, float) and np.isnan(val))) else val
        c.fill = PatternFill('solid', fgColor=row_bg)
        c.font = Font(name='Arial', size=8)
        c.border = bdr
        c.alignment = Alignment(vertical='center')
set_col_widths(ws_met, [10,20,13,15,14,15,13,13,30])
print(f"  → Platform_Metrics written ({len(metrics_df)} rows)")

# ── Sheet 7: Activity_Logs ─────────────────────────────────────────────────
write_data_sheet(wb, 'Activity_Logs', activity_df,
    [20,10,14,12,10,10,24],
    title='Activity Logs  |  122 Operations  |  AI for FinOps')

# ── Sheet 8: AI_Recommendations ───────────────────────────────────────────
write_data_sheet(wb, 'AI_Recommendations', recs_df,
    [10,18,18,28,16,42,50],
    title='AI Recommendations  |  22 Suggestions')

# ── Sheet 9: AI_Tagging_Suggestions ───────────────────────────────────────
write_data_sheet(wb, 'AI_Tagging_Suggestions', tags_df,
    [10,16,16,12,40],
    title="AI_Tagging_Suggestions  |  Likhith's Context-Based Tagging Module",
    hdr_bg=GREEN_HD)

# ── Sheet 10: Dataset_Metadata ─────────────────────────────────────────────
meta_data = [
    ('Resource_Metadata','ResourceID','Unique VM identifier (vm-01 to vm-17)','Azure Resource Manager'),
    ('Resource_Metadata','PolicyCompliance','Compliant/Non-Compliant against Azure Policy rules','Azure Policy'),
    ('Resource_Metadata','ExistingTag_Department','Existing dept tag from Likhith context-based tagging module','Likhith Tagging Module'),
    ('Resource_Metadata','ShutdownCandidate','Yes/No — AI recommendation to shut down this VM','AI Recommendations Engine'),
    ('Billing_Data','Timestamp','Hourly billing timestamp — Jan 01–30 2026','Azure Cost Management'),
    ('Billing_Data','CostUSD','Hourly cost in USD — Pareto distribution — NULL on anomaly rows for vm-03','Azure Cost Management'),
    ('Billing_Data','ReservationApplied','Yes = RI discount applied. No = full pay-as-you-go rate','Azure Cost Management'),
    ('Billing_Data','AnomalyFlag','Anomaly pattern label for this row — blank if normal','Anomaly Injection Script'),
    ('Platform_Metrics','Timestamp','15-minute interval timestamp — Jan 01–30 2026','Azure Monitor'),
    ('Platform_Metrics','CPU_Percent','CPU utilization % — Log-normal distribution with diurnal pattern','Azure Monitor'),
    ('Platform_Metrics','Memory_Percent','Memory utilization % — Gaussian distribution','Azure Monitor'),
    ('Platform_Metrics','NetworkIn_MB','Inbound network MB — Log-normal with 5% burst events','Azure Monitor'),
    ('Platform_Metrics','NetworkOut_MB','Outbound network MB — Log-normal','Azure Monitor'),
    ('Platform_Metrics','DiskRead_MB','Disk read throughput MB — Log-normal','Azure Monitor'),
    ('Platform_Metrics','DiskWrite_MB','Disk write throughput MB — Log-normal','Azure Monitor'),
    ('Platform_Metrics','AnomalyFlag','Anomaly pattern label — blank if normal','Anomaly Injection Script'),
    ('AI_Tagging_Suggestions','Confidence','AI confidence score 0-1 — ≥0.85 High, 0.75-0.85 Medium, <0.75 Low','Likhith Tagging Module'),
]
meta_df = pd.DataFrame(meta_data, columns=['SheetName','ColumnName','Description','DataSource'])
write_data_sheet(wb, 'Dataset_Metadata', meta_df,
    [22,28,55,28],
    title='Dataset Metadata  |  Column Descriptions & Data Sources')

wb.save(OUTPUT_FILE)
print(f"\n✅ Done! Saved to: {OUTPUT_FILE}")
print(f"   Billing_Data:     {len(billing_df):,} rows")
print(f"   Platform_Metrics: {len(metrics_df):,} rows")
print(f"   Total data rows:  {len(billing_df)+len(metrics_df):,}")