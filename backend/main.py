from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import anomalies, tagging

app = FastAPI(
    title="Azure FinOps AI API",
    description="Spend Anomaly Detection + Context-Based Auto-Tagging",
    version="1.0.0"
)

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(anomalies.router, prefix="/api/anomalies", tags=["Anomaly Detection"])
app.include_router(tagging.router,   prefix="/api/tagging",   tags=["Auto Tagging"])

@app.get("/")
def root():
    return {
        "app":     "Azure FinOps AI Application",
        "version": "1.0.0",
        "modules": ["Anomaly Detection", "Context-Based Auto-Tagging"],
        "status":  "running"
    }

@app.get("/api/health")
def health():
    return {"status": "ok"}
