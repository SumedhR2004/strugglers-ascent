import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
import { audioController } from '../lib/audio';
import { BrandSigil } from './BrandSigil';

export default function EntryRitual({ onAccept }) {
  const [stage, setStage] = useState(0); // 0: Fade-in, 1: Active prompt, 2: Reject screen, 3: Branding animation
  const [glowColor, setGlowColor] = useState('text-brand-red');

  useEffect(() => {
    // Stage transition timers
    const t1 = setTimeout(() => setStage(1), 1500);
    return () => clearTimeout(t1);
  }, []);

  const handleAccept = () => {
    setStage(3);
    setGlowColor('text-red-500');
    audioController.playSizzle();
    // Animate branding for 1.5 seconds, then set onboarding complete in storage and notify parent
    setTimeout(() => {
      storage.setOnboarding(true);
      onAccept();
    }, 1500);
  };

  const handleDecline = () => {
    setStage(2);
  };

  if (stage === 2) {
    return (
      <div className="fixed inset-0 bg-[#060606] flex flex-col items-center justify-center p-6 text-center select-none z-50">
        <div className="max-w-md w-full border border-brand-border bg-[#0d0d0d] p-8 text-center shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="text-brand-gray mb-8">
            <BrandSigil className="mx-auto text-brand-gray opacity-20" size="w-16 h-16" />
          </div>
          <h2 className="text-2xl text-brand-bone font-serif uppercase tracking-widest mb-4">
            THE STRENGTH OF WILL
          </h2>
          <p className="text-brand-gray-light font-sans text-sm leading-relaxed mb-8">
            "Go ahead and whine. Struggle. Run. Squirm. Fight your way out. Otherwise, you're just a corpse."
          </p>
          <p className="text-brand-gray font-serif italic mb-8">
            Return when you are ready.
          </p>
          <button
            id="btn_onboarding_retry"
            onClick={() => setStage(1)}
            className="px-6 py-2 border border-brand-red text-brand-red font-serif hover:bg-brand-red hover:text-brand-bone transition-all duration-300 uppercase tracking-widest text-xs"
          >
            Reconsider
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center p-6 select-none z-50 overflow-hidden">
      {/* Background subtle scanlines or glows */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.12)_0%,transparent_65%)] pointer-events-none" />
      <div className="absolute inset-0 bg-radial-glow opacity-30 pointer-events-none" />
      
      {/* Pulse Brand */}
      <div 
        className={`transition-all duration-1000 ${
          stage === 0 ? 'opacity-0 scale-75' : 'opacity-100 scale-100'
        } ${stage === 3 ? 'animate-branding-flash' : 'pulsing-brand'} ${glowColor}`}
      >
        <BrandSigil size="w-44 h-44 md:w-52 md:h-52" />
      </div>

      {/* Ritual Prompt */}
      <div 
        className={`text-center mt-12 max-w-xl transition-all duration-1000 delay-300 ${
          stage >= 1 && stage !== 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}
      >
        <h1 className="text-3xl md:text-4xl text-brand-bone font-serif font-black tracking-widest mb-4 leading-snug uppercase">
          ARE YOU READY TO SACRIFICE YOUR COMFORT?
        </h1>
        <p className="text-brand-red-light font-serif italic text-sm md:text-base tracking-wide mb-12">
          "This is not a curse placed on you. It is a choice you make."
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            id="btn_ritual_accept"
            onClick={handleAccept}
            className="w-56 px-6 py-3.5 border border-brand-red bg-brand-red text-brand-bone font-serif font-bold hover:bg-transparent hover:text-brand-red-light hover:shadow-[0_0_30px_rgba(139,0,0,0.8)] transition-all duration-300 uppercase tracking-widest text-xs active:scale-95 shadow-[0_0_15px_rgba(139,0,0,0.4)] cursor-pointer"
          >
            I ACCEPT THE BRAND
          </button>
          
          <button
            id="btn_ritual_decline"
            onClick={handleDecline}
            className="w-56 px-6 py-3.5 border border-brand-border text-brand-gray-light font-serif hover:border-brand-gray hover:text-brand-bone hover:bg-brand-card transition-all duration-300 uppercase tracking-widest text-xs active:scale-95 cursor-pointer"
          >
            NOT YET
          </button>
        </div>
      </div>

      {/* Screen branding flash overlay */}
      {stage === 3 && (
        <div className="absolute inset-0 bg-red-900 opacity-20 pointer-events-none animate-pulse" />
      )}
    </div>
  );
}
