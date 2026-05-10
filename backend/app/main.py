from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import chat, knowledge, projects, analytics
from app.database import init_db

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


@app.on_event("startup")
async def on_startup():
    await init_db()


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}
