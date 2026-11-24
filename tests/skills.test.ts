import { describe, it, expect } from 'vitest';
import { newSkill, recordWatched, recordResult, effectiveStage, MAX_STAGE, type SkillState } from '../src/progress/skills';

const at = (stage: number): SkillState => ({ ...newSkill(), stage });
const run = (s: SkillState, results: boolean[], max = 5) => results.reduce((acc, r) => recordResult(acc, r, max), s);

describe('skills', () => {
  it('starts at stage 1', () => expect(newSkill().stage).toBe(1));

  it('4 watched columns move stage 1 → 2', () => {
    let s = newSkill();
    for (let i = 0; i < 3; i++) s = recordWatched(s);
    expect(s.stage).toBe(1);
    expect(recordWatched(s).stage).toBe(2);
  });

  it('8 correct in a row move up and reset the streak', () => {
    const s = run(at(2), Array(8).fill(true));
    expect(s.stage).toBe(3);
    expect(s.streak).toBe(0);
  });

  it('7 correct then a wrong one resets the streak without moving', () => {
    const s = run(at(2), [...Array(7).fill(true), false]);
    expect(s.stage).toBe(2);
    expect(s.streak).toBe(0);
  });

  it('2 wrong in the last 5 move down one stage', () => {
    expect(run(at(3), [true, false, true, false]).stage).toBe(2);
    expect(run(at(3), [false]).stage).toBe(3);
  });

  it('wrong answers spread out do not move down', () => {
    expect(run(at(3), [false, true, true, true, true, true, false]).stage).toBe(3);
  });

  it('never goes above max or below 1', () => {
    expect(run(at(3), Array(30).fill(true), 3).stage).toBe(3);
    expect(run(at(1), Array(10).fill(false)).stage).toBe(1);
  });

  it('effectiveStage applies a cap', () => {
    expect(effectiveStage(at(4), 2)).toBe(2);
    expect(effectiveStage(at(1), 2)).toBe(1);
    expect(effectiveStage(at(4))).toBe(4);
  });

  it('max stages per skill', () => {
    expect(MAX_STAGE).toEqual({ fingerAdd: 5, fingerSub: 5, carry: 3, borrow: 3 });
  });
});
