"""
Tests for Module IA #5 — Automotive Safety Guard.
Verifies DETERMINISTIC FIRST detection, critical systems, safe inputs, confidence cap, and FastAPI endpoint.
"""
import pytest
from fastapi.testclient import TestClient
from app.ai.main import app
from app.ai.safety.service import SafetyGuardService, get_safety_guard_service

client = TestClient(app)

def test_safety_service_initialization():
    service = get_safety_guard_service()
    assert service is not None

def test_safety_deterministic_brakes_hazard():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="ma pédale de frein est toute molle et s'enfonce au plancher",
        symptoms=["Pédale molle"]
    )
    assert result["is_danger"] is True
    assert result["severity"] == "critical"
    assert result["critical_system"] == "Freinage"
    assert result["detection_source"] == "deterministic_rule"
    assert result["confidence"] <= 95
    assert len(result["danger_reason"]) > 10
    assert len(result["immediate_action"]) > 10

def test_safety_deterministic_steering_hazard():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="direction bloquée, le volant est très dur et impossible à tourner"
    )
    assert result["is_danger"] is True
    assert result["critical_system"] == "Direction"
    assert result["severity"] == "critical"
    assert result["detection_source"] == "deterministic_rule"

def test_safety_deterministic_oil_pressure_hazard():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="voyant huile rouge et burette allumée avec bruit métallique"
    )
    assert result["is_danger"] is True
    assert result["critical_system"] == "Pression d'huile / Moteur"
    assert result["severity"] == "critical"

def test_safety_deterministic_overheating_hazard():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="le moteur est en surchauffe, l'aiguille est dans le rouge et fumée blanche moteur"
    )
    assert result["is_danger"] is True
    assert "Refroidissement" in result["critical_system"]
    assert result["severity"] in ["high", "critical"]

def test_safety_deterministic_fuel_leak_hazard():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="forte odeur d'essence et fuite de carburant visible sous le réservoir"
    )
    assert result["is_danger"] is True
    assert "Carburant" in result["critical_system"]
    assert result["severity"] == "critical"

def test_safety_database_is_danger_flag():
    service = get_safety_guard_service()
    result = service.check_safety(
        fault_code="FAULT-BRK-001",
        system="Freinage",
        is_danger_known=True
    )
    assert result["is_danger"] is True
    assert result["detection_source"] == "deterministic_rule"

def test_safety_benign_input_safe():
    service = get_safety_guard_service()
    result = service.check_safety(
        text="la vitre électrique côté passager descend un peu plus lentement que d'habitude",
        system="Accessoires"
    )
    assert result["is_danger"] is False
    assert result["severity"] == "low"
    assert result["critical_system"] is None
    assert result["danger_reason"] is None
    assert result["confidence"] <= 95

def test_safety_fastapi_endpoint_hazard():
    payload = {
        "text": "bruit bizarre quand je roule et voyant stop allumé",
        "symptoms": ["Bruit suspect"]
    }
    response = client.post("/api/check-safety", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_danger"] is True
    assert data["confidence"] <= 95
    assert data["detection_source"] == "deterministic_rule"
    assert "immediate_action" in data

def test_safety_fastapi_endpoint_safe():
    payload = {
        "text": "l'autoradio bluetooth met 10 secondes à se connecter",
        "system": "Multimédia"
    }
    response = client.post("/api/check-safety", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_danger"] is False
    assert data["severity"] == "low"
