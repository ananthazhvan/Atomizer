import json
from datetime import datetime, timedelta
from enum import Enum


class ConnectionStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"


class FlowZintConnector:
    """FlowZint integration surface for Atomizer.

    Defines how Atomizer plugs into FlowZint's ecosystem:
    - Project Vault: pull client documents into the knowledge base
    - WhatsApp Onboarding: receive client messages via FlowZint's WhatsApp pipeline
    - Client Dashboard: embed the Atomizer chat widget in FlowZint's client portal

    In production these would call FlowZint's actual API endpoints.
    """

    def __init__(self):
        self._connection = {
            "status": ConnectionStatus.CONNECTED,
            "endpoint": "https://api.flowzint.com/v1",
            "workspace_id": "fz_ws_demo",
            "connected_since": (datetime.utcnow() - timedelta(days=14)).isoformat(),
        }
        self._last_sync = datetime.utcnow() - timedelta(minutes=7)
        self._sync_logs = [
            {
                "id": "sync_001",
                "type": "project_vault",
                "status": "success",
                "documents_synced": 12,
                "timestamp": (datetime.utcnow() - timedelta(minutes=5)).isoformat(),
            },
            {
                "id": "sync_002",
                "type": "client_roster",
                "status": "success",
                "records_imported": 48,
                "timestamp": (datetime.utcnow() - timedelta(hours=1)).isoformat(),
            },
            {
                "id": "sync_003",
                "type": "whatsapp_template",
                "status": "success",
                "templates_synced": 3,
                "timestamp": (datetime.utcnow() - timedelta(hours=6)).isoformat(),
            },
            {
                "id": "sync_004",
                "type": "project_vault",
                "status": "partial",
                "documents_synced": 9,
                "error": "2 documents exceeded size limit",
                "timestamp": (datetime.utcnow() - timedelta(days=1)).isoformat(),
            },
            {
                "id": "sync_005",
                "type": "client_roster",
                "status": "success",
                "records_imported": 52,
                "timestamp": (datetime.utcnow() - timedelta(days=1, hours=2)).isoformat(),
            },
        ]

    def get_status(self) -> dict:
        return {
            **self._connection,
            "last_sync": self._last_sync.isoformat(),
            "capabilities": self._get_capabilities(),
        }

    def get_sync_logs(self, limit: int = 20) -> list[dict]:
        return self._sync_logs[:limit]

    def _get_capabilities(self) -> list[dict]:
        return [
            {
                "id": "project_vault",
                "name": "Project Vault Sync",
                "description": "Pull client documents, contracts, and briefs from FlowZint Project Vault into Atomizer's knowledge base for RAG-powered agent responses.",
                "status": "active",
                "sync_frequency": "Every 15 minutes",
            },
            {
                "id": "whatsapp_onboarding",
                "name": "WhatsApp Client Onboarding",
                "description": "Receive new client messages from FlowZint's WhatsApp onboarding flow and route them through Atomizer's multi-agent pipeline.",
                "status": "active",
                "webhook": "/api/whatsapp/webhook",
            },
            {
                "id": "client_dashboard",
                "name": "Client Dashboard Embed",
                "description": "Embed the Atomizer chat widget in FlowZint's client dashboard. Each FlowZint client gets a dedicated Atomizer session tied to their project.",
                "status": "active",
                "embed_method": "JavaScript snippet",
            },
            {
                "id": "analytics_export",
                "name": "Analytics Export",
                "description": "Push Atomizer conversation analytics back to FlowZint's reporting dashboard for unified business intelligence.",
                "status": "configured",
                "sync_frequency": "Hourly",
            },
        ]


# Singleton instance
connector = FlowZintConnector()
