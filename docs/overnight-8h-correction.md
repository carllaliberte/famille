# Overnight 8h correction

The overnight execution fabric uses eight sequential slots of exactly 60 minutes.

- Slot duration: 60 minutes
- Workflow timeout: 65 minutes
- Total nominal execution window: 8 hours
- Global Breaker remains the authorization gate.
- Carl remains human authority.
- No auto-merge, source writes, or LIVE claim are introduced by the overnight runner.
- Each slot preserves its own evidence artifact.
