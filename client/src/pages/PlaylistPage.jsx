import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const STORAGE_KEY = 'moodPreferences';

// Mood normalization
const MOOD_BUCKET = {
  happy: ['happy', 'joy', 'excited', 'amused', 'delighted', 'content'],
  sad: ['sad', 'down', 'depressed', 'melancholy'],
  angry: ['angry', 'frustrated', 'annoyed', 'irritated'],
  neutral: ['neutral', 'normal', 'none', 'unsure'],
  rock: ['rock', 'guitar', 'metal']
};

function normalizeMood(detected) {
  if (!detected) return 'neutral';
  const s = detected.toString().trim().toLowerCase();
  for (const [bucket, words] of Object.entries(MOOD_BUCKET)) {
    if (words.includes(s) || s === bucket) return bucket;
    for (const w of words) if (s.includes(w)) return bucket;
  }
  if (s.includes('happy') || s.includes('joy')) return 'happy';
  if (s.includes('sad') || s.includes('depress')) return 'sad';
  if (s.includes('angry') || s.includes('mad') || s.includes('rage')) return 'angry';
  if (s.includes('calm') || s.includes('relax') || s.includes('chill')) return 'calm';
  if (s.includes('love') || s.includes('romant')) return 'romantic';
  if (s.includes('ener') || s.includes('motivat') || s.includes('pump')) return 'energetic';
  if (s.includes('party') || s.includes('dance')) return 'party';
  if (s.includes('rock') || s.includes('guitar') || s.includes('metal')) return 'rock';
  return 'neutral';
}

const DEFAULT_PLAYLIST = '37i9dQZF1DX4fpCWaHOned';
const isValidSpotifyId = (id) => typeof id === 'string' && /^[A-Za-z0-9]{22}$/.test(id);

const MOOD_PLAYLISTS_LANG = {
  happy: {
    english: ['37i9dQZF1DXdPec7aLTmlC', '37i9dQZF1DX3rxVfibe1L0'],
    hindi: ['37i9dQZF1DX9sIqqvKsjG8'],
    punjabi: ['37i9dQZF1DX4fpCWaHOned'],
    rock: ['37i9dQZF1DXa2PvUpywmrr'],
    mixed: ['37i9dQZF1DWXRqgorJj26U']
  },
  neutral: {
    english: ['37i9dQZF1DWXRqgorJj26U', '37i9dQZF1DX4fpCWaHOned'],
    hindi: ['37i9dQZF1DX0XUsuxWHRQd'],
    punjabi: ['37i9dQZF1DX4fpCWaHOned'],
    rock: ['37i9dQZF1DX4fpCWaHOned'],
    mixed: ['37i9dQZF1DX4fpCWaHOned']
  }
};

function getPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function extractSpotifyPlaylistId(raw) {
  if (!raw && raw !== 0) return null;
  if (typeof raw === 'object') {
    if (raw.id && isValidSpotifyId(raw.id)) return raw.id;
    if (raw.uri) {
      const m = String(raw.uri).match(/spotify:playlist:([A-Za-z0-9]{22})/);
      if (m) return m[1];
    }
    if (raw.external_urls && raw.external_urls.spotify) {
      const m = String(raw.external_urls.spotify).match(/playlist\/([A-Za-z0-9]{22})/);
      if (m) return m[1];
    }
    if (raw.playlist && typeof raw.playlist === 'string') {
      const m = raw.playlist.match(/([A-Za-z0-9]{22})/);
      if (m) return m[1];
    }
    try {
      const s = JSON.stringify(raw);
      const m = s.match(/playlist\/([A-Za-z0-9]{22})|spotify:playlist:([A-Za-z0-9]{22})|"([A-Za-z0-9]{22})"/);
      if (m) return m[1] || m[2] || m[3];
    } catch (e) {
      //ignore..
    }
    return null;
  }

  const s = String(raw).trim();
  if (isValidSpotifyId(s)) return s;
  let m = s.match(/playlist\/([A-Za-z0-9]{22})/);
  if (m) return m[1];
  m = s.match(/spotify:playlist:([A-Za-z0-9]{22})/);
  if (m) return m[1];
  m = s.match(/([A-Za-z0-9]{22})/);
  if (m) return m[1];
  return null;
}

function buildFallbackCandidates(moodVal, langVal) {
  const playlistsForMood = (MOOD_PLAYLISTS_LANG[moodVal] || {});
  const gatherValid = (arr) => (Array.isArray(arr) ? arr.filter(isValidSpotifyId) : []);
  let candidatePlaylists = [];

  if (langVal === 'mixed') {
    for (const key of Object.keys(playlistsForMood)) {
      candidatePlaylists = candidatePlaylists.concat(gatherValid(playlistsForMood[key]));
    }
  } else {
    candidatePlaylists = gatherValid(playlistsForMood[langVal]);
    if (candidatePlaylists.length === 0) candidatePlaylists = gatherValid(playlistsForMood['english'] || []);
    if (candidatePlaylists.length === 0) candidatePlaylists = gatherValid(playlistsForMood['rock'] || []);
    if (candidatePlaylists.length === 0) {
      for (const key of Object.keys(playlistsForMood)) {
        candidatePlaylists = candidatePlaylists.concat(gatherValid(playlistsForMood[key]));
      }
    }
  }

  if (candidatePlaylists.length === 0) {
    for (const moodObj of Object.values(MOOD_PLAYLISTS_LANG)) {
      if (moodObj && moodObj.mixed) candidatePlaylists = candidatePlaylists.concat(gatherValid(moodObj.mixed));
    }
  }

  if (candidatePlaylists.length === 0) candidatePlaylists = [DEFAULT_PLAYLIST];
  return Array.from(new Set(candidatePlaylists));
}

export default function PlaylistPage() {
  const [mood, setMood] = useState('neutral');
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState('mixed');
  const [playlists, setPlaylists] = useState([DEFAULT_PLAYLIST]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const qMood = q.get('mood');
    const stored = sessionStorage.getItem('detectedMood');
    const detected = (qMood || stored || 'neutral').toLowerCase();
    const normalized = normalizeMood(detected);
    setMood(normalized);

    const prefs = getPreferences();
    const chosen = (prefs && prefs[normalized]) || 'mixed';
    setLang(chosen);
    setIndex(0);
  }, [location.search]);

useEffect(() => {
  let cancelled = false;

  async function fetchPlaylists() {
    setLoading(true);
    setError(null);

    if (mounted.current) setPlaylists([]);

    const storedPrefs = getPreferences() || {};
    const prefForMood = (storedPrefs && storedPrefs[mood]) || null;

    const normalizedPref = typeof prefForMood === 'string' ? prefForMood.toLowerCase().trim() : null;
    const langForQuery = (normalizedPref && normalizedPref !== '') ? normalizedPref : (lang && lang !== 'mixed' ? lang : 'mixed');

    console.info(`[PlaylistPage] mood=${mood} stateLang=${lang} storedPref=${normalizedPref} -> using langForQuery=${langForQuery}`);

    const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
    const q = `${mood} playlist ${langForQuery !== 'mixed' ? langForQuery : ''} by spotify`.trim();
    const query = encodeURIComponent(q || mood || 'mood');
    const apiUrl = `${API_BASE.replace(/\/$/, '')}/api/spotify/search-playlists?q=${query}&limit=10`;

    console.info('[PlaylistPage] fetching playlists from', apiUrl);

    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts && !cancelled; attempt++) {
      try {
        const res = await fetch(apiUrl, { method: 'GET' });
        console.info(`[PlaylistPage] attempt ${attempt} status:`, res.status);

        let data;
        try { data = await res.json(); }
        catch (errJson) {
          const txt = await res.text().catch(() => null);
          data = txt ? JSON.parse(txt) : null;
        }

        console.debug('[PlaylistPage] raw response:', data);

        let rawList = [];
        if (Array.isArray(data)) rawList = data;
        else if (data && Array.isArray(data.playlists)) rawList = data.playlists;
        else if (data && Array.isArray(data.items)) rawList = data.items;
        else if (data && typeof data === 'object') {
          for (const k of Object.keys(data)) {
            if (Array.isArray(data[k]) && data[k].length > 0) {
              rawList = data[k];
              break;
            }
          }
        }

        console.debug('[PlaylistPage] rawList from API:', rawList);

        const ids = (Array.isArray(rawList)
          ? rawList.map(item => {
              if (!item && item !== 0) return null;
              if (typeof item === 'string') return extractSpotifyPlaylistId(item);
              if (typeof item === 'object') {
                if (item.id && /^[A-Za-z0-9]{22}$/.test(String(item.id))) return String(item.id);
                return extractSpotifyPlaylistId(item);
              }
              return null;
            }).filter(Boolean)
          : []);

        console.debug('[PlaylistPage] extracted ids:', ids);

        if (ids.length > 0) {
          if (!cancelled && mounted.current) {
            setPlaylists(ids);
            setIndex(0);
            setError(null);
            setLoading(false);
          }
          return;
        }

        console.warn(`[PlaylistPage] attempt ${attempt} returned no valid ids`);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 250 * attempt));
          continue;
        } else {
          const fallback = buildFallbackCandidates(mood, langForQuery);
          if (!cancelled && mounted.current) {
            setPlaylists(fallback);
            setIndex(0);
            setError('Failed to fetch playlists from server; using local fallback.');
            setLoading(false);
          }
          return;
        }
      } catch (err) {
        console.error(`[PlaylistPage] attempt ${attempt} failed:`, err);
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 250 * attempt));
          continue;
        } else {
          const fallback = buildFallbackCandidates(mood, langForQuery);
          if (!cancelled && mounted.current) {
            setPlaylists(fallback);
            setIndex(0);
            setError(`Failed to fetch playlists from server; using local fallback. (${err.message})`);
            setLoading(false);
          }
          return;
        }
      }
    }
  }

  fetchPlaylists();
  return () => { cancelled = true; };
}, [mood, lang]); 


  const prev = () => setIndex(i => (playlists && playlists.length ? (i - 1 + playlists.length) % playlists.length : 0));
  const next = () => setIndex(i => (playlists && playlists.length ? (i + 1) % playlists.length : 0));

  const currentPlaylistId = (Array.isArray(playlists) && playlists.length > 0)
    ? playlists[index % playlists.length]
    : DEFAULT_PLAYLIST;

  const safePlaylistId = isValidSpotifyId(currentPlaylistId)
    ? currentPlaylistId
    : DEFAULT_PLAYLIST;

  const embedUrl = `https://open.spotify.com/embed/playlist/${safePlaylistId}`;

  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      <main className="max-w-4xl mx-auto p-6 pt-28">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <button onClick={() => navigate(-1)} className="mb-2 btn btn-ghost">← Back</button>
            <h1 className="text-2xl font-semibold">Mood: {mood}</h1>
            <div className="text-sm opacity-70 mt-1">Preference: <strong className="capitalize">{lang}</strong></div>
          </div>

          <div className="flex items-center gap-2">
            <button className="btn btn-sm" onClick={() => navigate('/preferences')}>Edit Preferences</button>
            <div className="text-sm opacity-70">Prev Next</div>
          </div>
        </div>

        <div className="rounded-md overflow-hidden shadow">
          {loading ? (
            <div className="p-8 text-center">Loading playlists…</div>
          ) : (
            <iframe
              title="Moodify playlist"
              src={embedUrl}
              width="100%"
              height="380"
              frameBorder="0"
              allow="encrypted-media; clipboard-write"
            />
          )}
        </div>

        <div className="mt-4 text-sm opacity-80">
          <p>
            {error ? <span className="text-error">{error}</span> : <>Showing playlist {index + 1} of {playlists.length} for <strong>{mood}</strong> ({lang}).</>}
          </p>
          <p className="mt-2">Tip: Open <button className="link" onClick={() => navigate('/preferences')}>Preferences</button> to set your preferred language/style for this mood.</p>
        </div>

        <div className="mt-4 flex gap-2">
          <button onClick={prev} className="btn btn-outline btn-sm">Prev</button>
          <button onClick={next} className="btn btn-outline btn-sm">Next</button>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <div>Debug: playlists: {JSON.stringify(playlists)}</div>
          <div>NOTE: Check DevTools Network tab for the API response and console for logs.</div>
        </div>
      </main>
    </div>
  );
}
