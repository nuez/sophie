export type Op = '+' | '-';

export interface Problem {
  op: Op;
  top: number;
  bottom: number;
  level: number;
  /** Single-column levels (1–4): the whole answer is entered at once. */
  single: boolean;
  /** A review sum drawn from an earlier level. */
  review: boolean;
}

/** One cross-out on the top row: the digit at `place` goes from `before` to `after`. */
export interface BorrowMark {
  place: number;
  before: number;
  after: number;
}

export interface ColumnStep {
  place: number;
  topDigit: number;
  top: number;
  bottom: number;
  carryIn: 0 | 1;
  total: number;
  write: number;
  carryOut: 0 | 1;
  borrow: BorrowMark[] | null;
  trivial: boolean;
  skip: boolean;
}
