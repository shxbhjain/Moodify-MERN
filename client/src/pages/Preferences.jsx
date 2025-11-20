import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx'; 

const STORAGE_KEY = 'moodPreferences';
// const MOODS = ['happy','sad','angry','calm','romantic','energetic','party','neutral','rock'];
const MOODS = ['angry', 'happy', 'neutral', 'sad', 'surprise', 'rock'];
const LANG_OPTIONS = [
  { value: 'english', label: 'English' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' },
  { value: 'mixed', label: 'Mixed (auto)' }
];

export default function Preferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const defaults = {};
      MOODS.forEach(m => (defaults[m] = (parsed && parsed[m]) || 'mixed'));
      return defaults;
    } catch (e) {
      const defaults = {};
      MOODS.forEach(m => (defaults[m] = 'mixed'));
      return defaults;
    }
  });

  useEffect(() => {

  }, []);

  function update(mood, value) {
    setPrefs(prev => ({ ...prev, [mood]: value }));
  }

  function save() {
    try {
      const toSave = {};
      MOODS.forEach(m => { toSave[m] = prefs[m] || 'mixed'; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error('Failed to save preferences', e);
    }
    navigate('/playlist');
  }

  function resetToDefaults() {
    const defaults = {};
    MOODS.forEach(m => (defaults[m] = 'mixed'));
    setPrefs(defaults);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults)); } catch {}
  }

  function clearPrefs() {
    localStorage.removeItem(STORAGE_KEY);
    const defaults = MOODS.reduce((acc, m) => ({ ...acc, [m]: 'mixed' }), {});
    setPrefs(defaults);
  }

  return (
    <div className="min-h-screen bg-[#071427] text-white">
      <Navbar />
      <main className="max-w-3xl mx-auto p-6 pt-28">
        <h1 className="text-2xl font-semibold mb-4">Personalize your music preferences</h1>
        <p className="mb-6 text-sm opacity-75">
          Choose which language/style you'd like for each mood. These preferences are stored locally on your device.
        </p>

        <div className="space-y-4">
          {MOODS.map(mood => (
            <div key={mood} className="flex items-center gap-4 p-3 rounded-md bg-white/5">
              <div className="w-36 capitalize font-medium">{mood}</div>
              <select
                value={prefs[mood] || 'mixed'}
                onChange={e => update(mood, e.target.value)}
                className="px-3 py-2 rounded bg-transparent border border-white/10"
                style={{ color: 'inherit' }}
              >
                {LANG_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={save} className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-700">Save preferences</button>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded border border-white/10">Cancel</button>
          <button onClick={resetToDefaults} className="px-3 py-2 rounded bg-yellow-600 hover:bg-yellow-700">Reset to Mixed</button>
          <button onClick={clearPrefs} className="px-3 py-2 rounded bg-red-600 hover:bg-red-700">Clear Stored Prefs</button>
        </div>

        <p className="mt-4 text-xs opacity-60">
          Tip: If you previously saved incorrect preferences, click <strong>Clear Stored Prefs</strong>, then choose your preferred languages and Save.
        </p>
      </main>
    </div>
  );
}
