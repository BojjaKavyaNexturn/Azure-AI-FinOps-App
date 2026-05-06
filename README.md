# Azure FinOps AI Platform

An AI-powered internal FinOps platform built at NexTurn for Azure cloud cost management. Combines rule-based spend anomaly detection with LLM-powered explanations and context-based auto-tagging — all in a production-grade React + FastAPI application.

---

## 🌟 Current Workflow

1. **Data Ingestion**
   - Loads a realistic Azure simulation dataset (Excel) with 17 VMs, hourly billing, and 15-minute metrics
   - Data includes realistic distributions — Log-normal CPU, Pareto costs, Gaussian memory — not perfect clean data

2. **Anomaly Detection**
   - Rule-based engine detects 5 anomaly types from billing and metrics cross-validation
   - Confidence scores calculated statistically (Z-score based)
   - Each anomaly is traced across 15-minute intervals — not just daily flags

3. **AI Explanation Layer**
   - Detected anomalies sent to Groq API (Llama 3.3 70B)
   - Returns plain English explanation + recommended action + severity reasoning
   - This is the GenAI layer — rule-based detection feeds into LLM explanation

4. **Context-Based Auto-Tagging**
   - AI infers missing Department and CostCenter tags from owner, service name, environment, and CPU signals
   - Confidence breakdown shows which signal contributed how much
   - Bulk approve for all suggestions above 85% confidence

5. **Actionable UI**
   - Daily brief with estimated monthly waste
   - Drill-down per VM with charts, billing rows, metric rows
   - Action buttons — Audit, Alert Owner, Recommended Fix, Mark Resolved, Export CSV

---

## ⭐ Key Features

- 🔍 **Spend Anomaly Detection** — 5 realistic anomaly patterns detected across 60,000+ data rows
- 🤖 **AI Explanations** — Groq LLM generates plain English explanation for every anomaly
- 🏷️ **Context-Based Auto-Tagging** — AI infers missing tags from resource context signals
- 📊 **Interactive Charts** — Cost and CPU time-series charts per VM
- 🎨 **3 Themes** — Navy, Dark, Light — persisted across sessions
- 🔐 **Login System** — Session-based authentication
- 📝 **System Logging** — All API calls and events saved to rotating log file
- 📥 **CSV Export** — Download anomaly reports per VM

---

## 🛠️ Technology Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| React Router v6 | Client-side routing |
| Recharts | Data visualization (line + bar charts) |
| Lucide React | Icons |
| CSS Variables | Theme switching (Navy / Dark / Light) |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI | REST API server |
| Pandas + OpenPyXL | Excel dataset processing |
| Python logging | Rotating system logs → logs/finops.log |
| Groq API (Llama 3.3 70B) | LLM for AI explanations and tag reasoning |

### Data
| Item | Detail |
|---|---|
| Dataset | Excel (.xlsx) — realistic Azure simulation |
| Billing_Data | 12,240 rows — hourly resolution |
| Platform_Metrics | 48,960 rows — 15-minute resolution |
| Anomaly patterns | 5 types injected with realistic distributions |

---

## 📁 Project Structure

```
Azure-AI-FinOps-App/
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.png
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── AnomalyDetection.jsx
│   │   │   └── AutoTagging.jsx
│   │   ├── components/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
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
│   │   └── logger.py
│   ├── data/
│   │   └── final_updated_dataset.xlsx
│   ├── logs/                        ← auto-created on first run
│   │   └── finops.log
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── dataset_generation/
│   └── generate_finops_v6.py
│
├── docs/
│   └── architecture.md
│
├── README.md
└── .gitignore
```

---

## ⚙️ Environment Configuration

### Backend environment (`backend/.env`)

```env
GROQ_API_KEY=your_groq_api_key_here
DATA_PATH=data/final_updated_dataset.xlsx
LOG_LEVEL=INFO
```

Get your free Groq API key at: https://console.groq.com

---

## 🚀 Local Development

### Backend

```bash
# 1. Go to backend folder
cd backend

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Install dependencies
pip install -r requirements.txt

# 4. Add your Groq API key to .env
echo "GROQ_API_KEY=your_key_here" > .env

# 5. Run the server
uvicorn main:app --reload --port 8000
```

Backend runs at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`
Logs saved at: `backend/logs/finops.log`

### Frontend

```bash
# 1. Go to frontend folder
cd frontend

# 2. Install dependencies
npm install

# 3. Run the dev server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Login Credentials

```
Username: admin
Password: finops123
```

---

## 📊 Dataset — Anomaly Patterns

| # | Anomaly Type | VM | Severity | Dates |
|---|---|---|---|---|
| 1 | Cost Spike — No CPU Change | vm-05 | HIGH | Jan 03–05 |
| 2 | Orphaned Billing Gap (Active Usage, $0 Cost) | vm-09 | HIGH | Jan 03–04 |
| 3 | Gradual Cost Creep (+8% Week-over-Week) | vm-12 | MEDIUM | Jan 01–30 |
| 4 | Reservation Not Applied (40% Price Jump) | vm-07 | MEDIUM | Jan 01, 02, 06, 11, 16 |
| 5 | Resize — No Cost Drop | vm-06 | HIGH | Post Jan 20 |

---

## 📝 Notes

- The dataset uses realistic statistical distributions — Log-normal for CPU/Network, Pareto for costs, Gaussian for memory. Anomalies are **outcomes** of these distributions, not artificially forced in.
- Groq API (free tier) is used for LLM explanations. No credit card required.
- The `logs/` folder is auto-created on first backend startup. All API calls, anomaly detections, and errors are logged there.
- `venv/` and `node_modules/` are excluded from Git via `.gitignore`.

---

