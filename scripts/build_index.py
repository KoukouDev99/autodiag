"""
Script to build FAISS-CPU semantic index for canonical vehicle symptoms.
Indexes canonical symptoms from data/canonical_symptoms.json using
'paraphrase-multilingual-MiniLM-L12-v2' embeddings.
"""
import json
import os
from pathlib import Path
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Common French automotive paraphrases for enhanced recall
SYMPTOM_PARAPHRASES = {
    "start_fail": [
        "ma voiture ne démarre pas",
        "le démarreur tourne mais le moteur ne part pas",
        "rien ne se passe quand je tourne la clé",
        "impossible de mettre le contact et démarrer",
        "le moteur refuse de démarrer",
        "bruit de clic au démarrage mais rien ne tourne"
    ],
    "check_engine": [
        "voyant moteur orange allumé sur le tableau de bord",
        "le voyant en forme de moteur reste allumé",
        "alerte voyant orange combiné",
        "message faire vérifier moteur"
    ],
    "strange_noise": [
        "bruit de claquement sous le capot",
        "grincement anormal quand je roule",
        "sifflement aigu au niveau du moteur",
        "claquement métallique en accélérant",
        "vibration inhabituelle dans l'habitacle"
    ],
    "smoke": [
        "fumée blanche qui sort du pot d'échappement",
        "fumée noire et épaisse à l'accélération",
        "fumée bleue à l'échappement",
        "fumée qui sort de sous le capot"
    ],
    "overheat": [
        "le moteur surchauffe",
        "aiguille de température d'eau dans le rouge",
        "voyant liquide de refroidissement allumé",
        "fumée et odeur de liquide chaud"
    ],
    "brakes": [
        "la pédale de frein est molle ou s'enfonce",
        "les freins grincent ou sifflent fort",
        "la voiture vibre violemment au freinage",
        "manque de mordant et distance de freinage allongée"
    ],
    "battery": [
        "la batterie est à plat",
        "baisse d'intensité des phares et voyants faiblards",
        "plus de jus dans la batterie",
        "batterie déchargée après arrêt"
    ],
    "electric": [
        "problème électrique tableau de bord",
        "les vitres ou les phares ne marchent plus",
        "fusible grillé ou bug électronique",
        "l'alternateur ne charge plus"
    ],
    "high_fuel": [
        "la voiture consomme beaucoup trop de carburant",
        "surconsommation d'essence ou de diesel",
        "consommation anormale au 100km"
    ]
}

def build_symptoms_index():
    base_dir = Path(__file__).resolve().parent.parent
    data_file = base_dir / "data" / "canonical_symptoms.json"
    index_dir = base_dir / "data" / "faiss_index"
    index_dir.mkdir(parents=True, exist_ok=True)

    if not data_file.exists():
        raise FileNotFoundError(f"Canonical symptoms data not found at: {data_file}")

    with open(data_file, "r", encoding="utf-8") as f:
        symptoms = json.load(f)

    print(f"[AutoDiag AI] Loading {len(symptoms)} canonical symptoms...")

    # Load model from user cache
    cache_dir = Path.home() / ".cache" / "autodiag_models"
    model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", cache_folder=str(cache_dir))

    corpus_texts = []
    metadata = []

    for sym in symptoms:
        sym_id = sym.get("id")
        code = sym.get("code")
        label = sym.get("label", "")
        desc = sym.get("description", "")
        cat = sym.get("category", "")
        norm = sym.get("normalized_name", "")

        # 1. Main canonical entry
        main_text = f"{label}. {desc} Catégorie : {cat}."
        corpus_texts.append(main_text)
        metadata.append({
            "symptom_id": sym_id,
            "code": code,
            "label": label,
            "category": cat,
            "description": desc,
            "normalized_name": norm,
            "text": main_text
        })

        # 2. Add domain paraphrases for better beginner language matching
        paraphrases = SYMPTOM_PARAPHRASES.get(code, [])
        for p in paraphrases:
            corpus_texts.append(p)
            metadata.append({
                "symptom_id": sym_id,
                "code": code,
                "label": label,
                "category": cat,
                "description": desc,
                "normalized_name": norm,
                "text": p
            })

    print(f"[AutoDiag AI] Encoding {len(corpus_texts)} corpus passages...")
    embeddings = model.encode(corpus_texts, convert_to_numpy=True, show_progress_bar=True, normalize_embeddings=True)

    dim = embeddings.shape[1]
    print(f"[AutoDiag AI] Creating FAISS IndexFlatIP (dim={dim})...")
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype(np.float32))

    index_path = index_dir / "symptoms.index"
    meta_path = index_dir / "symptoms_meta.json"

    faiss.write_index(index, str(index_path))
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"[AutoDiag AI] Index built successfully!")
    print(f"  - FAISS index saved to: {index_path} ({index.ntotal} vectors)")
    print(f"  - Metadata saved to: {meta_path}")

if __name__ == "__main__":
    build_symptoms_index()
