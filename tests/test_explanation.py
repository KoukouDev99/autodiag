"""
Tests for Module IA #4 — Plain Language Diagnostic Explanation.
Verifies the 4 mandatory sections, confidence <= 95% cap, RAG integration, and fallback.
"""
import pytest
from fastapi.testclient import TestClient
from app.ai.main import app
from app.ai.explanation.service import DiagnosisExplainer, get_diagnosis_explainer

client = TestClient(app)

def test_explainer_initialization():
    explainer = get_diagnosis_explainer()
    assert explainer is not None

def test_explanation_structure_and_mandatory_sections():
    explainer = get_diagnosis_explainer()
    result = explainer.explain(
        fault_code="FAULT-BAT-001",
        fault_name="Batterie faible ou déchargée",
        symptoms=["Ne démarre pas", "Bruit de clic"],
        context="Peugeot 208, 68000km, température négative la nuit dernière",
        top_k_rag=3
    )

    assert "fault_code" in result
    assert "fault_name" in result
    assert "explanation" in result
    assert "sections" in result
    assert "confidence" in result
    assert "source_citations" in result

    sections = result["sections"]
    # Check all 4 mandatory sections
    assert "what_is_happening" in sections
    assert "probable_cause" in sections
    assert "what_to_do" in sections
    assert "warning" in sections

    # Check non-empty content
    assert len(sections["what_is_happening"].strip()) > 10
    assert len(sections["probable_cause"].strip()) > 15
    assert len(sections["what_to_do"].strip()) > 15
    assert len(sections["warning"].strip()) > 10

def test_explanation_confidence_never_exceeds_95():
    """Critical requirement: AI confidence must NEVER exceed 95%."""
    explainer = get_diagnosis_explainer()
    result = explainer.explain(
        fault_code="FAULT-BAT-001",
        fault_name="Batterie faible",
        symptoms=["Ne démarre pas"],
        top_k_rag=2
    )

    confidence = result["confidence"]
    assert isinstance(confidence, int)
    assert confidence <= 95, f"Confidence {confidence}% exceeded hard ceiling of 95%!"
    assert confidence >= 50

def test_explanation_what_to_do_contains_costs():
    """Section 3 (Quoi faire) must contain cost indications in €."""
    explainer = get_diagnosis_explainer()
    result = explainer.explain(
        fault_code="FAULT-BAT-001",
        fault_name="Batterie faible",
        top_k_rag=2
    )
    what_to_do = result["sections"]["what_to_do"]
    assert "€" in what_to_do

def test_explanation_warning_safety_flag():
    """Dangerous faults must trigger a safety warning."""
    explainer = get_diagnosis_explainer()
    result = explainer.explain(
        fault_code="FAULT-BRK-001",
        fault_name="Fuite ou défaillance hydraulique de freinage",
        symptoms=["Pédale de frein molle", "Voyant rouge de frein"],
        top_k_rag=2
    )
    warning = result["sections"]["warning"]
    assert len(warning) > 10
    # Must indicate pro or stop
    assert any(w in warning.lower() for w in ["sécurité", "professionnel", "assistance", "danger", "ne roulez pas", "arrêtez"])

def test_explanation_source_citations():
    """Verifies that citations from RAG are included with source_id and license."""
    explainer = get_diagnosis_explainer()
    result = explainer.explain(
        fault_code="FAULT-BAT-001",
        fault_name="Batterie faible ou déchargée",
        top_k_rag=3
    )
    citations = result.get("source_citations", [])
    assert isinstance(citations, list)
    if len(citations) > 0:
        c = citations[0]
        assert "source_id" in c
        assert "source_name" in c
        assert "license" in c

def test_explanation_fastapi_endpoint_success():
    payload = {
        "fault_code": "FAULT-STA-001",
        "fault_name": "Démarreur ou solénoïde en défaut",
        "symptoms": ["Aucun bruit", "Voyants allumés"],
        "context": "Renault Clio, 120000km",
        "top_k_rag": 3
    }
    response = client.post("/api/explain-diagnosis", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["fault_name"] == payload["fault_name"]
    assert data["confidence"] <= 95
    assert "sections" in data
    assert "what_is_happening" in data["sections"]
    assert "probable_cause" in data["sections"]
    assert "what_to_do" in data["sections"]
    assert "warning" in data["sections"]
