"""
AEOS – Strategic Intelligence Engine.

Cross-cutting aggregation layer that sits above individual intelligence
engines and below consumer features (Ask AEOS, Executive Briefing,
Opportunity Radar, 30/60/90 Roadmaps).

Processing order (deterministic first, AI last):
  1. Aggregate  – collect signals from source engines
  2. Score      – apply rules and thresholds
  3. Prioritize – rank by impact × urgency
  4. Plan       – generate roadmap skeletons
  5. Compress   – build context packs for AI
  6. Narrate    – Claude adds human-readable wording (future)
"""
