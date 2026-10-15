"""
Unit & Integration Tests for Module IA #1: Symptom Semantic Normalization.
Tests semantic matching using sentence-transformers, FAISS-CPU index,
threshold 0.6 triggering clarification, and API endpoint behavior.
"""
import pytest
from fastapi.testclient import TestClient
from app.ai.main import app
from app.ai.embeddings.service import SymptomNormalizer, get_symptom_normalizer

client = TestClient(app)

@pytest.fixture(scope="module")
def normalizer():
    return get_symptom_normalizer()

def test_health_endpoint():
    """Verify health endpoint responds with 200 and offline status."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "Offline" in data["mode"]

def test_normalize_start_fail_clear_phrase(normalizer):
    """Test standard failure to start query maps to start_fail with high confidence."""
    query = "ma voiture refuse de démarrer quand je tourne la clé"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["score"] >= 0.6
    assert result["needs_clarification"] is False
    assert result["code"] == "start_fail"
    assert result["symptom_id"] == 1
    assert len(result["top_3_alternatives"]) <= 3
    assert result["top_3_alternatives"][0]["code"] == "start_fail"

def test_normalize_engine_check_light(normalizer):
    """Test warning light description maps to check_engine."""
    query = "j'ai un voyant orange en forme de moteur allumé sur le tableau de bord"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["score"] >= 0.6
    assert result["needs_clarification"] is False
    assert result["code"] == "check_engine"
    assert result["symptom_id"] == 2

def test_normalize_strange_noise(normalizer):
    """Test unusual noise description maps to strange_noise."""
    query = "j'entends un claquement métallique anormal sous le capot quand j'accélère"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["score"] >= 0.6
    assert result["needs_clarification"] is False
    assert result["code"] == "strange_noise"
    assert result["symptom_id"] == 3

def test_normalize_smoke(normalizer):
    """Test exhaust smoke query maps to smoke symptom."""
    query = "il y a une épaisse fumée blanche qui s'échappe de mon pot d'échappement"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["score"] >= 0.6
    assert result["needs_clarification"] is False
    assert result["code"] == "smoke"
    assert result["symptom_id"] == 4

def test_normalize_brakes_issue(normalizer):
    """Test brake pedal complaint maps to brakes symptom."""
    query = "la pédale de frein est molle et la voiture met trop de temps à s'arrêter"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["score"] >= 0.6
    assert result["needs_clarification"] is False
    assert result["code"] == "brakes"

def test_normalize_vague_query_triggers_clarification(normalizer):
    """Test irrelevant or overly vague text falls below 0.6 and requires clarification."""
    query = "bonjour je voudrais savoir quelle heure il est dehors"
    result = normalizer.normalize(query, threshold=0.6)
    
    assert result["needs_clarification"] is True
    assert result["symptom_id"] is None
    assert result["message"] is not None
    # Alternatives should still be provided as suggestions
    assert len(result["top_3_alternatives"]) > 0

def test_normalize_empty_query(normalizer):
    """Test blank query handling."""
    result = normalizer.normalize("", threshold=0.6)
    assert result["needs_clarification"] is True
    assert result["symptom_id"] is None

def test_api_normalize_symptom_endpoint():
    """Test the POST /api/normalize-symptom HTTP API endpoint."""
    payload = {
        "text": "la batterie est complètement déchargée après une semaine sans rouler",
        "threshold": 0.6
    }
    response = client.post("/api/normalize-symptom", json=payload)
    assert response.status_code == 200
    data = response.json()
    
    assert "symptom_id" in data
    assert "score" in data
    assert "top_3_alternatives" in data
    assert "needs_clarification" in data
    assert data["needs_clarification"] is False
    assert data["code"] in ["battery", "start_fail"]

def test_keyword_fallback():
    """Verify deterministic fallback works if model is bypassed."""
    normalizer = SymptomNormalizer()
    fallback = normalizer._keyword_fallback("ma pédale de frein tremble fort", thresh=0.6)
    assert fallback["fallback_applied"] is True
    assert fallback["code"] == "brakes"
    assert fallback["needs_clarification"] is False
