"""
FastAPI Router for Beginner Question Reformulation (Module IA #2).
Endpoint: POST /api/reformulate-question
"""
from typing import List, Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from .service import QuestionReformulator, get_question_reformulator

router = APIRouter(prefix="/api", tags=["IA #2 - Reformulation Débutants"])

class ReformulateQuestionRequest(BaseModel):
    question: str = Field(
        ...,
        description="Question technique originale posée par le moteur déterministe",
        json_schema_extra={"example": "Le démarreur entraîne-t-il le volant moteur à une vitesse angulaire normale ?"}
    )
    context: Optional[str] = Field(
        None,
        description="Contexte ou symptôme actuel (ex: Ne démarre pas)",
        json_schema_extra={"example": "Symptôme : Ne démarre pas"}
    )
    options: Optional[List[str]] = Field(
        None,
        description="Options de réponse associées pour orienter la reformulation",
        json_schema_extra={"example": ["Oui, il tourne avec force", "Non, juste des clics", "Silence complet"]}
    )

class ReformulateQuestionResponse(BaseModel):
    original_question: str = Field(..., description="La question originale du diagnostic")
    reformulated_question: str = Field(..., description="La question reformulée en langage simple et concret pour débutant")
    explanation_hint: Optional[str] = Field(None, description="Indice pédagogique expliquant le rôle de l'organe mécanique")
    fallback_applied: bool = Field(False, description="Indique si le fallback a été activé en l'absence de LLM ou en cas d'erreur")

@router.post("/reformulate-question", response_model=ReformulateQuestionResponse)
async def reformulate_question(
    payload: ReformulateQuestionRequest,
    reformulator: QuestionReformulator = Depends(get_question_reformulator)
):
    """
    Reformule une question technique en termes d'observations sensorielles accessibles (bruit, voyant, sensation).
    Si le modèle LLM local est indisponible ou échoue, applique le fallback immédiat vers la question originale.
    """
    result = reformulator.reformulate(
        question=payload.question,
        context=payload.context,
        options=payload.options
    )
    return ReformulateQuestionResponse(**result)
