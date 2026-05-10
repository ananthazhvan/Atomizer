from app.knowledge import get_collection


async def embed_and_store(chunks: list[str], project_id: str, doc_title: str) -> int:
    collection = get_collection(project_id)

    existing = collection.get()
    start_index = len(existing["ids"]) if existing["ids"] else 0

    ids = [f"{doc_title}_{start_index + i}" for i in range(len(chunks))]
    metadatas = [
        {"title": doc_title, "chunk_index": start_index + i}
        for i in range(len(chunks))
    ]

    collection.add(ids=ids, documents=chunks, metadatas=metadatas)
    return len(chunks)
