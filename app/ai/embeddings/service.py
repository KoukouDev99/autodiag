"""
Symptom Normalization Service using Sentence-Transformers and FAISS-CPU.
Provides semantic vector matching from free-form user text to canonical symptoms.
"""
import json
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional
import numpy as np

logger = logging.getLogger("autodiag.ai.embeddings")

class SymptomNormalizer:
    def __init__(
        self,
        index_path: Optional[Path] = None,
        meta_path: Optional[Path] = None,
        model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
        threshold: float = 0.6
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.index_path = index_path or (base_dir / "data" / "faiss_index" / "symptoms.index")
        self.meta_path = meta_path or (base_dir / "data" / "faiss_index" / "symptoms_meta.json")
        self.model_name = model_name
        self.threshold = threshold
        
        self._model = None
        self._index = None
        self._metadata: List[Dict[str, Any]] = []
        self._initialized = False

    def _lazy_init(self):
        """Lazy load model and FAISS index on first request to minimize startup memory and latency."""
        if self._initialized:
            return

        try:
            import faiss
            from sentence_transformers import SentenceTransformer

            # Load metadata
            if not self.meta_path.exists():
                logger.warning(f"Metadata file not found at {self.meta_path}. Attempting to build or fallback.")
            else:
                with open(self.meta_path, "r", encoding="utf-8") as f:
                    self._metadata = json.load(f)

            # Load FAISS index
            if not self.index_path.exists():
                logger.warning(f"FAISS index not found at {self.index_path}")
                self._index = None
            else:
                self._index = faiss.read_index(str(self.index_path))
                logger.info(f"Loaded FAISS index with {self._index.ntotal} vectors.")

            # Load model from user cache
            cache_dir = Path.home() / ".cache" / "autodiag_models"
            self._model = SentenceTransformer(self.model_name, cache_folder=str(cache_dir))
            logger.info(f"SentenceTransformer '{self.model_name}' loaded successfully.")

            self._initialized = True
        except Exception as e:
            logger.error(f"Failed to initialize SymptomNormalizer: {e}")
            self._initialized = False

    def normalize(self, query: str, top_k: int = 3, threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Normalize user free-text query into canonical symptom and top alternatives.
        
        Returns:
            {
                "symptom_id": int | None,
                "code": str | None,
                "label": str | None,
                "score": float,
                "needs_clarification": bool,
                "threshold": float,
                "top_3_alternatives": List[dict],
                "fallback_applied": bool
            }
        """
        thresh = threshold if threshold is not None else self.threshold
        clean_query = (query or "").strip()
        if not clean_query:
            return {
                "symptom_id": None,
                "code": None,
                "label": None,
                "score": 0.0,
                "needs_clarification": True,
                "message": "Veuillez décrire le problème rencontré avec votre véhicule.",
                "threshold": thresh,
                "top_3_alternatives": [],
                "fallback_applied": False
            }

        self._lazy_init()

        # If model or index failed to load, use deterministic keyword fallback
        if not self._initialized or self._model is None or self._index is None:
            return self._keyword_fallback(clean_query, thresh)

        try:
            # 1. Encode query and normalize vector for cosine similarity
            query_vector = self._model.encode([clean_query], convert_to_numpy=True, normalize_embeddings=True)
            query_vector = query_vector.astype(np.float32)

            # 2. Search nearest neighbors in FAISS
            k_search = min(15, self._index.ntotal)
            scores, indices = self._index.search(query_vector, k_search)

            # 3. Deduplicate by unique symptom_id keeping max similarity score
            unique_results: Dict[int, Dict[str, Any]] = {}
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self._metadata):
                    continue
                meta = self._metadata[idx]
                sym_id = meta["symptom_id"]
                score_val = float(score)

                if sym_id not in unique_results or score_val > unique_results[sym_id]["score"]:
                    unique_results[sym_id] = {
                        "symptom_id": sym_id,
                        "code": meta["code"],
                        "label": meta["label"],
                        "category": meta["category"],
                        "score": round(score_val, 4)
                    }

            # 4. Sort aggregated candidates descending by similarity score
            sorted_candidates = sorted(unique_results.values(), key=lambda x: x["score"], reverse=True)
            top_alternatives = sorted_candidates[:top_k]

            if not top_alternatives:
                return self._keyword_fallback(clean_query, thresh)

            best = top_alternatives[0]
            best_score = best["score"]
            needs_clarification = best_score < thresh

            return {
                "symptom_id": best["symptom_id"] if not needs_clarification else None,
                "code": best["code"] if not needs_clarification else None,
                "label": best["label"] if not needs_clarification else None,
                "category": best["category"] if not needs_clarification else None,
                "score": best_score,
                "needs_clarification": needs_clarification,
                "message": (
                    "Symptôme ambigu ou score de similarité insuffisant. Veuillez préciser vos observations ou choisir une option suggérée."
                    if needs_clarification
                    else None
                ),
                "threshold": thresh,
                "top_3_alternatives": top_alternatives,
                "fallback_applied": False
            }

        except Exception as e:
            logger.error(f"Error during semantic normalization: {e}")
            return self._keyword_fallback(clean_query, thresh)

    def _keyword_fallback(self, query: str, thresh: float) -> Dict[str, Any]:
        """Deterministic keyword-based fallback if ML pipeline is offline or errors."""
        q_lower = query.lower()
        keyword_map = [
            (["démarr", "part pas", "tourne pas", "clé", "contact"], 1, "start_fail", "Ne démarre pas", "Démarrage"),
            (["voyant", "moteur", "combiné", "témoin"], 2, "check_engine", "Voyant moteur", "Moteur"),
            (["bruit", "clac", "grinc", "siffle", "vibr"], 3, "strange_noise", "Bruit inhabituel", "Mécanique"),
            (["fumé", "échappement", "blanche", "noire", "bleu"], 4, "smoke", "Fumée", "Échappement"),
            (["chauff", "température", "liquide", "bouill"], 5, "overheat", "Surchauffe", "Moteur"),
            (["frein", "pédale", "disque", "plaquette"], 6, "brakes", "Freinage défaillant", "Freinage"),
            (["batterie", "décharg", "vide", "phares"], 7, "battery", "Batterie", "Électrique"),
            (["électr", "fusible", "vitre", "alternateur"], 8, "electric", "Circuit électrique", "Électrique"),
            (["consomm", "carburant", "essence", "diesel"], 9, "high_fuel", "Consommation excessive", "Carburant"),
        ]

        alternatives = []
        for words, s_id, code, label, cat in keyword_map:
            matches = sum(1 for w in words if w in q_lower)
            if matches > 0:
                score = round(min(0.85, 0.5 + (0.15 * matches)), 4)
                alternatives.append({
                    "symptom_id": s_id,
                    "code": code,
                    "label": label,
                    "category": cat,
                    "score": score
                })

        alternatives = sorted(alternatives, key=lambda x: x["score"], reverse=True)[:3]
        if alternatives and alternatives[0]["score"] >= thresh:
            best = alternatives[0]
            return {
                "symptom_id": best["symptom_id"],
                "code": best["code"],
                "label": best["label"],
                "category": best["category"],
                "score": best["score"],
                "needs_clarification": False,
                "message": None,
                "threshold": thresh,
                "top_3_alternatives": alternatives,
                "fallback_applied": True
            }

        return {
            "symptom_id": None,
            "code": None,
            "label": None,
            "category": None,
            "score": alternatives[0]["score"] if alternatives else 0.0,
            "needs_clarification": True,
            "message": "Symptôme ambigu ou trop vague. Veuillez préciser vos observations.",
            "threshold": thresh,
            "top_3_alternatives": alternatives,
            "fallback_applied": True
        }


# Singleton instance
_normalizer_instance: Optional[SymptomNormalizer] = None

def get_symptom_normalizer() -> SymptomNormalizer:
    global _normalizer_instance
    if _normalizer_instance is None:
        _normalizer_instance = SymptomNormalizer()
    return _normalizer_instance
