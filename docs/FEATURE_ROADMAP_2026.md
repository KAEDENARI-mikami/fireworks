# Fireworks Feature Roadmap

Currency note: SPARK remains the run/gacha progression currency. 黒色火薬 is the shop currency layer, earned mainly through rewarded ads for now and designed so a paid currency model can be added later without rewriting progression.

Multi-tower note: the second tower slot is gated behind the 40000-step `並列塔制御` research and a shop purchase of `黒色火薬100`. The current implementation runs the second tower as a saved headless parallel battle from the GPS screen, then lets the player collect SPARK/resources from the shop. A later upgrade can promote secondary towers to fully rendered combat views.

1. Daily Route Contract
   - A daily mission generated from the player's movement area.
   - Rewards walking, returning, and defending a route rather than only grinding a static stage.
   - Market reason: gives a retention loop without forcing long sessions.

2. Sponsored Sweet Spots
   - Limited-time high-reward map cells that can later map to real venues or campaigns.
   - For now, implement as system-generated events to avoid business dependency.
   - Monetization reason: future sponsorship inventory without changing combat.

3. Boss Intel Ads
   - Optional rewarded ad before a boss grants a visible boss modifier preview or one reroll.
   - Keeps ads player-initiated and tied to high-tension moments.
   - Better than random interstitials for trust.

4. Expedition While Away
   - Offline/idle runs consume a saved loadout and produce capped resources.
   - Uses current deterministic replay direction, but packages it as a user-facing expedition.
   - Retention reason: players return to claim and adjust.

5. District Progression
   - Nearby map cells contribute to district-level unlocks.
   - Adds medium-term goals beyond single-run upgrades.
   - Good fit for location gameplay without requiring multiplayer immediately.

6. Loadout Presets
   - Save named skill and research setups.
   - Needed before adding many more skills, because inventory friction will grow.
   - Quality-of-life feature that also supports future monetized convenience without pay-to-win.

7. Enemy Codex
   - Unlock enemy entries after seeing or defeating them.
   - Shows resistances, behavior, and suggested counters.
   - Improves readability as Tier2 and later enemies expand.

8. Event Mutators
   - Weekly or 72-hour rulesets: meteor rain, shield famine, fast drones, double bosses.
   - Cheap content multiplier because it reuses existing systems.
   - Good for UA creatives and store update cadence.

9. Social Snapshot Share
   - Share a result card with wave, build, map rarity, boss defeated, and fireworks image.
   - No real-time multiplayer required.
   - Market reason: creator/social surfaces are increasingly important for discovery.

10. Seasonal Research Tree
   - A time-limited research branch with cosmetics, map effects, and small utility bonuses.
   - Keeps long-term progression fresh while avoiding hard power creep.
   - Can later support ads, battle-pass-like goals, or sponsorship themes.
