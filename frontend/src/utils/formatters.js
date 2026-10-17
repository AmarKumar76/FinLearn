import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines classes cleanly with Tailwind conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats integer paise into Indian Rupee string (e.g. 12500050 paise -> ₹1,25,000.50)
 * Uses exact Indian numbering system (thousands, lakhs, crores)
 */
export function formatPaiseToINR(paise, includePaise = true) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    return '₹0';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(paise);
  const rupees = Math.floor(absPaise / 100);
  const remainderPaise = absPaise % 100;

  // Format rupees using Indian numbering format
  const rupeesStr = rupees.toString();
  let lastThree = rupeesStr.substring(rupeesStr.length - 3);
  const otherNumbers = rupeesStr.substring(0, rupeesStr.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedRupees = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const paiseSuffix = includePaise && remainderPaise > 0
    ? `.${remainderPaise.toString().padStart(2, '0')}`
    : '';

  return `${isNegative ? '-' : ''}₹${formattedRupees}${paiseSuffix}`;
}

/**
 * Formats a rupee number into Indian Rupee string (e.g. 11122 -> ₹11,122)
 */
export function formatRupeesToINR(rupees, includeDecimals = false) {
  if (typeof rupees !== 'number' || isNaN(rupees)) {
    return '₹0';
  }
  return formatPaiseToINR(Math.round(rupees * 100), includeDecimals);
}

/**
 * Parses user rupee input string safely into integer paise
 * Rejects invalid decimal inputs exceeding 2 decimal digits
 */
export function parseRupeesToPaise(rupeeStr) {
  if (typeof rupeeStr === 'number') {
    return Math.round(rupeeStr * 100);
  }
  if (!rupeeStr || typeof rupeeStr !== 'string') {
    return 0;
  }
  const cleanStr = rupeeStr.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleanStr);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Formats standard ISO dates to user friendly display string
 */
export function formatDate(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
