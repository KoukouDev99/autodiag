"""
Script to download local models for AutoDiag AI layer.
Downloads sentence-transformers 'paraphrase-multilingual-MiniLM-L12-v2'
and sets up directories for GGUF LLMs.
"""
import os
import sys
from pathlib import Path

def download_embedding_model(model_name: str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"):
    print(f"[AutoDiag AI] Downloading / caching embedding model: {model_name}...")
    from sentence_transformers import SentenceTransformer
    
    # Use standard short user cache directory to avoid Windows MAX_PATH (260 char) limit
    cache_dir = Path.home() / ".cache" / "autodiag_models"
    cache_dir.mkdir(parents=True, exist_ok=True)
    
    model = SentenceTransformer(model_name, cache_folder=str(cache_dir))
    print(f"[AutoDiag AI] Successfully loaded & cached {model_name}")
    print(f"[AutoDiag AI] Embedding dimension: {model.get_sentence_embedding_dimension()}")
    return model

def setup_llm_directory():
    models_dir = Path(__file__).resolve().parent.parent / "models" / "llm"
    models_dir.mkdir(parents=True, exist_ok=True)
    readme = models_dir / "README.md"
    if not readme.exists():
        with open(readme, "w", encoding="utf-8") as f:
            f.write(
                "# Qwen2.5-3B-Instruct GGUF\n\n"
                "Place `qwen2.5-3b-instruct-q4_k_m.gguf` in this directory.\n"
                "Direct download URL:\n"
                "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf\n"
            )
    print(f"[AutoDiag AI] LLM directory ready: {models_dir}")

if __name__ == "__main__":
    download_embedding_model()
    setup_llm_directory()
    print("[AutoDiag AI] Model download and setup complete.")
