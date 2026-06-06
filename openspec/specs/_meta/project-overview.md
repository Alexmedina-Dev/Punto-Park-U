# Punto Park U — Project Overview

## Purpose

Aplicación web para la gestión inteligente de un parqueadero en Bogotá, Colombia.
Permite a los usuarios registrarse, reservar espacios en tiempo real, y a los administradores
monitorear y gestionar todo el sistema desde un panel central.

## Status

**Migration in progress** — migrating from vanilla HTML/CSS/JS to React + TypeScript.

## Reference Project

Location: `C:\Projects\Punto-Park-U-Web`

This is the **existing vanilla implementation** — do NOT modify. Use it as the source of truth
for behavior, design, and content during migration.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite + TS)              │
│  Dashboard Admin  │  Panel Usuario  │  Landing Page         │
└──────────────────────────┬──────────────────────────────────┘
                           │ REST / WebSocket (Axios + socket.io)
┌──────────────────────────▼──────────────────────────────────┐
│              BACKEND (Node.js + Express)                    │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐   │
│  │ Auth JWT │  │ Parkings │  │ Flux API Gateway       │   │
│  │ bcryptjs │  │ CRUD     │  │ (orquesta módulos)     │   │
│  └──────────┘  └──────────┘  └──────┬─────────────────┘   │
└─────────────────────────────────────┼──────────────────────┘
                                      │
              ┌───────────────────────┼──────────────────┐
              │                       │                  │
     ┌────────▼────────┐    ┌────────▼────────┐  ┌─────▼──────────┐
     │  Visión Comp.   │    │  Analítica      │  │  MongoDB Atlas │
     │  (Python/FastAPI│    │  Predictiva     │  │  Free tier     │
     │  Puerto 4001)   │    │  (Python/FastAPI│  │  512MB         │
     └─────────────────┘    │  Puerto 4002)   │  └────────────────┘
                           └─────────────────┘
```

## Stack

### Frontend
- React 18 with TypeScript
- Vite (build tool)
- Tailwind CSS v3.4
- Zustand (state management)
- React Router v6
- Axios (HTTP client)
- Chart.js (data visualization)

### Backend
- Node.js with Express
- MongoDB Atlas (M0 free tier)
- JWT + bcryptjs (authentication)
- socket.io (real-time updates)

### AI Modules (Flux AI)
- Python 3.11+ with FastAPI
- OpenCV + EasyOCR (computer vision)
- YOLOv8n (license plate detection)
- Scikit-learn + Prophet (predictive analytics)
- Deployed on Render free tier

## Deployment
- Frontend: Vercel free tier
- Backend: Railway free tier
- AI services: Render free tier

## Key Design Tokens
- **Dark mode only** (class="dark" on html)
- **Glassmorphism** for cards and panels
- **Neon accents** with CSS variables
- **Fonts**: Manrope (body), Space Grotesk (headings)
- **Icons**: Material Symbols
- **Responsive**: mobile-first with hamburger menu
