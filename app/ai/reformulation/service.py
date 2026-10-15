"""
Question Reformulation Service for Beginners (Module IA #2).
Uses Qwen2.5-3B-Instruct Q4_K_M via llama-cpp-python for simplifying
complex mechanical diagnostic questions into intuitive sensory observations.
Includes a mandatory deterministic fallback returning original/simplified questions.
"""
import logging
import os
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("autodiag.ai.reformulation")

# Curated beginner sensory dictionary for high-speed fallback & enrichment
BEGINNER_KNOWLEDGE_MAP = {
    "démarreur": {
        "hint": "Le démarreur est le moteur électrique qui lance le moteur quand vous tournez la clé.",
        "simplify": "entendez-vous le démarreur lancer le moteur avec force ou fait-il seulement un bruit de clic ?"
    },
    "solénoïde": {
        "hint": "Le solénoïde est l'interrupteur magnétique du démarreur qui produit un 'clac' au tour de clé.",
        "simplify": "entendez-vous un 'clac' sec ou des clics rapides au moment de démarrer ?"
    },
    "pompe de gavage": {
        "hint": "La pompe de gavage envoie le carburant du réservoir vers le moteur.",
        "simplify": "sous la banquette arrière, entendez-vous un léger bourdonnement (bzz) de 2 secondes à la mise sous contact ?"
    },
    "alternateur": {
        "hint": "L'alternateur recharge la batterie lorsque le moteur tourne.",
        "simplify": "vos phares ou l'éclairage intérieur diminuent-ils quand vous roulez ?"
    },
    "étrier": {
        "hint": "L'étrier serre les plaquettes contre les disques de frein pour ralentir la roue.",
        "simplify": "la voiture tire-t-elle d'un côté au freinage ou une roue devient-elle très chaude ?"
    },
    "bobine": {
        "hint": "La bobine d'allumage fournit l'électricité haute tension aux bougies.",
        "simplify": "le moteur a-t-il des secousses ou des trous à l'accélération ?"
    },
    "sonde lambda": {
        "hint": "La sonde lambda mesure l'oxygène dans les gaz d'échappement pour réguler le carburant.",
        "simplify": "remarquez-vous une surconsommation de carburant ou une odeur d'essence à l'échappement ?"
    }
}

class QuestionReformulator:
    def __init__(
        self,
        model_filename: str = "qwen2.5-3b-instruct-q4_k_m.gguf",
        n_ctx: int = 1024,
        n_threads: int = 4
    ):
        base_dir = Path(__file__).resolve().parent.parent.parent.parent
        self.model_filename = model_filename
        self.possible_paths = [
            base_dir / "models" / "llm" / model_filename,
            Path.home() / ".cache" / "autodiag_models" / model_filename,
            Path.home() / ".cache" / "huggingface" / "hub" / model_filename
        ]
        self.n_ctx = n_ctx
        self.n_threads = n_threads
        
        self._llm = None
        self._model_path = None
        self._initialized = False

    def _find_model_path(self) -> Optional[Path]:
        for p in self.possible_paths:
            if p.exists() and p.stat().st_size > 100_000_000:
                return p
        return None

    def _lazy_init(self):
        """Lazy load llama-cpp model only on first demand to avoid startup memory overhead."""
        if self._initialized:
            return

        model_path = self._find_model_path()
        if not model_path:
            logger.info("Qwen2.5 GGUF model file not found locally. Automatic fallback active.")
            self._initialized = True
            return

        try:
            from llama_cpp import Llama
            logger.info(f"Loading local LLM from {model_path} with {self.n_threads} threads...")
            self._llm = Llama(
                model_path=str(model_path),
                n_ctx=self.n_ctx,
                n_threads=self.n_threads,
                verbose=False
            )
            self._model_path = model_path
            logger.info("Qwen2.5 LLM loaded successfully.")
        except Exception as e:
            logger.warning(f"Could not initialize llama-cpp runtime: {e}. Fallback will be used.")
            self._llm = None

        self._initialized = True

    def reformulate(
        self,
        question: str,
        context: Optional[str] = None,
        options: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Reformulates a diagnostic question for automotive beginners.
        
        Returns:
            {
                "original_question": str,
                "reformulated_question": str,
                "explanation_hint": Optional[str],
                "fallback_applied": bool
            }
        """
        clean_q = (question or "").strip()
        if not clean_q:
            return {
                "original_question": "",
                "reformulated_question": "",
                "explanation_hint": None,
                "fallback_applied": True
            }

        self._lazy_init()

        # Identify any known technical term for explanation hint
        hint = self._extract_hint(clean_q)

        # 1. Attempt LLM generation if local model is loaded
        if self._llm is not None:
            try:
                system_prompt = (
                    "Tu es l'assistant de vulgarisation mécanique pour AutoDiag. "
                    "Ton but est de reformuler la question technique de diagnostic suivante pour qu'un conducteur débutant "
                    "qui n'y connaît rien à la mécanique sache exactement quoi regarder, écouter ou ressentir concrètement. "
                    "Règles strictes :\n"
                    "- 1 à 2 phrases simples maximum.\n"
                    "- Pas de jargon technique (remplace par des observations de bon sens : bruit, voyant, fumée, sensation).\n"
                    "- Ne commence pas par 'Voici la reformulation', réponds directement par la question reformulée."
                )

                user_prompt = f"Question technique : \"{clean_q}\""
                if context:
                    user_prompt += f"\nContexte de la panne : {context}"
                if options:
                    user_prompt += f"\nOptions possibles : {', '.join(options)}"

                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]

                output = self._llm.create_chat_completion(
                    messages=messages,
                    temperature=0.3,
                    max_tokens=150
                )

                content = output["choices"][0]["message"]["content"].strip()
                # Clean enclosing quotes if any
                clean_content = re.sub(r'^["«]|["»]$', '', content).strip()

                if clean_content and len(clean_content) > 10:
                    return {
                        "original_question": clean_q,
                        "reformulated_question": clean_content,
                        "explanation_hint": hint,
                        "fallback_applied": False
                    }
            except Exception as e:
                logger.error(f"Error during LLM question reformulation: {e}")

        # 2. Deterministic Fallback : Return curated simplification or original question
        fallback_question = self._deterministic_fallback(clean_q)
        return {
            "original_question": clean_q,
            "reformulated_question": fallback_question,
            "explanation_hint": hint,
            "fallback_applied": True
        }

    def _extract_hint(self, text: str) -> Optional[str]:
        t_lower = text.lower()
        for term, data in BEGINNER_KNOWLEDGE_MAP.items():
            if term in t_lower:
                return data["hint"]
        return None

    def _deterministic_fallback(self, question: str) -> str:
        """Heuristic rule-based simplification for beginner-friendly phrasing."""
        t_lower = question.lower()
        for term, data in BEGINNER_KNOWLEDGE_MAP.items():
            if term in t_lower and "simplify" in data:
                return f"Pour débutant : {data['simplify']}"
        # If no specific term matched, return original question directly (requirement compliance)
        return question


# Singleton instance
_reformulator_instance: Optional[QuestionReformulator] = None

def get_question_reformulator() -> QuestionReformulator:
    global _reformulator_instance
    if _reformulator_instance is None:
        _reformulator_instance = QuestionReformulator()
    return _reformulator_instance
