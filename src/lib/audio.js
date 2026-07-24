// THE BRAND: ASCENSION SYSTEM - Web Audio Synthesizer Engine

let audioCtx = null;
let bgMusicAudio = null;

// Audio settings state
let isMuted = localStorage.getItem('brand-audio-muted') === 'true';
let isMusicEnabled = localStorage.getItem('brand-audio-music') !== 'false'; // default true
let musicVolume = parseFloat(localStorage.getItem('brand-audio-volume') || '0.25');

const initAudioContext = () => {
  if (!audioCtx) {
    // Standard AudioContext initialization
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // Resume if suspended (browser security autoplays block)
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

export const audioController = {
  isMuted: () => isMuted,
  isMusicEnabled: () => isMusicEnabled,

  setMuted: (muted) => {
    isMuted = muted;
    localStorage.setItem('brand-audio-muted', muted ? 'true' : 'false');
    if (muted) {
      audioController.stopAmbientDrone();
    } else {
      initAudioContext();
      if (isMusicEnabled) {
        audioController.startAmbientDrone();
      }
    }
  },

  setMusicEnabled: (enabled) => {
    isMusicEnabled = enabled;
    localStorage.setItem('brand-audio-music', enabled ? 'true' : 'false');
    if (enabled && !isMuted) {
      audioController.startAmbientDrone();
    } else {
      audioController.stopAmbientDrone();
    }
  },

  // ⚔️ Giant Metal Sword Clang (Dragonslayer SFX)
  playClang: () => {
    if (isMuted) return;
    const ctx = initAudioContext();
    const now = ctx.currentTime;

    // Create audio nodes
    const gainNode = ctx.createGain();
    
    // Inharmonic frequencies to simulate heavy metal clang
    const freqs = [120, 230, 310, 443, 580, 890, 1200];
    const oscillators = [];

    freqs.forEach((f, index) => {
      const osc = ctx.createOscillator();
      // Mix saw and square waves for a harsh metallic timbre
      osc.type = index % 2 === 0 ? 'sawtooth' : 'square';
      osc.frequency.setValueAtTime(f, now);
      
      // Detune slightly over time for frequency dispersion
      osc.frequency.exponentialRampToValueAtTime(f * 0.95, now + 0.6);
      
      const oscGain = ctx.createGain();
      // Higher frequencies decay faster, lower rumble lasts longer
      const volume = 0.3 / freqs.length;
      oscGain.gain.setValueAtTime(volume, now);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + (0.3 + (1.2 / f)));

      osc.connect(oscGain);
      oscGain.connect(gainNode);
      oscillators.push(osc);
    });

    // Add high-pass filter for metal strike impact
    const filterNode = ctx.createBiquadFilter();
    filterNode.type = 'bandpass';
    filterNode.frequency.setValueAtTime(600, now);
    filterNode.frequency.exponentialRampToValueAtTime(200, now + 0.4);
    filterNode.Q.setValueAtTime(3, now);

    // Dynamic volume envelope
    gainNode.gain.setValueAtTime(0.01, now);
    // Exponential rise for sudden impact hit
    gainNode.gain.linearRampToValueAtTime(0.8, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    // Connect nodes
    gainNode.connect(filterNode);
    filterNode.connect(ctx.destination);

    // Start & stop oscillators
    oscillators.forEach(osc => {
      osc.start(now);
      osc.stop(now + 1.0);
    });
  },

  // 🔔 RPG Level Up Rising Chime
  playLevelUp: () => {
    if (isMuted) return;
    const ctx = initAudioContext();
    const now = ctx.currentTime;

    const notes = [
      { f: 261.63, t: 0.0 },  // C4
      { f: 329.63, t: 0.12 }, // E4
      { f: 392.00, t: 0.24 }, // G4
      { f: 523.25, t: 0.36 }, // C5
      { f: 659.25, t: 0.48 }, // E5
      { f: 783.99, t: 0.60 }, // G5
      { f: 1046.50, t: 0.72 } // C6
    ];

    notes.forEach(note => {
      const osc = ctx.createOscillator();
      // Triangle waves give a soft, retro chime tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, now + note.t);
      gain.gain.linearRampToValueAtTime(0.25, now + note.t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.t + 0.5);

      // Add a touch of resonance
      const filter = ctx.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.setValueAtTime(note.f * 1.5, now + note.t);

      osc.connect(gain);
      gain.connect(filter);
      filter.connect(ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + 0.6);
    });
  },

  // 🔥 Branding Sizzle (Accepting the Brand)
  playSizzle: () => {
    if (isMuted) return;
    const ctx = initAudioContext();
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 1.5; // 1.5 seconds of sound
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // Create white noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.frequency.exponentialRampToValueAtTime(300, now + 1.2);
    filter.Q.setValueAtTime(1.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, now);
    gainNode.gain.linearRampToValueAtTime(0.4, now + 0.1);
    // Add crackle envelope variations
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.4);
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

    noiseNode.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseNode.start(now);
    noiseNode.stop(now + 1.5);
  },

  // 🎵 Play custom background music: /LOnewolfmusic71.wav
  startAmbientDrone: () => {
    if (isMuted || !isMusicEnabled) return;

    if (!bgMusicAudio) {
      bgMusicAudio = new Audio('/LOnewolfmusic71.wav');
      bgMusicAudio.loop = true;
      bgMusicAudio.volume = musicVolume;
      
      bgMusicAudio.addEventListener('error', () => {
        console.error("[Audio Engine] Audio file failed to load:", bgMusicAudio.error);
      });
    }

    bgMusicAudio.play().catch(e => {
      console.warn("Failed to play custom track, will try on next interaction:", e);
    });
  },

  stopAmbientDrone: () => {
    if (bgMusicAudio) {
      bgMusicAudio.pause();
    }
  },

  getVolume: () => musicVolume,

  setVolume: (vol) => {
    musicVolume = vol;
    localStorage.setItem('brand-audio-volume', vol.toString());
    if (bgMusicAudio) {
      bgMusicAudio.volume = vol;
    }
  }
};
