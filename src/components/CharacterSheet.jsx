import React, { useState, useEffect } from 'react';
import { storage, getLevelInfo, checkAndTriggerAchievements } from '../lib/storage';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Dumbbell, Flame, TrendingUp, Trophy, Plus, Trash2, Shield, Swords, Sparkles, Lock, Check } from 'lucide-react';

const WEAPONS = [
  { id: 'dagger', name: 'Tethered Dagger', desc: 'A rusty dagger. Your struggle has just begun.', req: 'Default unlocked' },
  { id: 'greatsword', name: 'Iron Slab Greatsword', desc: 'A massive hunk of raw iron. Demands high Strength.', req: 'Requires STR Level 5', check: (levels) => levels.STR >= 5 },
  { id: 'dragonslayer', name: 'Dragon-Slayer Blade', desc: 'Too thick, too heavy, and too rough to be called a sword. Legend says it can cleave dragons.', req: 'Requires STR Level 10', check: (levels) => levels.STR >= 10 },
  { id: 'scroll', name: 'Scroll of Runic Seals', desc: 'A parchment inscribed with ancient equations to focus the mind.', req: 'Requires INT Level 5', check: (levels) => levels.INT >= 5 },
  { id: 'grimoire', name: 'Grimoire of the Void', desc: 'A dark ledger filled with logic-defying algorithms.', req: 'Requires INT Level 10', check: (levels) => levels.INT >= 10 }
];

const ARMORS = [
  { id: 'rags', name: 'Tattered Rag Cloak', desc: 'Simple worn cloth. Offers minimal protection against fate.', req: 'Default unlocked' },
  { id: 'chainmail', name: 'Ashen Chainmail', desc: 'Standard steel chain links forged in ashes.', req: 'Requires VIT Level 5', check: (levels) => levels.VIT >= 5 },
  { id: 'berserker', name: 'Berserker Carapace', desc: 'A cursed iron suit that fuels your relentless drive to move forward.', req: 'Requires VIT Level 10', check: (levels) => levels.VIT >= 10 },
  { id: 'assassin', name: 'Shadow Assassin Garb', desc: 'Light weight silent leather that blends with shadows.', req: 'Requires AGI Level 5', check: (levels) => levels.AGI >= 5 },
  { id: 'shroud', name: 'Void-Stalker Shroud', desc: 'A cloak woven from dark energy that bends space around you.', req: 'Requires AGI Level 10', check: (levels) => levels.AGI >= 10 }
];

const RELICS = [
  { id: 'ring', name: 'Dull Brass Ring', desc: 'A simple band. Provides comfort in dark times.', req: 'Default unlocked' },
  { id: 'talisman', name: 'Talisman of Resolve', desc: 'A heavy medallion carved with the symbol of the Beast of Resolve.', req: 'Requires PER Level 5', check: (levels) => levels.PER >= 5 },
  { id: 'unbroken', name: 'Mark of the Unbroken', desc: 'A runic sigil burned into your mind. Earned by pure consistency.', req: 'Requires 7-Day Streak', check: (levels, streak) => (streak?.longestStreak || 0) >= 7 || (streak?.currentStreak || 0) >= 7 },
  { id: 'eclipse_sigil', name: 'Red Eclipse Sigil', desc: 'The ultimate seal of the survivor. You conquered the eclipse.', req: 'Requires 10k+ Total XP', check: (levels, streak, totalXP) => totalXP >= 10000 }
];

const CHARACTER_TIERS = [
  { 
    tier: 1, 
    title: 'Masked Struggler', 
    desc: 'Equipped with tattered rags and a wooden mask. A simple survivor of the initial tragedy.', 
    class: 'Deprived', 
    glow: 'shadow-[0_0_20px_rgba(165,28,28,0.25)] border-brand-border/60',
    banner: 'bg-brand-border/10 text-brand-gray-light',
    color: 'text-brand-gray-light',
    req: 'Default unlocked'
  },
  { 
    tier: 2, 
    title: 'Vanguard Knight', 
    desc: 'Armed with basic steel armor and a shield. Forging your path through the wilderness.', 
    class: 'Warrior', 
    glow: 'shadow-[0_0_20px_rgba(56,189,248,0.3)] border-sky-500/40',
    banner: 'bg-sky-500/10 text-sky-400',
    color: 'text-sky-400',
    req: 'Requires Ashen Chainmail / Shadow Assassin Garb or Level 10+'
  },
  { 
    tier: 3, 
    title: 'Ashen Crusader', 
    desc: 'Cursed steel infused with molten embers. Your blade burns through adversity.', 
    class: 'Ember-Knight', 
    glow: 'shadow-[0_0_25px_rgba(249,115,22,0.4)] border-orange-500/50',
    banner: 'bg-orange-500/10 text-orange-400',
    color: 'text-orange-400',
    req: 'Requires Berserker Carapace or Level 20+'
  },
  { 
    tier: 4, 
    title: 'Void Monarch', 
    desc: 'Wrapped in shadow armor. The shadows bend to your indomitable will.', 
    class: 'Shadow-Sovereign', 
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.4)] border-purple-500/50',
    banner: 'bg-purple-500/10 text-purple-400',
    color: 'text-purple-400',
    req: 'Requires Void-Stalker Shroud or Level 30+'
  },
  { 
    tier: 5, 
    title: 'Eclipse Sovereign', 
    desc: 'The ultimate survivor of the dark eclipse. Wearing the crown of unmatched resolve.', 
    class: 'God-Hand Slayer', 
    glow: 'shadow-[0_0_35px_rgba(239,68,68,0.5)] border-brand-red',
    banner: 'bg-brand-red/10 text-brand-red',
    color: 'text-brand-red',
    req: 'Requires Red Eclipse Sigil or Level 40+'
  }
];

function CharacterPortrait({ tier, title }) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [tier]);

  if (imageError) {
    return (
      <div className="w-full h-full min-h-[220px] bg-brand-bg border border-brand-border/40 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="text-center space-y-3 z-10">
          <div className="w-14 h-14 mx-auto rounded-full bg-brand-red/10 border border-brand-red/35 flex items-center justify-center text-brand-red animate-pulse">
            <Swords className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-[9px] font-mono text-brand-red tracking-widest uppercase">[ ARTWORK AWAITING ]</h4>
            <p className="text-[9px] text-brand-gray-light leading-relaxed max-w-[190px] mx-auto mt-1">
              Place <code className="text-brand-gold bg-[#0e0e0e] px-1 py-0.5 text-[8.5px]">char_tier{tier}.png</code> in your <code className="text-brand-gold bg-[#0e0e0e] px-1 py-0.5 text-[8.5px]">public/</code> folder to summon your Struggler.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={`/char_tier${tier}.png`}
      alt={title}
      onError={() => setImageError(true)}
      className="w-full h-full min-h-[220px] object-cover border border-brand-border/40 object-center transition-all duration-75"
    />
  );
}

export default function CharacterSheet({ onNotification, activeTab }) {
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [cardioLog, setCardioLog] = useState([]);
  
  // Equipped Gear States
  const [equippedWeapon, setEquippedWeapon] = useState(localStorage.getItem('brand-eq-weapon') || 'dagger');
  const [equippedArmor, setEquippedArmor] = useState(localStorage.getItem('brand-eq-armor') || 'rags');
  const [equippedRelic, setEquippedRelic] = useState(localStorage.getItem('brand-eq-relic') || 'ring');
  const [selectedGearTab, setSelectedGearTab] = useState('weapons');

  // Custom Character Appearance Override
  const [appearanceOverride, setAppearanceOverride] = useState(
    localStorage.getItem('brand-char-avatar-override') ? parseInt(localStorage.getItem('brand-char-avatar-override')) : null
  );
  const [showAppearanceSelector, setShowAppearanceSelector] = useState(false);

  // Exercise states
  const [exerciseName, setExerciseName] = useState('');
  const [setsCount, setSetsCount] = useState(3);
  const [repsCount, setRepsCount] = useState(10);
  const [weightValue, setWeightValue] = useState('');

  // Cardio states
  const [cardioActivity, setCardioActivity] = useState('');
  const [cardioMinutes, setCardioMinutes] = useState(20);

  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    loadCharacterData();
  }, [activeTab]);

  const loadCharacterData = () => {
    const statsState = storage.getStatsState();
    setStats(statsState);

    const streakState = storage.getStreakData();
    setStreak(streakState);

    // Load workouts/cardio logged today from daily log
    const dailyLog = storage.getDailyLog(todayStr);
    setWorkoutLog(dailyLog.workoutsList || []);
    setCardioLog(dailyLog.cardioList || []);
  };

  if (!stats) {
    return <div className="py-20 text-center text-brand-gray-light font-serif">LOADING CHARACTER SHEET...</div>;
  }

  // Get level info for all stats
  const strInfo = getLevelInfo(stats.STR.cumulativeXP || 0);
  const agiInfo = getLevelInfo(stats.AGI.cumulativeXP || 0);
  const vitInfo = getLevelInfo(stats.VIT.cumulativeXP || 0);
  const intInfo = getLevelInfo(stats.INT.cumulativeXP || 0);
  const perInfo = getLevelInfo(stats.PER.cumulativeXP || 0);

  // Radar chart data based on levels
  const radarData = [
    { name: 'STR (Strength)', val: strInfo.level },
    { name: 'AGI (Agility)', val: agiInfo.level },
    { name: 'VIT (Vitality)', val: vitInfo.level },
    { name: 'INT (Intellect)', val: intInfo.level },
    { name: 'PER (Perception)', val: perInfo.level }
  ];

  const handleAddWorkout = (e) => {
    e.preventDefault();
    if (!exerciseName.trim()) return;

    const dailyLog = storage.getDailyLog(todayStr);
    const workouts = dailyLog.workoutsList || [];

    const newWorkout = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: parseInt(setsCount),
      reps: parseInt(repsCount),
      weight: weightValue ? `${weightValue} kg` : 'Bodyweight'
    };

    const updatedWorkouts = [...workouts, newWorkout];
    
    // Log awards STR XP (+5 XP per set)
    const earnedXP = newWorkout.sets * 5;
    const statsState = storage.getStatsState();
    const oldXP = statsState.STR.cumulativeXP || 0;
    statsState.STR.cumulativeXP = oldXP + earnedXP;

    // Save
    storage.saveStatsState(statsState);
    storage.saveDailyLog(todayStr, {
      ...dailyLog,
      workoutsList: updatedWorkouts
    });

    setStats(statsState);
    setWorkoutLog(updatedWorkouts);
    setExerciseName('');
    setWeightValue('');

    // Trigger Notification for XP
    onNotification({
      type: 'quest_complete',
      title: 'TRAINING RECORD SECURED',
      desc: `Logged ${newWorkout.name} (${newWorkout.sets} sets). STR gained +${earnedXP} XP!`,
      quote: "My place is here. In the mud, the blood, and the ash. That is where I struggle."
    });

    // Check level up
    const oldLvl = getLevelInfo(oldXP).level;
    const newLvl = getLevelInfo(statsState.STR.cumulativeXP).level;
    if (newLvl > oldLvl) {
      onNotification({
        type: 'level_up',
        title: 'STR LEVEL UP',
        desc: `Your Strength (STR) has reached Level ${newLvl}! Your muscles forge through agony.`,
        quote: "That thing was too big to be called a sword."
      });
    }

    // Check achievements
    const newlyUnlocked = checkAndTriggerAchievements();
    newlyUnlocked.forEach(achId => {
      onNotification({
        type: 'achievement_unlocked',
        title: 'THE BRAND DEEPENS: ACHIEVEMENT UNLOCKED',
        desc: `You unlocked a new badge. Details in achievement grid.`,
        quote: "Go ahead and whine. Struggle. Run. Squirm."
      });
    });
  };

  const handleAddCardio = (e) => {
    e.preventDefault();
    if (!cardioActivity.trim()) return;

    const dailyLog = storage.getDailyLog(todayStr);
    const cardios = dailyLog.cardioList || [];

    const newCardio = {
      id: Date.now().toString(),
      activity: cardioActivity,
      minutes: parseInt(cardioMinutes)
    };

    const updatedCardios = [...cardios, newCardio];
    
    // Log awards AGI XP (+1 XP per minute)
    const earnedXP = newCardio.minutes;
    const statsState = storage.getStatsState();
    const oldXP = statsState.AGI.cumulativeXP || 0;
    statsState.AGI.cumulativeXP = oldXP + earnedXP;

    // Save
    storage.saveStatsState(statsState);
    storage.saveDailyLog(todayStr, {
      ...dailyLog,
      cardioList: updatedCardios
    });

    setStats(statsState);
    setCardioLog(updatedCardios);
    setCardioActivity('');

    // Trigger Notification
    onNotification({
      type: 'quest_complete',
      title: 'CONDITIONING COMPLETED',
      desc: `Logged ${newCardio.activity} (${newCardio.minutes} mins). AGI gained +${earnedXP} XP!`,
      quote: "If you're always running away, you'll never see the things you want to change."
    });

    // Check level up
    const oldLvl = getLevelInfo(oldXP).level;
    const newLvl = getLevelInfo(statsState.AGI.cumulativeXP).level;
    if (newLvl > oldLvl) {
      onNotification({
        type: 'level_up',
        title: 'AGI LEVEL UP',
        desc: `Your Agility (AGI) has reached Level ${newLvl}! Fast as the shadows of the Eclipse.`,
        quote: "He who takes action survives. That is the only law of this world."
      });
    }

    // Check achievements
    const newlyUnlocked = checkAndTriggerAchievements();
    newlyUnlocked.forEach(achId => {
      onNotification({
        type: 'achievement_unlocked',
        title: 'THE BRAND DEEPENS: ACHIEVEMENT UNLOCKED',
        desc: `Your endurance has unlocked a new mark in your profile.`,
        quote: "Struggle. Run. Squirm. Fight your way out."
      });
    });
  };

  const deleteWorkout = (id) => {
    const dailyLog = storage.getDailyLog(todayStr);
    const workouts = dailyLog.workoutsList || [];
    const workoutToDelete = workouts.find(w => w.id === id);
    if (!workoutToDelete) return;

    const updatedWorkouts = workouts.filter(w => w.id !== id);
    
    // Deduct STR XP
    const deductedXP = workoutToDelete.sets * 5;
    const statsState = storage.getStatsState();
    statsState.STR.cumulativeXP = Math.max(0, (statsState.STR.cumulativeXP || 0) - deductedXP);

    storage.saveStatsState(statsState);
    storage.saveDailyLog(todayStr, {
      ...dailyLog,
      workoutsList: updatedWorkouts
    });

    setStats(statsState);
    setWorkoutLog(updatedWorkouts);
  };

  const deleteCardio = (id) => {
    const dailyLog = storage.getDailyLog(todayStr);
    const cardios = dailyLog.cardioList || [];
    const cardioToDelete = cardios.find(c => c.id === id);
    if (!cardioToDelete) return;

    const updatedCardios = cardios.filter(c => c.id !== id);

    // Deduct AGI XP
    const deductedXP = cardioToDelete.minutes;
    const statsState = storage.getStatsState();
    statsState.AGI.cumulativeXP = Math.max(0, (statsState.AGI.cumulativeXP || 0) - deductedXP);

    storage.saveStatsState(statsState);
    storage.saveDailyLog(todayStr, {
      ...dailyLog,
      cardioList: updatedCardios
    });

    setStats(statsState);
    setCardioLog(updatedCardios);
  };

  // Calculate total cumulative XP across all stats to check relic unlock
  const totalCumulativeXP = (stats.STR?.cumulativeXP || 0) + 
                            (stats.AGI?.cumulativeXP || 0) + 
                            (stats.VIT?.cumulativeXP || 0) + 
                            (stats.INT?.cumulativeXP || 0) + 
                            (stats.PER?.cumulativeXP || 0);

  const levels = {
    STR: strInfo.level,
    AGI: agiInfo.level,
    VIT: vitInfo.level,
    INT: intInfo.level,
    PER: perInfo.level
  };

  const activeWep = WEAPONS.find(w => w.id === equippedWeapon) || WEAPONS[0];
  const activeArm = ARMORS.find(a => a.id === equippedArmor) || ARMORS[0];
  const activeRel = RELICS.find(r => r.id === equippedRelic) || RELICS[0];

  const checkIsUnlocked = (item) => {
    if (!item.check) return true; // default items are always unlocked
    return item.check(levels, streak, totalCumulativeXP);
  };

  const handleEquip = (itemId, type) => {
    if (type === 'weapons') {
      setEquippedWeapon(itemId);
      localStorage.setItem('brand-eq-weapon', itemId);
      onNotification({
        type: 'quest_complete',
        title: 'WEAPON ARMED',
        desc: `You equipped the ${WEAPONS.find(w => w.id === itemId).name}.`,
        quote: "A blade is only as strong as the hand that holds it."
      });
    } else if (type === 'armors') {
      setEquippedArmor(itemId);
      localStorage.setItem('brand-eq-armor', itemId);
      onNotification({
        type: 'quest_complete',
        title: 'ARMOR FIT FOR TRIAL',
        desc: `You equipped the ${ARMORS.find(a => a.id === itemId).name}.`,
        quote: "It is a cursed shield that blocks the strikes of fate."
      });
    } else if (type === 'relics') {
      setEquippedRelic(itemId);
      localStorage.setItem('brand-eq-relic', itemId);
      onNotification({
        type: 'quest_complete',
        title: 'RELIC INFUSED',
        desc: `You equipped the ${RELICS.find(r => r.id === itemId).name}.`,
        quote: "A heavy symbol of your unbroken resolve."
      });
    }
    audioController.playLevelUp();
  };

  const statRow = (name, info, colorClass) => (
    <div key={name} className="border border-brand-border bg-brand-card p-4 space-y-2">
      <div className="flex justify-between items-baseline">
        <div className="flex items-center gap-2">
          <Flame className={`w-4 h-4 ${colorClass}`} />
          <span className="text-sm font-serif font-black text-brand-bone tracking-wide">{name}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-brand-gray-light uppercase mr-2">Level</span>
          <span className={`text-xl font-serif font-black ${colorClass}`}>{info.level}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-1.5 w-full bg-brand-bg border border-brand-border overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 bg-gradient-to-r from-brand-red to-brand-gold`} 
            style={{ width: `${info.progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-mono text-brand-gray uppercase">
          <span>XP: {info.xpInLevel} / {info.xpNeededForNext}</span>
          <span>Total: {info.cumulativeXP}</span>
        </div>
      </div>
    </div>
  );

  const isTierUnlocked = (tierNum) => {
    if (tierNum === 1) return true;
    if (tierNum === 2) return levels.VIT >= 5 || levels.AGI >= 5 || strInfo.level >= 10 || agiInfo.level >= 10 || vitInfo.level >= 10;
    if (tierNum === 3) return levels.VIT >= 10 || strInfo.level >= 20 || agiInfo.level >= 20 || vitInfo.level >= 20;
    if (tierNum === 4) return levels.AGI >= 10 || strInfo.level >= 30 || agiInfo.level >= 30 || vitInfo.level >= 30;
    if (tierNum === 5) return totalCumulativeXP >= 10000 || strInfo.level >= 40 || agiInfo.level >= 40 || vitInfo.level >= 40;
    return false;
  };

  let autoTier = 1;
  if (equippedRelic === 'eclipse_sigil' || totalCumulativeXP >= 10000) {
    autoTier = 5;
  } else if (equippedArmor === 'shroud') {
    autoTier = 4;
  } else if (equippedArmor === 'berserker') {
    autoTier = 3;
  } else if (equippedArmor === 'chainmail' || equippedArmor === 'assassin') {
    autoTier = 2;
  } else {
    // Stat-based tier upgrades
    const maxLevel = Math.max(strInfo.level, agiInfo.level, vitInfo.level, intInfo.level, perInfo.level);
    if (maxLevel >= 40) autoTier = 5;
    else if (maxLevel >= 30) autoTier = 4;
    else if (maxLevel >= 20) autoTier = 3;
    else if (maxLevel >= 10) autoTier = 2;
  }

  const activeTierNum = (appearanceOverride && isTierUnlocked(appearanceOverride)) ? appearanceOverride : autoTier;
  const currentTier = CHARACTER_TIERS.find(t => t.tier === activeTierNum) || CHARACTER_TIERS[0];

  return (
    <div className="space-y-6">
      {/* Upper section: Character Portrait, Radar graph & Stat list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        
        {/* Character Portrait Card */}
        <div className={`lg:col-span-4 border bg-brand-card p-5 flex flex-col justify-between shadow-lg relative min-h-[350px] transition-all duration-500 ${currentTier.glow}`}>
          <div>
            <div className="flex justify-between items-start mb-3 border-b border-brand-border/40 pb-2.5">
              <div>
                <h4 className="text-[7.5px] font-mono text-brand-gray uppercase tracking-widest leading-none">STRUGGLER IDENTITY</h4>
                <h2 className="text-xs font-serif font-black text-brand-bone tracking-wide uppercase mt-1">
                  {currentTier.title}
                </h2>
              </div>
              <span className={`text-[7px] font-mono uppercase tracking-widest px-2 py-0.5 border ${currentTier.banner}`}>
                {currentTier.class}
              </span>
            </div>
            
            <div className="w-full relative bg-[#070707] border border-brand-border/40 overflow-hidden mb-3 aspect-[4/3] flex items-center justify-center">
              <CharacterPortrait tier={currentTier.tier} title={currentTier.title} />
              
              {appearanceOverride && (
                <div className="absolute bottom-2 left-2 bg-[#0a0a0a]/90 border border-brand-gold/60 text-brand-gold text-[7px] font-mono px-1.5 py-0.5 uppercase tracking-wider">
                  Appearance Overridden
                </div>
              )}
            </div>
            
            <p className="text-[10px] text-brand-gray-light leading-relaxed mb-4">
              {currentTier.desc}
            </p>
          </div>

          <div className="space-y-2 border-t border-brand-border/40 pt-3">
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAppearanceSelector(!showAppearanceSelector)}
                className="flex-1 py-1.5 border border-brand-border hover:border-brand-red bg-[#090909] text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-brand-gold" />
                {showAppearanceSelector ? "Close Selection" : "Morph Appearance"}
              </button>
              
              {appearanceOverride && (
                <button 
                  onClick={() => {
                    setAppearanceOverride(null);
                    localStorage.removeItem('brand-char-avatar-override');
                  }}
                  className="px-2.5 py-1.5 border border-brand-red/40 hover:border-brand-red bg-[#090909] text-brand-red text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer text-center"
                  title="Restore auto-upgrade based on gear"
                >
                  Reset
                </button>
              )}
            </div>

            {showAppearanceSelector && (
              <div className="space-y-1 mt-2 bg-[#090909] border border-brand-border/40 p-1.5 max-h-[140px] overflow-y-auto">
                {CHARACTER_TIERS.map(t => {
                  const unlocked = isTierUnlocked(t.tier);
                  const isCurrent = activeTierNum === t.tier;

                  return (
                    <button
                      key={t.tier}
                      disabled={!unlocked}
                      onClick={() => {
                        setAppearanceOverride(t.tier);
                        localStorage.setItem('brand-char-avatar-override', t.tier.toString());
                      }}
                      className={`w-full text-left p-1 flex items-center justify-between border transition-all ${
                        isCurrent 
                          ? 'border-brand-gold bg-brand-gold/5 text-brand-gold font-bold' 
                          : unlocked 
                            ? 'border-brand-border/30 hover:border-brand-border bg-[#0d0d0d] text-brand-bone' 
                            : 'border-brand-border/10 opacity-30 text-brand-gray cursor-not-allowed'
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <span className="text-[8.5px] font-serif uppercase tracking-wide block leading-tight">
                          Tier {t.tier}: {t.title}
                        </span>
                        <span className="text-[6px] font-mono uppercase block text-brand-gray-light leading-none mt-0.5">
                          {unlocked ? t.class : t.req}
                        </span>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isCurrent ? (
                          <Check className="w-3 h-3 text-brand-gold" />
                        ) : !unlocked ? (
                          <Lock className="w-2.5 h-2.5 text-brand-gray" />
                        ) : (
                          <span className="text-[6.5px] font-mono uppercase tracking-wider text-brand-gray border border-brand-border/30 px-1 py-0.5">
                            Use
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Radar Graph */}
        <div className="lg:col-span-4 border border-brand-border bg-brand-card p-6 flex flex-col justify-between items-center shadow-lg relative min-h-[300px]">
          <h3 className="text-xs font-serif uppercase tracking-widest text-brand-gray-light border-b border-brand-border pb-2 w-full text-center">
            Attribute Balance Chart
          </h3>
          
          <div className="w-full h-64 mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#262626" />
                <PolarAngleAxis 
                  dataKey="name" 
                  tick={{ fill: '#e8e6e1', fontSize: 10, fontFamily: 'Cinzel, serif' }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 'auto']} 
                  tick={{ fill: '#404040', fontSize: 8 }} 
                />
                <Radar 
                  name="Character" 
                  dataKey="val" 
                  stroke="#a51c1c" 
                  fill="#8b0000" 
                  fillOpacity={0.4} 
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-[9px] font-mono text-brand-gray uppercase mt-2">
            Perfect balance is the struggling warrior's defense.
          </div>
        </div>

        {/* Stats List */}
        <div className="lg:col-span-4 space-y-3">
          {statRow('STR (Strength)', strInfo, 'text-red-500')}
          {statRow('AGI (Agility)', agiInfo, 'text-sky-400')}
          {statRow('VIT (Vitality)', vitInfo, 'text-indigo-400')}
          {statRow('INT (Intellect)', intInfo, 'text-purple-400')}
          {statRow('PER (Perception)', perInfo, 'text-orange-400')}
        </div>
      </div>

      {/* RPG Gear & Equipment (Struggler's Armory) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Equipped Loadout Card */}
        <div className="lg:col-span-5 border border-brand-border bg-brand-card p-6 shadow-xl space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-brand-border pb-3 mb-4 text-brand-bone">
              <Swords className="w-5 h-5 text-brand-red animate-pulse" />
              <h3 className="font-serif uppercase tracking-widest text-xs font-bold">Equipped Loadout</h3>
            </div>

            <div className="space-y-4">
              {/* Weapon Slot */}
              <div className="border border-brand-border bg-brand-bg p-3 flex gap-3 items-center">
                <div className="w-10 h-10 border border-brand-border/80 flex items-center justify-center bg-brand-card text-brand-gold flex-shrink-0">
                  <Swords className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-mono text-brand-gray uppercase tracking-widest block">Weapon Slot</span>
                  <span className="text-xs font-serif font-bold text-brand-bone uppercase block">{activeWep.name}</span>
                  <p className="text-[9px] text-brand-gray-light leading-relaxed truncate">{activeWep.desc}</p>
                </div>
              </div>

              {/* Armor Slot */}
              <div className="border border-brand-border bg-brand-bg p-3 flex gap-3 items-center">
                <div className="w-10 h-10 border border-brand-border/80 flex items-center justify-center bg-brand-card text-brand-red flex-shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-mono text-brand-gray uppercase tracking-widest block">Armor Slot</span>
                  <span className="text-xs font-serif font-bold text-brand-bone uppercase block">{activeArm.name}</span>
                  <p className="text-[9px] text-brand-gray-light leading-relaxed truncate">{activeArm.desc}</p>
                </div>
              </div>

              {/* Relic Slot */}
              <div className="border border-brand-border bg-brand-bg p-3 flex gap-3 items-center">
                <div className="w-10 h-10 border border-brand-border/80 flex items-center justify-center bg-brand-card text-indigo-400 flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] font-mono text-brand-gray uppercase tracking-widest block">Relic Slot</span>
                  <span className="text-xs font-serif font-bold text-brand-bone uppercase block">{activeRel.name}</span>
                  <p className="text-[9px] text-brand-gray-light leading-relaxed truncate">{activeRel.desc}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[8px] font-mono text-brand-gray uppercase text-center border-t border-brand-border/40 pt-3">
            Equipped gear reflects your progress in the crucible.
          </div>
        </div>

        {/* Armory Locker Card */}
        <div className="lg:col-span-7 border border-brand-border bg-brand-card p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2 text-brand-bone">
              <Trophy className="w-5 h-5 text-brand-gold animate-pulse" />
              <h3 className="font-serif uppercase tracking-widest text-xs font-bold">Struggler's Armory Locker</h3>
            </div>
            
            {/* Locker tab controls */}
            <div className="flex gap-2">
              {['weapons', 'armors', 'relics'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setSelectedGearTab(tab)}
                  className={`px-2.5 py-1 text-[8px] font-serif uppercase tracking-widest border transition-all cursor-pointer ${
                    selectedGearTab === tab 
                      ? 'border-brand-red bg-brand-red/10 text-brand-bone font-black' 
                      : 'border-brand-border bg-[#090909] text-brand-gray hover:text-brand-gray-light'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* List of items in current tab */}
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {(selectedGearTab === 'weapons' ? WEAPONS : selectedGearTab === 'armors' ? ARMORS : RELICS).map(item => {
              const unlocked = checkIsUnlocked(item);
              const equippedId = selectedGearTab === 'weapons' ? equippedWeapon : selectedGearTab === 'armors' ? equippedArmor : equippedRelic;
              const isEquipped = equippedId === item.id;

              return (
                <div 
                  key={item.id} 
                  className={`border p-3 flex justify-between items-center transition-all ${
                    unlocked 
                      ? 'border-brand-border bg-[#0d0d0d] hover:border-brand-border/80' 
                      : 'border-brand-border/40 bg-brand-bg opacity-40'
                  }`}
                >
                  <div className="min-w-0 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-serif font-black uppercase tracking-wider ${unlocked ? 'text-brand-bone' : 'text-brand-gray'}`}>
                        {item.name}
                      </span>
                      {!unlocked && (
                        <span className="text-[7px] font-mono text-brand-red uppercase px-1 border border-brand-red/40 bg-brand-red/5">
                          Locked
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-brand-gray-light mt-0.5 leading-relaxed">
                      {unlocked ? item.desc : `LOCKED. ${item.req}`}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    {unlocked ? (
                      isEquipped ? (
                        <span className="text-[9px] font-serif uppercase tracking-widest font-black text-brand-gold bg-brand-gold/5 border border-brand-gold px-2.5 py-1">
                          Equipped
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEquip(item.id, selectedGearTab)}
                          className="px-3 py-1 border border-brand-red hover:bg-brand-red text-brand-red hover:text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer"
                        >
                          Equip
                        </button>
                      )
                    ) : (
                      <span className="text-[9px] font-serif uppercase tracking-widest text-brand-gray px-3 py-1 border border-brand-border/40 select-none">
                        Locked
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action Logs (Strength + Cardio) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strength Logger */}
        <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-red-500 border-b border-brand-border pb-3">
            <Dumbbell className="w-5 h-5" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">Strength Training Log (+5 STR XP/Set)</h3>
          </div>

          <form onSubmit={handleAddWorkout} className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Exercise Name</label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                placeholder="e.g. Bench Press, Deadlift"
                className="w-full px-3 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red transition-all"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Weight (kg)</label>
              <input
                type="text"
                value={weightValue}
                onChange={(e) => setWeightValue(e.target.value)}
                placeholder="e.g. 80, BW"
                className="w-full px-3 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red transition-all"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Sets</label>
                <input
                  type="number"
                  value={setsCount}
                  onChange={(e) => setSetsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red text-center font-mono"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Reps</label>
                <input
                  type="number"
                  value={repsCount}
                  onChange={(e) => setRepsCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red text-center font-mono"
                />
              </div>
            </div>

            <button
              id="btn_add_strength"
              type="submit"
              className="col-span-2 py-2 border border-brand-red hover:bg-brand-red hover:text-brand-bone text-brand-red text-xs font-serif uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Record Set
            </button>
          </form>

          {/* Strength records list */}
          <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-1">
            {workoutLog.length === 0 ? (
              <p className="text-[11px] text-brand-gray uppercase italic text-center py-4">No exercises logged today.</p>
            ) : (
              workoutLog.map(w => (
                <div key={w.id} className="border border-brand-border bg-brand-bg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-serif text-brand-bone uppercase tracking-wider block font-bold">{w.name}</span>
                    <span className="text-[10px] text-brand-gray-light uppercase">
                      {w.sets} sets &times; {w.reps} reps | {w.weight}
                    </span>
                  </div>
                  <button
                    id={`btn_delete_strength_${w.id}`}
                    onClick={() => deleteWorkout(w.id)}
                    className="text-brand-gray hover:text-brand-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cardio Logger */}
        <div className="border border-brand-border bg-brand-card p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-sky-400 border-b border-brand-border pb-3">
            <Flame className="w-5 h-5" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">Conditioning Log (+1 AGI XP/Min)</h3>
          </div>

          <form onSubmit={handleAddCardio} className="grid grid-cols-3 gap-3 text-xs">
            <div className="col-span-2">
              <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Activity Name</label>
              <input
                type="text"
                value={cardioActivity}
                onChange={(e) => setCardioActivity(e.target.value)}
                placeholder="e.g. Running, Jump rope"
                className="w-full px-3 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red transition-all"
              />
            </div>
            
            <div>
              <label className="text-[10px] text-brand-gray uppercase tracking-widest block mb-1">Minutes</label>
              <input
                type="number"
                value={cardioMinutes}
                onChange={(e) => setCardioMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-brand-border bg-brand-bg text-brand-bone rounded-none outline-none focus:border-brand-red text-center font-mono"
              />
            </div>

            <button
              id="btn_add_cardio"
              type="submit"
              className="col-span-3 py-2 border border-sky-400 hover:bg-sky-400 hover:text-[#0a0a0a] text-sky-400 text-xs font-serif uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Record Minutes
            </button>
          </form>

          {/* Cardio list */}
          <div className="space-y-2 pt-2 max-h-48 overflow-y-auto pr-1">
            {cardioLog.length === 0 ? (
              <p className="text-[11px] text-brand-gray uppercase italic text-center py-4">No conditioning logged today.</p>
            ) : (
              cardioLog.map(c => (
                <div key={c.id} className="border border-brand-border bg-brand-bg p-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-serif text-brand-bone uppercase tracking-wider block font-bold">{c.activity}</span>
                    <span className="text-[10px] text-brand-gray-light uppercase">
                      Duration: {c.minutes} minutes
                    </span>
                  </div>
                  <button
                    id={`btn_delete_cardio_${c.id}`}
                    onClick={() => deleteCardio(c.id)}
                    className="text-brand-gray hover:text-brand-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
