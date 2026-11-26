<script setup lang="ts">
import { ref } from 'vue';
import { useScheduleAllocator, type ScheduleParams } from './composables/useScheduleAllocator';
import { parseScheduleQueryParams } from './utils/scheduleQueryParams';

const defaultParams: ScheduleParams = {
  startDate: '2026-11-1',
  endDate: '2026-12-31',
  totalHours: 24,
  totalMinutes: 40,
  holidays: [], // いらない
  fixedWeekday: 4,
  fixedBaseMinutes: 60,
  fixedBestMinutes: 120,
  holidayRatio: 0.3,
  bufferRatio: 0.15,
  dynamicMaxRatio: 0.08,
  roundUnitMinutes: 5,
};
const { params: queryParams, invalidParams } = parseScheduleQueryParams(window.location.search);
const params = ref<ScheduleParams>({ ...defaultParams, ...queryParams });

const { result } = useScheduleAllocator(params);

const categoryLabels: Record<string, string> = {
  fixed: '確定枠',
  weekday: '均等4曜日',
  holiday: '土日',
  buffer: '予備日',
};
</script>

<template>
  <div class="planner-container">
    <h2>Time-Orchestrator</h2>

    <div class="controls">
      <div class="control-group">
        <label>開始日: <input type="date" v-model="params.startDate" /></label>
        <label>終了日: <input type="date" v-model="params.endDate" /></label>
      </div>

      <div class="control-group">
        <label>目標時間:
          <input type="number" v-model.number="params.totalHours" min="0" style="width: 60px" /> 時間
          <input type="number" v-model.number="params.totalMinutes" min="0" max="59" style="width: 60px" /> 分
        </label>
      </div>

      <div class="control-group">
        <label>確定曜日:
          <select v-model.number="params.fixedWeekday">
            <option :value="0">日曜</option>
            <option :value="1">月曜</option>
            <option :value="2">火曜</option>
            <option :value="3">水曜</option>
            <option :value="4">木曜</option>
            <option :value="5">金曜</option>
            <option :value="6">土曜</option>
          </select>
        </label>
        <label>基本(分): <input type="number" v-model.number="params.fixedBaseMinutes" step="5" style="width: 65px" /></label>
        <label>最大(分): <input type="number" v-model.number="params.fixedBestMinutes" step="5" style="width: 65px" /></label>
      </div>

      <div class="control-group">
        <label>休日比率: <input type="number" v-model.number="params.holidayRatio" step="0.05" min="0" max="1" style="width: 65px" /></label>
        <label>予備日率: <input type="number" v-model.number="params.bufferRatio" step="0.05" min="0" max="0.5" style="width: 65px" /></label>
        <label>丸め単位(分): <input type="number" v-model.number="params.roundUnitMinutes" step="5" min="1" style="width: 60px" /></label>
      </div>
    </div>

    <p v-if="invalidParams.length" class="query-warning" role="alert">
      無効なクエリパラメータは既定値を使用します: {{ invalidParams.join(', ') }}
    </p>

    <div v-if="result" class="summary-box">
      <p><strong>均等4曜日の割り当て:</strong> 毎日 {{ result.assignedWeekday }}分（上限目安: {{ result.dynamicMaxWeekday }}分）</p>
      <p><strong>確定曜日の割り当て:</strong> 基本 {{ params.fixedBaseMinutes }}分（調子が良い時: {{ params.fixedBestMinutes }}分）</p>
      <p><strong>土休日の割り当て:</strong> 毎日 {{ result.assignedHoliday }}分</p>
      <p>
        <strong>完了予測:</strong> {{ result.completionDate }}
        （確定曜日が最大なら <strong>{{ result.completionDateBest }}</strong> / 予備日: {{ result.bufferDays }}日間）
      </p>
    </div>

    <table v-if="result" class="schedule-table">
      <thead>
        <tr>
          <th>日付</th>
          <th>曜日</th>
          <th>区分</th>
          <th>割り当て時間</th>
          <th>累計時間</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in result.dailySchedules"
          :key="item.date"
          :class="['row-' + item.category, { 'goal-reached': item.cumulativeMinutes >= result.goalTotalMinutes }]"
        >
          <td>{{ item.date }}</td>
          <td>{{ item.weekdayLabel }}</td>
          <td>{{ categoryLabels[item.category] }}</td>
          <td>
            {{ item.assignedMinutes }}分
            <span v-if="item.category === 'fixed'">（最大 {{ item.bestCaseMinutes }}分）</span>
          </td>
          <td>{{ item.cumulativeMinutes }}分 / {{ result.goalTotalMinutes }}分</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.planner-container { max-width: 720px; margin: 0 auto; font-family: sans-serif; }
.controls { background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; display: grid; gap: 10px; }
.control-group { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
.query-warning { color: #b91c1c; }
.summary-box { background: #eef6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin-bottom: 16px; }
.schedule-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.schedule-table th, .schedule-table td { border: 1px solid #ddd; padding: 8px; text-align: center; }
.row-fixed { background-color: #fffbeb; font-weight: bold; }
.row-holiday { background-color: #f9fafb; color: #666; }
.row-buffer { background-color: #f0fdf4; color: #15803d; }
</style>
