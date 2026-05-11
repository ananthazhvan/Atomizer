from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.routes import chat, knowledge, projects, analytics, integrations, whatsapp
from app.database import init_db, async_session, Project

app = FastAPI(title="Atomizer", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api")
app.include_router(knowledge.router, prefix="/api")
app.include_router(projects.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(integrations.router, prefix="/api")
app.include_router(whatsapp.router, prefix="/api")


@app.on_event("startup")
async def on_startup():
    await init_db()

    # Seed demo project
    async with async_session() as db:
        result = await db.execute(select(Project).where(Project.id == "demo"))
        if not result.scalars().first():
            db.add(Project(
                id="demo",
                name="CloudSync Demo",
                description="Sample project demonstrating Atomizer's multi-agent customer service platform.",
                business_domain="SaaS — Cloud Storage & Sync",
                settings={
                    "business_name": "CloudSync",
                    "industry": "SaaS",
                    "agent_toggles": {
                        "sales": True,
                        "support": True,
                        "customer_care": True,
                    },
                    "model": "deepseek-chat",
                    "temperature": 0.3,
                },
            ))
            await db.commit()


@app.get("/")
async def root():
    return {
        "name": "Atomizer API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/api/health",
    }


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
