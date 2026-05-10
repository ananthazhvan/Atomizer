from app.knowledge import get_collection


async def retrieve_context(query: str, project_id: str, top_k: int = 3) -> str:
    try:
        collection = get_collection(project_id)
    except Exception:
        return ""

    if collection.count() == 0:
        return ""

    results = collection.query(query_texts=[query], n_results=min(top_k, collection.count()))
    documents = results.get("documents", [[]])[0]

    if not documents:
        return ""

    return "\n\n---\n\n".join(documents)
