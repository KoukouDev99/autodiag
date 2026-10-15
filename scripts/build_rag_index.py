"""
Build FAISS-CPU RAG Index for AutoDiag Technical Knowledge Base.
Indexes technical documents (faults, diagnostic tests, repair solutions, DTC codes)
using 'paraphrase-multilingual-MiniLM-L12-v2' embeddings.
Maintains full provenance tracking (source_id, source_name, license, version).
"""
import json
import os
from pathlib import Path
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

def build_rag_index():
    base_dir = Path(__file__).resolve().parent.parent
    data_file = base_dir / "data" / "tech_documents.json"
    index_dir = base_dir / "data" / "faiss_index"
    index_dir.mkdir(parents=True, exist_ok=True)

    if not data_file.exists():
        raise FileNotFoundError(f"Technical documents not found at: {data_file}. Please run scripts/export_rag_documents.js first.")

    with open(data_file, "r", encoding="utf-8") as f:
        documents = json.load(f)

    print(f"[AutoDiag RAG] Loaded {len(documents)} technical documents from {data_file}")

    # Use short user cache directory to avoid Windows MAX_PATH issues
    cache_dir = Path.home() / ".cache" / "autodiag_models"
    print(f"[AutoDiag RAG] Loading embedding model 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'...")
    model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2", cache_folder=str(cache_dir))

    corpus_texts = []
    metadata = []

    for doc in documents:
        content = doc.get("content", "").strip()
        if not content:
            continue

        corpus_texts.append(content)
        metadata.append({
            "doc_id": doc.get("doc_id"),
            "doc_type": doc.get("doc_type"),
            "fault_code": doc.get("fault_code"),
            "title": doc.get("title"),
            "content": content,
            "source_id": doc.get("source_id"),
            "source_name": doc.get("source_name"),
            "license": doc.get("license"),
            "version": doc.get("version"),
            "metadata": doc.get("metadata", {})
        })

    print(f"[AutoDiag RAG] Encoding {len(corpus_texts)} technical documents...")
    embeddings = model.encode(
        corpus_texts,
        convert_to_numpy=True,
        show_progress_bar=True,
        normalize_embeddings=True
    )

    dim = embeddings.shape[1]
    print(f"[AutoDiag RAG] Creating FAISS IndexFlatIP (dim={dim})...")
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings.astype(np.float32))

    index_path = index_dir / "tech_docs.index"
    meta_path = index_dir / "tech_docs_meta.json"

    faiss.write_index(index, str(index_path))
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, ensure_ascii=False, indent=2)

    print(f"[AutoDiag RAG] Technical RAG index successfully built!")
    print(f"  - FAISS index saved to: {index_path} ({index.ntotal} vectors)")
    print(f"  - Metadata saved to: {meta_path}")

if __name__ == "__main__":
    build_rag_index()
