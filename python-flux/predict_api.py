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


@app.post("/insights")
async def generate_insights():
    """
    Generate AI insights and recommendations based on current data.
    Returns actionable recommendations for the parking administrator.
    """
    db, client = None, None
    try:
        db, client = get_mongodb()
        
        # Get today's date
        today = datetime.now()
        today_start = today.replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today_start - pd.Timedelta(days=7)
        
        # Aggregate statistics
        total_reservations = db.reservations.count_documents({})
        today_reservations = db.reservations.count_documents({
            'entryTime': {'$gte': today_start}
        })
        week_reservations = db.reservations.count_documents({
            'entryTime': {'$gte': week_ago}
        })
        
        # Revenue stats
        revenue_pipeline = [
            {'$match': {'status': 'completed'}},
            {'$group': {'_id': None, 'total': {'$sum': '$amount'}}}
        ]
        revenue_result = list(db.payments.aggregate(revenue_pipeline))
        total_revenue = revenue_result[0]['total'] if revenue_result else 0
        
        # Vehicle type distribution
        type_pipeline = [
            {'$group': {'_id': '$vehicleType', 'count': {'$sum': 1}}}
        ]
        type_distribution = list(db.reservations.aggregate(type_pipeline))
        
        # Peak hours
        hour_pipeline = [
            {'$match': {'entryTime': {'$exists': True}}},
            {'$group': {
                '_id': {'$hour': '$entryTime'},
                'count': {'$sum': 1}
            }},
            {'$sort': {'count': -1}},
            {'$limit': 3}
        ]
        peak_hours = list(db.reservations.aggregate(hour_pipeline))
        
        # Generate insights
        insights = []
        recommendations = []
        
        # Insight 1: Weekly trend
        if week_reservations > 0:
            daily_avg = week_reservations / 7
            if today_reservations > daily_avg * 1.2:
                insights.append(f"📈 Hoy tenemos {today_reservations} reservas, {((today_reservations/daily_avg - 1) * 100):.0f}% por encima del promedio diario.")
            elif today_reservations < daily_avg * 0.8:
                insights.append(f"📉 Hoy tenemos {today_reservations} reservas, {((1 - today_reservations/daily_avg) * 100):.0f}% por debajo del promedio diario.")
            else:
                insights.append(f"✅ Hoy tenemos {today_reservations} reservas, en línea con el promedio diario de {daily_avg:.0f}.")
        
        # Insight 2: Peak hours
        if peak_hours:
            peak_hour_str = ", ".join([f"{h['_id']:02d}:00" for h in peak_hours])
            insights.append(f"⏰ Horas pico: {peak_hour_str}. Considera tener más personal disponible.")
        
        # Insight 3: Vehicle types
        if type_distribution:
            top_type = max(type_distribution, key=lambda x: x['count'])
            insights.append(f"🚗 El vehículo más común es {top_type['_id']} con {top_type['count']} reservas.")
        
        # Insight 4: Revenue
        if total_revenue > 0:
            insights.append(f"💰 Ingresos totales acumulados: ${total_revenue:,.0f} COP.")
        
        # Recommendations
        if today_reservations < 5:
            recommendations.append("🎯 Considera lanzar una promoción para aumentar la ocupación.")
        
        if peak_hours and len(peak_hours) > 0:
            recommendations.append("👥 Aumenta el personal durante las horas pico para mejorar el servicio.")
        
        recommendations.append("📊 Revisa el reporte de 'Análisis Financiero' para detalles completos.")
        recommendations.append("🔮 Consulta la predicción de ocupación para planificar la próxima semana.")
        
        return {
            "insights": insights,
            "recommendations": recommendations,
            "stats": {
                "total_reservations": total_reservations,
                "today_reservations": today_reservations,
                "week_reservations": week_reservations,
                "total_revenue": total_revenue,
                "peak_hours": [h['_id'] for h in peak_hours],
                "vehicle_distribution": {item['_id']: item['count'] for item in type_distribution}
            },
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Insights error: {str(e)}")
        return {
            "insights": ["⚠️ No se pudieron generar insights en este momento."],
            "recommendations": ["Intenta más tarde cuando haya más datos disponibles."],
            "stats": {},
            "generated_at": datetime.now().isoformat()
        }
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
