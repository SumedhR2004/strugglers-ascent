import React, { useState, useEffect } from 'react';
import { storage, getLevelInfo, checkAndTriggerAchievements } from '../lib/storage';
import { 
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar 
} from 'recharts';
import { Dumbbell, Flame, TrendingUp, Trophy, Plus, Trash2 } from 'lucide-react';

export default function CharacterSheet({ onNotification, activeTab }) {
  const [stats, setStats] = useState(null);
  const [workoutLog, setWorkoutLog] = useState([]);
  const [cardioLog, setCardioLog] = useState([]);
  
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

  return (
    <div className="space-y-6">
      {/* Upper section: Stat list & Radar graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Graph */}
        <div className="lg:col-span-5 border border-brand-border bg-brand-card p-6 flex flex-col justify-between items-center shadow-lg relative min-h-[300px]">
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
        <div className="lg:col-span-7 space-y-3">
          {statRow('STR (Strength)', strInfo, 'text-red-500')}
          {statRow('AGI (Agility)', agiInfo, 'text-sky-400')}
          {statRow('VIT (Vitality)', vitInfo, 'text-indigo-400')}
          {statRow('INT (Intellect)', intInfo, 'text-purple-400')}
          {statRow('PER (Perception)', perInfo, 'text-orange-400')}
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
