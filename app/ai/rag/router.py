"""
FastAPI router for Technical RAG Context Retrieval (Module IA #3).
"""
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.ai.rag.service import get_tech_rag_retriever

router = APIRouter(prefix="/api", tags=["Technical RAG"])

class RetrieveContextRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Diagnostic query, fault code, or symptom description")
    top_k: int = Field(default=3, ge=1, le=10, description="Number of technical passages to retrieve")
    min_score: float = Field(default=0.25, ge=0.0, le=1.0, description="Minimum similarity score")
    filter_doc_type: Optional[str] = Field(default=None, description="Optional doc_type filter ('fault', 'test', 'solution', 'dtc')")

class PassageResponse(BaseModel):
    doc_id: Optional[str] = None
    doc_type: Optional[str] = None
    fault_code: Optional[str] = None
    title: Optional[str] = None
    content: str
    score: float
    source_id: Optional[int] = None
    source_name: Optional[str] = None
    license: Optional[str] = None
    version: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class RetrieveContextResponse(BaseModel):
    query: str
    passages: List[PassageResponse]
    total: int
    fallback_applied: bool

@router.post("/retrieve-context", response_model=RetrieveContextResponse)
async def retrieve_context(request: RetrieveContextRequest):
    """
    Retrieves the most relevant technical documents (faults, tests, repair guides, DTC)
    from the indexed local knowledge base with verified provenance and licenses.
    """
    try:
        retriever = get_tech_rag_retriever()
        result = retriever.retrieve(
            query=request.query,
            top_k=request.top_k,
            min_score=request.min_score,
            filter_doc_type=request.filter_doc_type
        )
        return RetrieveContextResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"RAG retrieval error: {str(e)}")
