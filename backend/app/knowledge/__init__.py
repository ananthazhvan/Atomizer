import chromadb
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2

from app.config import CHROMA_PERSIST_DIR

_client = None
_ef = None


def _get_client():
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
    return _client


def _get_ef():
    global _ef
    if _ef is None:
        _ef = ONNXMiniLM_L6_V2()
    return _ef


def get_collection(project_id: str):
    client = _get_client()
    return client.get_or_create_collection(
        name=f"project_{project_id}",
        embedding_function=_get_ef(),
    )
