from fastapi import APIRouter, Query

from app.integrations.flowzint import connector

router = APIRouter(tags=["integrations"])


@router.get("/integrations/flowzint/status")
async def flowzint_status():
    return connector.get_status()


@router.get("/integrations/flowzint/sync-logs")
async def flowzint_sync_logs(limit: int = Query(20, le=100)):
    return connector.get_sync_logs(limit)
