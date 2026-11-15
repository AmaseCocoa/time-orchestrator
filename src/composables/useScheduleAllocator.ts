import { computed, type Ref } from 'vue';

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface ScheduleParams {
  startDate: string;
  endDate: string;
  totalHours: number;
  totalMinutes: number;
  holidays: string[];
  fixedWeekday: Weekday;
  fixedBaseMinutes: number;
  fixedBestMinutes: number;
  holidayRatio: number;
  bufferRatio: number;
  dynamicMaxRatio: number;
  roundUnitMinutes: number;
}

export interface DailySchedule {
  date: string;
  weekdayLabel: string;
  category: 'fixed' | 'weekday' | 'holiday' | 'buffer';
  assignedMinutes: number;
  bestCaseMinutes: number;
  cumulativeMinutes: number;
}

const WEEKDAY_LABELS = ['日', '月', '火', '水', '木', '金', '土'];

export function useScheduleAllocator(params: Ref<ScheduleParams>) {
  const result = computed(() => {
    const p = params.value;
    const goalTotalMinutes = p.totalHours * 60 + p.totalMinutes;
    const holidaySet = new Set(p.holidays);
    const allDates = generateDateRange(p.startDate, p.endDate);
    const totalDays = allDates.length;

    if (totalDays === 0 || goalTotalMinutes <= 0) {
      return null;
    }

    const bufferDays = Math.round(totalDays * p.bufferRatio);
    const initialTargetDays = Math.max(1, totalDays - bufferDays);

    const dynamicMaxWeekday = Math.max(
      30,
      Math.min(120, goalTotalMinutes * p.dynamicMaxRatio)
    );

    const classify = (dateStr: string): 'fixed' | 'holiday' | 'weekday' => {
      const day = parseDateUTC(dateStr).getUTCDay() as Weekday;
      if (day === p.fixedWeekday) return 'fixed';
      if (day === 0 || day === 6 || holidaySet.has(dateStr)) return 'holiday';
      return 'weekday';
    };

    let chosenTargetDays = totalDays;
    let rawWeekday = 0;
    let rawHoliday = 0;

    for (let dCount = initialTargetDays; dCount <= totalDays; dCount++) {
      const subDates = allDates.slice(0, dCount);
      const counts = { fixed: 0, weekday: 0, holiday: 0 };
      for (const d of subDates) {
        counts[classify(d)]++;
      }

      const remMinutes = goalTotalMinutes - counts.fixed * p.fixedBaseMinutes;
      const denominator = counts.weekday + counts.holiday * p.holidayRatio;

      const tWeekday = denominator > 0 ? Math.max(0, remMinutes / denominator) : 0;
      const tHoliday = tWeekday * p.holidayRatio;

      if (tWeekday <= dynamicMaxWeekday || dCount === totalDays) {
        chosenTargetDays = dCount;
        rawWeekday = tWeekday;
        rawHoliday = tHoliday;
        break;
      }
    }

    const roundUp = (val: number) =>
      val === 0 ? 0 : Math.ceil(val / p.roundUnitMinutes) * p.roundUnitMinutes;

    const assignedWeekday = roundUp(rawWeekday);
    const assignedHoliday = roundUp(rawHoliday);

    let cumulative = 0;
    let cumulativeBest = 0;
    let completionDate = allDates[allDates.length - 1];
    let completionDateBest = allDates[allDates.length - 1];
    let doneBase = false;
    let doneBest = false;

    const dailySchedules: DailySchedule[] = allDates.map((dateStr, idx) => {
      const dayNum = parseDateUTC(dateStr).getUTCDay() as Weekday;
      const isBuffer = idx >= chosenTargetDays;
      const baseCat = classify(dateStr);

      let assigned = 0;
      let best = 0;

      if (!isBuffer) {
        if (baseCat === 'fixed') {
          assigned = p.fixedBaseMinutes;
          best = p.fixedBestMinutes;
        } else if (baseCat === 'weekday') {
          assigned = assignedWeekday;
          best = assignedWeekday;
        } else {
          assigned = assignedHoliday;
          best = assignedHoliday;
        }
      }

      cumulative += assigned;
      cumulativeBest += best;

      if (!doneBase && cumulative >= goalTotalMinutes) {
        completionDate = dateStr;
        doneBase = true;
      }
      if (!doneBest && cumulativeBest >= goalTotalMinutes) {
        completionDateBest = dateStr;
        doneBest = true;
      }

      return {
        date: dateStr,
        weekdayLabel: WEEKDAY_LABELS[dayNum],
        category: isBuffer ? 'buffer' : baseCat,
        assignedMinutes: assigned,
        bestCaseMinutes: best,
        cumulativeMinutes: cumulative,
      };
    });

    return {
      goalTotalMinutes,
      totalDays,
      targetDays: chosenTargetDays,
      bufferDays: totalDays - chosenTargetDays,
      targetEndDate: allDates[chosenTargetDays - 1],
      dynamicMaxWeekday: Math.round(dynamicMaxWeekday * 10) / 10,
      assignedWeekday,
      assignedHoliday,
      completionDate,
      completionDateBest,
      dailySchedules,
    };
  });

  return { result };
}

function parseDateUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function generateDateRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const curr = parseDateUTC(startStr);
  const end = parseDateUTC(endStr);
  while (curr <= end) {
    const y = curr.getUTCFullYear();
    const m = String(curr.getUTCMonth() + 1).padStart(2, '0');
    const d = String(curr.getUTCDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    curr.setUTCDate(curr.getUTCDate() + 1);
  }
  return dates;
}
