from fastapi import APIRouter

router = APIRouter(tags=["knowledge"])


@router.post("/knowledge/upload")
async def upload_knowledge():
    pass


@router.get("/knowledge/list")
async def list_knowledge():
    pass
