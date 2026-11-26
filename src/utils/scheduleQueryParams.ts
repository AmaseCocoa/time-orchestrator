import type { ScheduleParams, Weekday } from '../composables/useScheduleAllocator';

export type ScheduleQueryParams = Partial<
  Pick<
    ScheduleParams,
    | 'holidays'
    | 'fixedWeekday'
    | 'fixedBaseMinutes'
    | 'fixedBestMinutes'
    | 'holidayRatio'
    | 'bufferRatio'
    | 'dynamicMaxRatio'
    | 'roundUnitMinutes'
  >
>;

export function parseScheduleQueryParams(search: string): {
  params: ScheduleQueryParams;
  invalidParams: string[];
} {
  const query = new URLSearchParams(search);
  const params: ScheduleQueryParams = {};
  const invalidParams: string[] = [];

  const readNumber = (
    name: string,
    isValid: (value: number) => boolean,
  ): number | undefined => {
    const rawValue = query.get(name);
    if (rawValue === null) return undefined;

    const value = Number(rawValue);
    if (rawValue.trim() === '' || !Number.isFinite(value) || !isValid(value)) {
      invalidParams.push(name);
      return undefined;
    }
    return value;
  };

  const fixedWeekday = readNumber('fixedWeekday', isWeekday);
  if (fixedWeekday !== undefined && isWeekday(fixedWeekday)) {
    params.fixedWeekday = fixedWeekday;
  }

  const fixedBaseMinutes = readNumber(
    'fixedBaseMinutes',
    (value) => Number.isInteger(value) && value >= 0,
  );
  if (fixedBaseMinutes !== undefined) params.fixedBaseMinutes = fixedBaseMinutes;

  const fixedBestMinutes = readNumber(
    'fixedBestMinutes',
    (value) => Number.isInteger(value) && value >= 0,
  );
  if (fixedBestMinutes !== undefined) params.fixedBestMinutes = fixedBestMinutes;

  const holidayRatio = readNumber(
    'holidayRatio',
    (value) => value >= 0 && value <= 1,
  );
  if (holidayRatio !== undefined) params.holidayRatio = holidayRatio;

  const bufferRatio = readNumber(
    'bufferRatio',
    (value) => value >= 0 && value <= 0.5,
  );
  if (bufferRatio !== undefined) params.bufferRatio = bufferRatio;

  const dynamicMaxRatio = readNumber(
    'dynamicMaxRatio',
    (value) => value >= 0,
  );
  if (dynamicMaxRatio !== undefined) params.dynamicMaxRatio = dynamicMaxRatio;

  const roundUnitMinutes = readNumber(
    'roundUnitMinutes',
    (value) => Number.isInteger(value) && value > 0,
  );
  if (roundUnitMinutes !== undefined) params.roundUnitMinutes = roundUnitMinutes;

  const holidayValues = query.getAll('holidays');
  if (holidayValues.length > 0) {
    const holidays = holidayValues.flatMap((value) => value.split(',').map((date) => date.trim()));
    if (holidays.every(isValidDate)) {
      params.holidays = [...new Set(holidays)];
    } else {
      invalidParams.push('holidays');
    }
  }

  return { params, invalidParams };
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isWeekday(value: number): value is Weekday {
  return Number.isInteger(value) && value >= 0 && value <= 6;
}
