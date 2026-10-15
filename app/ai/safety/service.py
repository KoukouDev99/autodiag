"""
Automotive Safety Guard Service (Module IA #5).
Evaluates road safety hazards and immediate vehicle damage risks.
Enforces:
1. DETERMINISTIC CHECKS FIRST:
   - Evaluates rule-based triggers (brakes, steering, engine overheating, oil pressure loss, fuel leak, fire hazard, tire blowout).
   - Instant decision (< 1ms) with absolute certainty for life-critical hazards.
2. LLM IN SECOND:
   - Analyzes subtle, metaphorical, or colloquial beginner phrasings.
   - Strictly capped at 95% confidence.
3. DETERMINISTIC FALLBACK:
   - Never crashes or blocks user if LLM runtime is offline.
"""
import json
import logging
import re
from pathlib import Path
from typing import Dict, Any, List, Optional

logger = logging.getLogger("autodiag.ai.safety")

# Critical deterministic safety signatures
CRITICAL_SAFETY_PATTERNS = [
    {
        "system": "Freinage",
        "severity": "critical",
        "regex": r"\b(frein|freins|freinage|p[eé]dale\s+(?:molle|au\s+plancher|s['\s]enfonce)|perte\s+de\s+frein|s['\s]arr[eê]te\s+plus|ne\s+freine\s+plus|disque\s+(?:rouge|fumant)|liquide\s+de\s+frein\s+bas|voyant\s+frein)\b",
        "reason": "Défaillance ou perte d'efficacité critique du circuit de freinage.",
        "action": "Arrêtez le véhicule immédiatement en lieu sécurisé. Ne roulez sous aucun prétexte et contactez une dépanneuse."
    },
    {
        "system": "Direction",
        "severity": "critical",
        "regex": r"\b(direction\s+bloqu[eé]e|volant\s+(?:bloqu[eé]|tr[eè]s\s+dur|impossible\s+[aà]\s+tourner)|perte\s+de\s+direction|rotule\s+(?:cass[eé]e|arrach[eé]e)|biellette\s+cass[eé]e)\b",
        "reason": "Blocage ou anomalie sévère de la direction assistée ou de la tringlerie.",
        "action": "Immobilisation immédiate. Ne forcez pas sur le volant et faites remorquer le véhicule."
    },
    {
        "system": "Pression d'huile / Moteur",
        "severity": "critical",
        "regex": r"\b(pression\s+d['\s]huile|voyant\s+huile|burette\s+rouge|plus\s+d['\s]huile|niveau\s+huile\s+[aà]\s+sec|moteur\s+claque\s+sans\s+huile|alerte\s+rouge\s+huile)\b",
        "reason": "Chute critique de la pression d'huile ou lubrification moteur à sec (risque de serrage moteur immédiat).",
        "action": "Coupez le moteur sans attendre. Ne tentez aucun redémarrage avant appoint ou remorquage."
    },
    {
        "system": "Refroidissement / Surchauffe",
        "severity": "high",
        "regex": r"\b(surchauffe|aiguille\s+(?:dans\s+le\s+rouge|[aà]\s+fond)|vapeur\s+sous\s+le\s+capot|liquide\s+qui\s+bout|vase\s+bouillonne|fum[eé]e\s+blanche\s+moteur|120\s*(?:°|deg|degr[eé]s))\b",
        "reason": "Surchauffe thermique extrême du moteur avec risque de rupture de joint de culasse ou incendie.",
        "action": "Arrêtez le moteur dès que possible. Ne touchez JAMAIS au bouchon de radiateur/vase moteur chaud."
    },
    {
        "system": "Carburant / Incendie",
        "severity": "critical",
        "regex": r"\b(odeur\s+d['\s]essence|fuite\s+(?:d['\s]essence|carburant|gasoil)|d[eé]part\s+de\s+feu|flammes?|fum[eé]e\s+noire\s+sous\s+le\s+capot|odeur\s+de\s+br[uû]l[eé]\s+intense)\b",
        "reason": "Fuite inflammable de carburant ou amorce d'incendie électrique/moteur.",
        "action": "Évacuez les occupants du véhicule, coupez le contact, éloignez-vous et composez les numéros d'urgence (18/112)."
    },
    {
        "system": "Pneumatiques / Liaison au sol",
        "severity": "high",
        "regex": r"\b(pneu\s+[eé]clat[eé]|roue\s+(?:qui\s+se\s+d[eé]tache|d[eé]serr[eé]e|voil[eé]e)|vibrations?\s+extr[eê]mes?\s+au\s+volant|bruit\s+de\s+roulement\s+violent)\b",
        "reason": "Risque imminent de perte de roue, d'éclatement de pneumatique ou de sortie de route.",
        "action": "Réduisez progressivement votre vitesse sans freiner brusquement, garez-vous sur la bande d'arrêt d'urgence."
    },
    {
        "system": "Alerte Combiné",
        "severity": "high",
        "regex": r"\b(voyant\s+rouge|voyant\s+stop|message\s+arr[eê]t\s+imm[eé]diat)\b",
        "reason": "Alerte de gravité maximale déclenchée par le calculateur de bord (voyant STOP ou rouge).",
        "action": "Arrêt impératif du véhicule conformément aux consignes du constructeur automobile."
    }
]

class SafetyGuardService:
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
        self._initialized = False

    def _find_model_path(self) -> Optional[Path]:
        for p in self.possible_paths:
            if p.exists() and p.stat().st_size > 100_000_000:
                return p
        return None

    def _lazy_init(self):
        if self._initialized:
            return

        model_path = self._find_model_path()
        if not model_path:
            logger.info("Qwen2.5 GGUF model not found locally for Safety Guard. Deterministic fallback active.")
            self._initialized = True
            return

        try:
            from llama_cpp import Llama
            logger.info(f"Loading local LLM from {model_path} for Safety Guard...")
            self._llm = Llama(
                model_path=str(model_path),
                n_ctx=self.n_ctx,
                n_threads=self.n_threads,
                verbose=False
            )
            logger.info("Qwen2.5 LLM loaded successfully for Safety Guard.")
        except Exception as e:
            logger.warning(f"Could not initialize llama-cpp for Safety Guard: {e}. Fallback active.")
            self._llm = None

        self._initialized = True

    def check_safety(
        self,
        text: Optional[str] = None,
        fault_code: Optional[str] = None,
        system: Optional[str] = None,
        is_danger_known: Optional[bool] = None,
        symptoms: Optional[List[str]] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates automotive hazard level.
        Enforces DETERMINISTIC FIRST, LLM SECOND.
        """
        combined_text = " ".join(filter(None, [
            text or "",
            context or "",
            " ".join(symptoms or []),
            fault_code or "",
            system or ""
        ])).strip()

        # =====================================================================
        # ÉTAPE 1 : CONTRÔLE DÉTERMINISTE STRICT EN PREMIER (First Line)
        # =====================================================================
        det_result = self._check_deterministic(
            combined_text=combined_text,
            system=system,
            is_danger_known=is_danger_known
        )
        if det_result["is_danger"]:
            return det_result

        # =====================================================================
        # ÉTAPE 2 : ANALYSE LLM EN SECOND (Second Line pour formulations subtiles)
        # =====================================================================
        if combined_text and len(combined_text) >= 8:
            self._lazy_init()
            if self._llm is not None:
                llm_result = self._check_llm_safety(combined_text)
                if llm_result is not None:
                    return llm_result

        # =====================================================================
        # ÉTAPE 3 : AUCUN DANGER DÉTECTÉ (Safe state)
        # =====================================================================
        return {
            "is_danger": False,
            "severity": "low",
            "critical_system": None,
            "danger_reason": None,
            "immediate_action": "Aucun risque de sécurité vitale détecté. Vous pouvez poursuivre le diagnostic.",
            "detection_source": "deterministic_rule",
            "confidence": 95,
            "fallback_applied": False
        }

    def _check_deterministic(
        self,
        combined_text: str,
        system: Optional[str] = None,
        is_danger_known: Optional[bool] = None
    ) -> Dict[str, Any]:
        """Applies exact regex patterns and database danger flags."""
        # 1. Check database known danger flag
        if is_danger_known is True:
            sys_name = system or "Système critique"
            return {
                "is_danger": True,
                "severity": "critical",
                "critical_system": sys_name,
                "danger_reason": f"Panne répertoriée comme dangereuse pour la sécurité routière ({sys_name}).",
                "immediate_action": "Arrêt du véhicule en lieu sécurisé et assistance recommandée.",
                "detection_source": "deterministic_rule",
                "confidence": 95,
                "fallback_applied": False
            }

        # 2. Check critical keyword patterns
        for item in CRITICAL_SAFETY_PATTERNS:
            if re.search(item["regex"], combined_text, re.IGNORECASE):
                return {
                    "is_danger": True,
                    "severity": item["severity"],
                    "critical_system": item["system"],
                    "danger_reason": item["reason"],
                    "immediate_action": item["action"],
                    "detection_source": "deterministic_rule",
                    "confidence": 95,
                    "fallback_applied": False
                }

        return {"is_danger": False}

    def _check_llm_safety(self, text: str) -> Optional[Dict[str, Any]]:
        """Invokes local LLM to assess implicit/subtle danger."""
        try:
            system_prompt = (
                "Tu es l'officier de sécurité automobile d'AutoDiag. "
                "Ton rôle est de détecter si une observation de conducteur dissimule un DANGER IMMÉDIAT "
                "pour la vie humaine ou l'intégrité de la voiture (freins défaillants, direction coincée, "
                "moteur sans huile, surchauffe extrême, fuite d'essence ou feu).\n"
                "Réponds EXCLUSIVEMENT sous la forme d'un objet JSON valide avec cette structure :\n"
                "{\n"
                '  "is_danger": true ou false,\n'
                '  "severity": "low" ou "medium" ou "high" ou "critical",\n'
                '  "critical_system": "nom du système ou null",\n'
                '  "danger_reason": "explication concise ou null",\n'
                '  "immediate_action": "action recommandée ou null",\n'
                '  "confidence": <entier entre 50 et 95>\n'
                "}\n"
                "Ne réponds rien d'autre que ce JSON."
            )

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Observation du conducteur : \"{text}\""}
            ]

            output = self._llm.create_chat_completion(
                messages=messages,
                temperature=0.1,
                max_tokens=200
            )

            raw = output["choices"][0]["message"]["content"].strip()
            # Extract JSON block
            json_match = re.search(r"\{.*?\}", raw, re.DOTALL)
            if json_match:
                parsed = json.loads(json_match.group(0))
                is_danger = bool(parsed.get("is_danger", False))
                # Strict hard cap <= 95
                raw_conf = parsed.get("confidence", 85)
                try:
                    conf = min(max(50, int(raw_conf)), 95)
                except Exception:
                    conf = 85

                if is_danger:
                    return {
                        "is_danger": True,
                        "severity": parsed.get("severity") or "high",
                        "critical_system": parsed.get("critical_system") or "Sécurité routière",
                        "danger_reason": parsed.get("danger_reason") or "Risque potentiel détecté.",
                        "immediate_action": parsed.get("immediate_action") or "Arrêt du véhicule conseillé.",
                        "detection_source": "llm_analysis",
                        "confidence": conf,
                        "fallback_applied": False
                    }
        except Exception as e:
            logger.error(f"Error during LLM safety check: {e}")

        return None


# Global singleton
_safety_service_instance: Optional[SafetyGuardService] = None

def get_safety_guard_service() -> SafetyGuardService:
    global _safety_service_instance
    if _safety_service_instance is None:
        _safety_service_instance = SafetyGuardService()
    return _safety_service_instance
