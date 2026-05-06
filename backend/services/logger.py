"""
logger.py — Centralized Logging System
Azure FinOps AI Platform | NexTurn

Saves all logs to logs/finops.log (rotating, max 5MB, keeps 3 files)
Same output appears in terminal AND saved to file.

Usage in any module:
    from services.logger import get_logger
    log = get_logger(__name__)
    log.info("Anomaly detected on vm-05")
    log.error("Backend failed: reason")
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler

LOG_DIR  = os.path.join(os.path.dirname(__file__), '..', 'logs')
LOG_FILE = os.path.join(LOG_DIR, 'finops.log')
os.makedirs(LOG_DIR, exist_ok=True)

LOG_FORMAT = '%(asctime)s  [%(levelname)-8s]  %(name)-25s  %(message)s'
DATE_FMT   = '%Y-%m-%d %H:%M:%S'


def setup_logging(level: str = 'INFO') -> logging.Logger:
    """Call ONCE in main.py at startup."""
    log_level = getattr(logging, level.upper(), logging.INFO)
    root = logging.getLogger()
    root.setLevel(log_level)

    if root.handlers:
        return root

    formatter = logging.Formatter(LOG_FORMAT, datefmt=DATE_FMT)

    # Terminal handler
    console = logging.StreamHandler(sys.stdout)
    console.setLevel(log_level)
    console.setFormatter(formatter)
    root.addHandler(console)

    # Rotating file handler
    file_handler = RotatingFileHandler(
        LOG_FILE, maxBytes=5*1024*1024, backupCount=3, encoding='utf-8'
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    root.addHandler(file_handler)

    root.info('=' * 70)
    root.info('  Azure FinOps AI Platform — Starting up')
    root.info(f'  Log file  : {os.path.abspath(LOG_FILE)}')
    root.info(f'  Log level : {level.upper()}')
    root.info('=' * 70)
    return root


def get_logger(name: str) -> logging.Logger:
    """Get a named logger for any module."""
    return logging.getLogger(name)