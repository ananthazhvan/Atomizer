import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db, Project
from app.models import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(tags=["projects"])


@router.post("/projects", response_model=ProjectResponse)
async def create_project(body: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(
        id=str(uuid.uuid4()),
        name=body.name,
        description=body.description,
        business_domain=body.business_domain,
        created_at=datetime.utcnow(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).order_by(Project.created_at.desc()))
    return result.scalars().all()


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.patch("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, body: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalars().first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if body.name is not None:
        project.name = body.name
    if body.description is not None:
        project.description = body.description
    if body.business_domain is not None:
        project.business_domain = body.business_domain
    if body.settings is not None:
        project.settings = body.settings

    await db.commit()
    await db.refresh(project)
    return project
