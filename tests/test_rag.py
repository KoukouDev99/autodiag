"""
Tests for Module IA #3 — Technical RAG Context Retrieval.
Verifies FAISS semantic retrieval, document filtering, provenance tracking, and fallback.
"""
import pytest
from fastapi.testclient import TestClient
from app.ai.main import app
from app.ai.rag.service import TechRAGRetriever, get_tech_rag_retriever

client = TestClient(app)

def test_rag_retriever_initialization():
    retriever = get_tech_rag_retriever()
    assert retriever is not None

def test_rag_retrieval_battery_query():
    retriever = get_tech_rag_retriever()
    result = retriever.retrieve("batterie déchargée impossible de démarrer", top_k=3, min_score=0.20)
    
    assert "query" in result
    assert "passages" in result
    assert "total" in result
    assert isinstance(result["passages"], list)
    assert len(result["passages"]) > 0
    assert len(result["passages"]) <= 3

    top_passage = result["passages"][0]
    assert "doc_id" in top_passage
    assert "doc_type" in top_passage
    assert "title" in top_passage
    assert "content" in top_passage
    assert "score" in top_passage
    assert "source_id" in top_passage
    assert "source_name" in top_passage
    assert "license" in top_passage

    # Provenance verification
    assert top_passage["source_id"] in [1, 2]
    assert top_passage["license"] in ["MIT", "CC-BY-NC-SA 4.0", "Proprietary"]

def test_rag_retrieval_dtc_code():
    retriever = get_tech_rag_retriever()
    result = retriever.retrieve("P0300 ratés d'allumage cylindre", top_k=2, min_score=0.15)
    
    assert len(result["passages"]) > 0
    # Top passage should match misfire, ignition or code P0300
    found_misfire_or_ignition = any(
        "p0300" in p["content"].lower() or "allumage" in p["content"].lower() or "misfire" in p["content"].lower() or "cylindre" in p["content"].lower()
        for p in result["passages"]
    )
    assert found_misfire_or_ignition

def test_rag_retrieval_empty_query():
    retriever = get_tech_rag_retriever()
    result = retriever.retrieve("", top_k=3)
    assert result["total"] == 0
    assert len(result["passages"]) == 0

def test_rag_retrieval_doc_type_filter():
    retriever = get_tech_rag_retriever()
    result = retriever.retrieve("batterie", top_k=3, filter_doc_type="solution")
    
    for p in result["passages"]:
        assert p["doc_type"] == "solution"

def test_rag_deterministic_fallback():
    # Instantiate with non-existent paths to force fallback
    from pathlib import Path
    fallback_retriever = TechRAGRetriever(
        index_path=Path("non_existent.index"),
        meta_path=Path("non_existent_meta.json")
    )
    result = fallback_retriever.retrieve("démarreur bloqué", top_k=2)
    assert result["fallback_applied"] is True
    assert isinstance(result["passages"], list)

def test_rag_fastapi_endpoint_success():
    payload = {
        "query": "plaquettes de frein usées bruit de grincement",
        "top_k": 3,
        "min_score": 0.20
    }
    response = client.post("/api/retrieve-context", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["query"] == payload["query"]
    assert "passages" in data
    assert len(data["passages"]) > 0
    for p in data["passages"]:
        assert "source_id" in p
        assert "source_name" in p
        assert "license" in p

def test_rag_fastapi_endpoint_validation():
    # Empty query should fail validation
    response = client.post("/api/retrieve-context", json={"query": ""})
    assert response.status_code == 422
