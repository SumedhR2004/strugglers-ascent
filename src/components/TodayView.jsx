import React, { useState, useEffect } from 'react';
import { storage, awardXPForQuest, checkAndTriggerAchievements, getLevelInfo, getRankInfo, getRandomQuote, DEFAULT_QUESTS } from '../lib/storage';
import { 
  Brain, Dumbbell, Droplet, Moon, Utensils, PenTool, CheckSquare, Square, 
  Plus, Minus, Flame, ShieldAlert, Award, Star, BookOpen, Terminal,
  Play, Pause, RotateCcw, Timer, Music, Volume2, VolumeX
} from 'lucide-react';
import { audioController } from '../lib/audio';
import { BrandSigil } from './BrandSigil';

function RankBadge({ rankName }) {
  const [imageError, setImageError] = useState(false);
  
  useEffect(() => {
    setImageError(false);
  }, [rankName]);

  const getRankConfig = (name) => {
    if (name.includes("Novice")) {
      return {
        file: "/rank_novice.png",
        letter: "N",
        color: "text-brand-gray-light border-brand-border/60",
        label: "Novice"
      };
    }
    if (name.includes("Vanguard")) {
      return {
        file: "/rank_vanguard.png",
        letter: "V",
        color: "text-sky-400 border-sky-500/40",
        label: "Vanguard"
      };
    }
    if (name.includes("Champion")) {
      return {
        file: "/rank_champion.png",
        letter: "C",
        color: "text-brand-red border-brand-red",
        label: "Champion"
      };
    }
    return { file: null, letter: "?", color: "text-brand-gray border-brand-border" };
  };

  const config = getRankConfig(rankName);

  if (config.file && !imageError) {
    return (
      <img 
        src={config.file} 
        alt={rankName} 
        onError={() => setImageError(true)}
        className="w-full h-full object-cover animate-fade-in"
      />
    );
  }

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center p-1 border text-center select-none ${config.color} bg-[#0b0b0b] relative`}>
      <span className="text-xl font-serif font-black tracking-tighter uppercase">{config.letter}</span>
      <span className="text-[7px] font-mono tracking-widest uppercase mt-0.5 text-brand-gray opacity-80">{config.label}</span>
      <span className="text-[5px] font-sans text-brand-gray/60 uppercase absolute bottom-1">Artwork Pending</span>
    </div>
  );
}

export default function TodayView({ onNotification, activeTab, setActiveTab }) {
  const [dateStr, setDateStr] = useState('');
  const [log, setLog] = useState(null);
  const [questConfig, setQuestConfig] = useState(null);
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);

  // Focus Timer States
  const [timerDuration, setTimerDuration] = useState(
    parseInt(localStorage.getItem('brand-timer-duration') || '1500')
  ); // default 25 mins (1500s)
  const [timeLeft, setTimeLeft] = useState(parseInt(localStorage.getItem('brand-timer-duration') || '1500'));
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState('focus'); // 'focus' | 'rest'
  const [customMin, setCustomMin] = useState('25');

  // Audio Control States
  const [musicPlaying, setMusicPlaying] = useState(
    audioController.isMusicEnabled() && !audioController.isMuted()
  );
  const [musicVolume, setMusicVolume] = useState(audioController.getVolume());
  const [sfxEnabled, setSfxEnabled] = useState(!audioController.isMuted());

  useEffect(() => {
    const handleAudioStateChange = () => {
      setMusicPlaying(audioController.isMusicEnabled() && !audioController.isMuted());
      setMusicVolume(audioController.getVolume());
      setSfxEnabled(!audioController.isMuted());
    };
    window.addEventListener('audio-state-changed', handleAudioStateChange);
    return () => window.removeEventListener('audio-state-changed', handleAudioStateChange);
  }, []);

  const handleToggleMusicWidget = () => {
    const nextMusic = !audioController.isMusicEnabled();
    audioController.setMusicEnabled(nextMusic);
    if (nextMusic) {
      audioController.startAmbientDrone();
    } else {
      audioController.stopAmbientDrone();
    }
    setMusicPlaying(nextMusic && !audioController.isMuted());
    window.dispatchEvent(new Event('audio-state-changed'));
  };

  const handleToggleSfxWidget = () => {
    const nextMuted = sfxEnabled;
    audioController.setMuted(nextMuted);
    setSfxEnabled(!nextMuted);
    window.dispatchEvent(new Event('audio-state-changed'));
  };

  const handleVolumeSliderChange = (e) => {
    const vol = parseFloat(e.target.value);
    setMusicVolume(vol);
    audioController.setVolume(vol);
    window.dispatchEvent(new Event('audio-state-changed'));
  };

  // Direct preset loading from dashboard
  const handleLoadPresetsDirectly = () => {
    storage.saveQuestConfig(DEFAULT_QUESTS);
    setQuestConfig(DEFAULT_QUESTS);
    const updatedLog = storage.getDailyLog(dateStr);
    setLog(updatedLog);

    onNotification({
      type: 'quest_complete',
      title: 'PRESETS LOADED',
      desc: 'Standard struggles loaded to your quest board successfully.',
      quote: "Let them keep their clean towers. My domain is here—in the mud, the sweat, and the ash. This is where my iron is forged."
    });
    audioController.playLevelUp();
  };

  useEffect(() => {
    let interval = null;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      audioController.playClang();
      
      if (timerMode === 'focus') {
        onNotification({
          type: 'daily_clear',
          title: 'FOCUS SESSION COMPLETED',
          desc: 'You completed your focus block! Rest now and prepare for the next round.',
          quote: "If you are met by a wall, you must break it down."
        });
        setTimerMode('rest');
        setTimeLeft(300); // 5 mins rest
      } else {
        onNotification({
          type: 'quest_complete',
          title: 'REST PERIOD ENDED',
          desc: 'Rest has concluded. Re-arm yourself and return to the struggle.',
          quote: "Keep your eyes locked on the horizon. Looking back only summons the ghosts of what you could not save."
        });
        setTimerMode('focus');
        setTimeLeft(timerDuration);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft, timerMode, timerDuration]);

  const handleStartPauseTimer = () => {
    setTimerRunning(!timerRunning);
  };

  const handleResetTimer = () => {
    setTimerRunning(false);
    setTimeLeft(timerMode === 'focus' ? timerDuration : 300);
  };

  const handleSetPresetTimer = (mins, mode = 'focus') => {
    setTimerRunning(false);
    setTimerMode(mode);
    const secs = mins * 60;
    if (mode === 'focus') {
      setTimerDuration(secs);
      localStorage.setItem('brand-timer-duration', secs.toString());
    }
    setTimeLeft(secs);
  };

  const handleApplyCustomTime = (e) => {
    e.preventDefault();
    const mins = Math.max(1, parseInt(customMin) || 25);
    handleSetPresetTimer(mins, 'focus');
  };

  useEffect(() => {
    const today = new Date();
    // Simple format YYYY-MM-DD
    const tzOffset = today.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(today - tzOffset)).toISOString().slice(0, 10);
    setDateStr(localISOTime);
  }, [activeTab]);

  useEffect(() => {
    if (!dateStr) return;
    loadDayData();
  }, [dateStr]);

  const loadDayData = () => {
    const dailyLog = storage.getDailyLog(dateStr);
    const config = storage.getQuestConfig();
    const statsState = storage.getStatsState();
    const streakState = storage.getStreakData();

    setLog(dailyLog);
    setQuestConfig(config);
    setStats(statsState);
    setStreak(streakState);

    // Perform daily streak decay check if we haven't checked today
    performStreakDecayCheck(streakState, dailyLog);
  };

  const performStreakDecayCheck = (streakState, dailyLog) => {
    const today = new Date(dateStr);
    if (!streakState.lastCompletedDate) return;

    const lastDate = new Date(streakState.lastCompletedDate);
    const diffTime = today - lastDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // If more than 1 day has passed without completions (and the day hasn't already been cleared)
    if (diffDays > 1 && streakState.currentStreak > 0) {
      const decayedStreak = {
        ...streakState,
        currentStreak: 0,
        brandIntensity: Math.max(20, streakState.brandIntensity - (15 * (diffDays - 1)))
      };
      storage.saveStreakData(decayedStreak);
      setStreak(decayedStreak);

      onNotification({
        type: 'streak_decay',
        title: 'THE BRAND DIMS',
        desc: `You faltered in your struggle. Current streak reset to 0. Brand intensity decayed to ${decayedStreak.brandIntensity}%.`,
        quote: "Frail, scarred, and outmatched—we march forward regardless. That is our resolve. Stand up."
      });
    }
  };

  if (!log || !questConfig || !stats || !streak) {
    return <div className="py-20 text-center text-brand-gray-light font-serif">LOADING THE SYSTEM...</div>;
  }

  const getQuestIcon = (quest) => {
    const stat = quest?.stat || 'PER';
    switch (stat) {
      case 'INT': return <Brain className="w-5 h-5 text-purple-400" />;
      case 'STR': return <Dumbbell className="w-5 h-5 text-red-500" />;
      case 'AGI': return <Flame className="w-5 h-5 text-amber-500" />;
      case 'VIT': return <Droplet className="w-5 h-5 text-sky-400" />;
      case 'PER': return <PenTool className="w-5 h-5 text-orange-400" />;
      default: return <CheckSquare className="w-5 h-5 text-brand-bone" />;
    }
  };

  const updateQuestValue = (id, delta) => {
    const config = questConfig[id];
    
    let currentVal = log.quests[id]?.value || 0;
    let newVal = Math.max(0, currentVal + delta);
    // Round to 1 decimal place to prevent floating issues
    newVal = Math.round(newVal * 10) / 10;

    const completed = newVal >= config.target;
    const wasCompleted = log.quests[id]?.completed || false;

    const updatedLog = {
      ...log,
      quests: {
        ...log.quests,
        [id]: { completed, value: newVal }
      }
    };

    setLog(updatedLog);
    storage.saveDailyLog(dateStr, updatedLog);

    // Award XP if completed just now
    if (completed && !wasCompleted) {
      audioController.playClang();
      
      const statsState = storage.getStatsState();
      const xpReport = {};
      
      // Award main stat
      if (config.stat) {
        const addedXP = config.baseXP;
        statsState[config.stat].cumulativeXP = (statsState[config.stat].cumulativeXP || 0) + addedXP;
        xpReport[config.stat] = addedXP;
      }
      // Award extra stat
      if (config.extraStat && config.extraXP) {
        const addedXP = config.extraXP;
        statsState[config.extraStat].cumulativeXP = (statsState[config.extraStat].cumulativeXP || 0) + addedXP;
        xpReport[config.extraStat] = addedXP;
      }

      storage.saveStatsState(statsState);
      setStats(statsState);

      // Check level ups
      const levelUpNotifications = [];
      Object.entries(xpReport).forEach(([statName, xp]) => {
        const oldXP = statsState[statName].cumulativeXP - xp;
        const oldLvl = getLevelInfo(oldXP).level;
        const newLvl = getLevelInfo(statsState[statName].cumulativeXP).level;
        if (newLvl > oldLvl) {
          levelUpNotifications.push({ statName, level: newLvl });
        }
      });

      // System notification for completing quest
      onNotification({
        type: 'quest_complete',
        title: 'QUEST OBJECTIVE SECURED',
        desc: `${config.label} completed! Gained ${Object.entries(xpReport).map(([k, v]) => `+${v} ${k}`).join(', ')}.`,
        quote: getRandomQuote()
      });

      // Trigger level-up popups if any
      levelUpNotifications.forEach(notif => {
        onNotification({
          type: 'level_up',
          title: 'LIMIT BREAK: LEVEL UP',
          desc: `Your ${notif.statName} has climbed to Level ${notif.level}! The System rewards your persistence.`,
          quote: "If you are met by a wall, you must break it down."
        });
      });

      // Check for achievements
      const newlyUnlocked = checkAndTriggerAchievements();
      newlyUnlocked.forEach(achId => {
        onNotification({
          type: 'achievement_unlocked',
          title: 'THE BRAND DEEPENS: ACHIEVEMENT UNLOCKED',
          desc: `You unlocked the badge [${storage.getQuestConfig() !== null ? storage.getQuestConfig() : ''} - Check achievements sheet].`,
          quote: "Cry out. Whine. Twist and fight. But never cease your struggle."
        });
      });

      // Check if all quests of today are cleared
      checkDailyClear(updatedLog);
    }
  };

  const checkDailyClear = (currentLog) => {
    const allCompleted = Object.entries(questConfig).every(([id, q]) => {
      return currentLog.quests[id]?.completed === true;
    });

    if (allCompleted && !currentLog.xpRewarded) {
      // 1. Mark completed
      const updatedLog = { ...currentLog, xpRewarded: true, completedAt: new Date().toISOString() };
      storage.saveDailyLog(dateStr, updatedLog);
      setLog(updatedLog);

      // 2. Update streak data
      const streakState = storage.getStreakData();
      const isNewStreakDay = streakState.lastCompletedDate !== dateStr;
      
      let nextStreak = streakState.currentStreak;
      if (isNewStreakDay) {
        nextStreak += 1;
      }
      
      const nextLongest = Math.max(streakState.longestStreak, nextStreak);
      const nextIntensity = Math.min(100, streakState.brandIntensity + 10);

      const updatedStreak = {
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastCompletedDate: dateStr,
        brandIntensity: nextIntensity
      };
      
      storage.saveStreakData(updatedStreak);
      setStreak(updatedStreak);

      // 3. Award daily completion XP bonus (+30 XP to PER, +10 to VIT)
      const statsState = storage.getStatsState();
      statsState.PER.cumulativeXP = (statsState.PER.cumulativeXP || 0) + 30;
      statsState.VIT.cumulativeXP = (statsState.VIT.cumulativeXP || 0) + 10;
      storage.saveStatsState(statsState);
      setStats(statsState);

      // 4. Trigger popups
      onNotification({
        type: 'daily_clear',
        title: 'DAILY QUESTS CLEARED',
        desc: `You survived another day of struggle! Bonus: +30 PER XP, +10 VIT XP. Brand Intensity is now ${nextIntensity}%. Streak is ${nextStreak} days!`,
        quote: "Some embrace the quiet grave, but we choose the long, scarred road. We live on."
      });

      // Check achievements again for streak rewards
      const newlyUnlocked = checkAndTriggerAchievements();
      newlyUnlocked.forEach(achId => {
        onNotification({
          type: 'achievement_unlocked',
          title: 'THE BRAND DEEPENS: ACHIEVEMENT UNLOCKED',
          desc: `Your daily grind unlocked a new legendary badge. Check the gallery.`,
          quote: "Frail, scarred, and outmatched—we march forward regardless."
        });
      });
    }
  };

  const handleManualCheck = (id) => {
    const config = questConfig[id];
    const isCompleted = log.quests[id]?.completed || false;
    
    // Toggle completion. If completing, set to target value. If clearing, set to 0.
    const delta = isCompleted ? -log.quests[id].value : config.target - (log.quests[id]?.value || 0);
    updateQuestValue(id, delta);
  };

  // Get total progress percentage of daily quests
  const totalQuestsCount = Object.keys(questConfig).length;
  const completedQuestsCount = Object.keys(questConfig).filter(id => log.quests[id]?.completed).length;
  const completionRate = totalQuestsCount > 0 ? Math.round((completedQuestsCount / totalQuestsCount) * 100) : 0;

  // Rank Display
  const rankInfo = getRankInfo(stats);

  return (
    <div className="space-y-6">
      {/* Top Brand Meter and Rank Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Brand Meter */}
        <div className="border border-brand-border bg-brand-card p-6 flex items-center justify-between shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-950/10 rounded-full blur-2xl group-hover:bg-red-900/20 transition-all duration-500 pointer-events-none" />
          <div className="space-y-2">
            <h3 className="text-xs font-serif uppercase tracking-widest text-brand-gray-light">Streak Status</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-black text-brand-red">{streak.currentStreak}</span>
              <span className="text-xs text-brand-gray uppercase">Days Active</span>
            </div>
            <p className="text-[10px] text-brand-gray-light uppercase tracking-wider">
              Longest Streak: <span className="text-brand-gold">{streak.longestStreak} days</span>
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            {/* Visual Brand glowing according to intensity */}
            <div 
              style={{ opacity: streak.brandIntensity / 100, filter: `drop-shadow(0 0 ${streak.brandIntensity / 10}px rgba(139, 0, 0, 0.8))` }}
              className="text-brand-red transition-all duration-500 animate-pulse-slow"
            >
              <BrandSigil size="w-12 h-12" />
            </div>
            <span className="text-[9px] font-mono text-brand-gray uppercase mt-2">Brand: {streak.brandIntensity}%</span>
          </div>
        </div>

        {/* Current Rank Panel */}
        <div className="md:col-span-2 border border-brand-border bg-brand-card p-6 shadow-lg relative overflow-hidden flex flex-col sm:flex-row gap-6 justify-between items-center">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-950/10 rounded-full blur-2xl pointer-events-none" />
          
          {/* Rank info and progress (takes left side) */}
          <div className="flex-1 w-full space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="text-xs font-serif uppercase tracking-widest text-brand-gray-light">Active Fighter Arc</h3>
                <h2 className="text-lg font-serif font-bold text-brand-bone tracking-wide">{rankInfo.rank}</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-brand-gold bg-brand-bg/80 border border-brand-border/40 px-2.5 py-0.5">Total XP: {rankInfo.totalCumulativeXP}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-brand-gray uppercase tracking-widest">
                <span>Struggle Progression</span>
                <span>Next Rank: {rankInfo.nextRank}</span>
              </div>
              <div className="h-2 w-full bg-brand-bg border border-brand-border overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-red to-brand-gold transition-all duration-700" 
                  style={{ width: `${rankInfo.progress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Badge Frame Slot (takes right side) */}
          <div className="flex-shrink-0 w-20 h-20 bg-brand-bg border border-brand-border relative flex items-center justify-center overflow-hidden shadow-inner">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,39,0.08)_0%,transparent_70%)]" />
            <RankBadge rankName={rankInfo.rank} />
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Daily Quest Board */}
        <div className="lg:col-span-8 space-y-6">
          {totalQuestsCount === 0 ? (
            <div className="border border-dashed border-brand-border bg-brand-card/50 p-8 text-center space-y-4 rounded-none">
              <div className="text-brand-red flex justify-center">
                <ShieldAlert className="w-12 h-12 animate-pulse" />
              </div>
              <h3 className="font-serif uppercase tracking-widest text-sm font-bold text-brand-bone">NO ACTIVE STRUGGLES FORGED</h3>
              <p className="text-xs text-brand-gray-light max-w-md mx-auto leading-relaxed">
                "In this world, those who surrender to the quiet are already dead." You have no quests configured for today.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-4 py-2 bg-brand-red border border-brand-red hover:bg-transparent text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all cursor-pointer font-bold"
                >
                  Go to Settings to Customize
                </button>
                <button
                  onClick={handleLoadPresetsDirectly}
                  className="px-4 py-2 bg-[#0d0d0d] border border-brand-border hover:border-brand-gold text-brand-gray hover:text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all cursor-pointer font-bold"
                >
                  Load Default Presets
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-brand-border pb-4 gap-4">
                <div>
                  <h2 className="text-xl font-serif text-brand-bone uppercase tracking-wider">The Daily Quest Board</h2>
                  <p className="text-xs text-brand-gray uppercase tracking-wider">
                    Date: <span className="font-mono text-brand-gold">{dateStr}</span> | Daily Completion: <span className="font-mono text-brand-red">{completionRate}%</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-serif uppercase tracking-widest text-brand-gray-light">Daily Targets Status</span>
                  <div className="h-6 px-3 bg-brand-bg border border-brand-border text-brand-bone font-mono text-xs flex items-center justify-center">
                    {completedQuestsCount}/{totalQuestsCount} Cleared
                  </div>
                </div>
              </div>

              {/* Quest List */}
              <div className="divide-y divide-brand-border/60">
                {Object.entries(questConfig).map(([id, quest]) => {
                  const questLog = log.quests[id] || { completed: false, value: 0 };
                  return (
                    <div 
                      key={id} 
                      className={`py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300 ${
                        questLog.completed ? 'bg-brand-red/5 px-2 border-brand-red/30' : ''
                      }`}
                    >
                      {/* Left: Checkbox + Quest Title & Stats details */}
                      <div className="flex items-start gap-3 flex-1">
                        <button
                          id={`btn_quest_check_${id}`}
                          onClick={() => handleManualCheck(id)}
                          className="mt-0.5 text-brand-red hover:text-brand-red-light focus:outline-none transition-colors"
                        >
                          {questLog.completed ? (
                            <CheckSquare className="w-5 h-5 fill-brand-red text-brand-bone" />
                          ) : (
                            <Square className="w-5 h-5 text-brand-gray" />
                          )}
                        </button>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {getQuestIcon(quest)}
                            <span className={`text-sm font-serif font-bold tracking-wide uppercase ${
                              questLog.completed ? 'line-through text-brand-gray' : 'text-brand-bone'
                            }`}>
                              {quest.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-[10px] font-mono text-brand-gold uppercase bg-brand-bg px-2 py-0.5 border border-brand-border/40">
                              Target: {quest.target} {quest.unit}
                            </span>
                            <span className="text-[10px] font-mono text-brand-red-light uppercase bg-brand-bg px-2 py-0.5 border border-brand-border/40">
                              +{quest.baseXP} {quest.stat} XP
                            </span>
                            {quest.extraStat && (
                              <span className="text-[10px] font-mono text-emerald-600 uppercase bg-brand-bg px-2 py-0.5 border border-brand-border/40">
                                +{quest.extraXP} {quest.extraStat} XP
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Logging and details */}
                      <div className="flex items-center justify-between md:justify-end gap-6 md:w-80">
                        {/* Quest Value controls */}
                        <div className="flex items-center gap-3">
                          <button
                            id={`btn_quest_dec_${id}`}
                            onClick={() => updateQuestValue(id, id === 'water' || id === 'meals' ? -1 : -0.5)}
                            disabled={questLog.completed}
                            className="w-6 h-6 border border-brand-border bg-brand-bg hover:bg-brand-red/20 disabled:opacity-30 flex items-center justify-center transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 text-brand-bone" />
                          </button>
                          
                          <span className="w-16 text-center font-mono text-sm text-brand-bone font-bold">
                            {questLog.value} <span className="text-[10px] font-sans text-brand-gray">{quest.unit}</span>
                          </span>

                          <button
                            id={`btn_quest_inc_${id}`}
                            onClick={() => updateQuestValue(id, id === 'water' || id === 'meals' ? 1 : 0.5)}
                            disabled={questLog.completed}
                            className="w-6 h-6 border border-brand-border bg-brand-bg hover:bg-brand-red/20 disabled:opacity-30 flex items-center justify-center transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-brand-bone" />
                          </button>
                        </div>

                        {/* Completion Tag */}
                        <div className="w-20 text-right">
                          {questLog.completed ? (
                            <span className="text-[10px] font-serif uppercase tracking-widest text-brand-gold font-bold">SECURED</span>
                          ) : (
                            <span className="text-[10px] font-serif uppercase tracking-widest text-brand-gray">PENDING</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Focus Timer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 text-brand-bone">
                <Timer className="w-5 h-5 text-brand-red" />
                <h3 className="font-serif uppercase tracking-widest text-sm font-bold">The Struggle Timer</h3>
              </div>
              <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${
                timerMode === 'focus' ? 'border-brand-red text-brand-red bg-red-950/10' : 'border-emerald-600 text-emerald-500 bg-emerald-950/10'
              }`}>
                {timerMode === 'focus' ? 'Focus Mode' : 'Rest Mode'}
              </span>
            </div>

            {/* Large Timer Countdown display */}
            <div className="flex flex-col items-center justify-center py-6 bg-[#090909] border border-brand-border/40 relative">
              <span className="text-5xl font-mono font-bold text-brand-bone tracking-wider">
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-sans text-brand-gray uppercase tracking-widest mt-1">
                {timerRunning ? 'STRUGGLE RUNNING' : 'STRUGGLE PAUSED'}
              </span>
            </div>

            {/* Timer Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                id="btn_timer_toggle"
                onClick={handleStartPauseTimer}
                className={`py-2 px-4 border font-serif text-[10px] uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 ${
                  timerRunning
                    ? 'bg-[#1a0f0f] border-brand-red text-brand-red hover:bg-brand-red hover:text-brand-bone'
                    : 'bg-brand-red border-brand-red text-brand-bone hover:bg-transparent'
                }`}
              >
                {timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" /> Start Focus
                  </>
                )}
              </button>

              <button
                id="btn_timer_reset"
                onClick={handleResetTimer}
                className="py-2 px-4 bg-[#0a0a0a] border border-brand-border hover:border-brand-gold text-brand-gray hover:text-brand-bone font-serif text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Quick Timer Presets */}
            <div className="space-y-2.5 pt-4 border-t border-brand-border/40">
              <h4 className="text-[10px] font-serif text-brand-bone uppercase tracking-wider">Interval Presets</h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  id="btn_preset_25"
                  onClick={() => handleSetPresetTimer(25, 'focus')}
                  className="py-1 bg-[#090909] border border-brand-border text-brand-bone text-[9px] font-mono hover:border-brand-red transition-all cursor-pointer"
                >
                  25m
                </button>
                <button
                  id="btn_preset_50"
                  onClick={() => handleSetPresetTimer(50, 'focus')}
                  className="py-1 bg-[#090909] border border-brand-border text-brand-bone text-[9px] font-mono hover:border-brand-red transition-all cursor-pointer"
                >
                  50m
                </button>
                <button
                  id="btn_preset_rest_5"
                  onClick={() => handleSetPresetTimer(5, 'rest')}
                  className="py-1 bg-[#090909] border border-brand-border text-emerald-500 text-[9px] font-mono hover:border-emerald-600 transition-all cursor-pointer"
                >
                  5m R
                </button>
                <button
                  id="btn_preset_rest_15"
                  onClick={() => handleSetPresetTimer(15, 'rest')}
                  className="py-1 bg-[#090909] border border-brand-border text-emerald-500 text-[9px] font-mono hover:border-emerald-600 transition-all cursor-pointer"
                >
                  15m R
                </button>
              </div>
            </div>

            {/* Custom timer form */}
            <form onSubmit={handleApplyCustomTime} className="space-y-2 pt-4 border-t border-brand-border/40">
              <h4 className="text-[10px] font-serif text-brand-bone uppercase tracking-wider">Custom Focus Duration</h4>
              <div className="flex gap-2">
                <input
                  id="input_custom_minutes"
                  type="number"
                  min="1"
                  max="720"
                  value={customMin}
                  onChange={(e) => setCustomMin(e.target.value)}
                  placeholder="Minutes"
                  className="flex-1 px-3 py-1 bg-brand-bg border border-brand-border text-brand-bone text-xs font-mono outline-none focus:border-brand-red"
                  required
                />
                <button
                  id="btn_apply_custom_timer"
                  type="submit"
                  className="px-4 py-1 bg-[#0a0a0a] border border-brand-border hover:border-brand-gold text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>

          {/* The Battle Hymn Audio Widget Card */}
          <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <div className="flex items-center gap-2 text-brand-bone">
                <Music className="w-4 h-4 text-brand-gold animate-pulse" />
                <h3 className="font-serif uppercase tracking-widest text-xs font-bold text-brand-bone">The Battle Hymn</h3>
              </div>
              <span className="text-[8px] font-mono text-brand-gray uppercase">Audio Core</span>
            </div>

            {/* Rotating Vinyl visualizer */}
            <div className="flex items-center gap-3.5 py-3 px-3 bg-[#090909] border border-brand-border/40 relative">
              <div className="relative flex-shrink-0">
                <div 
                  className={`w-12 h-12 rounded-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-950 border border-neutral-700 flex items-center justify-center relative shadow-[0_0_10px_rgba(0,0,0,0.8)] ${musicPlaying ? 'animate-spin' : ''}`}
                  style={{ animationDuration: '8s' }}
                >
                  {/* Vinyl grooves */}
                  <div className="w-8 h-8 rounded-full border border-neutral-700/40 absolute" />
                  <div className="w-5 h-5 rounded-full border border-neutral-800/60 absolute" />
                  {/* Center label */}
                  <div className="w-3 h-3 rounded-full bg-brand-red border border-black flex items-center justify-center z-10">
                    <div className="w-1 h-1 rounded-full bg-[#090909]" />
                  </div>
                </div>
                {/* Tone arm */}
                <div 
                  className={`w-1.5 h-5 bg-neutral-600 border border-neutral-800 rounded-full absolute -top-1 -right-0.5 origin-top-left transition-transform duration-500 ${musicPlaying ? 'rotate-12' : '-rotate-12'}`}
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="text-[8px] font-mono text-brand-gray uppercase block tracking-wider">Now Playing</span>
                <span className="text-[10px] font-serif font-black text-brand-bone tracking-wide uppercase truncate block">Lone Wolf Theme</span>
                <span className="text-[7px] font-mono text-brand-gold uppercase block mt-0.5">Gapless Loop Active</span>
              </div>
            </div>

            {/* Audio Controls */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <button
                id="btn_widget_play_toggle"
                onClick={handleToggleMusicWidget}
                className={`flex-1 py-1.5 border text-[9px] font-serif uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  musicPlaying 
                    ? 'bg-[#1a0f0f] border-brand-red text-brand-red hover:bg-brand-red hover:text-brand-bone' 
                    : 'bg-brand-red border-brand-red text-brand-bone hover:bg-transparent'
                }`}
              >
                {musicPlaying ? (
                  <>
                    <Pause className="w-3 h-3" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3" /> Play
                  </>
                )}
              </button>

              <button
                id="btn_widget_sfx_toggle"
                onClick={handleToggleSfxWidget}
                className={`px-3 py-1.5 border text-[9px] font-serif uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                  sfxEnabled 
                    ? 'border-brand-border text-brand-bone hover:border-brand-red hover:text-brand-red' 
                    : 'border-brand-red text-brand-red hover:bg-brand-red hover:text-brand-bone'
                }`}
                title={sfxEnabled ? "Mute All" : "Unmute All"}
              >
                {sfxEnabled ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{sfxEnabled ? "Mute" : "Unmute"}</span>
              </button>
            </div>

            {/* Slider */}
            <div className="space-y-1 pt-1.5 border-t border-brand-border/20">
              <div className="flex justify-between text-[8px] font-mono text-brand-gray uppercase tracking-wider">
                <span>Volume</span>
                <span className="text-brand-gold">{Math.round(musicVolume * 100)}%</span>
              </div>
              <input
                id="slider_widget_volume"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={musicVolume}
                onChange={handleVolumeSliderChange}
                className="w-full h-1 bg-brand-bg border border-brand-border rounded-none appearance-none cursor-pointer accent-brand-red animate-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
