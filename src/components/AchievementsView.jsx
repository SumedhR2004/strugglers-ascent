import React, { useState, useEffect } from 'react';
import { storage, ACHIEVEMENTS } from '../lib/storage';
import { Trophy, Lock, Unlock, ShieldAlert } from 'lucide-react';

export default function AchievementsView({ activeTab }) {
  const [unlocked, setUnlocked] = useState([]);

  useEffect(() => {
    setUnlocked(storage.getAchievements());
  }, [activeTab]);

  const getTierColor = (tier, isUnlocked) => {
    if (!isUnlocked) return 'border-brand-border text-brand-gray opacity-40 bg-[#0d0d0d]';
    
    switch (tier) {
      case 'Gold':
        return 'border-brand-gold bg-[#1a150b] text-brand-gold shadow-[0_0_15px_rgba(201,162,39,0.25)]';
      case 'Silver':
        return 'border-[#a3a3a3] bg-[#121212] text-[#e8e6e1] shadow-[0_0_15px_rgba(163,163,163,0.15)]';
      case 'Bronze':
        default:
        return 'border-[#8c6239] bg-[#110d0a] text-[#c69c6d] shadow-[0_0_15px_rgba(140,98,57,0.15)]';
    }
  };

  const unlockedCount = ACHIEVEMENTS.filter(ach => unlocked.includes(ach.id)).length;
  const totalCount = ACHIEVEMENTS.length;
  const percentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Achievements Header Banner */}
      <div className="border border-brand-border bg-brand-card p-6 shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6">
        <div className="space-y-1.5 text-center sm:text-left">
          <h2 className="text-xl font-serif text-brand-bone uppercase tracking-wider">Hall of Brands (Achievements)</h2>
          <p className="text-xs text-brand-gray-light uppercase tracking-wider">
            Prove your grit. Unlocking accomplishments deepens your brand's sigil.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-brand-gray uppercase tracking-widest block">Unlocked Seals</span>
            <span className="text-2xl font-serif font-black text-brand-gold">{unlockedCount} / {totalCount}</span>
          </div>
          <div className="w-16 h-16 rounded-full border-2 border-brand-border bg-brand-bg flex items-center justify-center relative">
            <Trophy className="w-6 h-6 text-brand-red animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-brand-gold mt-8 font-black">
              {percentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ACHIEVEMENTS.map(ach => {
          const isUnlocked = unlocked.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`border p-5 flex flex-col justify-between h-48 transition-all duration-300 relative group overflow-hidden ${getTierColor(
                ach.tier,
                isUnlocked
              )}`}
            >
              {/* Background watermark */}
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
                <Trophy size="w-24 h-24" className="w-24 h-24" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 border border-current bg-brand-bg/50">
                    {ach.tier}
                  </span>
                  
                  {isUnlocked ? (
                    <Unlock className="w-4 h-4 text-brand-gold animate-bounce" />
                  ) : (
                    <Lock className="w-4 h-4 text-brand-gray" />
                  )}
                </div>

                <h3 className="font-serif font-black uppercase text-sm tracking-wider leading-snug mt-2">
                  {ach.title}
                </h3>
                <p className="text-[11px] text-brand-gray-light leading-relaxed font-sans mt-1">
                  {ach.desc}
                </p>
              </div>

              <div className="border-t border-current/20 pt-2 mt-4 text-[9px] font-mono uppercase tracking-wider flex justify-between">
                <span>Status</span>
                <span className="font-bold">{isUnlocked ? 'SEAL UNLOCKED' : 'LOCKED'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
