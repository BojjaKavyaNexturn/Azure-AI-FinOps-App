"""
main.py — FastAPI Entry Point
Azure FinOps AI Platform | NexTurn
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.logger import setup_logging, get_logger
from routers import anomalies, tagging

# ── Initialize logging FIRST before anything else ────────────────────────────
setup_logging(level='INFO')
log = get_logger(__name__)

app = FastAPI(
    title='Azure FinOps AI Platform',
    description='Spend Anomaly Detection + Context-Based Auto-Tagging',
    version='1.0.0',
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:5173', 'http://127.0.0.1:5173'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(anomalies.router, prefix='/api/anomalies', tags=['Anomaly Detection'])
app.include_router(tagging.router,   prefix='/api/tagging',   tags=['Auto Tagging'])

@app.on_event('startup')
async def startup():
    log.info('FastAPI application started')
    log.info('Routers registered: /api/anomalies, /api/tagging')

@app.on_event('shutdown')
async def shutdown():
    log.info('FastAPI application shutting down')

@app.get('/')
def root():
    log.info('Health check called')
    return {'status': 'ok', 'app': 'Azure FinOps AI Platform'}