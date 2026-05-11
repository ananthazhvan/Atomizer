TOOL_DEFINITIONS = [
    {
        "name": "lookup_order",
        "description": "Look up an order by its ID. Returns order status, items, total, and delivery estimate.",
        "input_schema": {
            "type": "object",
            "properties": {
                "order_id": {
                    "type": "string",
                    "description": "The order ID to look up (e.g. ORD-12345)",
                }
            },
            "required": ["order_id"],
        },
    },
    {
        "name": "check_stock",
        "description": "Check current inventory stock level for a product by name.",
        "input_schema": {
            "type": "object",
            "properties": {
                "product_name": {
                    "type": "string",
                    "description": "The product name to check stock for",
                }
            },
            "required": ["product_name"],
        },
    },
    {
        "name": "create_support_ticket",
        "description": "Create a support ticket for the customer. Returns the ticket ID and status.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Brief title of the issue",
                },
                "description": {
                    "type": "string",
                    "description": "Detailed description of the problem",
                },
            },
            "required": ["title", "description"],
        },
    },
    {
        "name": "calculate_shipping",
        "description": "Calculate shipping cost and delivery time for a given destination ZIP/postal code.",
        "input_schema": {
            "type": "object",
            "properties": {
                "zip_code": {
                    "type": "string",
                    "description": "Destination ZIP or postal code",
                },
                "weight_kg": {
                    "type": "number",
                    "description": "Package weight in kilograms (default 1.0)",
                },
            },
            "required": ["zip_code"],
        },
    },
    {
        "name": "get_account_status",
        "description": "Retrieve account details including subscription tier, billing status, and account standing for a customer email.",
        "input_schema": {
            "type": "object",
            "properties": {
                "email": {
                    "type": "string",
                    "description": "Customer email address",
                },
            },
            "required": ["email"],
        },
    },
]
