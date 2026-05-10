# Atomizer — Implementation Plan (Prototype)

---

## 1. OVERVIEW & PIPELINE

### What We're Actually Building

A business gets bombarded with customer messages — some want to buy things (sales), some need help (support), some are angry (customer care). Right now, a human reads each message and figures out who should handle it.

Atomizer automates this with **3 specialized AI agents behind a smart router**:

```
Customer Message → Router Agent (classifies intent) → Sales / Support / CustomerCare Agent → Response
                                                              ↓
                                                     Knowledge Base (RAG)
                                                              ↓
                                                     Dashboard (see everything)
```

### The Pipeline (Visual)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   CHAT       │ --> │   ROUTER     │ --> │  SPECIALIST  │ --> │   RESPONSE   │
│   WIDGET     │     │   AGENT      │     │   AGENT      │     │   TO USER    │
│  (Next.js)   │     │ (Classifier) │     │ (Sales/Supp/ │     │              │
│              │     │              │     │  Care)       │     │              │
└──────────────┘     └──────────────┘     └──────┬───────┘     └──────────────┘
                                                 │
                                                 ▼
                                        ┌──────────────┐
                                        │  KNOWLEDGE   │
                                        │  BASE (RAG)  │
                                        │  ChromaDB    │
                                        └──────────────┘
```

### Tech Stack (Minimal)

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | Next.js + Tailwind + shadcn/ui | Fast UI with prebuilt components |
| Backend | Python FastAPI | Clean, async, perfect for AI |
| Database | SQLite (dev) / PostgreSQL (prod) | Zero setup for SQLite, swap later |
| Vector DB | ChromaDB | In-memory, no separate server needed |
| AI | Claude API (single model, different system prompts) | One API key, multiple "agents" |
| Deploy | Docker Compose | One command to run everything |

### Why This is Simpler

- **Cut**: WhatsApp, voice, email, Redis, multi-language, A/B testing, workflow builder, self-improving prompts
- **Kept**: Multi-agent routing, RAG knowledge base, working dashboard, chat widget, analytics, Docker
- **Result**: ~60% of the code for ~90% of the wow factor

---

## 2. PROJECT STRUCTURE

```
Atomizer/
├── docker-compose.yml
├── .env.example
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── app/
│   │   ├── main.py                    # FastAPI entry point
│   │   ├── config.py                  # Settings from env
│   │   ├── database.py                # SQLite/Postgres setup
│   │   ├── models.py                  # Pydantic models
│   │   │
│   │   ├── agents/
│   │   │   ├── __init__.py
│   │   │   ├── router.py              # Intent classifier
│   │   │   ├── sales.py               # Sales specialist
│   │   │   ├── support.py             # Support specialist
│   │   │   ├── care.py                # Customer care specialist
│   │   │   └── base.py                # Shared agent logic
│   │   │
│   │   ├── knowledge/
│   │   │   ├── __init__.py
│   │   │   ├── upload.py              # File upload + chunking
│   │   │   ├── embed.py               # Embedding generation
│   │   │   └── retrieve.py            # Similarity search
│   │   │
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── chat.py                # POST /api/chat
│   │       ├── knowledge.py           # Upload + list knowledge
│   │       ├── projects.py            # CRUD projects
│   │       └── analytics.py           # GET stats
│   │
│   └── tests/
│       └── test_chat.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.ts
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                   # Landing page
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # Admin dashboard
│   │   │   ├── analytics/
│   │   │   │   └── page.tsx           # Analytics page
│   │   │   ├── knowledge/
│   │   │   │   └── page.tsx           # Knowledge base management
│   │   │   └── settings/
│   │   │       └── page.tsx           # Agent configuration
│   │   └── widget/
│   │       └── page.tsx               # Chat widget demo
│   └── components/
│       ├── ChatWidget.tsx             # Embeddable chat component
│       ├── ChatMessage.tsx            # Single message bubble
│       ├── DashboardNav.tsx           # Sidebar navigation
│       ├── StatCard.tsx               # Metric display card
│       └── AgentBadge.tsx             # Shows which agent responded
│
└── docs/
    └── architecture.md
```

---

## 3. STEP-BY-STEP BUILD ORDER

### PHASE 0: Environment Setup (30 min)

**What**: Get everything installed and running.

```bash
# Step 1: Create project
mkdir -p ~/Projects/Atomizer && cd ~/Projects/Atomizer
git init && git checkout -b main

# Step 2: Get an Anthropic API key
# Go to https://console.anthropic.com/ → Create API Key → Copy it
# You'll need to add credits (~$20 is plenty for this project)

# Step 3: Create .env file
cat > .env << 'EOF'
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
DATABASE_URL=sqlite:///./atomizer.db
CHROMA_PERSIST_DIR=./chroma_data
EOF

# Step 4: Create .env.example
cat > .env.example << 'EOF'
ANTHROPIC_API_KEY=your-api-key-here
DATABASE_URL=sqlite:///./atomizer.db
CHROMA_PERSIST_DIR=./chroma_data
EOF
```

---

### PHASE 1: Backend Skeleton (Day 1, ~3 hours)

**Goal**: FastAPI running with health check, database, and models.

#### Step 1.1: Create backend structure

Prompt Claude Code:
```
Create a FastAPI backend skeleton for a multi-agent chat platform called Atomizer.

Create these files:

1. backend/requirements.txt with:
   - fastapi
   - uvicorn[standard]
   - sqlalchemy
   - chromadb
   - anthropic
   - python-multipart
   - pypdf2
   - python-dotenv
   - pydantic
   - aiosqlite

2. backend/app/config.py that reads ANTHROPIC_API_KEY and DATABASE_URL from env

3. backend/app/database.py that sets up SQLAlchemy with SQLite (async)

4. backend/app/models.py with these Pydantic models:
   - ProjectCreate(name, description, business_domain)
   - ProjectResponse(id, name, description, business_domain, created_at)
   - ChatRequest(project_id, message, session_id)
   - ChatResponse(response, agent_type, confidence)
   - KnowledgeUpload(title, project_id)

5. backend/app/main.py with:
   - CORS middleware (allow all origins for dev)
   - Health check at GET /api/health returning {"status": "ok", "version": "0.1.0"}
   - Include routers for chat, knowledge, projects, analytics (just stubs for now)

Make each file minimal. No comments. Just working code.
```

#### Step 1.2: Test it

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# Visit http://localhost:8000/api/health → should return {"status":"ok"}
```

---

### PHASE 2: The Brain — Multi-Agent System (Day 2-3, ~6 hours)

**Goal**: Router + 3 specialist agents working. This is THE core differentiator.

#### Step 2.1: Base Agent Class

Prompt Claude Code:
```
Create backend/app/agents/base.py - a base class for all AI agents.

class BaseAgent:
    - __init__(self, client: anthropic.AsyncAnthropic, system_prompt: str, model: str = "claude-sonnet-4-6")
    - async def run(self, user_message: str, conversation_history: list[dict], knowledge_context: str = "") -> dict
        Returns {"response": str, "confidence": float, "reasoning": str}
    
    The run() method should:
    1. Format messages with system prompt, optional knowledge context, and conversation history
    2. Call Claude API with temperature=0.3
    3. Parse the response to extract response text and confidence
    4. Return the structured dict
    
    Use the anthropic.AsyncAnthropic client. Handle errors gracefully.
```

#### Step 2.2: Router Agent

Prompt Claude Code:
```
Create backend/app/agents/router.py with a RouterAgent that extends BaseAgent.

System prompt should classify messages into: SALES, SUPPORT, CUSTOMER_CARE, GENERAL

Include these few-shot examples in the prompt:
- "How much does the enterprise plan cost?" → SALES
- "My app keeps crashing when I upload photos" → SUPPORT
- "I want a refund for my purchase last week" → CUSTOMER_CARE
- "Hello, how are you?" → GENERAL

The Router should return JSON: {"category": "SALES", "confidence": 0.95, "reasoning": "..."}

Create a standalone test at the bottom of the file (if __name__ == "__main__") that 
tests classification of 3 sample messages.
```

#### Step 2.3: Specialist Agents

Prompt Claude Code (run 3 times, once per agent — or once with all 3):

```
Create 3 specialist agent files in backend/app/agents/:
- sales.py (SalesAgent)
- support.py (SupportAgent)  
- care.py (CustomerCareAgent)

Each extends BaseAgent. Their system prompts should make them behave as:

SALES AGENT:
- You are a skilled sales representative for a business
- Help customers understand products, pricing, and features
- Qualify leads by asking about needs and budget
- Suggest appropriate products based on customer requirements
- Be persuasive but not pushy
- End responses with a subtle call to action

SUPPORT AGENT:
- You are a technical support specialist
- Diagnose problems methodically using decision-tree logic
- Ask clarifying questions when the issue is vague
- Provide step-by-step solutions
- If you cannot solve it, clearly state what needs human escalation
- Be patient and thorough

CUSTOMER CARE AGENT:
- You are a customer care representative
- Handle complaints, refunds, account issues, and feedback
- Always acknowledge the customer's frustration first
- Be empathetic but professional
- Offer concrete resolutions, not just apologies
- Know when to escalate to a manager

Each agent should also accept an optional "knowledge_context" parameter
that gets prepended to their system prompt for RAG integration.
```

#### Step 2.4: Wire It Together — The Chat Endpoint

Prompt Claude Code:
```
Create backend/app/routes/chat.py with the main chat endpoint.

POST /api/chat
Body: {"project_id": str, "message": str, "session_id": str}
Response: {"response": str, "agent_type": str, "confidence": float}

Flow:
1. Receive message
2. Create RouterAgent and classify intent
3. Based on category, create the right specialist agent (SalesAgent/SupportAgent/CustomerCareAgent)
4. Retrieve relevant knowledge from ChromaDB (if any documents exist for this project)
5. Run the specialist agent with the message + knowledge context
6. Store the conversation in SQLite
7. Return the response with agent_type and confidence

Also store session_id so conversations persist across messages.
Use the database.py SQLAlchemy session for storage.

For now, if ChromaDB is empty, pass empty knowledge_context. Don't fail.
```

#### Step 2.5: Test the Pipeline

```bash
# Terminal 1: Start backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2: Test with curl
curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test","message":"How much does your premium plan cost?","session_id":"123"}'
# Should return agent_type: "SALES" with a sales response

curl -X POST http://localhost:8000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"project_id":"test","message":"The app crashes when I click save. Help!","session_id":"123"}'
# Should return agent_type: "SUPPORT" with a troubleshooting response
```

---

### PHASE 3: Knowledge Base / RAG (Day 4, ~3 hours)

**Goal**: Upload documents, chunk them, store embeddings, retrieve relevant context.

Prompt Claude Code:
```
Build a RAG knowledge system in backend/app/knowledge/

1. upload.py:
   - async function process_document(file: UploadFile, project_id: str) -> int
   - Accepts PDF and TXT files
   - For PDF: use PyPDF2 to extract text
   - For TXT: read directly
   - Split text into chunks of ~500 characters with 100 char overlap
   - Return list of text chunks

2. embed.py:
   - Uses Claude API for embeddings (no separate embedding service needed)
   - Actually, use a simpler approach: we'll use keyword + semantic search via ChromaDB's built-in embedding
   - async function embed_and_store(chunks: list[str], project_id: str, doc_title: str)
   - Store in ChromaDB collection named f"project_{project_id}"
   - Each chunk gets metadata: {"title": doc_title, "chunk_index": i}

3. retrieve.py:
   - async function retrieve_context(query: str, project_id: str, top_k: int = 3) -> str
   - Query ChromaDB for top_k most relevant chunks
   - Concatenate them into a single context string
   - Return the context string (or "" if no documents found)

4. Routes in backend/app/routes/knowledge.py:
   - POST /api/knowledge/upload - accepts file + project_id, returns {"chunks_stored": int}
   - GET /api/knowledge/list?project_id=X - returns list of document titles
   
Wire this into the chat route so retrieve_context() is called before the specialist agent runs.
```

---

### PHASE 4: Frontend — Admin Dashboard (Day 5, ~4 hours)

**Goal**: A professional-looking admin panel where a "business owner" manages their AI system.

#### Step 4.1: Initialize Next.js

Prompt Claude Code:
```
Create a Next.js 14 frontend with:
- TypeScript
- Tailwind CSS
- shadcn/ui components

Run: npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir=false

Then install and initialize shadcn/ui:
- npx shadcn-ui@latest init (defaults, slate theme)
- Add components: button, card, input, textarea, dialog, select, tabs, badge, separator, scroll-area

Create a layout at frontend/app/layout.tsx with:
- Inter font from next/font/google
- Dark sidebar navigation
- Professional dark theme using Tailwind (slate/gray palette)
```

#### Step 4.2: Dashboard Page

Prompt Claude Code:
```
Create frontend/app/dashboard/page.tsx - the main admin dashboard.

Layout:
- Left: Sidebar with links (Overview, Analytics, Knowledge Base, Settings, Chat Widget)
- Right: Main content area

The page should show:
1. Header: "Atomizer Dashboard" with project name
2. 4 StatCards in a grid:
   - Total Conversations (with up/down trend indicator)
   - Avg Response Time
   - Resolution Rate (%)
   - Active Sessions
   (Use mock data for now - we'll wire the API later)

3. Recent Conversations table showing:
   - Customer message (truncated to 80 chars)
   - Which agent responded (color-coded badge: Sales=blue, Support=green, Care=orange)
   - Time
   - Status (Resolved/Pending/Escalated)

Use shadcn/ui Card components. Make it look like a real SaaS product.
Load data from the FastAPI backend (use fetch in useEffect for now, fall back to mock data).
```

#### Step 4.3: Chat Widget Demo Page

Prompt Claude Code:
```
Create frontend/components/ChatWidget.tsx - an embeddable chat bubble:

- A floating circular button (bottom-right) with a chat icon
- Clicking opens a chat panel (360px wide, 500px tall)
- Shows "Atomizer AI" header with online status indicator
- Messages appear as bubbles (user=right/blue, ai=left/gray)
- Agent type shown as a small badge under each AI message
- Input field with send button at the bottom
- Auto-scrolls to latest message
- Typing indicator (animated dots) while waiting for response
- Session persists in localStorage

Create frontend/app/widget/page.tsx that showcases the ChatWidget on a fake 
business website (make it look like a real company page with a hero section, 
features, and pricing table in the background).

The chat widget should POST to http://localhost:8000/api/chat
```

#### Step 4.4: Knowledge Base Management Page

Prompt Claude Code:
```
Create frontend/app/dashboard/knowledge/page.tsx:

- File upload zone (drag & drop or click to browse)
- Accept PDF and TXT files
- Show upload progress
- List of uploaded documents with:
  - Title
  - Upload date
  - Number of chunks
  - Delete button
- Upload triggers POST to /api/knowledge/upload
- List fetched from GET /api/knowledge/list

Use shadcn/ui components. Make the upload area look polished with dashed border 
and an icon. Great UX here = high documentation score.
```

#### Step 4.5: Analytics Page

Prompt Claude Code:
```
Create frontend/app/dashboard/analytics/page.tsx:

1. Time range selector (7d, 30d, All time) using shadcn Tabs
2. Two charts using a charting library (use recharts):
   - Line chart: Conversations over time
   - Pie chart: Distribution by agent type (Sales/Support/Care)
3. Table: Agent performance breakdown
   - Agent Type | Total Conversations | Avg Confidence | Resolution Rate

Install recharts: npm install recharts

Fetch from:
- GET /api/analytics/overview?period=7d
- GET /api/analytics/agent-breakdown?period=7d

Backend: Create backend/app/routes/analytics.py with these endpoints.
Return real data from the SQLite conversations table.
```

---

### PHASE 5: Backend Routes — Complete the API (Day 6, ~3 hours)

**Goal**: All API endpoints working with real data.

Prompt Claude Code:
```
Complete the backend API routes:

1. backend/app/routes/projects.py:
   - POST /api/projects - create project
   - GET /api/projects - list projects
   - GET /api/projects/{id} - get project details

2. backend/app/routes/analytics.py:
   - GET /api/analytics/overview?project_id=X&period=7d
     Returns: total_conversations, avg_response_time, resolution_rate, active_sessions
   - GET /api/analytics/agent-breakdown?project_id=X&period=7d
     Returns: [{agent_type, count, avg_confidence, resolution_rate}]
   - GET /api/analytics/conversations?project_id=X&limit=20
     Returns: list of recent conversations with agent_type, message preview, status

3. Add proper SQLAlchemy models for:
   - Project: id, name, description, business_domain, created_at
   - Conversation: id, project_id, session_id, status, created_at, updated_at
   - Message: id, conversation_id, role (user/assistant), content, agent_type, confidence, created_at

4. Create database tables on startup (use SQLAlchemy create_all)

All analytics should query real data from SQLite.
```

---

### PHASE 6: Wiring — Connect Frontend to Backend (Day 7, ~3 hours)

**Goal**: Everything connected. Real data flowing.

Prompt Claude Code:
```
The frontend currently uses mock data. Wire it up to the real backend:

1. Create frontend/lib/api.ts with a helper:
   const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
   
   Export functions:
   - chat(projectId, message, sessionId) → ChatResponse
   - uploadKnowledge(file, projectId) → {chunks_stored}
   - listKnowledge(projectId) → Document[]
   - getAnalytics(projectId, period) → AnalyticsOverview
   - getAgentBreakdown(projectId, period) → AgentBreakdown[]
   - getProjects() → Project[]
   - createProject(data) → Project

2. Update ChatWidget.tsx to call the real API
3. Update dashboard/page.tsx to fetch real stats
4. Update analytics/page.tsx to fetch real analytics
5. Update knowledge/page.tsx to use real upload/list endpoints
6. Generate unique session IDs in the chat widget (uuid or nanoid)

Add loading states (skeleton cards) and error states (toast notifications) everywhere.
Install and use sonner for toast notifications: npm install sonner
```

---

### PHASE 7: Docker & Polish (Day 8, ~3 hours)

**Goal**: One command to run the whole thing. Fix rough edges.

#### Step 7.1: Docker Compose

Prompt Claude Code:
```
Create docker-compose.yml at the project root:

services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    environment from .env
    volumes: ["./chroma_data:/app/chroma_data", "./backend:/app"]
    
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment: [NEXT_PUBLIC_API_URL=http://localhost:8000]
    depends_on: [backend]

Create Dockerfiles for both services.
Backend Dockerfile: python:3.11-slim, install requirements, run uvicorn
Frontend Dockerfile: node:20-alpine, install deps, run next dev

Make sure docker-compose up starts everything.
```

#### Step 7.2: Polish Checklist

Go through each Claude Code prompt:

```
Fix all rough edges:

1. Empty states: Show helpful messages when no data exists ("No conversations yet. 
   Add the chat widget to your website to get started!")

2. Error handling: All API calls should catch errors and show toast notifications

3. Loading states: Every data fetch should show skeleton loaders, not blank screens

4. Mobile responsive: Dashboard and widget should work on mobile

5. Keyboard shortcuts: Enter to send chat, Escape to close widget

6. Dark mode only (consistent professional look, simpler to build)

7. Add a "Create Project" flow to the dashboard home page

8. The chat widget should show the project name in the header
```

---

### PHASE 8: Documentation & Demo (Day 9-10, ~4 hours)

**Goal**: The 20% of score that most teams ignore.

#### Step 8.1: README.md

Prompt Claude Code:
```
Write a professional README.md for a hackathon project called Atomizer.

Structure:
1. Project logo/title + one-line tagline
2. Badges (Python, Next.js, FastAPI, Docker, Anthropic)
3. Problem statement (2-3 sentences)
4. Architecture diagram (Mermaid)
5. Features list (bullet points with emoji icons)
6. Quick Start (3 commands to run: git clone, cp .env.example .env, docker-compose up)
7. Screenshots section (placeholders for now - we'll add real screenshots)
8. How It Works (explain router → specialist agent flow)
9. Tech Stack table
10. API Reference (link to /docs)
11. Project Structure (simplified tree)
12. Evaluation Criteria Alignment (how we score on each metric)
13. Team section
```

#### Step 8.2: Demo Video Script

Write a tight 4-minute script structure (put this in docs/demo-script.md):

```
0:00-0:20 - HOOK
"I run a business with 50 customer messages a day. Half are sales inquiries, 
30% are support issues, 20% are complaints. One person can't handle all three 
well. Here's what I built."

0:20-1:00 - ADMIN SETUP (screen recording)
Show: Create project → Upload knowledge document (a fake product catalog PDF) → 
Dashboard shows "Knowledge Base: 1 document, 24 chunks"

1:00-2:00 - CHAT DEMO (screen recording)
Show widget on fake business site:
- Sales query: "What's the difference between your basic and pro plans?" → 
  SalesAgent responds with comparison (uses knowledge base)
- Support query: "The export button isn't working" → 
  SupportAgent asks diagnostic questions
- Complaint: "I was charged twice this month" → 
  CareAgent acknowledges, offers resolution
- Show the agent badge changing colors (SALES=blue, SUPPORT=green, CARE=orange)

2:00-2:45 - ANALYTICS (screen recording)
Show dashboard analytics: conversation trends, agent breakdown pie chart, 
resolution rates. "Business owners can see exactly what customers need."

2:45-3:30 - TECHNICAL DEEP DIVE (architecture diagram on screen)
"Mermaid diagram on screen." Explain router classification → specialist routing → 
RAG retrieval → response generation. Show the code structure on GitHub.

3:30-4:00 - CLOSE
"Atomizer: Three agents, one platform, every customer conversation handled 
intelligently. Built with FastAPI, Next.js, and Claude. Docker-compose up to run."
```

#### Step 8.3: Record & Submit

1. Record screen with OBS Studio (free) or Loom
2. Upload to YouTube (unlisted)
3. Push everything to public GitHub
4. Add the demo video link to README
5. Submit via the FlowZint portal at flowzint.in/2026/ai/hackothon/

---

## 4. COMPLEXITY MAP

| What We Cut | Why | What We Kept | Why It Matters |
|-------------|-----|-------------|----------------|
| WhatsApp API | Needs business verification, webhook setup | Chat Widget | Same demo value, zero setup |
| Voice Processing | Adds Whisper dependency, ffmpeg | RAG Knowledge Base | Shows AI sophistication |
| Redis | Separate server, config | In-memory session | SQLite handles our scale |
| Multi-language | Adds translation layer + testing burden | Single language (English) | Judges evaluate in English |
| Workflow Builder | Drag-and-drop is complex frontend work | Agent Configuration page | Shows the concept |
| Self-Improving Prompts | Complex feedback loop | Analytics Dashboard | Shows response quality data |
| PostgreSQL | Separate Docker service | SQLite | Zero config, swap later |
| Email Integration | SMTP config, templates | — | Not core to demo |
| A/B Testing | Complex routing logic | — | Not visible in demo |
| Plugin System | Premature abstraction | — | Not needed for prototype |

## 5. TIME BUDGET

| Phase | Hours | Cumulative |
|-------|-------|------------|
| Phase 0: Setup | 0.5 | 0.5 |
| Phase 1: Backend Skeleton | 3 | 3.5 |
| Phase 2: Multi-Agent System | 6 | 9.5 |
| Phase 3: RAG Knowledge Base | 3 | 12.5 |
| Phase 4: Frontend Dashboard | 4 | 16.5 |
| Phase 5: Backend Routes | 3 | 19.5 |
| Phase 6: Frontend-Backend Wiring | 3 | 22.5 |
| Phase 7: Docker & Polish | 3 | 25.5 |
| Phase 8: Docs & Demo | 4 | 29.5 |

**Total: ~30 hours over 10 days.** You have ~24 days until July 4 deadline. That's generous buffer.

---

## 6. FIRST 10 MINUTES — START HERE

```bash
# Copy-paste this entire block into your terminal
mkdir -p ~/Projects/Atomizer && cd ~/Projects/Atomizer
git init && git checkout -b main

cat > .env << 'EOF'
ANTHROPIC_API_KEY=your-key-here
DATABASE_URL=sqlite:///./atomizer.db
CHROMA_PERSIST_DIR=./chroma_data
EOF

mkdir -p backend/app/{agents,knowledge,routes} frontend docs
echo "Atomizer initialized. Now start Phase 1 with Claude Code."
```

Then open Claude Code in this directory and paste the Phase 1 prompt.
