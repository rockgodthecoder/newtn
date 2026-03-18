# NLSpec: Journey Mapper Phase 2 — CEPs, Decision Mechanisms & Tactic Swipe
# Version: 1.0
# Date: 2026-03-18
# Depends on: NLSPEC_customer_journey_mapper.md (Phase 1 must be complete)

---

## 1. Context

### 1.1 Problem Statement
The Phase 1 journey map shows *what* happens at each stage but doesn't explain *why* customers enter the category (CEPs) or *what trust questions* they need answered before buying. Tactics are buried inside nodes and there's no system for acting on them.

### 1.2 What Phase 2 Adds
1. **Category Entry Points (CEPs)** — AI-extracted situations/triggers that bring customers into the brand's category. Shown as a new CEP View on the journey page.
2. **Decision Mechanisms** — AI-extracted trust questions customers ask before buying (e.g. "Is this greenwashing?", "How does it fit?"). Shown alongside CEPs.
3. **Journey/CEP toggle** — switch between the existing journey map and the new CEP view.
4. **Tactic cards** — every tactic from every node becomes its own record with swipe status.
5. **Review page** (`/intelligence/review`) — Tinder-style swipe through all tactics. Right = approved (To-Do), Left = dismissed. Filterable by channel.
6. **To-Do page** (`/intelligence/todo`) — list of all approved tactics, markable as done.

### 1.3 Scope

**IN scope:**
- `journey_ceps` and `journey_decisions` tables + RLS
- `journey_tactics` table (individual tactic records) + RLS
- CEP + decision mechanism generation in build pipeline (2 new AI steps)
- Tactic extraction into `journey_tactics` during build
- CEP View UI on the journey page (toggle)
- CEP card → drawer showing connected journey nodes
- Decision mechanism cards in CEP view
- `/intelligence/review` — swipe page with channel filter
- `/intelligence/todo` — to-do list with done/undone toggle
- Sidebar + homepage updates

**OUT of scope — do NOT implement:**
- Editing CEP or decision mechanism content
- Linking CEPs to nodes manually (AI determines links during build)
- Sharing or exporting the To-Do list
- Notifications or reminders for To-Do items
- Re-running CEP/decision generation without rebuilding the full map

---

## 2. Architecture

### 2.1 New Files
```
app/intelligence/customer-journey/CEPView.tsx
app/intelligence/customer-journey/CEPCard.tsx
app/intelligence/customer-journey/DecisionCard.tsx

app/intelligence/review/page.tsx
app/intelligence/review/SwipeClient.tsx

app/intelligence/todo/page.tsx
app/intelligence/todo/TodoClient.tsx

app/api/intelligence/journey/ceps/route.ts
app/api/intelligence/decisions/route.ts
app/api/intelligence/tactics/route.ts
app/api/intelligence/tactics/[id]/route.ts
```

### 2.2 Modified Files
- `app/intelligence/customer-journey/page.tsx` — add toggle, pass CEP view
- `app/intelligence/customer-journey/JourneyMapClient.tsx` — add toggle UI
- `app/api/intelligence/journey/build/route.ts` — add CEP, decision, tactic steps
- `components/Sidebar.tsx` — add Review and To-Do links
- `app/page.tsx` — add Review and To-Do cards to Intelligence section

### 2.3 No New Dependencies
All libraries from Phase 1 are sufficient.

---

## 3. Data Model

### 3.1 New Tables

#### `journey_ceps`
| Field | Type | Constraints | Default | Notes |
|-------|------|-------------|---------|-------|
| id | uuid | PK | gen_random_uuid() | |
| journey_map_id | uuid | NOT NULL, FK → journey_maps.id ON DELETE CASCADE | | |
| title | text | NOT NULL | | e.g. "Marathon Prep" |
| description | text | NOT NULL | | 1-2 sentences explaining the CEP |
| connected_node_ids | jsonb | NOT NULL | '[]' | Array of journey_nodes.id strings |
| position | integer | NOT NULL | | Display order |
| created_at | timestamptz | NOT NULL | now() | |

#### `journey_decisions`
| Field | Type | Constraints | Default | Notes |
|-------|------|-------------|---------|-------|
| id | uuid | PK | gen_random_uuid() | |
| journey_map_id | uuid | NOT NULL, FK → journey_maps.id ON DELETE CASCADE | | |
| question | text | NOT NULL | | e.g. "Is this greenwashing?" |
| answer_approach | text | NOT NULL | | How the brand should answer this |
| position | integer | NOT NULL | | Display order |
| created_at | timestamptz | NOT NULL | now() | |

#### `journey_tactics`
| Field | Type | Constraints | Default | Notes |
|-------|------|-------------|---------|-------|
| id | uuid | PK | gen_random_uuid() | |
| journey_map_id | uuid | NOT NULL, FK → journey_maps.id ON DELETE CASCADE | | |
| journey_node_id | uuid | NOT NULL, FK → journey_nodes.id ON DELETE CASCADE | | |
| text | text | NOT NULL | | The tactic text |
| channel | text | NOT NULL | | Inherited from node category: website/email/ads/organic/other |
| swipe_status | text | NOT NULL | 'unreviewed' | One of: unreviewed, approved, dismissed |
| completed | boolean | NOT NULL | false | For To-Do tracking |
| position | integer | NOT NULL | | Order within the node |
| created_at | timestamptz | NOT NULL | now() | |

### 3.2 RLS Policies
```sql
-- journey_ceps
CREATE POLICY "Users own their CEPs" ON journey_ceps
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );

-- journey_decisions
CREATE POLICY "Users own their decisions" ON journey_decisions
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );

-- journey_tactics
CREATE POLICY "Users own their tactics" ON journey_tactics
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );
```

### 3.3 SQL Migration
```sql
-- Run in Supabase SQL Editor

CREATE TABLE journey_ceps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id uuid NOT NULL REFERENCES journey_maps(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  connected_node_ids jsonb NOT NULL DEFAULT '[]',
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journey_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id uuid NOT NULL REFERENCES journey_maps(id) ON DELETE CASCADE,
  question text NOT NULL,
  answer_approach text NOT NULL,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE journey_tactics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_map_id uuid NOT NULL REFERENCES journey_maps(id) ON DELETE CASCADE,
  journey_node_id uuid NOT NULL REFERENCES journey_nodes(id) ON DELETE CASCADE,
  text text NOT NULL,
  channel text NOT NULL DEFAULT 'other',
  swipe_status text NOT NULL DEFAULT 'unreviewed'
    CHECK (swipe_status IN ('unreviewed', 'approved', 'dismissed')),
  completed boolean NOT NULL DEFAULT false,
  position integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE journey_ceps ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE journey_tactics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their CEPs" ON journey_ceps
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );

CREATE POLICY "Users own their decisions" ON journey_decisions
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );

CREATE POLICY "Users own their tactics" ON journey_tactics
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM journey_maps WHERE id = journey_map_id)
  );
```

---

## 4. API Endpoints

### 4.1 GET `/api/intelligence/journey/ceps`
**Purpose:** Get all CEPs and decisions for the current user's journey map.
**Auth:** Supabase session required.
**Success Response (200):**
```json
{
  "ceps": [
    {
      "id": "uuid",
      "title": "Marathon Prep",
      "description": "Runners researching gear 8-12 weeks before a race.",
      "connected_node_ids": ["node-uuid-1", "node-uuid-3"],
      "position": 0
    }
  ],
  "decisions": [
    {
      "id": "uuid",
      "question": "Is this greenwashing?",
      "answer_approach": "Show third-party certifications above the fold on the product page.",
      "position": 0
    }
  ]
}
```
Returns `{ "ceps": [], "decisions": [] }` if no map exists.

---

### 4.2 GET `/api/intelligence/tactics`
**Purpose:** Get tactics for the current user with optional filters.
**Auth:** Supabase session required.
**Query Parameters:**
| Param | Type | Required | Values |
|-------|------|----------|--------|
| status | string | no | unreviewed, approved, dismissed |
| channel | string | no | website, email, ads, organic, other |

**Success Response (200):**
```json
{
  "tactics": [
    {
      "id": "uuid",
      "text": "Add trust badges above the fold on the product page",
      "channel": "website",
      "swipe_status": "unreviewed",
      "completed": false,
      "position": 0,
      "journey_node_id": "uuid",
      "node_title": "Product Page Visit"
    }
  ],
  "total": 87,
  "unreviewed": 62,
  "approved": 15,
  "dismissed": 10
}
```

---

### 4.3 PATCH `/api/intelligence/tactics/[id]`
**Purpose:** Update a tactic's swipe_status or completed state.
**Auth:** Supabase session required.
**Request Body (all fields optional):**
```json
{ "swipe_status": "approved", "completed": true }
```
**Validation:** `swipe_status` must be one of: unreviewed, approved, dismissed.
**Success Response (200):** Updated tactic object.
**Error Responses:**
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 404 | Tactic not found or belongs to different user |
| 400 | Invalid swipe_status value |

---

## 5. Build Pipeline Additions

Add these steps to `buildJourney()` in `app/api/intelligence/journey/build/route.ts` **after** node detail generation (after progress hits 95%).

### Step 5 — CEP Generation (progress: 95% → 97%)
Model: `anthropic/claude-opus-4-5`, Temperature: 0.4

Prompt:
```
You are an expert brand strategist. Based on the following brand data, identify the Category Entry Points (CEPs) for this brand.

CEPs are the specific situations, occasions, needs, or mental triggers that cause a customer to think about and enter this product category. They are NOT marketing channels — they are the real-world moments that trigger a purchase consideration.

Brand Profile:
{businessProfile as JSON}

Brand URL: {url}
Brand Description: {description}

Generate 8-12 CEPs specific to this brand's category and audience.

For each CEP, also identify which journey stage node titles are most relevant to addressing it (list 2-4 node titles from the journey).

Journey node titles (for reference):
{stageOutlines.map(s => s.title).join(", ")}

Return a JSON array:
[
  {
    "title": "CEP name (2-4 words)",
    "description": "1-2 sentences: the specific situation or trigger",
    "connected_node_titles": ["node title 1", "node title 2"]
  }
]

Return ONLY valid JSON.
```

After AI response, resolve `connected_node_titles` to actual node IDs by matching against saved nodes. Store in `journey_ceps`.

---

### Step 6 — Decision Mechanism Generation (progress: 97% → 99%)
Model: `anthropic/claude-opus-4-5`, Temperature: 0.4

Prompt:
```
You are an expert ecommerce conversion strategist. Based on this brand, identify the key decision-making questions and trust barriers customers face before purchasing.

These are the specific questions, doubts, or objections a customer has about this particular brand or product category — things they need answered before they feel confident buying.

Brand Profile:
{businessProfile as JSON}

Brand URL: {url}

Generate 6-10 decision mechanisms. Be specific to this brand's category, product type, and customer concerns.

Examples of decision mechanisms:
- "Is this greenwashing?" (for eco brands)
- "How does it fit compared to my usual size?" (for footwear)
- "Will it last as long as a non-sustainable alternative?"
- "Is this brand actually trustworthy or just trendy?"

Return a JSON array:
[
  {
    "question": "The customer's exact question or doubt",
    "answer_approach": "Specific, actionable way the brand should answer this on their website or in their marketing"
  }
]

Return ONLY valid JSON.
```

Store results in `journey_decisions`.

---

### Step 7 — Tactic Extraction (progress: 99% → 100%)
After CEPs and decisions are saved, extract all tactics from saved nodes into `journey_tactics`:

```typescript
const { data: savedNodes } = await supabase
  .from("journey_nodes")
  .select("id, tactics, category")
  .eq("journey_map_id", mapId);

const tacticInserts = [];
for (const node of savedNodes ?? []) {
  const tactics = Array.isArray(node.tactics) ? node.tactics : [];
  tactics.forEach((text: string, i: number) => {
    tacticInserts.push({
      journey_map_id: mapId,
      journey_node_id: node.id,
      text,
      channel: node.category ?? "other",
      swipe_status: "unreviewed",
      completed: false,
      position: i,
    });
  });
}
if (tacticInserts.length > 0) {
  await supabase.from("journey_tactics").insert(tacticInserts);
}
```

Then mark map complete.

---

## 6. Frontend

### 6.1 Journey/CEP Toggle
Add a toggle to the top bar of `JourneyMapClient.tsx`:

```
[ Journey Map ]  [ CEP View ]
```

Toggle is a pill switcher. Switching between views does not reload the page — it conditionally renders `<JourneyMapCanvas>` or `<CEPView>`.

`CEPView` receives `ceps`, `decisions`, and `nodes` as props (fetched server-side in `page.tsx`).

---

### 6.2 Component: `CEPView.tsx`
Client component. Two sections stacked vertically.

**Section 1 — Category Entry Points**
Header: "Category Entry Points" + count badge

Grid of `<CEPCard>` components (2 cols on mobile, 3 on desktop).

Each card:
- CEP title (bold)
- Description text
- "X touchpoints" badge showing count of connected nodes
- On click → slide-in drawer (right side) showing:
  - CEP title + description
  - List of connected journey nodes (show node title + channel badge)
  - Message: "These are the stages in your journey that address this entry point."

**Section 2 — Decision Mechanisms**
Header: "Decision Mechanisms" + count badge
Subheader: "Trust questions customers ask before buying"

Grid of `<DecisionCard>` components.

Each card:
- Question (bold, larger text)
- Answer approach text below
- Channel-neutral — no colour coding

---

### 6.3 Component: `CEPCard.tsx`
```
┌─────────────────────────────┐
│ Marathon Prep               │
│ Runners researching gear    │
│ 8-12 weeks before a race.   │
│                             │
│ [3 touchpoints →]           │
└─────────────────────────────┘
```
Style: `var(--surface)`, `var(--border)`, accent left-border (3px, `var(--accent)`).
Hover: border becomes `var(--accent)`, cursor pointer.

---

### 6.4 Component: `DecisionCard.tsx`
```
┌─────────────────────────────┐
│ "Is this greenwashing?"     │
│                             │
│ Show B Corp cert + supply   │
│ chain page above the fold.  │
└─────────────────────────────┘
```
Style: `var(--surface)`, `var(--border)`, amber left-border (3px, `#f59e0b`).

---

### 6.5 Page: `/intelligence/review`
Server component → redirects to login if not authenticated.
Fetches `GET /api/intelligence/tactics?status=unreviewed` server-side.
Passes to `<SwipeClient>`.

**`SwipeClient.tsx`** — client component.

**Layout:**
- Channel filter tabs at top: All | Website | Email | Ads | Organic | Other
  - Filtering changes which tactics show in the queue (client-side filter on loaded tactics)
- Large card in center showing current tactic
- Card content:
  - Channel badge (colour-coded)
  - Node name it belongs to (small label above)
  - Tactic text (large, centered)
- Two buttons below: ✕ (dismiss, red) and ✓ (approve, green)
- Also supports keyboard: → key = approve, ← key = dismiss
- Progress indicator: "X of Y remaining"

**Behaviour:**
- On ✓ or → : PATCH tactic to `approved`, advance to next card
- On ✕ or ← : PATCH tactic to `dismissed`, advance to next card
- When queue is empty: show "All done! Check your To-Do list." with link to `/intelligence/todo`
- Optimistic UI — update local state immediately, PATCH in background

---

### 6.6 Page: `/intelligence/todo`
Server component → redirects to login if not authenticated.
Fetches `GET /api/intelligence/tactics?status=approved` server-side.
Passes to `<TodoClient>`.

**`TodoClient.tsx`** — client component.

**Layout:**
- Header: "To-Do" + count of incomplete approved tactics
- Filter tabs: All | Website | Email | Ads | Organic | Other
- List of tactic items grouped by channel

Each tactic item:
- Checkbox (toggle `completed`)
- Tactic text (strikethrough when completed)
- Small label showing which journey node it came from
- Channel colour dot

**Behaviour:**
- Checking/unchecking calls PATCH `/api/intelligence/tactics/[id]` with `{ completed: true/false }`
- Completed items shown at bottom, greyed out
- Optimistic UI — toggle local state immediately, PATCH in background

---

### 6.7 Sidebar Updates
Add under Intelligence section:
```
{ href: "/intelligence/review", label: "Review Tactics", icon: <swipe/cards icon> }
{ href: "/intelligence/todo",   label: "To-Do",          icon: <checklist icon> }
```

### 6.8 Homepage Updates
Add to Intelligence category in `app/page.tsx`:
```
{
  href: "/intelligence/review",
  title: "Review Tactics",
  description: "Swipe through AI-generated tactics. Approve what fits, dismiss what doesn't.",
  icon: icons.layers,
  badge: "New",
}
{
  href: "/intelligence/todo",
  title: "To-Do",
  description: "Your approved tactics ready to action. Track what's done.",
  icon: icons.list,
  badge: "New",
}
```

---

## 7. Constraints

### 7.1 Forbidden
- Do NOT modify `journey_nodes.tactics` — keep the jsonb for backward compat with the journey map display
- Do NOT allow editing CEP or decision content
- Do NOT re-run Phase 2 generation independently — only runs as part of full map rebuild
- Do NOT add swipe gestures (touch drag) — buttons and keyboard only for now

### 7.2 Protected Files (do not modify)
- `app/intelligence/login/page.tsx`
- `proxy.ts`
- `utils/supabase/client.ts`
- `utils/supabase/server.ts`
- `app/tools/price-converter/page.tsx`

---

## 8. Acceptance Criteria

### 8.1 Build Pipeline
- [ ] After map completes, `journey_ceps` has 8-12 records
- [ ] After map completes, `journey_decisions` has 6-10 records
- [ ] After map completes, `journey_tactics` has one record per tactic across all nodes
- [ ] Each tactic inherits the correct `channel` from its parent node
- [ ] CEP `connected_node_ids` contains valid node UUIDs

### 8.2 CEP View
- [ ] Toggle switches between Journey Map and CEP View without page reload
- [ ] CEP cards display title, description, and touchpoint count
- [ ] Clicking a CEP card opens a drawer with connected node titles
- [ ] Decision mechanism cards display question and answer approach
- [ ] Both sections visible in CEP view

### 8.3 Review Page
- [ ] Shows only `unreviewed` tactics by default
- [ ] Channel filter correctly filters the queue
- [ ] Approving a tactic sets `swipe_status = 'approved'`
- [ ] Dismissing sets `swipe_status = 'dismissed'`
- [ ] → and ← keyboard shortcuts work
- [ ] Empty state shows when queue is exhausted
- [ ] Progress counter updates correctly

### 8.4 To-Do Page
- [ ] Shows only `approved` tactics
- [ ] Channel filter works
- [ ] Checking a tactic sets `completed = true` with strikethrough
- [ ] Unchecking sets `completed = false`
- [ ] Completed items sorted to bottom
- [ ] Header count reflects incomplete items only

### 8.5 Auth
- [ ] All new API routes return 401 for unauthenticated requests
- [ ] RLS prevents cross-user data access on all 3 new tables
- [ ] New pages redirect to login if not authenticated

### 8.6 Build
- [ ] `npm run build` passes
- [ ] `npm run lint` passes
