"""
AutoDiag Local AI Microservice.
Built with FastAPI, 100% offline, running on local CPU.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.ai.embeddings.router import router as embeddings_router

app = FastAPI(
    title="AutoDiag Local AI Service",
    description="Microservice IA local (100% hors-ligne) pour la normalisation sémantique, la reformulation pour débutants, le RAG documentaire et l'explication vulgarisée.",
    version="1.0.0"
)

# CORS configuration allowing requests from Angular frontend (4200) and Express backend (3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(embeddings_router)

@app.get("/api/health")
async def health_check():
    """Health check endpoint for the local AI service."""
    return {
        "status": "healthy",
        "service": "AutoDiag AI Layer",
        "mode": "100% Local / Offline",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("AI_PORT", "8001"))
    uvicorn.run("app.ai.main:app", host="127.0.0.1", port=port, reload=True)
