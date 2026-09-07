/**
 * Run with:  npx tsx lib/gstCalculator.test.ts
 */
import { adviseGstReduction, computeGstSummary, type GstItem } from './gstCalculator';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const items: GstItem[] = [
  { id: '1', name: 'Widget A', quantity: 1, unitPrice: 1000, gstRate: 18, inclusive: false },
  { id: '2', name: 'Widget B', quantity: 1, unitPrice: 500, gstRate: 5, inclusive: false },
  { id: '3', name: '', quantity: 1, unitPrice: 1180, gstRate: 18, inclusive: true },
];

const summary = computeGstSummary(items);
assert(summary.subtotal === 2500, `subtotal expected 2500, got ${summary.subtotal}`);
assert(summary.totalGst === 385, `totalGst expected 385, got ${summary.totalGst}`);
assert(summary.grandTotal === 2885, `grandTotal expected 2885, got ${summary.grandTotal}`);

const advice = adviseGstReduction(summary, 2500);
assert(advice.exceedsTarget, 'should exceed target');
assert(advice.excess === 385, `excess expected 385, got ${advice.excess}`);
assert(advice.reductionPerItem === 128.33, `reductionPerItem expected 128.33, got ${advice.reductionPerItem}`);
assert(advice.suggestedLines.length === 3, 'three suggested lines');

const one = computeGstSummary([items[0]]);
const oneAdvice = adviseGstReduction(one, 1000);
assert(oneAdvice.exceedsTarget, 'single line should still advise');
assert(oneAdvice.reductionPerItem === oneAdvice.excess, 'one line takes the full cut');

const five = computeGstSummary([
  ...items,
  { id: '4', name: '', quantity: 2, unitPrice: 100, gstRate: 5, inclusive: false },
  { id: '5', name: '', quantity: 1, unitPrice: 200, gstRate: 18, inclusive: false },
]);
const fiveAdvice = adviseGstReduction(five, 1000);
assert(fiveAdvice.suggestedLines.length === 5, 'five lines');
assert(Math.abs(fiveAdvice.reductionPerItem * 5 - fiveAdvice.excess) < 0.1, 'equal split across all lines');

const within = adviseGstReduction(summary, 5000);
assert(!within.exceedsTarget, 'should be within target');

console.log('gstCalculator.test.ts — all passed');
