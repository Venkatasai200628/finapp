export type GstItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  /** GST rate in percent, e.g. 5, 12, 18, 28. */
  gstRate: number;
  /** When true, unitPrice already includes GST. */
  inclusive: boolean;
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
};

export type GstSummary = {
  lines: GstLineResult[];
  subtotal: number;
  totalGst: number;
  grandTotal: number;
};

export type GstReductionAdvice = {
  exceedsTarget: boolean;
  targetIdeal: number;
  excess: number;
  reductionPerItem: number;
  suggestedLines: Array<GstLineResult & { reducedTotal: number; savedAmount: number }>;
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
 * When the grand total exceeds `targetIdeal`, cut the same rupee amount from
 * every line — 1 line, 3 lines, or 20 lines all work the same way.
 */
export function adviseGstReduction(summary: GstSummary, targetIdeal: number): GstReductionAdvice {
  const { grandTotal, lines } = summary;
  const excess = round2(Math.max(0, grandTotal - targetIdeal));
  const exceedsTarget = excess > 0;
  const count = lines.length;

  if (!exceedsTarget || count === 0 || targetIdeal <= 0) {
    return {
      exceedsTarget: false,
      targetIdeal,
      excess: 0,
      reductionPerItem: 0,
      suggestedLines: lines.map((l) => ({ ...l, reducedTotal: l.totalAmount, savedAmount: 0 })),
      message:
        count === 0
          ? 'Add lines to the bill to compare against a target.'
          : targetIdeal <= 0
            ? 'Enter a target amount if you want a cap check.'
            : `Total ₹${grandTotal.toLocaleString('en-IN')} is within ₹${targetIdeal.toLocaleString('en-IN')}.`,
    };
  }

  const reductionPerItem = round2(excess / count);
  const suggestedLines = lines.map((l) => {
    const reducedTotal = round2(Math.max(0, l.totalAmount - reductionPerItem));
    return { ...l, reducedTotal, savedAmount: round2(l.totalAmount - reducedTotal) };
  });

  const message =
    `Bill exceeds target by ₹${excess.toLocaleString('en-IN')}. ` +
    `Cut ₹${reductionPerItem.toLocaleString('en-IN')} from each of the ${count} line${count === 1 ? '' : 's'} ` +
    `to reach ₹${targetIdeal.toLocaleString('en-IN')}.`;

  return {
    exceedsTarget: true,
    targetIdeal,
    excess,
    reductionPerItem,
    suggestedLines,
    message,
  };
}
