import React, { useState, useEffect } from 'react';
import { storage, getRandomQuote, getLevelInfo, checkAndTriggerAchievements } from '../lib/storage';
import { PenTool, Search, Save, Calendar, Trash2 } from 'lucide-react';

export default function ReflectionJournal({ onNotification, activeTab }) {
  const [dateStr, setDateStr] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyReflections, setHistoryReflections] = useState([]);
  const [strugglerQuote, setStrugglerQuote] = useState('');

  useEffect(() => {
    const today = new Date();
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISO = (new Date(today - tzOffset)).toISOString().slice(0, 10);
    setDateStr(localISO);

    setStrugglerQuote(getRandomQuote());
  }, [activeTab]);

  useEffect(() => {
    if (!dateStr) return;
    setReflectionText(storage.getReflection(dateStr));
    loadReflectionHistory();
  }, [dateStr, activeTab]);

  const loadReflectionHistory = () => {
    try {
      const logs = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('brand-reflections:')) {
          const date = key.replace('brand-reflections:', '');
          const text = JSON.parse(localStorage.getItem(key));
          if (text && text.trim()) {
            logs.push({ date, text });
          }
        }
      }
      
      // Sort reverse chronological
      logs.sort((a, b) => b.date.localeCompare(a.date));
      setHistoryReflections(logs);
    } catch (e) {
      console.error("Failed to load reflection history:", e);
    }
  };

  const handleSaveReflection = (e) => {
    e.preventDefault();
    storage.saveReflection(dateStr, reflectionText);

    // Complete the daily reflection quest automatically
    const dailyLog = storage.getDailyLog(dateStr);
    const wasCompleted = dailyLog.quests?.reflection?.completed || false;

    if (!wasCompleted && reflectionText.trim() !== '') {
      // Award XP for reflection quest (PER stat)
      const config = storage.getQuestConfig();
      const refQuest = config.reflection;

      const updatedLog = {
        ...dailyLog,
        quests: {
          ...dailyLog.quests,
          reflection: { completed: true, value: 1 }
        }
      };
      
      storage.saveDailyLog(dateStr, updatedLog);

      const statsState = storage.getStatsState();
      const oldXP = statsState.PER.cumulativeXP || 0;
      statsState.PER.cumulativeXP = oldXP + refQuest.baseXP;
      storage.saveStatsState(statsState);

      onNotification({
        type: 'quest_complete',
        title: 'REFLECTION COMMITTED',
        desc: `Reflection saved. Gained +${refQuest.baseXP} PER XP!`,
        quote: strugglerQuote
      });

      // Check level up
      const oldLvl = getLevelInfo(oldXP).level;
      const newLvl = getLevelInfo(statsState.PER.cumulativeXP).level;
      if (newLvl > oldLvl) {
        onNotification({
          type: 'level_up',
          title: 'PER LEVEL UP',
          desc: `Your Perception/Discipline (PER) has climbed to Level ${newLvl}! Clear sight in the darkness.`,
          quote: "Even if we struggle against fate, we move forward."
        });
      }

      // Check achievements
      const newlyUnlocked = checkAndTriggerAchievements();
      newlyUnlocked.forEach(achId => {
        onNotification({
          type: 'achievement_unlocked',
          title: 'THE BRAND DEEPENS: ACHIEVEMENT UNLOCKED',
          desc: `Your daily reflection unlocked a new mark in your profile.`,
          quote: "Struggle, fight, and carve your own path."
        });
      });
    } else {
      onNotification({
        type: 'quest_complete',
        title: 'REFLECTION SAVED',
        desc: 'Daily reflection updated successfully.',
        quote: strugglerQuote
      });
    }

    loadReflectionHistory();
  };

  const handleDeleteReflection = (dateToDelete) => {
    if (window.confirm(`Are you sure you want to purge reflection for ${dateToDelete}?`)) {
      localStorage.removeItem(`brand-reflections:${dateToDelete}`);
      
      // Update completion to false if it was completed
      const dailyLog = storage.getDailyLog(dateToDelete);
      if (dailyLog.quests && dailyLog.quests.reflection) {
        dailyLog.quests.reflection = { completed: false, value: 0 };
        storage.saveDailyLog(dateToDelete, dailyLog);
      }

      if (dateToDelete === dateStr) {
        setReflectionText('');
      }

      loadReflectionHistory();
    }
  };

  // Filter reflections based on search query
  const filteredReflections = historyReflections.filter(log => {
    return log.date.includes(searchQuery) || log.text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Daily Reflection Input */}
      <div className="lg:col-span-6 border border-brand-border bg-brand-card p-6 shadow-xl flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 text-brand-bone border-b border-brand-border pb-3 mb-4">
            <PenTool className="w-5 h-5 text-brand-red" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">Write Reflections Ledger</h3>
          </div>
          
          <p className="text-xs text-brand-gray-light leading-relaxed italic border-l-2 border-brand-red/50 pl-3 py-1 mb-6">
            "{strugglerQuote}"
          </p>

          <form onSubmit={handleSaveReflection} className="space-y-4">
            <div>
              <label className="text-[10px] text-brand-gray uppercase tracking-widest font-serif block mb-1">
                Reflections of Today ({dateStr})
              </label>
              <h4 className="text-xs font-serif text-brand-gold uppercase mb-2">
                What did you conquer today? What tried to loosen your resolve?
              </h4>
              <textarea
                id="txt_daily_reflection"
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Log your struggle here... Record what went well, and where you faltered. Keep it raw."
                className="w-full h-64 p-3 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red transition-all resize-none text-xs leading-relaxed"
              />
            </div>

            <button
              id="btn_save_reflection"
              type="submit"
              className="w-full py-2.5 bg-brand-red border border-brand-red text-brand-bone text-xs font-serif uppercase tracking-widest hover:bg-transparent hover:text-brand-red-light transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(139,0,0,0.3)]"
            >
              <Save className="w-4 h-4" /> Save Entry (+15 PER XP)
            </button>
          </form>
        </div>
      </div>

      {/* Historical Reflections List */}
      <div className="lg:col-span-6 border border-brand-border bg-brand-card p-6 shadow-xl space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold text-brand-bone">Struggle Chronicle</h3>
            <span className="text-[10px] font-mono text-brand-gray uppercase">{historyReflections.length} Entries Recorded</span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              id="input_reflection_search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keywords or date..."
              className="w-full pl-9 pr-3 py-2 border border-brand-border bg-brand-bg text-brand-bone text-xs rounded-none outline-none focus:border-brand-red transition-all"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-brand-gray" />
          </div>

          {/* Scrolling list */}
          <div className="space-y-4 max-h-[26rem] overflow-y-auto pr-1">
            {filteredReflections.length === 0 ? (
              <p className="text-center text-xs text-brand-gray py-20 uppercase font-serif">No archives found matching the query.</p>
            ) : (
              filteredReflections.map(log => (
                <div key={log.date} className="border border-brand-border bg-[#0d0d0d] p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center border-b border-brand-border/40 pb-1.5">
                    <span className="font-serif font-black text-brand-red uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {log.date}
                    </span>
                    <button
                      id={`btn_delete_reflection_${log.date}`}
                      onClick={() => handleDeleteReflection(log.date)}
                      className="text-brand-gray hover:text-brand-red transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-brand-bone font-sans leading-relaxed whitespace-pre-wrap">
                    {log.text}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
