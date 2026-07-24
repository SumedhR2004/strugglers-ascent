import React, { useState, useEffect } from 'react';
import { storage, DEFAULT_QUESTS } from '../lib/storage';
import { Settings, Save, RefreshCw, Download, Upload, Trash2, Eye } from 'lucide-react';
import SyncCard from './SyncCard';
import { audioController } from '../lib/audio';

export default function SettingsView({ onNotification, onRecommit, activeTab }) {
  const [config, setConfig] = useState(null);
  const [resetHour, setResetHour] = useState(0); // 0 = Midnight, 1 = 1AM, etc.
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState('');
  
  const [audioMuted, setAudioMuted] = useState(audioController.isMuted());
  const [musicEnabled, setMusicEnabled] = useState(audioController.isMusicEnabled());
  const [musicVolume, setMusicVolume] = useState(audioController.getVolume());

  const [newQuestLabel, setNewQuestLabel] = useState('');
  const [newQuestTarget, setNewQuestTarget] = useState('1.0');
  const [newQuestUnit, setNewQuestUnit] = useState('hrs');
  const [newQuestStat, setNewQuestStat] = useState('INT');
  const [newQuestXP, setNewQuestXP] = useState('20');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [activeTab]);

  const loadSettings = () => {
    setConfig(storage.getQuestConfig());
    setResetHour(storage.getStreakData().resetHour || 0);
  };

  const handleToggleMute = (enabled) => {
    const nextMuted = !enabled;
    setAudioMuted(nextMuted);
    audioController.setMuted(nextMuted);
    window.dispatchEvent(new Event('audio-state-changed'));
  };

  const handleToggleMusic = (enabled) => {
    setMusicEnabled(enabled);
    audioController.setMusicEnabled(enabled);
  };

  const handleVolumeChange = (vol) => {
    setMusicVolume(vol);
    audioController.setVolume(vol);
  };

  const handleLoadPresets = () => {
    if (window.confirm("Do you wish to load the default preset quest board? This will merge them with your current configured struggles.")) {
      const merged = { ...config, ...DEFAULT_QUESTS };
      setConfig(merged);
      storage.saveQuestConfig(merged);
      onNotification({
        type: 'quest_complete',
        title: 'PRESETS INITIALIZED',
        desc: 'Successfully loaded all standard preset objectives to the ledger.',
        quote: "Keep moving forward. In the end, the struggler is the only one who survives."
      });
      audioController.playLevelUp();
    }
  };

  if (!config) {
    return <div className="py-20 text-center text-brand-gray-light font-serif">LOADING SETTINGS...</div>;
  }

  const handleFieldChange = (id, field, value) => {
    let finalVal = value;
    if (field === 'target') {
      finalVal = Math.max(0.1, parseFloat(value) || 0.1);
    } else if (field === 'baseXP') {
      finalVal = Math.max(1, parseInt(value) || 1);
    }
    setConfig({
      ...config,
      [id]: {
        ...config[id],
        [field]: finalVal
      }
    });
  };

  const handleDeleteQuest = (id) => {
    if (Object.keys(config).length <= 1) {
      alert("You must keep at least one quest in the system to continue your struggle.");
      return;
    }
    if (window.confirm(`Do you wish to delete the quest "${config[id].label}"?`)) {
      const updated = { ...config };
      delete updated[id];
      setConfig(updated);
    }
  };

  const handleCreateQuest = (e) => {
    e.preventDefault();
    if (!newQuestLabel.trim()) return;

    const id = "quest_" + Date.now();
    const newQuest = {
      id,
      label: newQuestLabel.trim(),
      target: parseFloat(newQuestTarget) || 1,
      unit: newQuestUnit.trim() || 'hrs',
      stat: newQuestStat,
      baseXP: parseInt(newQuestXP) || 20
    };

    setConfig({
      ...config,
      [id]: newQuest
    });

    // Reset Form
    setNewQuestLabel('');
    setNewQuestTarget('1.0');
    setNewQuestUnit('hrs');
    setNewQuestStat('INT');
    setNewQuestXP('20');
    setShowAddForm(false);
    
    // Play chime sound
    audioController.playLevelUp();
  };

  const handleSaveQuests = (e) => {
    e.preventDefault();
    storage.saveQuestConfig(config);
    
    // Save reset hour inside streak data
    const streak = storage.getStreakData();
    storage.saveStreakData({
      ...streak,
      resetHour: parseInt(resetHour)
    });

    onNotification({
      type: 'quest_complete',
      title: 'SYSTEM PARAMETERS MODIFIED',
      desc: 'Daily quest targets and reset configurations updated successfully.',
      quote: "He who takes action survives. That is the only law of this world."
    });
  };

  const handleExport = () => {
    try {
      const dataStr = storage.exportAllData();
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `brand-sacrifice-ascension-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onNotification({
        type: 'quest_complete',
        title: 'DATA SECURED',
        desc: 'All Brand stats, daily logs, and reflection records exported to JSON successfully.',
        quote: "Do not look back. If you do, you will only see what you have lost."
      });
    } catch (e) {
      console.error(e);
      alert('Failed to export data.');
    }
  };

  const handleImport = (e) => {
    setImportError('');
    setImportSuccess('');
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const success = storage.importAllData(text);
        if (success) {
          setImportSuccess('System database restored successfully! Reloading in 2 seconds...');
          onNotification({
            type: 'quest_complete',
            title: 'SYSTEM RESTORED',
            desc: 'Successfully imported all historical data and stats! Re-branding system...',
            quote: "Even if we painstakingly piece together something lost, things change. But we persist."
          });
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (err) {
        setImportError(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (window.confirm("WARNING: You are about to SACRIFICE all historical logs, levels, XP, streaks, and reflections permanently. This cannot be undone. Do you proceed?")) {
      if (window.confirm("ARE YOU ABSOLUTELY RESOLVED? The ledger will be burned and you will start back at zero.")) {
        // Clear all localstorage brand- keys
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.startsWith("brand-")) {
            localStorage.removeItem(key);
          }
        }
        onNotification({
          type: 'streak_decay',
          title: 'SYSTEM REDUCED TO ASH',
          desc: 'All stats and struggles wiped from memory. Brand status reset.',
          quote: "Go ahead and whine. Struggle. Run. Squirm. Fight your way out."
        });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Edit Quests Form */}
      <div className="lg:col-span-7 border border-brand-border bg-brand-card p-6 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-brand-border pb-3">
          <div className="flex items-center gap-2 text-brand-bone">
            <Settings className="w-5 h-5 text-brand-red" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">Configure System Objectives</h3>
          </div>
          
          <div className="flex gap-2">
            <button
              id="btn_load_presets"
              type="button"
              onClick={handleLoadPresets}
              className="px-2.5 py-1 bg-brand-gold/10 border border-brand-gold hover:bg-brand-gold text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer font-bold"
            >
              Load Presets
            </button>
            <button
              id="btn_toggle_add_quest"
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-2.5 py-1 bg-brand-red/10 border border-brand-red hover:bg-brand-red text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all cursor-pointer font-bold"
            >
              {showAddForm ? "Show Active Board" : "+ Add Custom Quest"}
            </button>
          </div>
        </div>

        {showAddForm ? (
          /* Create Quest Form */
          <form onSubmit={handleCreateQuest} className="space-y-4 bg-[#0d0d0d] p-4 border border-brand-border/40">
            <h4 className="font-serif uppercase text-brand-gold text-xs tracking-wider border-b border-brand-border/30 pb-2">Forge New Quest Objective</h4>
            
            {/* Tutorial section */}
            <div className="text-[9px] text-brand-gray-light leading-relaxed bg-brand-bg border border-brand-border/30 p-3 space-y-1 font-mono">
              <p className="text-brand-gold uppercase font-serif font-bold text-[10px] mb-1">💡 How to Forge a Quest:</p>
              <p>1. **Quest Label**: The specific action to track (e.g., *DSA practice*, *Cardio*, *Protein meals*).</p>
              <p>2. **Target Value & Unit**: Set your daily goal threshold (e.g., *2.0 hrs*, *45 min*, *8 glasses*).</p>
              <p>3. **Associated Stat**: The RPG attribute that gains experience (e.g., *INT* for study, *STR* for training).</p>
              <p>4. **Base XP**: Chooses the difficulty level experience points (e.g., 20–30 XP is standard).</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-brand-gray block">Quest Label</label>
                <input
                  id="input_new_quest_label"
                  type="text"
                  value={newQuestLabel}
                  onChange={(e) => setNewQuestLabel(e.target.value)}
                  placeholder="e.g. LeetCode Practice"
                  className="w-full px-3 py-1.5 border border-brand-border bg-brand-bg text-brand-bone outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-brand-gray block">Target Value</label>
                <input
                  id="input_new_quest_target"
                  type="number"
                  step="0.1"
                  value={newQuestTarget}
                  onChange={(e) => setNewQuestTarget(e.target.value)}
                  className="w-full px-3 py-1.5 border border-brand-border bg-brand-bg text-brand-bone font-mono outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-brand-gray block">Unit</label>
                <input
                  id="input_new_quest_unit"
                  type="text"
                  value={newQuestUnit}
                  onChange={(e) => setNewQuestUnit(e.target.value)}
                  placeholder="e.g. hrs, min, glasses"
                  className="w-full px-3 py-1.5 border border-brand-border bg-brand-bg text-brand-bone outline-none focus:border-brand-red"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-brand-gray block">Associated Stat</label>
                <select
                  id="select_new_quest_stat"
                  value={newQuestStat}
                  onChange={(e) => setNewQuestStat(e.target.value)}
                  className="w-full px-3 py-1.5 border border-brand-border bg-brand-bg text-brand-bone outline-none focus:border-brand-red"
                >
                  <option value="INT">INT (Intellect / Study / Coding)</option>
                  <option value="STR">STR (Strength / Gym / Power)</option>
                  <option value="AGI">AGI (Agility / Conditioning / Cardio)</option>
                  <option value="VIT">VIT (Vitality / Sleep / Water / Diet)</option>
                  <option value="PER">PER (Perception / Focus / Reflection)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] uppercase tracking-wider text-brand-gray block">Base XP Reward</label>
                <input
                  id="input_new_quest_xp"
                  type="number"
                  value={newQuestXP}
                  onChange={(e) => setNewQuestXP(e.target.value)}
                  className="w-full px-3 py-1.5 border border-brand-border bg-brand-bg text-brand-bone font-mono outline-none focus:border-brand-red"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                id="btn_create_quest"
                type="submit"
                className="flex-1 py-2 bg-brand-red hover:bg-transparent hover:text-brand-red-light border border-brand-red text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all cursor-pointer font-bold"
              >
                Add Quest
              </button>
              <button
                id="btn_cancel_create_quest"
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-brand-border text-brand-gray hover:text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          /* Active Quests Board Editor */
          <form onSubmit={handleSaveQuests} className="space-y-4">
            <div className="grid grid-cols-1 gap-3.5">
              {Object.entries(config).map(([id, quest]) => (
                <div key={id} className="border border-brand-border/40 bg-[#0d0d0d] p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left Column: Title and stat dropdown */}
                  <div className="flex-1 space-y-1">
                    <input
                      type="text"
                      value={quest.label}
                      onChange={(e) => handleFieldChange(id, 'label', e.target.value)}
                      className="w-full px-2 py-0.5 border border-transparent bg-transparent hover:border-brand-border focus:border-brand-red text-brand-bone font-serif uppercase tracking-wider font-black block outline-none"
                    />
                    <div className="flex items-center gap-1.5 pl-2">
                      <span className="text-[8px] text-brand-gray uppercase">Trains:</span>
                      <select
                        value={quest.stat}
                        onChange={(e) => handleFieldChange(id, 'stat', e.target.value)}
                        className="bg-transparent border-none text-brand-gold text-[9px] font-mono font-bold outline-none py-0 focus:ring-0 cursor-pointer"
                      >
                        <option value="INT" className="bg-[#0a0a0a] text-brand-bone">INT</option>
                        <option value="STR" className="bg-[#0a0a0a] text-brand-bone">STR</option>
                        <option value="AGI" className="bg-[#0a0a0a] text-brand-bone">AGI</option>
                        <option value="VIT" className="bg-[#0a0a0a] text-brand-bone">VIT</option>
                        <option value="PER" className="bg-[#0a0a0a] text-brand-bone">PER</option>
                      </select>
                      
                      <span className="text-[8px] text-brand-gray uppercase ml-2">Base XP:</span>
                      <input
                        type="number"
                        value={quest.baseXP}
                        onChange={(e) => handleFieldChange(id, 'baseXP', e.target.value)}
                        className="w-10 bg-transparent border-none text-brand-red-light text-[9px] font-mono font-bold outline-none py-0 focus:ring-0 text-center"
                      />
                    </div>
                  </div>

                  {/* Right Column: Target inputs & Delete */}
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step={id === 'water' || id === 'meals' ? '1' : '0.1'}
                        value={quest.target}
                        onChange={(e) => handleFieldChange(id, 'target', e.target.value)}
                        className="w-16 px-2 py-1 border border-brand-border bg-brand-bg text-brand-bone font-mono text-sm text-center outline-none focus:border-brand-red"
                      />
                      <input
                        type="text"
                        value={quest.unit}
                        onChange={(e) => handleFieldChange(id, 'unit', e.target.value)}
                        className="w-16 px-2 py-1 border border-brand-border bg-brand-bg text-brand-gray text-[10px] text-center uppercase outline-none focus:border-brand-red"
                      />
                    </div>

                    <button
                      id={`btn_delete_quest_${id}`}
                      type="button"
                      onClick={() => handleDeleteQuest(id)}
                      className="p-1.5 border border-transparent hover:border-brand-red hover:bg-brand-red/10 text-brand-gray hover:text-brand-red-light transition-all rounded-sm cursor-pointer"
                      title="Delete objective"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-brand-border/60 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-serif uppercase tracking-widest text-brand-gray-light block">Daily Reset Hour</label>
                <select
                  value={resetHour}
                  onChange={(e) => setResetHour(parseInt(e.target.value))}
                  className="px-3 py-1 border border-brand-border bg-brand-bg text-brand-bone text-xs rounded-none outline-none focus:border-brand-red transition-all font-mono cursor-pointer"
                >
                  <option value={0}>00:00 (Midnight)</option>
                  <option value={1}>01:00 AM</option>
                  <option value={2}>02:00 AM</option>
                  <option value={3}>03:00 AM</option>
                  <option value={4}>04:00 AM</option>
                  <option value={5}>05:00 AM</option>
                  <option value={6}>06:00 AM</option>
                </select>
              </div>

              <button
                id="btn_save_settings"
                type="submit"
                className="px-6 py-2 bg-brand-red border border-brand-red hover:bg-transparent hover:text-brand-red-light text-brand-bone text-xs font-serif uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_0_10px_rgba(139,0,0,0.3)] cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save Parameters
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Backup & System Operations */}
      <div className="lg:col-span-5 border border-brand-border bg-brand-card p-6 shadow-xl space-y-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-brand-bone border-b border-brand-border pb-3">
            <RefreshCw className="w-5 h-5 text-brand-gold" />
            <h3 className="font-serif uppercase tracking-widest text-sm font-bold">System Operations</h3>
          </div>

          {/* Cloud Sync Section */}
          <SyncCard onNotification={onNotification} />

          {/* Recommit Ritual */}
          <div className="space-y-2 pt-4 border-t border-brand-border/40">
            <h4 className="text-xs font-serif text-brand-bone uppercase tracking-wider">Recommit to the Brand</h4>
            <p className="text-[10px] text-brand-gray-light leading-relaxed">
              If your resolve has wavered or you want to restart, you can experience the branding gate ritual again. Your current logs are preserved.
            </p>
            <button
              id="btn_recommit_ritual"
              onClick={onRecommit}
              className="w-full py-2 bg-[#0d0d0d] border border-brand-border hover:border-brand-red text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-brand-red" /> Re-View Entry Ritual
            </button>
          </div>

          {/* Export / Import Database */}
          <div className="space-y-3.5 pt-4 border-t border-brand-border/40">
            <h4 className="text-xs font-serif text-brand-bone uppercase tracking-wider">Ledger Backup & Restore</h4>
            <p className="text-[10px] text-brand-gray-light leading-relaxed">
              Vaporizing browser caches will erase local storage. Export regularly to keep your struggle alive.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                id="btn_export_data"
                onClick={handleExport}
                className="flex-1 py-2 bg-brand-red/10 border border-brand-red text-brand-bone text-[10px] font-serif uppercase tracking-widest hover:bg-brand-red transition-all flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Export Data
              </button>

              <label className="flex-1 py-2 bg-[#0d0d0d] border border-brand-border text-brand-bone text-[10px] font-serif uppercase tracking-widest hover:border-brand-gold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-brand-gold" />
                <span>Import Backup</span>
                <input
                  id="input_import_file"
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
            </div>

            {importError && (
              <p className="text-[10px] text-red-500 font-mono leading-relaxed mt-1">{importError}</p>
            )}
            {importSuccess && (
              <p className="text-[10px] text-brand-gold font-mono leading-relaxed mt-1">{importSuccess}</p>
            )}
          </div>
          {/* Audio Parameters */}
          <div className="space-y-3 pt-4 border-t border-brand-border/40">
            <h4 className="text-xs font-serif text-brand-bone uppercase tracking-wider">Audio Parameters</h4>
            <div className="flex flex-col gap-2.5 bg-[#0d0d0d] p-3 border border-brand-border/40 text-[10px]">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="chk_enable_sfx"
                  type="checkbox"
                  checked={!audioMuted}
                  onChange={(e) => handleToggleMute(e.target.checked)}
                  className="rounded-none border-brand-border text-brand-red bg-brand-bg focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span className="text-brand-bone uppercase font-serif tracking-wider font-semibold">Enable sound effects (SFX)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="chk_enable_music"
                  type="checkbox"
                  checked={musicEnabled}
                  onChange={(e) => handleToggleMusic(e.target.checked)}
                  className="rounded-none border-brand-border text-brand-red bg-brand-bg focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                />
                <span className="text-brand-bone uppercase font-serif tracking-wider font-semibold">Enable background music</span>
              </label>

              {musicEnabled && (
                <div className="flex flex-col gap-1.5 pl-5 mt-1 border-t border-brand-border/20 pt-2">
                  <div className="flex justify-between text-[8px] uppercase tracking-wider text-brand-gray-light font-semibold">
                    <span>Music Volume</span>
                    <span className="font-mono text-brand-bone">{Math.round(musicVolume * 100)}%</span>
                  </div>
                  <input
                    id="slider_music_volume"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="w-full accent-brand-red cursor-pointer bg-brand-bg border border-brand-border h-1 rounded-none outline-none appearance-none"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purge System Data */}
        <div className="pt-6 border-t border-brand-border/60 space-y-4">
          <button
            id="btn_purge_system"
            onClick={handleResetData}
            className="w-full py-2.5 bg-red-950/20 hover:bg-brand-red hover:text-brand-bone border border-brand-red/40 text-brand-red-light text-xs font-serif uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" /> Purge System (Full Wipe)
          </button>

          {/* Author Credit */}
          <div className="border border-brand-border/40 bg-[#0a0a0a] p-3 text-center space-y-1">
            <p className="text-[8px] font-mono uppercase tracking-widest text-brand-gray">Forged by</p>
            <a
              href="https://github.com/SumedhRdotcom"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-serif font-black uppercase tracking-widest text-brand-gold hover:text-brand-red-light transition-colors duration-200 block"
            >
              SUMEDH RAUT
            </a>
            <p className="text-[8px] font-mono text-brand-gray uppercase tracking-widest leading-relaxed">
              Theme Music by <span className="text-brand-gold font-bold">LONE WOLF</span>
            </p>
            <p className="text-[8px] font-mono text-brand-gray uppercase tracking-widest">
              github.com/SumedhRdotcom · v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
