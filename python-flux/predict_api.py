"""
Prophet AI Predictive Analytics — Punto Park U
FastAPI microservice for occupancy prediction using Facebook Prophet.

Usage:
    pip install -r requirements.txt
    uvicorn predict_api:app --host 0.0.0.0 --port 4002 --reload

Endpoints:
    POST /predict/occupancy - Predict parking occupancy for N days
    GET  /health            - Health check
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from prophet import Prophet
import pandas as pd
from pymongo import MongoClient
from datetime import datetime
import os
import logging
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Prophet AI Predictive Analytics",
    description="Occupancy prediction for Punto Park U using Facebook Prophet",
    version="1.0.0"
)


class ForecastPoint(BaseModel):
    ds: str
    yhat: float
    yhat_lower: float
    yhat_upper: float


class ForecastResponse(BaseModel):
    forecast: List[dict]
    historical_days: int
    model: str
    generated_at: str


class HealthCheck(BaseModel):
    status: str
    prophet_ready: bool
    mongodb_connected: bool


def get_mongodb_uri() -> str:
    return os.getenv('MONGODB_URI', 'mongodb://localhost:27017')


def get_db():
    client = MongoClient(get_mongodb_uri(), serverSelectionTimeoutMS=3000)
    return client['punto-park-u'], client


@app.get("/health", response_model=HealthCheck)
async def health_check():
    mongodb_connected = False
    try:
        client = MongoClient(get_mongodb_uri(), serverSelectionTimeoutMS=2000)
        client.admin.command('ping')
        mongodb_connected = True
        client.close()
    except Exception:
        pass

    return HealthCheck(
        status="healthy",
        prophet_ready=True,
        mongodb_connected=mongodb_connected
    )


@app.post("/predict/occupancy")
async def predict_occupancy(days: int = 7):
    """
    Predict parking occupancy for the next N days using Facebook Prophet.

    Aggregates daily reservation counts from MongoDB and trains a Prophet model
    with weekly seasonality (detectable from 30 days of seed data).
    """
    db, client = None, None
    try:
        db, client = get_mongodb()

        pipeline = [
            {'$match': {
                'status': {'$in': ['completed', 'active']},
                'entryTime': {'$exists': True, '$ne': None}
            }},
            {'$group': {
                '_id': {'$dateToString': {'format': '%Y-%m-%d', 'date': '$entryTime'}},
                'occupancy': {'$sum': 1}
            }},
            {'$sort': {'_id': 1}}
        ]
        data = list(db.reservations.aggregate(pipeline))

        if len(data) < 7:
            return {
                "forecast": [],
                "historical_days": len(data),
                "model": "prophet",
                "generated_at": datetime.now().isoformat(),
                "error": f"Need at least 7 days of data, found {len(data)}"
            }

        df = pd.DataFrame(data)
        df.columns = ['ds', 'y']
        df['ds'] = pd.to_datetime(df['ds'])
        df['y'] = df['y'].astype(float)

        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=days)
        forecast = model.predict(future)

        result = forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']].tail(days)
        result['ds'] = result['ds'].dt.strftime('%Y-%m-%d')

        return {
            "forecast": result.to_dict('records'),
            "historical_days": len(data),
            "model": "prophet",
            "generated_at": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")
    finally:
        if client:
            try:
                client.close()
            except Exception:
                pass


def get_mongodb():
    client = MongoClient(get_mongodb_uri(), serverSelectionTimeoutMS=5000)
    db = client['punto-park-u']
    return db, client


# ── Main ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=4002)
