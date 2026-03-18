# NLSpec: Customer Journey Mapper
# Version: 1.0
# Date: 2026-03-18
# Source: specs/INTERVIEW_customer_journey_mapper.md

---

## 1. Context

### 1.1 Problem Statement
Ecommerce owners lack a clear, structured view of every touchpoint their customers experience from first contact to post-purchase. They need an AI-generated, visual, ever-growing map of their customer journey built from their actual website content.

### 1.2 Prior Art
- `app/intelligence/page.tsx` — existing Intelligence dashboard. The journey mapper is a sub-feature of Intelligence.
- `utils/supabase/server.ts` and `utils/supabase/client.ts` — existing Supabase auth utilities. Use these patterns exactly.
- `app/api/` — no existing API routes. This feature introduces the first ones.

### 1.3 Scope

**IN scope:**
- Brand URL + description input form
- Website scraping (1 level deep, max 20 pages)
- AI-powered journey map generation (20+ nodes) via OpenRouter → `anthropic/claude-opus-4-5`
- Left-to-right visual map with clickable nodes
- Node detail panel: explanation paragraph + bulleted tactics list
- Real-time progress display during build (polling-based)
- 1 saved journey map per user account
- Add new AI-generated node (user describes the stage, AI generates content)
- Delete existing node
- Block new map creation if one already exists — user must delete first

**OUT of scope — do NOT implement:**
- Multiple journey maps per user
- Editing existing node content directly
- Export (PDF, image, shareable link)
- Social media scraping
- Any data source other than the brand URL
- User roles or team sharing

---

## 2. Architecture

### 2.1 New Files
```
app/intelligence/customer-journey/page.tsx
app/intelligence/customer-journey/JourneyInputForm.tsx
app/intelligence/customer-journey/JourneyProgress.tsx
app/intelligence/customer-journey/JourneyMapClient.tsx
app/intelligence/customer-journey/NodeDetailPanel.tsx

app/api/intelligence/journey/build/route.ts
app/api/intelligence/journey/route.ts
app/api/intelligence/journey/nodes/route.ts
app/api/intelligence/journey/nodes/[id]/route.ts
```

### 2.2 Modified Files
- `components/Sidebar.tsx` — add "Customer Journey" link under Intelligence section
- `app/page.tsx` — add Customer Journey card to Intelligence category
- `.env.local` — add `OPENROUTER_API_KEY`

### 2.3 Dependencies to Install
```
@xyflow/react        ← visual node graph (React Flow v12)
```
No other new dependencies.

### 2.4 Module Dependencies
- **Uses:** `utils/supabase/server.ts`, `utils/supabase/client.ts` (auth)
- **Uses:** OpenRouter API (external, via fetch — no SDK)
- **Does NOT use:** any other Intelligence modules

---

## 3. Data Model

### 3.1 Supabase Tables

#### `journey_maps`
| Field | Type | Constraints | Default | Notes |
|-------|------|-------------|---------|-------|
| id | uuid | PK, auto-generated | gen_random_uuid() | |
| user_id | uuid | NOT NULL, FK → auth.users.id, UNIQUE | — | UNIQUE enforces 1 map per user |
| url | text | NOT NULL | — | The brand URL submitted |
| description | text | NOT NULL | — | Brand description submitted |
| status | text | NOT NULL | 'building' | One of: building, complete, failed |
| progress_pct | integer | NOT NULL | 0 | 0–100 |
| progress_step | text | NULLABLE | null | Human-readable current step |
| created_at | timestamptz | NOT NULL | now() | |
| updated_at | timestamptz | NOT NULL | now() | |

#### `journey_nodes`
| Field | Type | Constraints | Default | Notes |
|-------|------|-------------|---------|-------|
| id | uuid | PK, auto-generated | gen_random_uuid() | |
| journey_map_id | uuid | NOT NULL, FK → journey_maps.id ON DELETE CASCADE | — | |
| title | text | NOT NULL | — | Stage name, e.g. "Social Media Discovery" |
| position | integer | NOT NULL | — | Order in left-to-right flow, 0-indexed |
| explanation | text | NOT NULL | — | 2–4 sentence explanation of this stage |
| tactics | jsonb | NOT NULL | '[]' | Array of strings — bulleted action items |
| created_at | timestamptz | NOT NULL | now() | |

### 3.2 RLS Policies (Supabase Row Level Security)
Both tables must have RLS enabled with these policies:

**journey_maps:**
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`
- DELETE: `auth.uid() = user_id`

**journey_nodes:**
- SELECT: `auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)`
- INSERT: `auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)`
- DELETE: `auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)`

### 3.3 SQL Migration
```sql
-- Run in Supabase SQL editor

CREATE TABLE journey_maps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'building'
    CHECK (status IN ('building', 'complete', 'failed')),
  progress_pct integer NOT NULL DEFAULT 0,
  progress_step text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE TABLE journey_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id uuid NOT NULL REFERENCES journey_maps(id) ON DELETE CASCADE,
  title text NOT NULL,
  position integer NOT NULL,
  explanation text NOT NULL,
  tactics jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journey_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their journey map" ON journey_maps
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their journey nodes" ON journey_nodes
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );
```

---

## 4. API Endpoints

### 4.1 POST `/api/intelligence/journey/build`
**Purpose:** Start building a new journey map. Scrapes website, calls AI, saves nodes to DB.
**Auth:** Supabase session cookie required. Return 401 if not authenticated.
**Request Body:**
```json
{ "url": "https://example.com", "description": "We sell premium dog food..." }
```
**Validation:**
- `url`: required, must be a valid URL (starts with http:// or https://)
- `description`: required, 10–2000 characters

**Pre-condition check:** If a `journey_maps` record already exists for this `user_id` (any status), return:
```json
{ "error": "A journey map already exists. Delete it before creating a new one." }
```
HTTP 409.

**On success:** Immediately insert a `journey_maps` record with `status = 'building'`, `progress_pct = 0`, return:
```json
{ "id": "<journey_map_id>" }
```
HTTP 202. Then execute the build pipeline (see Section 5.2) within the same request using a streaming `Response` — the client does NOT need to read the stream, it polls separately.

**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 400 | Invalid URL or description too short | `{ "error": "..." }` |
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 409 | Map already exists | `{ "error": "A journey map already exists. Delete it before creating a new one." }` |
| 500 | Build pipeline failed | Sets map status to 'failed' in DB |

**Note on execution time:** This endpoint may run for up to 5 minutes. On Vercel, set `export const maxDuration = 300` at the top of the route file.

---

### 4.2 GET `/api/intelligence/journey`
**Purpose:** Get the current user's journey map + all nodes.
**Auth:** Supabase session cookie required.
**Success Response (200):**
```json
{
  "map": {
    "id": "uuid",
    "url": "https://example.com",
    "description": "...",
    "status": "complete",
    "progress_pct": 100,
    "progress_step": null,
    "created_at": "..."
  },
  "nodes": [
    {
      "id": "uuid",
      "title": "Social Media Discovery",
      "position": 0,
      "explanation": "...",
      "tactics": ["Post 3x/week on Instagram", "Run retargeting ads"]
    }
  ]
}
```
Returns `{ "map": null, "nodes": [] }` if no map exists. Nodes are sorted by `position` ascending.

**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |

---

### 4.3 DELETE `/api/intelligence/journey`
**Purpose:** Delete the current user's journey map and all its nodes (cascade).
**Auth:** Supabase session cookie required.
**Success Response:** 204 No Content.
**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 404 | No map exists | `{ "error": "No journey map found" }` |

---

### 4.4 POST `/api/intelligence/journey/nodes`
**Purpose:** Add a new AI-generated node to the existing map.
**Auth:** Supabase session cookie required.
**Request Body:**
```json
{ "stage_description": "I want to add a stage about email nurture sequences" }
```
**Validation:** `stage_description` required, 5–500 characters.

**Pre-condition:** Map must exist and have `status = 'complete'`. Return 409 if map is building or failed.

**Behaviour:**
1. Fetch existing nodes to understand the journey context.
2. Call OpenRouter (`anthropic/claude-opus-4-5`) to generate a single new node: title, explanation, tactics, and best `position` to insert it.
3. Shift `position` of existing nodes at or after the insertion point by +1.
4. Insert the new node.
5. Return the new node.

**Success Response (201):**
```json
{
  "id": "uuid",
  "title": "Email Nurture Sequence",
  "position": 7,
  "explanation": "...",
  "tactics": ["Send welcome email within 1 hour", "..."]
}
```
**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 400 | stage_description missing or too short | `{ "error": "..." }` |
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 404 | No map exists | `{ "error": "No journey map found" }` |
| 409 | Map not complete | `{ "error": "Cannot add nodes while map is building" }` |

---

### 4.5 DELETE `/api/intelligence/journey/nodes/[id]`
**Purpose:** Delete a single node by ID.
**Auth:** Supabase session cookie required.
**Behaviour:** Delete the node. Do NOT re-sequence positions of remaining nodes.
**Success Response:** 204 No Content.
**Error Responses:**
| Status | Condition | Body |
|--------|-----------|------|
| 401 | Not authenticated | `{ "error": "Unauthorized" }` |
| 404 | Node not found OR belongs to different user | `{ "error": "Not Found" }` |

---

## 5. Business Logic

### 5.1 Scraping Logic
File: handled inside `/api/intelligence/journey/build/route.ts`

1. Validate and normalise the URL (add `https://` if missing).
2. Fetch the homepage HTML using `fetch()` with a 10-second timeout.
3. Extract all `<a href>` links from the homepage HTML that:
   - Are internal (same domain)
   - Are not anchors, mailto, tel, or file links
   - Are not duplicates
4. Deduplicate and limit to the first 19 unique internal links (homepage + 19 = 20 pages max).
5. Fetch each page in parallel (Promise.all) with a 10-second timeout per page.
6. For each page, extract visible text: strip all HTML tags, collapse whitespace, limit to 3000 characters per page.
7. Combine all page text into a single scrape result string. Label each page with its URL.
8. If a page fetch fails, skip it silently (do not abort the whole pipeline).

Update `progress_pct = 20`, `progress_step = 'Scraped website content'` after this step.

### 5.2 AI Build Pipeline
All AI calls use OpenRouter. Base URL: `https://openrouter.ai/api/v1/chat/completions`. Auth: `Authorization: Bearer ${process.env.OPENROUTER_API_KEY}`.

#### Step 1 — Business Analysis (progress: 20% → 40%)
Model: `anthropic/claude-opus-4-5`
Temperature: 0.3

Prompt:
```
You are an expert ecommerce strategist. Analyze the following website content and brand description.

Brand URL: {url}
Brand Description: {description}

Scraped Website Content:
{scraped_content}

Output a JSON object with these fields:
- business_type: string (e.g. "DTC skincare brand", "B2B SaaS", "marketplace")
- target_audience: string (who their customer is)
- product_summary: string (what they sell)
- key_channels: string[] (marketing channels visible from the site)
- brand_tone: string (e.g. "premium", "playful", "clinical")
- funnel_complexity: "simple" | "moderate" | "complex"

Return ONLY valid JSON.
```

Parse the JSON response. Store as `businessProfile`. Update `progress_pct = 40`.

#### Step 2 — Journey Architecture (progress: 40% → 60%)
Model: `anthropic/claude-opus-4-5`
Temperature: 0.4

Prompt:
```
You are an expert customer journey strategist. Based on this brand profile, design a detailed customer journey map.

Brand Profile:
{businessProfile as JSON}

Brand URL: {url}
Brand Description: {description}

Create a comprehensive customer journey with 20-30 stages. Each stage is a specific touchpoint or moment in the customer's experience, from first awareness all the way through post-purchase retention and advocacy.

Be highly specific to this brand — reference their actual channels, products, and audience. Do not use generic stage names.

Output a JSON array of stages:
[
  {
    "title": "Stage name (short, 2-5 words)",
    "position": 0,
    "category": "awareness|consideration|conversion|retention|advocacy"
  },
  ...
]

Positions start at 0. Return ONLY valid JSON.
```

Parse the JSON array. Store as `stageOutlines`. Update `progress_pct = 60`.

#### Step 3 — Node Detail Generation (progress: 60% → 95%)
Model: `anthropic/claude-opus-4-5`
Temperature: 0.5

Process stages in batches of 5 to stay within token limits. For each batch:

Prompt:
```
You are an expert ecommerce strategist. For each of the following customer journey stages, generate detailed content specific to this brand.

Brand Profile:
{businessProfile as JSON}

Stages to detail:
{batch of stage outlines as JSON}

For each stage, output:
{
  "position": <same as input>,
  "explanation": "2-4 sentences explaining what happens at this stage, why it matters, and what the customer is thinking/feeling.",
  "tactics": [
    "Specific, actionable tactic 1 the brand must execute",
    "Specific, actionable tactic 2",
    ... (5-8 tactics per stage)
  ]
}

Be specific to this brand. Reference their actual products, audience, and channels.
Return a JSON array of the detailed stages. Return ONLY valid JSON.
```

After each batch, update progress proportionally between 60% and 95%.

#### Step 4 — Save to Database (progress: 95% → 100%)
1. Insert all nodes into `journey_nodes` table.
2. Update `journey_maps` record: `status = 'complete'`, `progress_pct = 100`, `progress_step = null`.

**On any unrecoverable error during pipeline:**
- Update `journey_maps`: `status = 'failed'`, `progress_step = 'Build failed. Please delete and try again.'`
- Do not throw — return gracefully.

### 5.3 Progress Polling
The client polls `GET /api/intelligence/journey` every **3 seconds** while `status === 'building'`. When `status` changes to `complete` or `failed`, the client stops polling and re-renders.

### 5.4 Add Node Logic
When a client requests a new node via POST `/api/intelligence/journey/nodes`:
1. Fetch all existing nodes to provide context.
2. Call `anthropic/claude-opus-4-5` with the stage description + full existing journey context.
3. AI determines the best `position` for the new node within the existing sequence.
4. Nodes at positions >= insertion point have their `position` incremented by 1 (UPDATE in DB).
5. New node is inserted.

### 5.5 Validation Rules
- URL: must start with `http://` or `https://`. Reject bare domains.
- Description: 10–2000 characters.
- Stage description (add node): 5–500 characters.

---

## 6. Frontend

### 6.1 Page: `app/intelligence/customer-journey/page.tsx`
Server component. Auth check via `utils/supabase/server.ts` — redirect to `/intelligence/login` if not authenticated.

Fetch the journey map and nodes server-side. Pass to client components.

**Render logic:**
- If `map === null` → render `<JourneyInputForm />`
- If `map.status === 'building'` → render `<JourneyProgress map={map} />`
- If `map.status === 'failed'` → render failure state with delete button + error message
- If `map.status === 'complete'` → render `<JourneyMapClient map={map} nodes={nodes} />`

### 6.2 Component: `JourneyInputForm.tsx`
Client component (`"use client"`).

**Fields:**
- Brand URL (text input, placeholder: "https://yourbrand.com")
- Brand Description (textarea, placeholder: "Tell us about your brand, products, and target customer...", rows: 4)
- Submit button: "Build My Journey Map"

**Behaviour:**
- On submit: POST to `/api/intelligence/journey/build`
- Show inline loading state on button while request is in flight
- On 202 response: router.refresh() to re-render the page (which now shows JourneyProgress)
- On 409: show error "You already have a journey map. Delete it first."
- On 400: show validation error

**Layout:** Centered card, max-width 560px, matches Intelligence design system.

### 6.3 Component: `JourneyProgress.tsx`
Client component (`"use client"`).

**Behaviour:** Poll `GET /api/intelligence/journey` every 3 seconds. Update displayed progress from response. On `status === 'complete'` or `'failed'`, call `router.refresh()` to hand off to the appropriate view.

**Display:**
- Progress bar (accent purple, animated fill based on `progress_pct`)
- Current step text (`progress_step`)
- Animated pulsing brain icon
- "This takes up to 5 minutes — hang tight." subtext
- Do NOT show a cancel button

### 6.4 Component: `JourneyMapClient.tsx`
Client component (`"use client"`). Uses `@xyflow/react`.

**Layout:** Full-width, full-height canvas (min-height: 500px). Left-to-right flow.

**Node appearance (custom node):**
- Rounded rectangle, background: `var(--surface)`, border: `1px solid var(--border)`
- Stage title (bold, `var(--text-primary)`)
- Category badge below title (colour-coded by category — see below)
- On hover: border changes to `var(--accent)`, cursor: pointer
- Delete button (×) top-right corner of node, appears on hover only

**Category colours:**
- `awareness` → `#3b82f6` (blue)
- `consideration` → `#f59e0b` (amber)
- `conversion` → `#22c55e` (green)
- `retention` → `#8b5cf6` (purple)
- `advocacy` → `#ec4899` (pink)

**Edges:** Straight animated arrows between nodes, colour: `var(--border)`.

**Clicking a node:** Opens `<NodeDetailPanel>` for that node (slide-in from right).

**"Add Node" button:** Floating button bottom-right of the canvas. Opens a small modal with a textarea ("Describe the stage you want to add") + confirm button. Calls POST `/api/intelligence/journey/nodes`. On success, re-fetches and re-renders nodes.

**Delete node button (×):** Calls DELETE `/api/intelligence/journey/nodes/[id]`. On success, removes node from local state without re-fetching.

**Delete map button:** Top-right of the page (not the canvas). "Delete Map" — opens confirmation dialog ("Are you sure? This cannot be undone.") → calls DELETE `/api/intelligence/journey` → router.refresh().

### 6.5 Component: `NodeDetailPanel.tsx`
Client component. Slide-in panel from the right side of the screen.

**Layout:**
- Fixed overlay on the right: width 400px (full-width on mobile)
- Background: `var(--surface)`, border-left: `1px solid var(--border)`
- Close button (×) top-right
- Node title (h2, `var(--text-primary)`)
- Category badge
- Section "What's happening here" → explanation paragraph
- Section "What you need to do" → bulleted list of tactics (each bullet in `var(--text-secondary)`)

**Behaviour:** Clicking outside the panel or pressing Escape closes it.

### 6.6 Sidebar + Homepage Updates

**`components/Sidebar.tsx`** — Add under Intelligence section:
```
{
  href: "/intelligence/customer-journey",
  label: "Customer Journey",
  icon: <map icon>,
}
```

**`app/page.tsx`** — Add to Intelligence category tools array:
```
{
  href: "/intelligence/customer-journey",
  title: "Customer Journey Mapper",
  description: "AI-generated visual map of your full customer journey from first contact to sale.",
  icon: icons.map,
  badge: "New",
}
```

---

## 7. AI Configuration

### 7.1 OpenRouter Setup
- Base URL: `https://openrouter.ai/api/v1/chat/completions`
- API Key: `process.env.OPENROUTER_API_KEY`
- Model: `anthropic/claude-opus-4-5` for all calls
- All calls use standard `fetch()` — no SDK

### 7.2 Request Shape
```typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://newtn-nine.vercel.app",
    "X-Title": "Newtn Intelligence",
  },
  body: JSON.stringify({
    model: "anthropic/claude-opus-4-5",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3, // varies per step — see Section 5.2
  }),
});
const data = await response.json();
const content = data.choices[0].message.content;
```

### 7.3 JSON Parsing Safety
All AI responses must be parsed with a try/catch. If JSON.parse fails:
- Log the raw response
- Mark the map as `failed`
- Set `progress_step = 'AI returned invalid data. Please delete and try again.'`

---

## 8. Environment Variables

Add to `.env.local` (and Vercel environment variables):
```
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## 9. Constraints

### 9.1 Forbidden Approaches
- Do NOT use any OpenAI or Anthropic SDK — use raw `fetch()` to OpenRouter
- Do NOT implement real-time streaming to the client — use polling
- Do NOT allow editing node content directly
- Do NOT implement multiple maps per user
- Do NOT add export functionality

### 9.2 Performance
- Scraping: all page fetches run in parallel (Promise.all), 10s timeout each
- AI calls: batches of 5 nodes — do NOT send all nodes in one call (token limit risk)
- Set `export const maxDuration = 300` in the build route

### 9.3 Protected Files
- Do NOT modify `app/tools/price-converter/page.tsx`
- Do NOT modify `app/intelligence/login/page.tsx`
- Do NOT modify `proxy.ts`
- Do NOT modify `utils/supabase/client.ts` or `utils/supabase/server.ts`

---

## 10. Acceptance Criteria

### 10.1 Input & Validation
- [ ] Submitting a bare domain without http/https shows a validation error
- [ ] Submitting a description under 10 characters shows a validation error
- [ ] Submitting when a map already exists returns a 409 and shows the error message

### 10.2 Build Pipeline
- [ ] After submitting, a `journey_maps` record is created with `status = 'building'`
- [ ] Progress percentage increases from 0 → 100 across the 4 pipeline steps
- [ ] `progress_step` updates at each pipeline step
- [ ] On completion, `status = 'complete'` and at least 20 nodes exist in `journey_nodes`
- [ ] All nodes have non-empty `title`, `explanation`, and at least 3 items in `tactics`
- [ ] On pipeline failure, `status = 'failed'` and `progress_step` contains an error message

### 10.3 Visual Map
- [ ] Nodes render left-to-right in ascending `position` order
- [ ] Edges connect each node to the next
- [ ] Each node shows its title and a category badge with the correct colour
- [ ] Clicking a node opens the NodeDetailPanel with explanation and tactics
- [ ] The panel closes on clicking outside or pressing Escape
- [ ] Delete button (×) appears on node hover and removes the node on confirm
- [ ] "Add Node" button opens a modal; submitted description generates a new node

### 10.4 Map Management
- [ ] Creating a second map when one exists returns 409
- [ ] Deleting the map removes all nodes (cascade)
- [ ] After deleting, the input form is shown again

### 10.5 Auth
- [ ] Unauthenticated requests to all API routes return 401
- [ ] Users cannot access or modify another user's map or nodes (RLS)
- [ ] Visiting `/intelligence/customer-journey` while logged out redirects to login

### 10.6 Build
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] No `console.log` statements in production code
