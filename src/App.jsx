import React, { useState, useEffect } from 'react';
import { storage, registerSyncCallback } from './lib/storage';
import EntryRitual from './components/EntryRitual';
import TodayView from './components/TodayView';
import CharacterSheet from './components/CharacterSheet';
import HistoryView from './components/HistoryView';
import AchievementsView from './components/AchievementsView';
import ReflectionJournal from './components/ReflectionJournal';
import SettingsView from './components/SettingsView';
import { 
  Flame, ShieldAlert, Award, ChevronUp, 
  Swords, User, Calendar, Star, BookOpen, Settings as SettingsIcon,
  Volume2, VolumeX
} from 'lucide-react';
import { subscribeToAuth, pushSingleDocToCloud } from './lib/firebase';
import { audioController } from './lib/audio';
import { BrandSigil } from './components/BrandSigil';

const TABS = [
  { id: 'today',        label: 'Today',     Icon: Swords },
  { id: 'character',   label: 'Stats',     Icon: User },
  { id: 'history',     label: 'History',   Icon: Calendar },
  { id: 'achievements',label: 'Seals',     Icon: Star },
  { id: 'reflections', label: 'Journal',   Icon: BookOpen },
  { id: 'settings',    label: 'Settings',  Icon: SettingsIcon },
];

// ── EMBER CANVAS PARTICLE OVERLAY (MASTERCLASS FX) ──
function EmberOverlay({ active }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Create particles
    const particles = [];
    const particleCount = 70;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 100,
        vx: (Math.random() - 0.5) * 1.8,
        vy: -Math.random() * 2.5 - 1.2,
        size: Math.random() * 3.5 + 1,
        color: Math.random() > 0.4 ? '#a51c1c' : '#c9a227', // red or gold
        alpha: Math.random() * 0.6 + 0.4,
        decay: Math.random() * 0.008 + 0.003
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Recycle dead particles
        if (p.alpha <= 0 || p.y < -10 || p.x < -10 || p.x > canvas.width + 10) {
          p.x = Math.random() * canvas.width;
          p.y = canvas.height + Math.random() * 20;
          p.vx = (Math.random() - 0.5) * 1.8;
          p.vy = -Math.random() * 2.5 - 1.2;
          p.alpha = Math.random() * 0.6 + 0.4;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[49] w-full h-full"
    />
  );
}

export default function App() {
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [notificationsQueue, setNotificationsQueue] = useState([]);
  const [systemStateChecked, setSystemStateChecked] = useState(false);
  const [muted, setMuted] = useState(audioController.isMuted());

  useEffect(() => {
    const onboarding = storage.getOnboarding();
    setOnboardingComplete(onboarding.complete);
    setSystemStateChecked(true);

    // Register active Firebase authentication sync handler
    const unsubscribe = subscribeToAuth((user) => {
      if (user) {
        registerSyncCallback((key, value) => {
          pushSingleDocToCloud(user.uid, key, value);
        });
      } else {
        registerSyncCallback(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 🎵 Autoplay background music upon first user interaction
  useEffect(() => {
    if (onboardingComplete) {
      const handleUserInteraction = () => {
        audioController.startAmbientDrone();
        // Remove listeners
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('touchstart', handleUserInteraction);
      };
      window.addEventListener('click', handleUserInteraction);
      window.addEventListener('touchstart', handleUserInteraction);
      return () => {
        window.removeEventListener('click', handleUserInteraction);
        window.removeEventListener('touchstart', handleUserInteraction);
      };
    }
  }, [onboardingComplete]);

  // 🔔 Trigger level-up or clear chimes when notifications are displayed
  useEffect(() => {
    const currentNotif = notificationsQueue[0];
    if (currentNotif) {
      if (currentNotif.type === 'level_up' || currentNotif.type === 'daily_clear' || currentNotif.type === 'achievement_unlocked') {
        audioController.playLevelUp();
      }
    }
  }, [notificationsQueue]);

  const queueNotification = (notif) => {
    setNotificationsQueue((prev) => [...prev, { ...notif, id: Date.now() + Math.random() }]);
  };

  const handleDismissNotification = () => {
    setNotificationsQueue((prev) => prev.slice(1));
  };

  const handleToggleMute = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    audioController.setMuted(nextMuted);
  };

  const handleRecommit = () => {
    if (window.confirm("Do you wish to return to the Entry Ritual? Your current logs and levels will be preserved.")) {
      storage.setOnboarding(false);
      setOnboardingComplete(false);
      setActiveTab('today');
    }
  };

  if (!systemStateChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-center space-y-4">
          <BrandSigil className="mx-auto text-brand-red animate-pulse" size="w-12 h-12" />
          <p className="text-brand-gray font-serif uppercase tracking-widest text-xs">CALIBRATING SYSTEM...</p>
        </div>
      </div>
    );
  }

  if (!onboardingComplete) {
    return <EntryRitual onAccept={() => setOnboardingComplete(true)} />;
  }

  const currentNotif = notificationsQueue[0];

  const renderActiveView = () => {
    switch (activeTab) {
      case 'today':        return <TodayView onNotification={queueNotification} activeTab={activeTab} setActiveTab={setActiveTab} />;
      case 'character':   return <CharacterSheet onNotification={queueNotification} activeTab={activeTab} />;
      case 'history':     return <HistoryView onNotification={queueNotification} activeTab={activeTab} />;
      case 'achievements':return <AchievementsView activeTab={activeTab} />;
      case 'reflections': return <ReflectionJournal onNotification={queueNotification} activeTab={activeTab} />;
      case 'settings':    return <SettingsView onNotification={queueNotification} onRecommit={handleRecommit} activeTab={activeTab} />;
      default:            return <TodayView onNotification={queueNotification} activeTab={activeTab} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg text-brand-bone font-sans relative">
      {/* ── TOP HEADER (shown on all screens) ── */}
      <header className="border-b border-brand-border bg-[#0d0d0d] sticky top-0 z-30 shadow-[0_2px_15px_rgba(0,0,0,0.9)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          {/* Logo & Mute */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 select-none">
              <img 
                src="/logo.jpg" 
                alt="Brand of Ascension" 
                className="h-9 md:h-11 w-auto object-contain filter brightness-110"
              />
            </div>
            
            {/* Audio Toggle Button */}
            <button 
              id="btn_mute_toggle"
              onClick={handleToggleMute} 
              className={`p-1.5 border hover:border-brand-red rounded-sm transition-all duration-300 cursor-pointer ${
                muted ? 'border-brand-border/40 text-brand-gray' : 'border-brand-red/40 text-brand-red'
              }`}
              title={muted ? "Unmute system" : "Mute system"}
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 animate-pulse" />}
            </button>
          </div>

          {/* Desktop Tab Navigation (hidden on mobile — we use bottom bar instead) */}
          <nav className="hidden md:flex gap-4">
            {TABS.map(({ id, label }) => (
              <button
                key={id}
                id={`tab_btn_${id}`}
                onClick={() => setActiveTab(id)}
                className={`py-2 px-3 text-center border-b-2 font-serif uppercase tracking-widest text-[10px] transition-all duration-300 font-bold outline-none cursor-pointer ${
                  activeTab === id
                    ? 'border-brand-red text-brand-red'
                    : 'border-transparent text-brand-gray-light hover:text-brand-bone hover:border-brand-border'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Mobile: show active tab name */}
          <span className="md:hidden text-[10px] font-serif uppercase tracking-widest text-brand-red font-bold">
            {TABS.find(t => t.id === activeTab)?.label}
          </span>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      {/* pb-24 on mobile to clear the bottom nav bar */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-28 md:pb-10">
        <div className="animate-fade-in" key={activeTab}>
          {renderActiveView()}
        </div>
      </main>

      <footer className="hidden md:block text-center py-6 text-brand-gray text-[9px] uppercase tracking-wider font-mono space-y-1.5">
        <p>"Cry out. Whine. Twist and fight. But never cease your struggle. In the end, only those who refuse to yield remain standing."</p>
        <p>
          Built by{" "}
          <a
            href="https://github.com/SumedhRdotcom"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-red-light hover:text-brand-gold transition-colors duration-200 font-bold tracking-widest"
          >
            SUMEDH RAUT
          </a>
          {" "}· Theme Music by{" "}
          <span className="text-brand-gold font-bold tracking-widest">LONE WOLF</span>
          {" "}· v1.0.0
        </p>
      </footer>

      {/* ── MOBILE BOTTOM NAV BAR ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0a0a0a] border-t border-brand-border shadow-[0_-4px_20px_rgba(0,0,0,0.8)]"
           style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex justify-around items-stretch">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              id={`mobile_tab_btn_${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all duration-200 cursor-pointer ${
                activeTab === id
                  ? 'text-brand-red bg-brand-red/5 border-t-2 border-brand-red'
                  : 'text-brand-gray border-t-2 border-transparent hover:text-brand-gray-light active:bg-brand-red/5'
              }`}
            >
              <Icon className={`w-5 h-5 transition-all duration-200 ${activeTab === id ? 'scale-110' : ''}`} />
              <span className="text-[8px] font-serif uppercase tracking-wider font-bold">{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* ── SYSTEM NOTIFICATION OVERLAY ── */}
      <EmberOverlay active={!!currentNotif} />
      {currentNotif && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4 z-50 animate-fade-in">
          <div className="system-panel w-full md:max-w-lg border-t md:border border-brand-red bg-[#0d0d0d] p-6 md:p-8 shadow-[0_0_40px_rgba(139,0,0,0.4)] relative animate-system-slide rounded-t-2xl md:rounded-none">
            
            {/* Top glow line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent" />

            {/* Drag handle (mobile) */}
            <div className="md:hidden w-10 h-1 bg-brand-border rounded-full mx-auto mb-6" />

            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center p-3 bg-brand-red/10 border border-brand-red/40 mb-2">
                {currentNotif.type === 'level_up' ? (
                  <ChevronUp className="w-8 h-8 text-brand-gold animate-bounce" />
                ) : currentNotif.type === 'streak_decay' ? (
                  <ShieldAlert className="w-8 h-8 text-brand-red animate-pulse" />
                ) : (
                  <Award className="w-8 h-8 text-brand-gold animate-pulse" />
                )}
              </div>

              <p className="text-[10px] font-mono tracking-widest text-brand-red uppercase">
                [ SYSTEM NOTIFICATION ]
              </p>

              <h3 className="text-xl font-serif font-black text-brand-bone tracking-wide uppercase leading-snug">
                {currentNotif.title}
              </h3>

              <p className="text-xs text-brand-gray-light leading-relaxed font-sans border-y border-brand-border/40 py-4">
                {currentNotif.desc}
              </p>

              {currentNotif.quote && (
                <p className="text-xs italic text-brand-gold font-serif opacity-80 leading-relaxed">
                  "{currentNotif.quote}"
                </p>
              )}
            </div>

            <button
              id="btn_dismiss_notification"
              onClick={handleDismissNotification}
              className="w-full mt-6 py-3 bg-[#0a0a0a] border border-brand-red hover:bg-brand-red text-brand-bone text-xs font-serif uppercase tracking-widest transition-all duration-300 cursor-pointer"
            >
              Acknowledge &amp; Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
