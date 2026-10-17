/**
 * Calculates the next recurrence date handling month-end boundaries and leap years
 * e.g. Jan 31 + 1 month -> Feb 28 (or Feb 29 in leap year)
 *
 * @param {Date|string} currentDate
 * @param {string} recurrenceRule 'Monthly' | 'Quarterly' | 'Annually' | 'One-time'
 * @returns {Date|null}
 */
export function calculateNextRecurrenceDate(currentDate, recurrenceRule) {
  if (recurrenceRule === 'One-time') {
    return null;
  }

  const d = new Date(currentDate);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date provided to recurrence calculation');
  }

  const dayOfMonth = d.getDate();
  const year = d.getFullYear();
  const month = d.getMonth();

  let targetMonth = month;
  let targetYear = year;

  if (recurrenceRule === 'Monthly') {
    targetMonth += 1;
  } else if (recurrenceRule === 'Quarterly') {
    targetMonth += 3;
  } else if (recurrenceRule === 'Annually') {
    targetYear += 1;
  } else {
    return null;
  }

  // Adjust for year rollover if targetMonth >= 12
  if (targetMonth >= 12) {
    targetYear += Math.floor(targetMonth / 12);
    targetMonth = targetMonth % 12;
  }

  // Determine last day of the target month
  // Note: Date(targetYear, targetMonth + 1, 0) gives the last day of targetMonth
  const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // Clamp day to valid days in the target month (e.g., 31 -> 28/29 in Feb, 31 -> 30 in Apr)
  const clampedDay = Math.min(dayOfMonth, daysInTargetMonth);

  // Construct nextDate safely without intermediate month rollover
  const nextDate = new Date(
    targetYear,
    targetMonth,
    clampedDay,
    d.getHours(),
    d.getMinutes(),
    d.getSeconds(),
    d.getMilliseconds()
  );

  return nextDate;
}

/**
 * Checks if a given year is a leap year
 */
export function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default {
  calculateNextRecurrenceDate,
  isLeapYear,
};
