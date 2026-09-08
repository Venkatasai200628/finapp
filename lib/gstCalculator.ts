export type GstItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** GST rate in percent, e.g. 5, 12, 18, 28. */
  gstRate: number;
  /** When true, unitPrice already includes GST. */
  inclusive: boolean;
  /** When true, line is locked and cannot be reduced by target cap. */
  fixed?: boolean;
};

export type GstLineResult = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  lineAmount: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  fixed?: boolean;
};

export type GstSummary = {
  lines: GstLineResult[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
};

export type ReductionStrategy = 'equal' | 'proportional' | 'highest_first';

export type GstReductionAdvice = {
  exceedsTarget: boolean;
  targetIdeal: number;
  excess: number;
  reductionPerItem: number;
  strategy: ReductionStrategy;
  strategyLabel: string;
  suggestedLines: Array<GstLineResult & { reducedTotal: number; savedAmount: number; isFixed?: boolean }>;
  message: string;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function lineGross(item: GstItem) {
  const qty = item.quantity > 0 ? item.quantity : 1;
  return qty * item.unitPrice;
}

export function computeGstLine(item: GstItem): GstLineResult {
  const quantity = item.quantity > 0 ? item.quantity : 1;
  const lineAmount = round2(quantity * item.unitPrice);
  const rate = item.gstRate / 100;
  let baseAmount: number;
  let gstAmount: number;
  let totalAmount: number;

  if (item.inclusive) {
    totalAmount = lineAmount;
    baseAmount = totalAmount / (1 + rate);
    gstAmount = totalAmount - baseAmount;
  } else {
    baseAmount = lineAmount;
    gstAmount = baseAmount * rate;
    totalAmount = baseAmount + gstAmount;
  }

  return {
    id: item.id,
    name: item.name.trim() || 'Line',
    quantity,
    unitPrice: item.unitPrice,
    gstRate: item.gstRate,
    lineAmount,
    baseAmount: round2(baseAmount),
    gstAmount: round2(gstAmount),
    totalAmount: round2(totalAmount),
    fixed: item.fixed,
  };
}

export function computeGstSummary(items: GstItem[]): GstSummary {
  const lines = items.filter((i) => i.unitPrice > 0).map(computeGstLine);
  const subtotal = round2(lines.reduce((s, l) => s + l.baseAmount, 0));
  const totalGst = round2(lines.reduce((s, l) => s + l.gstAmount, 0));
  const grandTotal = round2(lines.reduce((s, l) => s + l.totalAmount, 0));
  return { lines, subtotal, totalGst, grandTotal };
}

/**
 * When the grand total exceeds `targetIdeal`, calculate reductions according
 * to the selected strategy, skipping any fixed/locked lines.
 */
export function adviseGstReduction(
  summary: GstSummary,
  targetIdeal: number,
  strategy: ReductionStrategy = 'equal'
): GstReductionAdvice {
  const { grandTotal, lines } = summary;
  const excess = round2(Math.max(0, grandTotal - targetIdeal));
  const exceedsTarget = excess > 0;
  const count = lines.length;

  const strategyLabels: Record<ReductionStrategy, string> = {
    equal: 'Equal cut across lines',
    proportional: 'Proportional to item total',
    highest_first: 'Cut from largest items first',
  };

  if (!exceedsTarget || count === 0 || targetIdeal <= 0) {
    return {
      exceedsTarget: false,
      targetIdeal,
      excess: 0,
      reductionPerItem: 0,
      strategy,
      strategyLabel: strategyLabels[strategy],
      suggestedLines: lines.map((l) => ({
        ...l,
        reducedTotal: l.totalAmount,
        savedAmount: 0,
        isFixed: l.fixed,
      })),
      message:
        count === 0
          ? 'Add lines to the bill to compare against a target.'
          : targetIdeal <= 0
            ? 'Enter a target amount if you want a cap check.'
            : `Total ₹${grandTotal.toLocaleString('en-IN')} is within ₹${targetIdeal.toLocaleString('en-IN')}.`,
    };
  }

  const unlocked = lines.filter((l) => !l.fixed);
  const unlockedCount = unlocked.length;

  if (unlockedCount === 0) {
    return {
      exceedsTarget: true,
      targetIdeal,
      excess,
      reductionPerItem: 0,
      strategy,
      strategyLabel: strategyLabels[strategy],
      suggestedLines: lines.map((l) => ({
        ...l,
        reducedTotal: l.totalAmount,
        savedAmount: 0,
        isFixed: true,
      })),
      message: `Bill exceeds target by ₹${excess.toLocaleString('en-IN')}, but all lines are locked (fixed). Unlock at least one line to compute cuts.`,
    };
  }

  let suggestedLines: Array<GstLineResult & { reducedTotal: number; savedAmount: number; isFixed?: boolean }> = [];
  let message = '';
  let reductionPerItem = 0;

  if (strategy === 'equal') {
    reductionPerItem = round2(excess / unlockedCount);
    suggestedLines = lines.map((l) => {
      if (l.fixed) {
        return { ...l, reducedTotal: l.totalAmount, savedAmount: 0, isFixed: true };
      }
      const reducedTotal = round2(Math.max(0, l.totalAmount - reductionPerItem));
      return { ...l, reducedTotal, savedAmount: round2(l.totalAmount - reducedTotal), isFixed: false };
    });
    message = `Bill exceeds target by ₹${excess.toLocaleString('en-IN')}. Equal split: cut ₹${reductionPerItem.toLocaleString('en-IN')} from each of the ${unlockedCount} unlocked line${unlockedCount === 1 ? '' : 's'}.`;
  } else if (strategy === 'proportional') {
    const unlockedTotal = unlocked.reduce((sum, l) => sum + l.totalAmount, 0) || 1;
    suggestedLines = lines.map((l) => {
      if (l.fixed) {
        return { ...l, reducedTotal: l.totalAmount, savedAmount: 0, isFixed: true };
      }
      const share = l.totalAmount / unlockedTotal;
      const cut = round2(excess * share);
      const reducedTotal = round2(Math.max(0, l.totalAmount - cut));
      return { ...l, reducedTotal, savedAmount: round2(l.totalAmount - reducedTotal), isFixed: false };
    });
    message = `Bill exceeds target by ₹${excess.toLocaleString('en-IN')}. Proportional split: larger lines take larger cuts to reach ₹${targetIdeal.toLocaleString('en-IN')}.`;
  } else {
    // highest_first
    let remainingExcess = excess;
    // Map of cuts
    const cuts = new Map<string, number>();
    const sortedUnlocked = [...unlocked].sort((a, b) => b.totalAmount - a.totalAmount);
    for (const item of sortedUnlocked) {
      if (remainingExcess <= 0) break;
      const take = Math.min(item.totalAmount, remainingExcess);
      cuts.set(item.id, round2(take));
      remainingExcess -= take;
    }
    suggestedLines = lines.map((l) => {
      if (l.fixed) {
        return { ...l, reducedTotal: l.totalAmount, savedAmount: 0, isFixed: true };
      }
      const cut = cuts.get(l.id) ?? 0;
      const reducedTotal = round2(Math.max(0, l.totalAmount - cut));
      return { ...l, reducedTotal, savedAmount: cut, isFixed: false };
    });
    message = `Bill exceeds target by ₹${excess.toLocaleString('en-IN')}. Highest-first split: absorbed starting from the largest bills.`;
  }

  return {
    exceedsTarget: true,
    targetIdeal,
    excess,
    reductionPerItem,
    strategy,
    strategyLabel: strategyLabels[strategy],
    suggestedLines,
    message,
  };
}
