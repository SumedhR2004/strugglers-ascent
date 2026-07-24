import React, { useState, useEffect } from 'react';
import { storage, getLevelInfo, checkAndTriggerAchievements } from '../lib/storage';
import { Calendar, ChevronRight, Plus, Minus, CheckSquare, Square, Save, RotateCcw, TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as ChartTooltip
} from 'recharts';

export default function HistoryView({ onNotification, activeTab }) {
  const [pastDays, setPastDays] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);
  const [questConfig, setQuestConfig] = useState(null);
  const [reflectionText, setReflectionText] = useState('');

  useEffect(() => {
    loadHistory();
  }, [activeTab, selectedDate]);

  const loadHistory = () => {
    const config = storage.getQuestConfig();
    setQuestConfig(config);

    // Generate list of the last 105 days
    const days = [];
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;

    for (let i = 0; i < 105; i++) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = (new Date(d - tzOffset)).toISOString().slice(0, 10);

      // Load daily log
      const log = storage.getDailyLog(dateStr);
      
      // Calculate completion rate
      const total = Object.keys(config).length;
      const completed = Object.keys(config).filter(id => log.quests[id]?.completed).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      days.push({
        dateStr,
        pct,
        completed,
        total,
        log
      });
    }

    setPastDays(days);

    // If no date is selected yet, select today by default
    if (!selectedDate) {
      const todayStr = (new Date(today - tzOffset)).toISOString().slice(0, 10);
      setSelectedDate(todayStr);
      const todayLog = storage.getDailyLog(todayStr);
      setSelectedLog(todayLog);
      setReflectionText(storage.getReflection(todayStr));
    } else {
      const log = storage.getDailyLog(selectedDate);
      setSelectedLog(log);
      setReflectionText(storage.getReflection(selectedDate));
    }
  };

  const getPaddedHeatmapCells = () => {
    if (pastDays.length === 0) return [];
    
    // Reverse so oldest is first
    const chronoDays = [...pastDays].reverse();
    
    // Find the day of week for the first day (oldest)
    const firstDayDate = new Date(chronoDays[0].dateStr);
    let dayOfWeek = firstDayDate.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Align Mon (0) to Sun (6)
    // Sunday (0) -> 6, Monday (1) -> 0, Tuesday (2) -> 1, etc.
    const startPadding = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    const cells = [];
    // Add placeholders for padding
    for (let i = 0; i < startPadding; i++) {
      cells.push({ isPlaceholder: true, key: `pad-${i}` });
    }
    
    chronoDays.forEach(day => {
      cells.push({ ...day, isPlaceholder: false, key: day.dateStr });
    });
    
    return cells;
  };

  const handleSelectDay = (dateStr) => {
    setSelectedDate(dateStr);
    const log = storage.getDailyLog(dateStr);
    setSelectedLog(log);
    setReflectionText(storage.getReflection(dateStr));
  };

  const updateBackfillValue = (id, delta) => {
    if (!selectedLog || !questConfig) return;

    const config = questConfig[id];
    let currentVal = selectedLog.quests[id]?.value || 0;
    let newVal = Math.max(0, currentVal + delta);
    newVal = Math.round(newVal * 10) / 10;

    const completed = newVal >= config.target;
    const wasCompleted = selectedLog.quests[id]?.completed || false;

    const updatedLog = {
      ...selectedLog,
      quests: {
        ...selectedLog.quests,
        [id]: { completed, value: newVal }
      }
    };

    setSelectedLog(updatedLog);
    storage.saveDailyLog(selectedDate, updatedLog);

    // Award XP if completed
    if (completed && !wasCompleted) {
      const statsState = storage.getStatsState();
      const xpReport = {};

      if (config.stat) {
        const addedXP = config.baseXP;
        statsState[config.stat].cumulativeXP = (statsState[config.stat].cumulativeXP || 0) + addedXP;
        xpReport[config.stat] = addedXP;
      }
      if (config.extraStat && config.extraXP) {
        const addedXP = config.extraXP;
        statsState[config.extraStat].cumulativeXP = (statsState[config.extraStat].cumulativeXP || 0) + addedXP;
        xpReport[config.extraStat] = addedXP;
      }

      storage.saveStatsState(statsState);

      onNotification({
        type: 'quest_complete',
        title: 'HISTORICAL BACKFILL CLEARED',
        desc: `Backfilled ${config.label} for ${selectedDate}. Awarded ${Object.entries(xpReport).map(([k, v]) => `+${v} ${k}`).join(', ')} XP!`,
        quote: "Go ahead and whine. Struggle. Run. Squirm. Fight your way out."
      });

      // Check level-ups
      Object.entries(xpReport).forEach(([statName, xp]) => {
        const currentXP = statsState[statName].cumulativeXP;
        const oldLvl = getLevelInfo(currentXP - xp).level;
        const newLvl = getLevelInfo(currentXP).level;
        if (newLvl > oldLvl) {
          onNotification({
            type: 'level_up',
            title: `${statName} LEVEL UP`,
            desc: `Your ${statName} has hit Level ${newLvl} from your historical efforts.`,
            quote: "Struggle. Run. Squirm. Fight your way out."
          });
        }
      });

      // Check achievements
      const newlyUnlocked = checkAndTriggerAchievements();
      newlyUnlocked.forEach(achId => {
        onNotification({
          type: 'achievement_unlocked',
          title: 'ACHIEVEMENT UNLOCKED',
          desc: `Your retroactive grind has earned a new badge.`,
          quote: "Even if we weak ones struggle, it is our brand."
        });
      });
    }

    // Refresh history stats
    loadHistory();
  };

  const handleSaveReflection = () => {
    storage.saveReflection(selectedDate, reflectionText);
    
    // Automatically set reflection quest completed if it exists
    if (selectedLog && selectedLog.quests && selectedLog.quests.reflection && !selectedLog.quests.reflection.completed) {
      updateBackfillValue('reflection', 1);
    } else {
      onNotification({
        type: 'quest_complete',
        title: 'ARCHIVE ENTRY UPDATED',
        desc: `Reflection journal for ${selectedDate} has been saved.`,
        quote: "Even if we painstakingly piece together something lost, it doesn't mean things will ever go back to how they were."
      });
    }
  };

  const getCellColor = (pct) => {
    if (pct === 100) return 'bg-[#c9a227] border-[#c9a227] text-[#0a0a0a] shadow-[0_0_8px_rgba(201,162,39,0.4)]'; // gold
    if (pct > 75) return 'bg-[#a51c1c] border-[#a51c1c] text-[#e8e6e1]'; // bright red
    if (pct > 30) return 'bg-[#5a0c0c] border-[#5a0c0c] text-brand-bone'; // deep red
    if (pct > 0) return 'bg-[#2a0606] border-[#2a0606] text-brand-gray-light'; // dark red
    return 'bg-[#0f0f0f] border-brand-border text-brand-gray'; // black/gray
  };

  const chartData = pastDays.slice(0, 30).map(day => ({ 
    date: day.dateStr.slice(5), 
    pct: day.pct 
  })).reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Heatmap + Intensity Curve */}
      <div className="lg:col-span-7 space-y-6">
        {/* Heatmap Card */}
        <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-bone border-b border-brand-border pb-3">
            <Calendar className="w-5 h-5 text-brand-red" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">Struggle History Ledger (15-Week Heatmap)</h3>
          </div>

          <div className="flex gap-2.5 pt-2 items-start">
            {/* Day of Week Labels */}
            <div className="flex flex-col justify-between h-[96px] text-[8px] font-mono text-brand-gray uppercase select-none pt-1">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
              <span>Sun</span>
            </div>

            {/* Heatmap Grid wrapping 7 rows tall */}
            <div className="flex-1 flex flex-col flex-wrap h-[115px] gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {getPaddedHeatmapCells().map(cell => {
                if (cell.isPlaceholder) {
                  return (
                    <div 
                      key={cell.key} 
                      className="w-3 h-3 bg-transparent border border-transparent flex-shrink-0"
                    />
                  );
                }

                const formattedDate = new Date(cell.dateStr).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });

                return (
                  <button
                    id={`btn_history_day_${cell.dateStr}`}
                    key={cell.key}
                    onClick={() => handleSelectDay(cell.dateStr)}
                    title={`${formattedDate}: ${cell.pct}% cleared (${cell.completed}/${cell.total} quests)`}
                    className={`w-3 h-3 border transition-all active:scale-90 hover:scale-110 flex-shrink-0 relative cursor-pointer ${
                      selectedDate === cell.dateStr ? 'ring-1 ring-brand-bone scale-105 z-10' : ''
                    } ${getCellColor(cell.pct)}`}
                  />
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 justify-between items-center text-[10px] uppercase font-mono text-brand-gray pt-4 border-t border-brand-border/60">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#c9a227] inline-block border border-[#c9a227]"></span>
              <span>100% Cleared</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#a51c1c] inline-block border border-[#a51c1c]"></span>
              <span>75-99%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#5a0c0c] inline-block border border-[#5a0c0c]"></span>
              <span>30-74%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-[#2a0606] inline-block border border-[#2a0606]"></span>
              <span>1-29%</span>
            </div>
          </div>
        </div>

        {/* Struggle Intensity Curve Area Chart */}
        <div className="border border-brand-border bg-brand-card p-6 shadow-xl flex flex-col justify-between relative min-h-[250px]">
          <div className="flex items-center gap-2 text-brand-bone border-b border-brand-border pb-3">
            <TrendingUp className="w-5 h-5 text-brand-red animate-pulse" />
            <h3 className="font-serif uppercase tracking-widest text-xs font-bold">Struggle Intensity Curve (Past 30 Days)</h3>
          </div>

          <div className="w-full h-44 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a51c1c" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#a51c1c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#404040" 
                  tick={{ fill: '#a3a3a3', fontSize: 8, fontFamily: 'monospace' }} 
                />
                <YAxis 
                  domain={[0, 100]} 
                  stroke="#404040" 
                  tick={{ fill: '#a3a3a3', fontSize: 8, fontFamily: 'monospace' }} 
                />
                <ChartTooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="border border-brand-border bg-[#0d0d0d] p-2 text-[9px] font-mono text-brand-bone shadow-xl">
                          <p className="font-bold">{payload[0].payload.date}</p>
                          <p className="text-brand-gold mt-0.5">Intensity: {payload[0].value}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="pct" 
                  stroke="#a51c1c" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCurve)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Day Inspector / Backfill Log */}
      <div className="lg:col-span-5 border border-brand-border bg-brand-card p-6 shadow-xl flex flex-col justify-between space-y-4">
        {selectedLog && questConfig ? (
          <>
            <div>
              <div className="border-b border-brand-border pb-3 mb-4">
                <span className="text-[10px] font-serif uppercase tracking-widest text-brand-gray-light">Inspecting Ledger</span>
                <h2 className="text-lg font-serif font-black text-brand-red uppercase tracking-widest">{selectedDate}</h2>
              </div>

              {/* Quests Edit (Backfill) List */}
              <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                {Object.entries(questConfig).map(([id, quest]) => {
                  const qLog = selectedLog.quests[id] || { completed: false, value: 0 };
                  return (
                    <div key={id} className="border border-brand-bg bg-[#0d0d0d] p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-bold text-brand-bone uppercase tracking-wider flex items-center gap-1">
                          {qLog.completed ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-gray"></span>
                          )}
                          {quest.label}
                        </span>
                        <span className="font-mono text-brand-gray-light">
                          {qLog.value} / {quest.target} {quest.unit}
                        </span>
                      </div>

                      {/* Control buttons */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex gap-2">
                          <button
                            id={`btn_backfill_dec_${id}`}
                            onClick={() => updateBackfillValue(id, id === 'water' || id === 'meals' ? -1 : -0.5)}
                            disabled={qLog.completed}
                            className="px-2.5 py-0.5 border border-brand-border bg-brand-bg text-[10px] text-brand-bone hover:border-brand-red font-mono disabled:opacity-30"
                          >
                            -
                          </button>
                          <button
                            id={`btn_backfill_inc_${id}`}
                            onClick={() => updateBackfillValue(id, id === 'water' || id === 'meals' ? 1 : 0.5)}
                            disabled={qLog.completed}
                            className="px-2.5 py-0.5 border border-brand-border bg-brand-bg text-[10px] text-brand-bone hover:border-brand-red font-mono disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>

                        <button
                          id={`btn_backfill_check_${id}`}
                          onClick={() => {
                            const isCompleted = qLog.completed;
                            const delta = isCompleted ? -qLog.value : quest.target - qLog.value;
                            updateBackfillValue(id, delta);
                          }}
                          className="text-[9px] font-serif uppercase tracking-widest text-brand-gray-light hover:text-brand-red"
                        >
                          {qLog.completed ? "Mark Incomplete" : "Mark Cleared"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Historical reflection log */}
              <div className="pt-4 border-t border-brand-border/60 space-y-2">
                <label className="text-[10px] text-brand-gray uppercase tracking-widest font-serif font-black block">
                  Historical Reflection Entry
                </label>
                <textarea
                  id="txt_history_reflection"
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="What was conquered on this day?"
                  className="w-full h-20 p-2.5 text-xs border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red transition-all resize-none"
                />
                <button
                  id="btn_history_reflection_save"
                  onClick={handleSaveReflection}
                  className="w-full py-1.5 bg-[#0f0f0f] border border-brand-border hover:border-brand-red text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3 h-3 text-brand-red" /> Save Archive Reflection
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center text-brand-gray py-20 uppercase font-serif text-sm">Select a day to inspect.</div>
        )}
      </div>
    </div>
  );
}
