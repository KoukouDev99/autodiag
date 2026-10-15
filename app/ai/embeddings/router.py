"""
FastAPI Router for Semantic Symptom Normalization (IA #1).
Endpoint: POST /api/normalize-symptom
"""
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from .service import SymptomNormalizer, get_symptom_normalizer

router = APIRouter(prefix="/api", tags=["IA #1 - Normalisation Sémantique"])

class NormalizeSymptomRequest(BaseModel):
    text: str = Field(..., description="Texte libre décrivant le symptôme observé par l'automobiliste", json_schema_extra={"example": "ma voiture ne démarre pas et fait des clics rapides"})
    threshold: Optional[float] = Field(0.6, description="Seuil minimal de similarité cosinus (défaut: 0.6)", ge=0.0, le=1.0)
    top_k: Optional[int] = Field(3, description="Nombre d'alternatives à retourner", ge=1, le=10)

class AlternativeItem(BaseModel):
    symptom_id: int
    code: str
    label: str
    category: Optional[str] = None
    score: float

class NormalizeSymptomResponse(BaseModel):
    symptom_id: Optional[int] = Field(None, description="Identifiant du symptôme canonique sélectionné si score >= seuil")
    code: Optional[str] = Field(None, description="Code unique du symptôme")
    label: Optional[str] = Field(None, description="Libellé canonique grand public")
    category: Optional[str] = None
    score: float = Field(..., description="Score de similarité cosinus (0.0 à 1.0)")
    needs_clarification: bool = Field(..., description="Vrai si le score est inférieur au seuil (0.6)")
    message: Optional[str] = Field(None, description="Message guidant l'utilisateur en cas de besoin de précision")
    threshold: float
    top_3_alternatives: List[AlternativeItem] = Field(default_factory=list, description="Top 3 des symptômes canoniques les plus proches")
    fallback_applied: bool = Field(False, description="Indique si le fallback déterministe par mots-clés a été activé")

@router.post("/normalize-symptom", response_model=NormalizeSymptomResponse)
async def normalize_symptom(
    payload: NormalizeSymptomRequest,
    normalizer: SymptomNormalizer = Depends(get_symptom_normalizer)
):
    """
    Normalise une description libre en langage naturel vers un symptôme canonique existant.
    Si le score de similarité est inférieur à 0.6, demande une clarification avec les 3 suggestions les plus probables.
    """
    result = normalizer.normalize(
        query=payload.text,
        top_k=payload.top_k or 3,
        threshold=payload.threshold or 0.6
    )
    return NormalizeSymptomResponse(**result)
