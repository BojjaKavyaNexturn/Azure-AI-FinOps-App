# 🏗️ Architecture — Azure FinOps AI Platform

## Overview

A full-stack AI-powered FinOps platform built for NexTurn's internal Azure cost management.
Combines rule-based anomaly detection with LLM-powered explanations and context-based auto-tagging.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                      │
│  localhost:5173                                                      │
│                                                                      │
│  ┌──────────┐  ┌────────────────────┐  ┌────────────────────────┐  │
│  │  Login   │  │  Anomaly Detection  │  │    Auto-Tagging        │  │
│  │  Page    │  │  (Kavya Bojja)      │  │    (Likhith Nariyam)   │  │
│  └──────────┘  └────────────────────┘  └────────────────────────┘  │
│                         ↕ REST API (api.js)                         │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTP
┌─────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                       │
│  localhost:8000                                                      │
│                                                                      │
│  ┌──────────────────────┐   ┌────────────────────────────────────┐  │
│  │  /api/anomalies      │   │  /api/tagging                      │  │
│  │  anomalies.py        │   │  tagging.py                        │  │
│  └──────────┬───────────┘   └────────────┬───────────────────────┘  │
│             ↓                            ↓                          │
│  ┌──────────────────────┐   ┌────────────────────────────────────┐  │
│  │  anomaly_engine.py   │   │  tagging_engine.py                 │  │
│  │  • Rule-based detect │   │  • Signal inference                │  │
│  │  • Z-score stats     │   │  • Confidence scoring              │  │
│  │  • 5 anomaly types   │   │  • Dept + CostCenter tags          │  │
│  └──────────┬───────────┘   └────────────┬───────────────────────┘  │
│             ↓                            ↓                          │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  data_loader.py  — loads Excel dataset into pandas DataFrames│   │
│  │  grok_service.py — calls Groq API (Llama 3.3 70B)           │   │
│  │  logger.py       — rotating file + terminal logs             │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  backend/data/final_updated_dataset.xlsx                     │   │
│  │  • Resource_Metadata  (17 VMs)                               │   │
│  │  • Billing_Data       (hourly, 12,240 rows)                  │   │
│  │  • Platform_Metrics   (15-min, 48,960 rows)                  │   │
│  │  • Activity_Logs      (122 operations)                       │   │
│  │  • AI_Recommendations (22 suggestions)                       │   │
│  │  • AI_Tagging_Suggestions (14 tags)                          │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              ↕ HTTPS
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                                 │
│                                                                      │
│  ┌──────────────────────────────┐                                   │
│  │  Groq API                    │                                   │
│  │  Model: llama-3.3-70b        │                                   │
│  │  Purpose: AI explanations    │                                   │
│  │  for anomalies + tag         │                                   │
│  │  reasoning                   │                                   │
│  └──────────────────────────────┘                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Anomaly Detection Flow
```
Excel Dataset (Billing + Metrics)
        ↓
data_loader.py  →  loads into pandas DataFrames
        ↓
anomaly_engine.py  →  rule-based detection
        │               • Cost spike (3x rolling avg, no CPU change)
        │               • Orphaned billing (CPU active, cost = $0)
        │               • Gradual cost creep (+8%/week)
        │               • Reservation not applied (40% price jump)
        │               • Resize with no cost drop
        ↓
grok_service.py  →  Groq API call (Llama 3.3 70B)
        │               • Plain English explanation
        │               • Recommended action
        │               • Severity reasoning
        ↓
/api/anomalies  →  JSON response  →  React frontend
```

### Auto-Tagging Flow
```
Excel Dataset (Resource_Metadata + AI_Tagging_Suggestions)
        ↓
data_loader.py  →  loads resource context
        ↓
tagging_engine.py  →  signal inference
        │               • Owner signal  (40% weight)
        │               • Service signal (20% weight)
        │               • Environment signal (10% weight)
        │               • CPU pattern signal (10% weight)
        ↓
grok_service.py  →  Groq API call
        │               • Tag reasoning
        │               • Alternative possibilities
        │               • Recommended action
        ↓
/api/tagging  →  JSON response  →  React frontend
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React 18 + Vite | UI framework |
| Frontend | React Router v6 | Page routing |
| Frontend | Recharts | Data visualization |
| Frontend | Lucide React | Icons |
| Backend | FastAPI | REST API server |
| Backend | Pandas + OpenPyXL | Excel data processing |
| Backend | Python logging | System logs → file |
| AI Layer | Groq API (Llama 3.3 70B) | LLM explanations |
| Data | Excel (.xlsx) | Simulated Azure dataset |
| Dev | Vite | Frontend build tool |

---

## Folder Structure

```
Azure-AI-FinOps-App/
│
├── frontend/
│   ├── src/
│   │   ├── assets/          ← logo.png
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── AnomalyDetection.jsx   ← Kavya
│   │   │   └── AutoTagging.jsx        ← Likhith
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
│
├── backend/
│   ├── routers/
│   │   ├── anomalies.py
│   │   └── tagging.py
│   ├── services/
│   │   ├── anomaly_engine.py
│   │   ├── tagging_engine.py
│   │   ├── data_loader.py
│   │   ├── grok_service.py
│   │   └── logger.py           ← logging system
│   ├── data/
│   │   └── final_updated_dataset.xlsx
│   ├── logs/                   ← auto-created, finops.log saved here
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── dataset_generation/
│   └── generate_finops_v6.py
│
├── docs/
│   └── architecture.md         ← this file
│
├── README.md
└── .gitignore
```

---

## Dataset Summary

| Sheet | Rows | Resolution | Purpose |
|---|---|---|---|
| Resource_Metadata | 17 | — | 17 Azure VMs with SKU, region, owner, compliance |
| Billing_Data | 12,240 | Hourly | Cost per hour with anomaly flags |
| Platform_Metrics | 48,960 | 15-min | CPU, Memory, Network, Disk per interval |
| Activity_Logs | 122 | — | Resize, restart, deploy operations |
| AI_Recommendations | 22 | — | Rightsizing, shutdown, RI suggestions |
| AI_Tagging_Suggestions | 14 | — | Missing tag suggestions with confidence |

### Anomaly Patterns (5 types)

| # | Pattern | VM | Severity |
|---|---|---|---|
| 1 | Cost Spike — No CPU Change | vm-05 | HIGH |
| 2 | Orphaned Billing Gap | vm-09 | HIGH |
| 3 | Gradual Cost Creep (+8%/week) | vm-12 | MEDIUM |
| 4 | Reservation Not Applied | vm-07 | MEDIUM |
| 5 | Resize — No Cost Drop | vm-06 | HIGH |

---

## Environment Variables

```env
# backend/.env
GROQ_API_KEY=your_groq_api_key_here
DATA_PATH=data/final_updated_dataset.xlsx
LOG_LEVEL=INFO
```

---

*NexTurn Internal Project · Azure FinOps AI · Jan 2026*