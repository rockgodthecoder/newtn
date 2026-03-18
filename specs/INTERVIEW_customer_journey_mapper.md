# Interview: customer_journey_mapper
# Date: 2026-03-18
# Status: Complete — all ambiguities resolved

## Answers

**Q1. What is a "customer journey" in this context?**
A tool that helps ecom owners find the full journey their customer goes through from first contact to sale.

**Q2. Who uses this tool?**
Clients (logged-in users via Supabase auth) input their brand and see their customer journey.

**Q3. What is the core output?**
A visual map/diagram. Nodes are clickable to reveal more information.

**Q4. Where does data come from?**
Input: brand URL + text description. The system scrapes the website from that URL.

**Q5. What problem does it solve?**
Helps create a detailed, ever-growing document of the customer journey. More data can be added over time.

**Q6. What does scraping cover?**
Everything it can find — all copy, product pages, etc.
Resolved: 1 level deep from homepage, up to 20 pages max.

**Q7. Who decides the journey stages?**
The AI decides the stages based on what it finds.

**Q8. What shows when a node is clicked?**
A longer explanation + bulleted list of tactics the client needs to execute at that stage (e.g. "Website needs to show materials here to prove X").

**Q9. How is more data added over time?**
Users can add new AI-generated nodes and delete existing ones. Cannot edit node content directly. Future tools will feed in more data.

**Q10. Is the journey saved per user?**
Yes — logged-in, saved per Supabase user account.

**Q11. AI model/provider?**
OpenRouter with Anthropic models (`anthropic/claude-opus-4-5`).

**Q12. How many nodes?**
20+ — super detailed.

**Q13. Specific model?**
`anthropic/claude-opus-4-5` via OpenRouter.

**Q14. How long can it take? Should progress be shown?**
Up to 5 minutes max. Show progress while building.

**Q15. Multiple journeys per client?**
1 journey map per account for now.

**Q16. How does adding data to an existing map work?**
Add new AI-generated nodes or delete existing ones. No editing of existing node content.

**Q17. Starting fresh with a new URL?**
Blocked until the existing map is explicitly deleted.

**Q18. Visual map style?**
Left-to-right timeline/flowchart.

**Q19. Export?**
Skipped for now.

## Ambiguity Check — PASSED

All items resolved:
- Scraping depth: 1 level deep, max 20 pages ✅
- Node editing: add AI-generated nodes + delete only (no content editing) ✅
- Replace behaviour: blocked until delete ✅
- Node content format: bulleted list for tactics ✅
