// THE BRAND: ASCENSION SYSTEM - Storage & Game Mechanics Engine

// A collection of gritty, motivating quotes for the Struggler
export const STRUGGLER_QUOTES = [
  "Cry out. Whine. Twist and fight. But never cease your struggle. In this world, those who stop moving are the first to rot.",
  "You can gather the scattered shards of what was shattered, but the seams will always show. We rebuild to advance, not to return.",
  "In the end, only those who refuse to yield remain standing. Keep marching.",
  "If your back is always turned in flight, you will never witness the destiny you seek to forge.",
  "If you are met by a wall, you must break it down. If there is no path, you must carve one with your own hands.",
  "Let them keep their clean towers. My domain is here—in the mud, the sweat, and the ash. This is where my iron is forged.",
  "Keep your eyes locked on the horizon. Looking back only summons the ghosts of what you could not save.",
  "If you hesitate at the crunch of every dry leaf, you will never cross the dark forest. Harden your stride.",
  "Frail, scarred, and outmatched—we march forward regardless. That is our unbroken resolve.",
  "The load is heavy and the iron is coarse. Yet it is the only tool we have to carve a destiny."
];

export const getRandomQuote = () => {
  const index = Math.floor(Math.random() * STRUGGLER_QUOTES.length);
  return STRUGGLER_QUOTES[index];
};

// Default quest targets
export const DEFAULT_QUESTS = {
  dsa: { id: "dsa", label: "DSA Practice", target: 2.0, unit: "hrs", stat: "INT", baseXP: 25 },
  python: { id: "python", label: "Python Learning", target: 2.0, unit: "hrs", stat: "INT", baseXP: 20 },
  hackerrank: { id: "hackerrank", label: "HackerRank Challenges", target: 1.0, unit: "hrs", stat: "INT", baseXP: 15 },
  project: { id: "project", label: "Project Development", target: 2.5, unit: "hrs", stat: "INT", baseXP: 25, extraStat: "PER", extraXP: 5 },
  strength: { id: "strength", label: "Strength Training", target: 45, unit: "min", stat: "STR", baseXP: 30, extraStat: "VIT", extraXP: 5 },
  water: { id: "water", label: "Water Intake", target: 8, unit: "glasses", stat: "VIT", baseXP: 10, extraStat: "AGI", extraXP: 5 },
  sleep: { id: "sleep", label: "Sleep Duration", target: 7.0, unit: "hrs", stat: "VIT", baseXP: 20 },
  meals: { id: "meals", label: "Protein-Rich Meals", target: 3, unit: "meals", stat: "STR", baseXP: 15, extraStat: "VIT", extraXP: 5 },
  reflection: { id: "reflection", label: "Reflection Journal Log", target: 1, unit: "entry", stat: "PER", baseXP: 15 }
};

// Initial stat structure
const INITIAL_STATS = {
  STR: { cumulativeXP: 0 },
  AGI: { cumulativeXP: 0 },
  VIT: { cumulativeXP: 0 },
  INT: { cumulativeXP: 0 },
  PER: { cumulativeXP: 0 }
};

// Achievements List
export const ACHIEVEMENTS = [
  { id: "brand_accepted", title: "The Branded Struggler", desc: "Accept the Brand of the Struggler and begin the climb.", tier: "Bronze" },
  { id: "streak_7", title: "Struggler's Resolve", desc: "Maintain a 7-day daily quest streak.", tier: "Bronze" },
  { id: "streak_30", title: "Unbreakable Will", desc: "Maintain a 30-day daily quest streak.", tier: "Silver" },
  { id: "streak_100", title: "The Hundred-Man Slayer", desc: "Maintain a 100-day daily quest streak.", tier: "Gold" },
  { id: "dsa_master", title: "Grand Scholar", desc: "Log a cumulative 100 hours of DSA practice.", tier: "Silver" },
  { id: "iron_body", title: "Iron Body", desc: "Log a cumulative 50 strength training sessions.", tier: "Silver" },
  { id: "eclipse_conqueror", title: "Eclipse Survivor", desc: "Reach the ultimate Eclipse Survivor Rank (10,000+ total cumulative XP).", tier: "Gold" },
  { id: "stat_level_10", title: "Breaker of Limits", desc: "Bring any core stat to level 10.", tier: "Gold" }
];

// RPG formulas
// Cumulative XP to reach level L: 50 * L * (L - 1)
export const getXPForLevel = (level) => {
  return 50 * level * (level - 1);
};

export const getLevelInfo = (cumulativeXP) => {
  if (cumulativeXP < 0) cumulativeXP = 0;
  let level = 1;
  while (cumulativeXP >= getXPForLevel(level + 1)) {
    level++;
  }
  const currentLevelXP = getXPForLevel(level);
  const nextLevelXP = getXPForLevel(level + 1);
  const xpInLevel = cumulativeXP - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min(100, Math.floor((xpInLevel / xpNeededForNext) * 100));

  return {
    level,
    xpInLevel,
    xpNeededForNext,
    progressPercent,
    cumulativeXP
  };
};

export const getRankInfo = (statsState) => {
  const totalCumulativeXP = Object.values(statsState).reduce((acc, stat) => acc + (stat.cumulativeXP || 0), 0);
  
  let rank = "Novice Struggler (Tethered)";
  let nextRank = "Ashen Vanguard (Unbound)";
  let threshold = 2500;
  let prevThreshold = 0;
  
  if (totalCumulativeXP >= 10000) {
    rank = "Undying Champion (Eclipse Conqueror)";
    nextRank = "Max Rank Achieved";
    threshold = 10000;
    prevThreshold = 10000;
  } else if (totalCumulativeXP >= 2500) {
    rank = "Ashen Vanguard (Unbound)";
    nextRank = "Undying Champion (Eclipse Conqueror)";
    threshold = 10000;
    prevThreshold = 2500;
  }

  const range = threshold - prevThreshold;
  const progress = range > 0 ? Math.min(100, Math.floor(((totalCumulativeXP - prevThreshold) / range) * 100)) : 100;

  return {
    rank,
    nextRank,
    totalCumulativeXP,
    progress,
    threshold
  };
};

// Safe LocalStorage API wrappers
const safeGet = (key, defaultValue) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error(`Failed to read key "${key}" from localStorage:`, e);
    return defaultValue;
  }
};

// Register a sync callback for cloud databases
let syncCallback = null;

export const registerSyncCallback = (callback) => {
  syncCallback = callback;
};

const safeSet = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (syncCallback) {
      syncCallback(key, value);
    }
    return true;
  } catch (e) {
    console.error(`Failed to write key "${key}" to localStorage:`, e);
    return false;
  }
};

// Main Exported Storage API
export const storage = {
  // Onboarding
  getOnboarding: () => safeGet("brand-onboarding-complete", { complete: false, date: null }),
  setOnboarding: (complete) => safeSet("brand-onboarding-complete", { complete, date: new Date().toISOString() }),

  // Quest targets configuration
  getQuestConfig: () => safeGet("brand-quest-config", {}),
  saveQuestConfig: (config) => safeSet("brand-quest-config", config),

  // Daily log (quest checklist progress)
  getDailyLog: (dateStr) => {
    // Schema: { quests: { dsa: { completed: false, value: 0 }, ... }, extraLogs: { workoutSets: 0, runMinutes: 0 } }
    const defaultConfig = safeGet("brand-quest-config", {});
    const initialLog = {
      quests: {},
      workoutSets: 0,
      runMinutes: 0,
      xpRewarded: false,
      completedAt: null
    };
    Object.keys(defaultConfig).forEach(id => {
      initialLog.quests[id] = { completed: false, value: 0 };
    });
    return safeGet(`brand-daily-log:${dateStr}`, initialLog);
  },
  
  saveDailyLog: (dateStr, log) => safeSet(`brand-daily-log:${dateStr}`, log),

  // Stats state
  getStatsState: () => safeGet("brand-stats-state", INITIAL_STATS),
  saveStatsState: (stats) => safeSet("brand-stats-state", stats),

  // Streak & Brand Intensity Meter
  getStreakData: () => safeGet("brand-streak-data", {
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    brandIntensity: 20 // ranges from 20% to 100%
  }),
  saveStreakData: (streak) => safeSet("brand-streak-data", streak),

  // Achievements
  getAchievements: () => safeGet("brand-achievements", []),
  saveAchievements: (achievements) => safeSet("brand-achievements", achievements),

  // Reflections
  getReflection: (dateStr) => safeGet(`brand-reflections:${dateStr}`, ""),
  saveReflection: (dateStr, text) => safeSet(`brand-reflections:${dateStr}`, text),

  // Export / Import
  exportAllData: () => {
    try {
      const data = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("brand-")) {
          data[key] = JSON.parse(localStorage.getItem(key));
        }
      }
      return JSON.stringify(data, null, 2);
    } catch (e) {
      console.error("Failed to export database data:", e);
      throw e;
    }
  },

  importAllData: (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      // Basic validation: must be an object, and have keys starting with brand-
      if (typeof data !== "object" || data === null) {
        throw new Error("Invalid format. Data must be a valid JSON object.");
      }
      
      const keys = Object.keys(data);
      if (keys.length === 0) {
        throw new Error("Import file contains no data.");
      }

      // Check key integrity
      const hasBrandKeys = keys.some(key => key.startsWith("brand-"));
      if (!hasBrandKeys) {
        throw new Error("Import file does not contain Brand System data keys.");
      }

      // Clear existing brand data first
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith("brand-")) {
          localStorage.removeItem(key);
        }
      }

      // Import new keys
      Object.entries(data).forEach(([key, val]) => {
        localStorage.setItem(key, JSON.stringify(val));
      });
      
      return true;
    } catch (e) {
      console.error("Failed to import database data:", e);
      throw e;
    }
  }
};

// Core Game Mechanics Logic
export const awardXPForQuest = (questId, loggedValue) => {
  const stats = storage.getStatsState();
  const config = storage.getQuestConfig();
  const quest = config[questId];
  if (!quest) return null;

  const xpReport = {};
  
  // Award main stat
  if (quest.stat) {
    const originalXP = stats[quest.stat].cumulativeXP || 0;
    stats[quest.stat].cumulativeXP = originalXP + quest.baseXP;
    xpReport[quest.stat] = quest.baseXP;
  }

  // Award extra stat if applicable
  if (quest.extraStat && quest.extraXP) {
    const originalXP = stats[quest.extraStat].cumulativeXP || 0;
    stats[quest.extraStat].cumulativeXP = originalXP + quest.extraXP;
    xpReport[quest.extraStat] = quest.extraXP;
  }

  storage.saveStatsState(stats);
  return xpReport;
};

// Check for and trigger achievements
export const checkAndTriggerAchievements = () => {
  const currentAchievements = storage.getAchievements();
  const stats = storage.getStatsState();
  const streak = storage.getStreakData();
  const onboarding = storage.getOnboarding();
  const config = storage.getQuestConfig();
  
  const unlocked = [...currentAchievements];
  let newlyUnlocked = [];

  const unlock = (id) => {
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      newlyUnlocked.push(id);
    }
  };

  // 1. Brand Accepted
  if (onboarding.complete) {
    unlock("brand_accepted");
  }

  // 2. Daily streaks
  if (streak.currentStreak >= 7) unlock("streak_7");
  if (streak.currentStreak >= 30) unlock("streak_30");
  if (streak.currentStreak >= 100) unlock("streak_100");

  // 3. Stat Level 10
  Object.values(stats).forEach(stat => {
    const lvlInfo = getLevelInfo(stat.cumulativeXP || 0);
    if (lvlInfo.level >= 10) {
      unlock("stat_level_10");
    }
  });

  // 4. Eclipse rank
  const rankInfo = getRankInfo(stats);
  if (rankInfo.totalCumulativeXP >= 10000) {
    unlock("eclipse_conqueror");
  }

  // 5. Cumulative DSA practice hour check
  // Sum up DSA logged values across all history logs
  try {
    let cumulativeDSAPractice = 0;
    let cumulativeStrengthSessions = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("brand-daily-log:")) {
        const log = JSON.parse(localStorage.getItem(key));
        if (log && log.quests) {
          if (log.quests.dsa && log.quests.dsa.completed) {
            cumulativeDSAPractice += parseFloat(log.quests.dsa.value || config.dsa.target);
          }
          if (log.quests.strength && log.quests.strength.completed) {
            cumulativeStrengthSessions += 1;
          }
        }
      }
    }
    if (cumulativeDSAPractice >= 100) unlock("dsa_master");
    if (cumulativeStrengthSessions >= 50) unlock("iron_body");
  } catch (e) {
    console.error("Failed to compute history analytics for achievements:", e);
  }

  if (newlyUnlocked.length > 0) {
    storage.saveAchievements(unlocked);
  }

  return newlyUnlocked;
};
