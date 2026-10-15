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

def download_llm_model(
    repo_id: str = "Qwen/Qwen2.5-3B-Instruct-GGUF",
    filename: str = "qwen2.5-3b-instruct-q4_k_m.gguf"
):
    """Download Qwen2.5-3B-Instruct Q4_K_M GGUF model (~2.09 GB) from Hugging Face."""
    from huggingface_hub import hf_hub_download

    models_dir = Path(__file__).resolve().parent.parent / "models" / "llm"
    models_dir.mkdir(parents=True, exist_ok=True)
    target_path = models_dir / filename

    if target_path.exists() and target_path.stat().st_size > 1_500_000_000:
        print(f"[AutoDiag AI] LLM model already exists at: {target_path} ({round(target_path.stat().st_size / (1024*1024), 2)} MB)")
        return target_path

    print(f"[AutoDiag AI] Downloading LLM {filename} from {repo_id} (~2.09 GB)...")
    downloaded_path = hf_hub_download(
        repo_id=repo_id,
        filename=filename,
        local_dir=str(models_dir),
        local_dir_use_symlinks=False
    )
    print(f"[AutoDiag AI] LLM model downloaded successfully to: {downloaded_path}")
    return Path(downloaded_path)

if __name__ == "__main__":
    download_embedding_model()
    setup_llm_directory()
    if "--with-llm" in sys.argv:
        download_llm_model()
    print("[AutoDiag AI] Model download and setup complete.")
