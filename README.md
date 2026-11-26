# Time-Orchestrator

スケジュール設定はURLのクエリパラメータで上書きできます。開始日・終了日・目標時間はクエリから変更せず、画面上の既定値を使用します。

| パラメータ | 内容 | 例 |
| --- | --- | --- |
| `fixedWeekday` | 固定曜日（日曜=0〜土曜=6） | `fixedWeekday=4` |
| `fixedBaseMinutes` | 固定曜日の基本時間（分） | `fixedBaseMinutes=60` |
| `fixedBestMinutes` | 固定曜日の最大時間（分） | `fixedBestMinutes=120` |
| `holidayRatio` | 休日の割り当て比率（0〜1） | `holidayRatio=0.3` |
| `bufferRatio` | 予備日率（0〜0.5） | `bufferRatio=0.15` |
| `dynamicMaxRatio` | 平日の上限時間を求める比率 | `dynamicMaxRatio=0.08` |
| `roundUnitMinutes` | 割り当て時間の丸め単位（分） | `roundUnitMinutes=5` |
| `holidays` | 追加の休日（`YYYY-MM-DD`、複数指定可） | `holidays=2026-12-25&holidays=2026-12-28` |

例: `/?fixedWeekday=2&fixedBaseMinutes=45&bufferRatio=0.2&holidays=2026-12-25`

省略した項目は既定値のままです。値が無効な項目は既定値を使用し、画面に警告を表示します。
