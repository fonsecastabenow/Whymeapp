"""
Main entry point for the Whyme ML service.

Imports the FastAPI app from api.py and provides
convenience startup.
"""

from src.api import app

__all__ = ["app"]
