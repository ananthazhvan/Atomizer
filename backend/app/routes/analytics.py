from fastapi import APIRouter

router = APIRouter(tags=["analytics"])


@router.get("/analytics/overview")
async def analytics_overview():
    pass


@router.get("/analytics/agent-breakdown")
async def agent_breakdown():
    pass
