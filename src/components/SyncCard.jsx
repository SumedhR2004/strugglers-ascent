import React, { useState, useEffect } from 'react';
import { 
  getFirebase, 
  initFirebase, 
  loginWithGoogle, 
  logoutFirebase, 
  subscribeToAuth,
  pushAllDataToCloud,
  pullAllDataFromCloud
} from '../lib/firebase';
import { Cloud, CloudOff, RefreshCw, Key, LogIn, LogOut, Check, ShieldAlert } from 'lucide-react';

export default function SyncCard({ onNotification }) {
  const [config, setConfig] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [user, setUser] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('');
  const [showConfigForm, setShowConfigForm] = useState(false);

  useEffect(() => {
    // Check initial firebase configuration status
    const { app } = getFirebase();
    setIsInitialized(!!app);
    setLastSync(localStorage.getItem('brand-last-sync-time') || 'Never');

    // Subscribe to Firebase Auth changes
    const unsubscribe = subscribeToAuth((currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleConfigure = (e) => {
    e.preventDefault();
    try {
      // Try parsing the configuration string
      const parsedConfig = JSON.parse(config.trim());
      if (!parsedConfig.apiKey || !parsedConfig.projectId) {
        throw new Error("Invalid Config: apiKey and projectId are required.");
      }

      const success = initFirebase(parsedConfig);
      if (success) {
        setIsInitialized(true);
        setShowConfigForm(false);
        setConfig('');
        onNotification({
          type: 'quest_complete',
          title: 'FIREBASE KEY COMMITTED',
          desc: 'Cloud sync parameters successfully registered. You can now link your Google Account.',
          quote: "Those who move are those who survive. That is the only law of the ash."
        });
        
        // Setup listener again since firebase is initialized now
        subscribeToAuth((currentUser) => {
          setUser(currentUser);
        });
      } else {
        alert("Failed to initialize Firebase with the provided configuration.");
      }
    } catch (err) {
      alert(`Configuration error: ${err.message}. Please paste the valid JSON config object.`);
    }
  };

  const handleLogin = async () => {
    try {
      const loggedUser = await loginWithGoogle();
      onNotification({
        type: 'quest_complete',
        title: 'CLOUD ACCOUNT SIGNED IN',
        desc: `Welcome, struggles ledger connected to Google account: ${loggedUser.email}.`,
        quote: "Fight. Twist. Carve your way out of the dark."
      });
    } catch (e) {
      alert("Failed to log in with Google.");
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      onNotification({
        type: 'streak_decay',
        title: 'CLOUD DATABASE DISCONNECTED',
        desc: 'Successfully logged out. Your data will only persist locally.',
        quote: "Cry out if you must. Whine. Twist and fight. But never cease your struggle."
      });
    } catch (e) {
      alert("Failed to log out.");
    }
  };

  const handlePushSync = async () => {
    if (!user) return;
    setSyncing(true);
    try {
      await pushAllDataToCloud(user.uid);
      const nowStr = new Date().toLocaleString();
      setLastSync(nowStr);
      onNotification({
        type: 'quest_complete',
        title: 'CLOUD LEDGER BACKUP COMPLETE',
        desc: 'Successfully pushed all stats, logs, and achievements to your secure Firestore cloud store.',
        quote: "Let them keep their clean towers. My domain is here—in the mud, the sweat, and the ash."
      });
    } catch (e) {
      alert("Failed to backup data to the cloud.");
    } finally {
      setSyncing(false);
    }
  };

  const handlePullSync = async () => {
    if (!user) return;
    if (!window.confirm("WARNING: Pulling data from the cloud will overwrite your local stats, quest configurations, and reflections with the cloud copy. Do you proceed?")) {
      return;
    }
    
    setSyncing(true);
    try {
      await pullAllDataFromCloud(user.uid);
      const nowStr = new Date().toLocaleString();
      setLastSync(nowStr);
      onNotification({
        type: 'quest_complete',
        title: 'LEDGER SYNC SUCCESSFUL',
        desc: 'Overwrote local stats with cloud backup. Re-branding system database...',
        quote: "Even if what was broken is gathered once more, the seams remain. Yet we persist."
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e) {
      alert("Failed to sync backup from the cloud.");
    } finally {
      setSyncing(false);
    }
  };

  const handleRemoveConfig = () => {
    if (window.confirm("Disconnect Firebase parameters? Cloud backups will be disabled. Your local data stays intact.")) {
      localStorage.removeItem('brand-firebase-config');
      localStorage.removeItem('brand-last-sync-time');
      logoutFirebase();
      setIsInitialized(false);
      setUser(null);
      onNotification({
        type: 'streak_decay',
        title: 'CLOUDBASE DISCONNECTED',
        desc: 'Firebase config parameters removed.',
        quote: "Keep your eyes locked on the horizon. Looking back only summons the ghosts."
      });
    }
  };

  // If Firebase is not initialized, show configuration portal
  if (!isInitialized) {
    return (
      <div className="border border-brand-border bg-brand-card p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <CloudOff className="w-5 h-5 text-brand-gray" />
            <h3 className="font-serif uppercase tracking-widest text-xs font-bold text-brand-bone">Cloud Sync (Inactive)</h3>
          </div>
          <span className="text-[8px] font-mono text-brand-gray uppercase">Local Mode</span>
        </div>

        <p className="text-[10px] text-brand-gray-light leading-relaxed">
          Google Cloud saving requires entering your own free Firebase Project Configuration config object. 
        </p>

        {!showConfigForm ? (
          <button
            id="btn_show_cloud_config"
            onClick={() => setShowConfigForm(true)}
            className="w-full py-2 bg-[#0d0d0d] border border-brand-border hover:border-brand-gold text-brand-bone text-[10px] font-serif uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5 text-brand-gold" /> Connect Firebase
          </button>
        ) : (
          <form onSubmit={handleConfigure} className="space-y-3">
            <div>
              <label className="text-[8px] text-brand-gray uppercase tracking-widest block mb-1">Firebase SDK Config JSON</label>
              <textarea
                id="textarea_firebase_config"
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                placeholder='e.g. { "apiKey": "AIzaSy...", "projectId": "brand-...", ... }'
                className="w-full h-32 p-2 border border-brand-border bg-brand-bg text-brand-bone font-mono text-[9px] outline-none focus:border-brand-red resize-none"
                required
              />
            </div>
            <div className="flex gap-2">
              <button
                id="btn_submit_cloud_config"
                type="submit"
                className="flex-1 py-1.5 bg-brand-red text-brand-bone border border-brand-red text-[9px] font-serif uppercase tracking-widest hover:bg-transparent hover:text-brand-red-light transition-all cursor-pointer"
              >
                Save config
              </button>
              <button
                id="btn_cancel_cloud_config"
                type="button"
                onClick={() => setShowConfigForm(false)}
                className="px-3 py-1.5 border border-brand-border text-brand-gray text-[9px] font-serif uppercase tracking-widest hover:text-brand-bone transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="border border-brand-border bg-brand-card p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between border-b border-brand-border pb-3">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-emerald-400" />
          <h3 className="font-serif uppercase tracking-widest text-xs font-bold text-brand-bone">Cloud Sync (Linked)</h3>
        </div>
        <span className="text-[8px] font-mono text-emerald-400 uppercase">Online</span>
      </div>

      {user ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 bg-[#0d0d0d] p-2.5 border border-brand-border/40">
            {user.photoURL ? (
              <img 
                src={user.photoURL} 
                alt={user.displayName || "Google User"} 
                className="w-8 h-8 rounded-full border border-brand-gold"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-red/20 border border-brand-red text-brand-bone flex items-center justify-center font-serif text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-serif font-black text-brand-bone truncate uppercase tracking-wider">
                {user.displayName || "Struggler"}
              </p>
              <p className="text-[9px] text-brand-gray truncate">{user.email}</p>
            </div>
          </div>

          <div className="text-[9px] text-brand-gray-light font-mono flex justify-between uppercase">
            <span>Last Saved Sync:</span>
            <span className="text-brand-gold">{lastSync}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              id="btn_cloud_push"
              onClick={handlePushSync}
              disabled={syncing}
              className="flex-1 py-2 bg-brand-red/10 border border-brand-red hover:bg-brand-red text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3 text-brand-red" />}
              <span>Backup (Push)</span>
            </button>

            <button
              id="btn_cloud_pull"
              onClick={handlePullSync}
              disabled={syncing}
              className="flex-1 py-2 bg-[#0a0a0a] border border-brand-border hover:border-brand-gold text-brand-bone text-[9px] font-serif uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 text-brand-gold" />}
              <span>Restore (Pull)</span>
            </button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-brand-border/40 text-[9px] font-mono">
            <button 
              id="btn_disconnect_config"
              onClick={handleRemoveConfig}
              className="text-brand-gray-light hover:text-brand-red uppercase transition-all"
            >
              Delete credentials
            </button>
            <button
              id="btn_cloud_logout"
              onClick={handleLogout}
              className="text-brand-gray-light hover:text-brand-bone uppercase transition-all flex items-center gap-1"
            >
              <LogOut className="w-2.5 h-2.5" /> Log Out
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <p className="text-[10px] text-brand-gray-light leading-relaxed">
            Firebase is configured. Sign in to sync your character sheet, workout sets, and logs to the cloud.
          </p>
          <button
            id="btn_google_login"
            onClick={handleLogin}
            className="w-full py-2 bg-brand-red text-brand-bone border border-brand-red text-[10px] font-serif uppercase tracking-widest hover:bg-transparent hover:text-brand-red-light transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In with Google
          </button>
          <button
            id="btn_disconnect_config_unauth"
            onClick={handleRemoveConfig}
            className="text-[9px] font-mono text-brand-gray-light hover:text-brand-red uppercase transition-all block mx-auto"
          >
            Remove Firebase configuration
          </button>
        </div>
      )}
    </div>
  );
}
