import * as XLSX from 'xlsx';

export type ParsedStatementRow = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  timestamp: number;
  source: string;
  dateLabel: string;
  rawDescription: string;
};

export type ParseResult = {
  rows: ParsedStatementRow[];
  skipped: number;
  errors: string[];
};

function parseIndianDate(raw: string): number | null {
  const s = String(raw ?? '').trim();

  const serial = Number(s);
  if (!Number.isNaN(serial) && serial > 1000) {
    const d = XLSX.SSF.parse_date_code(serial);
    if (d) return new Date(d.y, d.m - 1, d.d).getTime();
  }

  const dmy = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) {
    const year = dmy[3].length === 2 ? 2000 + Number(dmy[3]) : Number(dmy[3]);
    return new Date(year, Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  }
  const ymd = s.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
  if (ymd) return new Date(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3])).getTime();
  const parsed = Date.parse(s);
  return Number.isNaN(parsed) ? null : parsed;
}

function toNumber(raw: unknown): number {
  const cleaned = String(raw ?? '').replace(/[₹,\s"]/g, '').replace(/\((.*)\)/, '-$1');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function extractMerchantAndCategory(rawDesc: string): { merchant: string; category: string } {
  const text = String(rawDesc || '').trim();
  const upper = text.toUpperCase();

  let merchant = '';
  let upiHandle = '';

  // 1. Indian UPI formats:
  // Examples:
  // DEP TFR   UPI/CR/373153462446/Google P/utib/playstore1/UPI 0097733162090 AT 00858 KAVALI
  // WDL TFR   UPI/DR/661047468230/RAVULA N/UBIN/8885607939/Paid 0097691162095 AT 00858 KAVALI
  // WDL TFR   UPI/DR/967579383914/REVIVE GYM/KARB/reviverame/Pa 0097691162095 AT 00858 KAVALI
  // WDL TFR   UPI/DR/661052542923/SOPANAM /YESB/paytm.s1bj/Paid 0097691162095 AT 00858 KAVALI
  const upiMatch = text.match(/UPI[/-](?:CR|DR|P2A|P2M|P2P)[/-]([A-Za-z0-9]+)[/-]([^/]+)(?:[/-]([^/]+))?(?:[/-]([^/]+))?/i);
  if (upiMatch) {
    merchant = upiMatch[2]?.trim() || '';
    upiHandle = (upiMatch[4] || upiMatch[3] || '').trim();
  } else {
    // UPI with RRN first: UPI/123456789012/Merchant/Bank...
    const upiSimple = text.match(/UPI[/-]([A-Za-z0-9]{8,16})[/-]([^/]+)/i);
    if (upiSimple) {
      merchant = upiSimple[2]?.trim() || '';
    } else {
      // Any general UPI occurrence
      const upiIndex = upper.indexOf('UPI');
      if (upiIndex !== -1) {
        const parts = text.slice(upiIndex).split(/[/|\-@]/).map((p) => p.trim());
        const ignore = ['UPI', 'CR', 'DR', 'P2A', 'P2M', 'P2P', 'INT', 'REV', 'RETURN', 'PAID', 'PAY'];
        for (let i = 1; i < parts.length; i++) {
          const p = parts[i];
          if (p.length >= 3 && !ignore.includes(p.toUpperCase()) && !/^\d+$/.test(p) && !p.toUpperCase().startsWith('UTR')) {
            merchant = p;
            break;
          }
        }
      }
    }
  }

  // 2. NEFT / IMPS / RTGS
  if (!merchant && (upper.includes('NEFT') || upper.includes('IMPS') || upper.includes('RTGS'))) {
    const parts = text.split(/[/|\-@_]/).map((p) => p.trim());
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      if (
        p.length >= 3 &&
        !/^\d+$/.test(p) &&
        !/^(NEFT|IMPS|RTGS|DR|CR|NETBANKING|FT|WDL|DEP|TFR)$/i.test(p) &&
        !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(p)
      ) {
        merchant = p;
        break;
      }
    }
  }

  // 3. Autopay / NACH / APY / Subscriptions
  if (!merchant && (upper.includes('APY') || upper.includes('NACH') || upper.includes('ACH') || upper.includes('AUTOPAY'))) {
    if (upper.includes('APY')) {
      merchant = 'Atal Pension Yojana (APY)';
    } else if (upper.includes('SIP') || upper.includes('MUTUAL')) {
      merchant = 'Mutual Fund SIP';
    } else {
      merchant = 'Bank Autopay';
    }
  }

  // 4. Fallback cleanup: strip leading DEP TFR / WDL TFR / POS / ECOM
  if (!merchant) {
    let cleaned = text
      .replace(/^(DEP|WDL|TO|BY)\s+(TFR|TRANSFER)\s*/i, '')
      .replace(/^(POS|ECOM|TRF|TRANSFER)\s*/i, '')
      .split(/[/|@\-_\n]/)[0]
      .trim();
    cleaned = cleaned.replace(/\s+\d+.*$/, '').trim();
    merchant = cleaned || 'Bank Entry';
  }

  // Strip trailing bank noise and extra spaces
  merchant = merchant.replace(/\s+/g, ' ').trim();
  if (/^Google\s*P$/i.test(merchant) || /playstore/i.test(text)) {
    merchant = 'Google Play';
  }
  if (/sopanam/i.test(merchant) || /sopanam/i.test(text)) {
    merchant = 'Sopanam Canteen';
  }
  // Convert ALL CAPS to Clean Title Case
  if (merchant === merchant.toUpperCase() && merchant.length > 2) {
    merchant = merchant
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  // Category determination
  const combined = `${merchant} ${text} ${upiHandle}`.toLowerCase();
  let category = 'Uncategorized';

  if (/salary|sal cr|payroll|stipend|interest cr/.test(combined)) {
    category = 'Income';
  } else if (/trading|zerodha|groww|upstox|angel|demat|nse|bse|stocks|shares|sharekhan|motilal|mutual\s*fund|sip\b/.test(combined)) {
    category = 'Trading';
  } else if (/sopanam|canteen|food|swiggy|zomato|restaurant|cafe|bakery|eats|dhaba|bhoj|pizza|burger|kitchen|mess|tiffin|tea|coffee|hotel|biryani|sweets/.test(combined)) {
    category = 'Food';
  } else if (/gym|fitness|workout|revive|cult|crossfit|yoga|netflix|spotify|prime|hotstar|youtube|subscription|autopay|nach|apy|emi|loan|insurance|lic|playstore|google play/.test(combined)) {
    category = 'Subscription';
  } else if (/grocery|dmart|bigbasket|bazaar|supermarket|kirana|spencers|reliance fresh|provision|vegetable|fruits|milk|dairy/.test(combined)) {
    category = 'Groceries';
  } else if (/amazon|flipkart|myntra|shopee|mart|store|retail|apparel|clothing|shoes|fashion|stationery|fancy|mall|electronics/.test(combined)) {
    category = 'Shopping';
  } else if (/uber|ola|petrol|fuel|irctc|rapido|metro|transport|auto|cab|bus|air|indigo|railway/.test(combined)) {
    category = 'Transport';
  } else if (/upi|neft|imps|rtgs|transfer|trf|wdl|atm|cash|ravula|prasada|balakris/.test(combined)) {
    category = 'Transfer';
  }

  return { merchant, category };
}

type ColumnMap = {
  date?: number;
  description?: number;
  debit?: number;
  credit?: number;
  amount?: number;
  type?: number;
};

function detectColumns(header: string[]): ColumnMap {
  const lower = header.map((h) => String(h ?? '').toLowerCase().trim());
  const find = (...keys: string[]) => lower.findIndex((h) => keys.some((k) => h.includes(k)));

  const map: ColumnMap = {
    date: find('date', 'txn date', 'transaction date', 'value date', 'posted date'),
    description: find('description', 'narration', 'particulars', 'remarks', 'details', 'transaction remarks'),
    debit: find('debit', 'withdrawal', 'dr amount', 'debit amount'),
    credit: find('credit', 'deposit', 'cr amount', 'credit amount'),
    amount: find('amount', 'txn amount', 'transaction amount'),
    type: find('dr/cr', 'type', 'cr/dr', 'transaction type'),
  };

  Object.keys(map).forEach((k) => {
    const key = k as keyof ColumnMap;
    if ((map[key] as number) === -1) map[key] = undefined;
  });
  return map;
}

function bestSheet(wb: XLSX.WorkBook): XLSX.WorkSheet | null {
  let best: XLSX.WorkSheet | null = null;
  let bestRows = 0;
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    const ref = ws['!ref'];
    if (!ref) continue;
    const range = XLSX.utils.decode_range(ref);
    const rows = range.e.r - range.s.r + 1;
    if (rows > bestRows) {
      bestRows = rows;
      best = ws;
    }
  }
  return best;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => String(c ?? '').toLowerCase().trim());
    const hasDate = cells.some((c) => c.includes('date'));
    const hasDesc = cells.some((c) =>
      ['description', 'narration', 'particulars', 'remarks', 'details'].some((k) => c.includes(k))
    );
    if (hasDate && hasDesc) return i;
  }
  return 0;
}

/**
 * Parse an Excel bank statement from a Buffer.
 * Expects the buffer to be ALREADY DECRYPTED if it had a password.
 */
export function parseExcelStatementNode(data: Buffer): ParseResult {
  let wb: XLSX.WorkBook;

  try {
    wb = XLSX.read(data, {
      type: 'buffer',
      cellDates: false,
      cellText: false,
      raw: true,
    });
  } catch (e: any) {
    const msg = e instanceof Error ? e.message : String(e);
    const isPassword =
      msg.toLowerCase().includes('password') ||
      msg.toLowerCase().includes('encrypt') ||
      msg.toLowerCase().includes('protected');

    return {
      rows: [],
      skipped: 0,
      errors: [isPassword ? 'WRONG_PASSWORD' : `Could not open the file: ${msg}`],
    };
  }

  const ws = bestSheet(wb);
  if (!ws) return { rows: [], skipped: 0, errors: ['No usable sheet found in the workbook.'] };

  const allRows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  if (allRows.length < 2) {
    return { rows: [], skipped: 0, errors: ['Sheet appears empty — check the file.'] };
  }

  const headerIdx = findHeaderRow(allRows);
  const header = (allRows[headerIdx] as unknown[]).map((c) => String(c ?? ''));
  const cols = detectColumns(header);

  if (cols.date === undefined || cols.description === undefined) {
    return {
      rows: [],
      skipped: allRows.length - headerIdx - 1,
      errors: [
        'Could not find Date and Description/Narration columns. ' +
          'Columns found: ' + header.filter(Boolean).join(', '),
      ],
    };
  }

  const rows: ParsedStatementRow[] = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < allRows.length; i++) {
    const parts = allRows[i] as unknown[];
    const dateRaw = String(parts[cols.date!] ?? '').trim();
    const desc = String(parts[cols.description!] ?? '').trim();
    if (!desc) { skipped++; continue; }

    let amount = 0;
    if (cols.debit !== undefined || cols.credit !== undefined) {
      const debit = cols.debit !== undefined ? toNumber(parts[cols.debit]) : 0;
      const credit = cols.credit !== undefined ? toNumber(parts[cols.credit]) : 0;
      if (Number.isFinite(debit) && debit > 0) amount = -debit;
      else if (Number.isFinite(credit) && credit > 0) amount = credit;
      else { skipped++; continue; }
    } else if (cols.amount !== undefined) {
      const rawAmt = toNumber(parts[cols.amount]);
      if (!Number.isFinite(rawAmt) || rawAmt === 0) { skipped++; continue; }
      const typeCol = cols.type !== undefined ? String(parts[cols.type] ?? '').toLowerCase() : '';
      if (typeCol.startsWith('dr') || typeCol === 'debit') amount = -Math.abs(rawAmt);
      else if (typeCol.startsWith('cr') || typeCol === 'credit') amount = Math.abs(rawAmt);
      else amount = rawAmt;
    } else {
      skipped++;
      continue;
    }

    const ts = parseIndianDate(dateRaw) ?? Date.now();
    const { merchant, category } = extractMerchantAndCategory(desc);
    rows.push({
      id: `xl-${i}-${ts}`,
      merchant,
      category,
      amount,
      timestamp: ts,
      source: 'bank_statement',
      dateLabel: dateRaw || new Date(ts).toLocaleDateString('en-IN'),
      rawDescription: desc,
    });
  }

  const errors: string[] = [];
  if (rows.length === 0 && skipped > 0) {
    errors.push('No valid rows parsed — make sure Debit/Credit or Amount columns exist.');
  }
  return { rows, skipped, errors };
}
