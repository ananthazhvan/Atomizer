from fastapi import APIRouter, UploadFile, File, Form
from app.knowledge.upload import process_document
from app.knowledge.embed import embed_and_store
from app.knowledge import get_collection

router = APIRouter(tags=["knowledge"])


@router.post("/knowledge/upload")
async def upload_knowledge(
    file: UploadFile = File(...),
    project_id: str = Form(...),
):
    try:
        chunks = await process_document(file, project_id)
        count = await embed_and_store(chunks, project_id, file.filename or "untitled")
        return {"chunks_stored": count}
    except ValueError as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.get("/knowledge/list")
async def list_knowledge(project_id: str):
    try:
        collection = get_collection(project_id)
    except Exception:
        return {"documents": []}

    items = collection.get()
    seen = set()
    docs = []
    for meta in (items.get("metadatas") or []):
        title = meta.get("title", "unknown")
        if title not in seen:
            seen.add(title)
            docs.append({"title": title})
    return {"documents": docs}
