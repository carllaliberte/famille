/**
 * Topology suggestions only. CREATE/MERGE/SPLIT are never applied here.
 */
export class DynamicTaxonomyEngine {
  assess(projects = []) {
    const n = projects.length;
    const proposals = [];
    if (n === 0) {
      return {
        n,
        act: "MAINTAIN_BOUNDARIES",
        proposals,
        create: false,
        auto_merge: false,
        write: "DENIED",
      };
    }
    const names = new Set(projects.map((p) => p.id));
    if (names.size !== n) {
      proposals.push({
        act: "MERGE_PROJECTS",
        why: "duplicate identity",
        create: false,
      });
    }
    for (const p of projects) {
      const coupling = Number(p.coupling) || 0;
      if (coupling >= 0.8) {
        proposals.push({
          act: "SPLIT_PROJECT",
          target: p.id,
          why: "coupling too high",
          create: false,
        });
      }
    }
    if (proposals.length === 0) {
      proposals.push({
        act: "MAINTAIN_BOUNDARIES",
        why: "no measured boundary failure",
        create: false,
      });
    }
    return {
      n,
      act: proposals[0].act,
      proposals,
      create: false,
      auto_merge: false,
      write: "DENIED",
      forge_is_brain: false,
    };
  }
}
