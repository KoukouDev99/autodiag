"""
Unit & Integration Tests for Module IA #2: Question Reformulation for Beginners.
Tests sensory reformulation, explanation hints, deterministic fallback to original question,
and FastAPI endpoint behavior.
"""
import pytest
from fastapi.testclient import TestClient
from app.ai.main import app
from app.ai.reformulation.service import QuestionReformulator, get_question_reformulator

client = TestClient(app)

@pytest.fixture(scope="module")
def reformulator():
    return get_question_reformulator()

def test_reformulate_empty_question(reformulator):
    """Verify empty input does not crash and returns safe structure."""
    res = reformulator.reformulate("")
    assert res["original_question"] == ""
    assert res["reformulated_question"] == ""
    assert res["fallback_applied"] is True

def test_reformulate_starter_question(reformulator):
    """Verify question with technical term 'démarreur' produces beginner phrasing and hint."""
    q = "Le démarreur entraîne-t-il le volant moteur à vitesse normale ?"
    res = reformulator.reformulate(q, context="Ne démarre pas")
    
    assert res["original_question"] == q
    assert len(res["reformulated_question"]) > 10
    assert res["explanation_hint"] is not None
    assert "démarreur" in res["explanation_hint"].lower()

def test_reformulate_fuel_pump_question(reformulator):
    """Verify 'pompe de gavage' question extracts sensory acoustic hint."""
    q = "Entendez-vous la pompe de gavage électrique s'activer lors de la mise sous contact ?"
    res = reformulator.reformulate(q, context="Ne démarre pas")
    
    assert res["original_question"] == q
    assert res["explanation_hint"] is not None
    assert "pompe de gavage" in res["explanation_hint"].lower()

def test_reformulate_solenoid_question(reformulator):
    """Verify 'solénoïde' question produces click observation hint."""
    q = "Le solénoïde claque-t-il sous l'action du Neiman ?"
    res = reformulator.reformulate(q)
    
    assert res["original_question"] == q
    assert res["explanation_hint"] is not None
    assert "solénoïde" in res["explanation_hint"].lower()

def test_fallback_returns_original_question_when_no_rules_match():
    """Verify requirement: if LLM is unavailable and no rule matches, strictly return original question."""
    reformulator = QuestionReformulator()
    # Force LLM to None
    reformulator._llm = None
    reformulator._initialized = True
    
    arbitrary_q = "Quel est l'angle de braquage lors du test dynamique ?"
    res = reformulator.reformulate(arbitrary_q)
    
    assert res["original_question"] == arbitrary_q
    assert res["reformulated_question"] == arbitrary_q
    assert res["fallback_applied"] is True

def test_api_reformulate_question_endpoint():
    """Test POST /api/reformulate-question HTTP endpoint."""
    payload = {
        "question": "Le démarreur lance-t-il le moteur normalement ?",
        "context": "Symptôme : Démarrage impossible",
        "options": ["Oui, tourne normalement", "Non, clics rapides", "Rien"]
    }
    response = client.post("/api/reformulate-question", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "original_question" in data
    assert "reformulated_question" in data
    assert "explanation_hint" in data
    assert "fallback_applied" in data
    assert data["original_question"] == payload["question"]
    assert len(data["reformulated_question"]) > 0

def test_api_reformulate_question_with_hint():
    """Test POST /api/reformulate-question returns educational hint for novices."""
    payload = {
        "question": "L'étrier de frein avant gauche reste-t-il grippé ?",
        "context": "Symptôme : Freinage",
        "options": ["Oui", "Non"]
    }
    response = client.post("/api/reformulate-question", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert data["explanation_hint"] is not None
    assert "étrier" in data["explanation_hint"].lower()
