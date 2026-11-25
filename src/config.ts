/** All tuning knobs in one place (spec §6.2, §9, §10). */
export const CONFIG = {
  stageUpStreak: 8,        // consecutive first-try-correct to move up a stage
  stageDownWrong: 2,       // wrong answers ...
  stageDownWindow: 5,      // ... within the last N to move down
  watchedToAdvance: 4,     // stage-1 columns watched before moving to stage 2
  careEvery: 5,            // counted sums per care break
  unlockMinSums: 10,       // sums at a level before it can unlock the next
  unlockWindow: 10,
  unlockCorrect: 8,        // of the last unlockWindow first-try-correct
  reviewShare: 0.2,        // share of sums from earlier levels
  newConceptCap: 2,        // max stage for a newly introduced skill ...
  newConceptSums: 5,       // ... during the first N sums of that level
  scruffyAfterMs: 24 * 60 * 60 * 1000,
  clipTimeoutMs: 4000,
  /** Voice is off for now: she reads every instruction. The clips stay in public/audio. */
  voice: false,
} as const;
