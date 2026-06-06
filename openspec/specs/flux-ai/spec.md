# Domain: Flux AI

## Source
- Plan: `C:\Projects\Punto-Park-U-Web\plan-flux-ai.txt`
- Currently marketing content only on landing page

## Modules

### Module 1: Computer Vision (Python/FastAPI)
- License plate recognition (Colombian format: ABC-123 / ABC-12D)
- Vehicle brand, model, color identification
- **Stack**: Python 3.11+, OpenCV, EasyOCR, YOLOv8n, FastAPI
- **Deploy**: Render free tier (port 4001)

### Module 2: Intelligent Assignment (Node.js/Express)
- Real-time optimal spot scoring algorithm
- **Stack**: Node.js, socket.io (built into backend)
- Variables: vehicle type, occupancy, estimated duration, user preferences

### Module 3: Predictive Analytics (Python/FastAPI)
- Peak hour prediction
- Anomaly detection (vehicles exceeding time limits)
- **Stack**: Python 3.11+, Scikit-learn, Prophet, FastAPI
- **Deploy**: Render free tier (port 4002)

## Migration Notes
- Phase 2-3 of implementation (after core React migration)
- First version uses heuristics/rules, then ML
- All free tier infrastructure
- Python microservices communicate with Node.js backend via REST
