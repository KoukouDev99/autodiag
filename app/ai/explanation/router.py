"""
FastAPI router for Plain Language Diagnostic Explanation (Module IA #4).
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.explanation.service import get_diagnosis_explainer

router = APIRouter(prefix="/api", tags=["Diagnostic Explanation"])

class ExplainDiagnosisRequest(BaseModel):
    fault_code: Optional[str] = Field(default=None, description="Diagnostic fault code (e.g. 'FAULT-BAT-001' or 'P0300')")
    fault_name: Optional[str] = Field(default=None, description="Fault title or diagnostic label")
    symptoms: Optional[List[str]] = Field(default=None, description="List of observed symptoms")
    context: Optional[str] = Field(default=None, description="Vehicle context (model, mileage, driving conditions)")
    top_k_rag: int = Field(default=3, ge=1, le=10, description="Number of technical RAG documents to incorporate")

class ExplanationSections(BaseModel):
    what_is_happening: str = Field(..., description="🔍 Ce qui se passe (1 phrase simple pour profane)")
    probable_cause: str = Field(..., description="🎯 Cause probable (explication du mécanisme en 2-3 phrases)")
    what_to_do: str = Field(..., description="🔧 Quoi faire (liste ordonnée du moins cher au plus cher avec coûts €)")
    warning: str = Field(..., description="⚠️ Attention (quand s'arrêter et appeler un pro)")

class SourceCitation(BaseModel):
    source_id: Optional[int] = None
    source_name: Optional[str] = None
    license: Optional[str] = None
    version: Optional[str] = None

class ExplainDiagnosisResponse(BaseModel):
    fault_code: Optional[str] = None
    fault_name: str
    explanation: str
    sections: ExplanationSections
    confidence: int = Field(..., ge=0, le=95, description="Confidence percentage capped strictly at 95%")
    source_citations: List[SourceCitation]
    fallback_applied: bool

@router.post("/explain-diagnosis", response_model=ExplainDiagnosisResponse)
async def explain_diagnosis(request: ExplainDiagnosisRequest):
    """
    Generates a structured, beginner-friendly diagnostic explanation in plain French
    combining RAG technical context with local LLM (or deterministic fallback).
    Enforces 4 mandatory sections and a strict 95% maximum confidence cap.
    """
    try:
        explainer = get_diagnosis_explainer()
        result = explainer.explain(
            fault_code=request.fault_code,
            fault_name=request.fault_name,
            symptoms=request.symptoms,
            context=request.context,
            top_k_rag=request.top_k_rag
        )
        return ExplainDiagnosisResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Diagnostic explanation error: {str(e)}")
