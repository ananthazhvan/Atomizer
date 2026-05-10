from fastapi import APIRouter

router = APIRouter(tags=["projects"])


@router.post("/projects")
async def create_project():
    pass


@router.get("/projects")
async def list_projects():
    pass


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    pass
