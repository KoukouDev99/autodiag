"""
FastAPI router for Automotive Safety Guard (Module IA #5).
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.safety.service import get_safety_guard_service

router = APIRouter(prefix="/api", tags=["Safety Guard"])

class CheckSafetyRequest(BaseModel):
    text: Optional[str] = Field(default=None, description="Free-text observation from user")
    fault_code: Optional[str] = Field(default=None, description="Identified fault code (e.g. 'FAULT-BRK-001')")
    system: Optional[str] = Field(default=None, description="Automotive system category (e.g. 'Freinage')")
    is_danger_known: Optional[bool] = Field(default=None, description="Pre-existing deterministic danger flag from DB")
    symptoms: Optional[List[str]] = Field(default=None, description="List of observed symptom names or codes")
    context: Optional[str] = Field(default=None, description="Driving conditions or vehicle context")

class CheckSafetyResponse(BaseModel):
    is_danger: bool = Field(..., description="True if an immediate hazard to driver safety or vehicle integrity is identified")
    severity: str = Field(..., description="Hazard severity: 'low', 'medium', 'high', 'critical'")
    critical_system: Optional[str] = Field(default=None, description="Critical vehicle system involved")
    danger_reason: Optional[str] = Field(default=None, description="Clear description of the immediate hazard")
    immediate_action: Optional[str] = Field(default=None, description="Mandatory safety action recommended to the driver")
    detection_source: str = Field(..., description="'deterministic_rule', 'llm_analysis', or 'safe'")
    confidence: int = Field(..., ge=0, le=95, description="Confidence capped strictly at 95%")
    fallback_applied: bool

@router.post("/check-safety", response_model=CheckSafetyResponse)
async def check_safety(request: CheckSafetyRequest):
    """
    Evaluates road safety and vehicle integrity hazards.
    Always executes deterministic rules first, then LLM for subtle colloquial phrasings.
    """
    try:
        service = get_safety_guard_service()
        result = service.check_safety(
            text=request.text,
            fault_code=request.fault_code,
            system=request.system,
            is_danger_known=request.is_danger_known,
            symptoms=request.symptoms,
            context=request.context
        )
        return CheckSafetyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Safety check error: {str(e)}")
