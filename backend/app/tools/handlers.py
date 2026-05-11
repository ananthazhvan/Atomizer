import json
import random
from datetime import datetime, timedelta


async def _lookup_order(order_id: str) -> str:
    statuses = ["processing", "shipped", "delivered", "on_hold"]
    items = [
        {"name": "CloudSync Pro License", "qty": 1, "price": 299.00},
        {"name": "Premium Support Add-on", "qty": 1, "price": 99.00},
        {"name": "Data Migration Service", "qty": 2, "price": 149.00},
    ]
    picked = random.sample(items, k=random.randint(1, 3))
    total = sum(i["price"] * i["qty"] for i in picked)
    eta = datetime.utcnow() + timedelta(days=random.randint(1, 7))

    return json.dumps({
        "order_id": order_id,
        "status": random.choice(statuses),
        "items": picked,
        "total": round(total, 2),
        "currency": "USD",
        "ordered_at": (datetime.utcnow() - timedelta(days=random.randint(1, 30))).isoformat(),
        "estimated_delivery": eta.strftime("%Y-%m-%d"),
    })


async def _check_stock(product_name: str) -> str:
    inventory = {
        "cloudsync pro": {"in_stock": True, "quantity": 847, "warehouse": "Mumbai"},
        "cloudsync enterprise": {"in_stock": True, "quantity": 312, "warehouse": "Bangalore"},
        "premium support": {"in_stock": True, "quantity": 9999, "warehouse": "N/A (digital)"},
        "data migration": {"in_stock": True, "quantity": 9999, "warehouse": "N/A (service)"},
        "hardware token": {"in_stock": False, "quantity": 0, "warehouse": "Delhi"},
    }
    result = inventory.get(product_name.lower(), {
        "in_stock": True,
        "quantity": random.randint(50, 500),
        "warehouse": "Unknown",
    })
    result["product"] = product_name
    return json.dumps(result)


async def _create_support_ticket(title: str, description: str) -> str:
    ticket_id = f"TKT-{random.randint(10000, 99999)}"
    return json.dumps({
        "ticket_id": ticket_id,
        "title": title,
        "status": "open",
        "priority": "medium",
        "created_at": datetime.utcnow().isoformat(),
        "note": "A support agent will follow up within 4 business hours.",
    })


async def _calculate_shipping(zip_code: str, weight_kg: float = 1.0) -> str:
    base_cost = 5.99 if zip_code.startswith(("1", "2", "3", "4", "5")) else 12.99
    cost = round(base_cost + (weight_kg - 1.0) * 2.50, 2)
    days = 3 if zip_code.startswith(("1", "2", "3", "4", "5")) else 7
    return json.dumps({
        "zip_code": zip_code,
        "weight_kg": weight_kg,
        "shipping_cost": max(cost, 0.0),
        "currency": "USD",
        "estimated_days": days,
        "carrier": random.choice(["BlueDart", "Delhivery", "India Post"]),
    })


async def _get_account_status(email: str) -> str:
    tiers = ["Starter", "Professional", "Enterprise"]
    statuses = ["active", "past_due", "cancelled"]
    return json.dumps({
        "email": email,
        "subscription_tier": random.choice(tiers),
        "billing_status": random.choice(statuses),
        "account_standing": "good",
        "member_since": (datetime.utcnow() - timedelta(days=random.randint(30, 1095))).strftime("%Y-%m-%d"),
        "renewal_date": (datetime.utcnow() + timedelta(days=random.randint(15, 365))).strftime("%Y-%m-%d"),
    })


TOOL_HANDLERS = {
    "lookup_order": _lookup_order,
    "check_stock": _check_stock,
    "create_support_ticket": _create_support_ticket,
    "calculate_shipping": _calculate_shipping,
    "get_account_status": _get_account_status,
}
