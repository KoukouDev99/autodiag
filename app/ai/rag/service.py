"""
Technical Knowledge RAG Retriever Service (Module IA #3).
Provides semantic similarity search across technical documents (faults, tests, solutions, DTC codes).
Ensures complete provenance tracking: source_id, source_name, license, and version.
Includes deterministic fallback.
"""
import json
import logging
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger("autodiag.ai.rag")

class TechRAGRetriever:
    def __init__(
        self,
        index_path: Optional[Path] = None,
        meta_path: Optional[Path] = None,
        embedding_model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.index_path = index_path or (base_dir / "data" / "faiss_index" / "tech_docs.index")
        self.meta_path = meta_path or (base_dir / "data" / "faiss_index" / "tech_docs_meta.json")
        self.backup_data_path = base_dir / "data" / "tech_documents.json"
        self.embedding_model_name = embedding_model_name

        self._index = None
        self._metadata: List[Dict[str, Any]] = []
        self._model = None
        self._initialized = False

    def _lazy_init(self):
        if self._initialized:
            return

        try:
            import faiss
            from sentence_transformers import SentenceTransformer

            cache_dir = Path.home() / ".cache" / "autodiag_models"
            cache_dir.mkdir(parents=True, exist_ok=True)

            logger.info(f"Loading embedding model for Tech RAG: {self.embedding_model_name}")
            self._model = SentenceTransformer(self.embedding_model_name, cache_folder=str(cache_dir))

            if self.index_path.exists() and self.meta_path.exists():
                logger.info(f"Loading FAISS index from {self.index_path}")
                self._index = faiss.read_index(str(self.index_path))
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)
                logger.info(f"Tech RAG initialized with {len(self._metadata)} documents.")
            else:
                logger.warning(f"FAISS index files not found at {self.index_path}. Fallback active.")
        except Exception as e:
            logger.error(f"Failed to initialize TechRAGRetriever: {e}")
            self._index = None
            self._model = None

        self._initialized = True

    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        min_score: float = 0.25,
        filter_doc_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Retrieves top_k technical documents relevant to the query with provenance.
        """
        clean_query = (query or "").strip()
        if not clean_query:
            return {
                "query": "",
                "passages": [],
                "total": 0,
                "fallback_applied": False
            }

        self._lazy_init()

        # 1. Semantic FAISS Search
        if self._index is not None and self._model is not None and len(self._metadata) > 0:
            try:
                query_vec = self._model.encode([clean_query], convert_to_numpy=True, normalize_embeddings=True)
                
                # Fetch slightly more if filtering is required
                fetch_k = min(len(self._metadata), top_k * 3 if filter_doc_type else top_k)
                scores, indices = self._index.search(query_vec.astype(np.float32), fetch_k)

                passages = []
                for score, idx in zip(scores[0], indices[0]):
                    if idx < 0 or idx >= len(self._metadata):
                        continue
                    if score < min_score:
                        continue

                    doc = self._metadata[idx]
                    if filter_doc_type and doc.get("doc_type") != filter_doc_type:
                        continue

                    passages.append({
                        "doc_id": doc.get("doc_id"),
                        "doc_type": doc.get("doc_type"),
                        "fault_code": doc.get("fault_code"),
                        "title": doc.get("title"),
                        "content": doc.get("content"),
                        "score": round(float(score), 4),
                        "source_id": doc.get("source_id"),
                        "source_name": doc.get("source_name"),
                        "license": doc.get("license"),
                        "version": doc.get("version"),
                        "metadata": doc.get("metadata", {})
                    })

                    if len(passages) >= top_k:
                        break

                return {
                    "query": clean_query,
                    "passages": passages,
                    "total": len(passages),
                    "fallback_applied": False
                }
            except Exception as e:
                logger.error(f"Error during FAISS retrieval: {e}")

        # 2. Deterministic Lexical Fallback
        passages = self._deterministic_fallback(clean_query, top_k=top_k, filter_doc_type=filter_doc_type)
        return {
            "query": clean_query,
            "passages": passages,
            "total": len(passages),
            "fallback_applied": True
        }

    def _deterministic_fallback(
        self,
        query: str,
        top_k: int = 3,
        filter_doc_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Keyword matching fallback if FAISS/model is unavailable."""
        docs_to_search = self._metadata
        if not docs_to_search and self.backup_data_path.exists():
            try:
                with open(self.backup_data_path, "r", encoding="utf-8") as f:
                    docs_to_search = json.load(f)
            except Exception:
                docs_to_search = []

        if not docs_to_search:
            return []

        words = [w.lower() for w in query.split() if len(w) > 2]
        scored_docs = []

        for doc in docs_to_search:
            if filter_doc_type and doc.get("doc_type") != filter_doc_type:
                continue

            text = (doc.get("title", "") + " " + doc.get("content", "")).lower()
            matches = sum(1 for w in words if w in text)
            if matches > 0:
                score = min(0.9, matches / max(1, len(words)))
                scored_docs.append((score, doc))

        scored_docs.sort(key=lambda x: x[0], reverse=True)
        results = []
        for score, doc in scored_docs[:top_k]:
            results.append({
                "doc_id": doc.get("doc_id"),
                "doc_type": doc.get("doc_type"),
                "fault_code": doc.get("fault_code"),
                "title": doc.get("title"),
                "content": doc.get("content"),
                "score": round(float(score), 4),
                "source_id": doc.get("source_id", 2),
                "source_name": doc.get("source_name", "AutoDiag Workshop Heuristics"),
                "license": doc.get("license", "CC-BY-NC-SA 4.0"),
                "version": doc.get("version", "4.2"),
                "metadata": doc.get("metadata", {})
            })

        return results


# Global singleton
_rag_retriever_instance: Optional[TechRAGRetriever] = None

def get_tech_rag_retriever() -> TechRAGRetriever:
    global _rag_retriever_instance
    if _rag_retriever_instance is None:
        _rag_retriever_instance = TechRAGRetriever()
    return _rag_retriever_instance
