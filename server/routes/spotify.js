import express from 'express';
import axios from 'axios';
import qs from 'querystring';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.warn('WARNING: SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET not set in env.');
}

// --- Simple token cache ---
let tokenCache = {
  access_token: null,
  expires_at: 0 
};

async function getClientCredentialsToken() {
  const now = Date.now();
  if (tokenCache.access_token && tokenCache.expires_at > now + 5000) {
    return tokenCache.access_token;
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const body = qs.stringify({ grant_type: 'client_credentials' });

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  try {
    const res = await axios.post(tokenUrl, body, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 7000
    });

    const data = res.data;
    tokenCache.access_token = data.access_token;
    tokenCache.expires_at = Date.now() + (data.expires_in * 1000);
    return tokenCache.access_token;
  } catch (err) {
    console.error('Failed to fetch Spotify token:', err.response ? err.response.data : err.message);
    throw err;
  }
}


let localPlaylists = {};
try {
  const dataPath = path.resolve(process.cwd(), 'server', 'data', 'playlists.json');
  if (fs.existsSync(dataPath)) {
    localPlaylists = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log('Loaded local playlist mapping from server/data/playlists.json');
  } else {
    localPlaylists = {}; 
  }
} catch (e) {
  console.error('Error reading local playlists file:', e.message);
  localPlaylists = {};
}


const isPlaylistId = (s) => typeof s === 'string' && /^[A-Za-z0-9]{22}$/.test(s);


router.get('/search-playlists', async (req, res) => {
  const q = (req.query.q || '').toString().trim();
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit || '12', 10)));

  if (!q) {
    const ids = new Set();
    for (const mood of Object.values(localPlaylists || {})) {
      for (const arr of Object.values(mood || {})) (arr || []).forEach(id => ids.add(id));
    }
    return res.json({ playlists: Array.from(ids).slice(0, limit).map(id => ({ id })) });
  }

  let token;
  try {
    token = await getClientCredentialsToken();
  } catch (err) {
    console.error('Token fetch failed, returning fallback local ids');
    const fallbackIds = [];
    for (const mood of Object.values(localPlaylists || {})) {
      for (const arr of Object.values(mood || {})) (arr || []).forEach(id => fallbackIds.push(id));
    }
    return res.json({ playlists: Array.from(new Set(fallbackIds)).slice(0, limit).map(id => ({ id })) });
  }

  try {
    const searchUrl = 'https://api.spotify.com/v1/search';
    const response = await axios.get(searchUrl, {
      params: { q, type: 'playlist', limit },
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000
    });

    const items = (response.data && response.data.playlists && response.data.playlists.items) || [];
    const playlists = items
      .filter(it => it && it.id)
      .map(it => ({
        id: it.id,
        name: it.name,
        description: it.description,
        images: it.images || []
      }));

    if (!playlists.length) {
      const fallbackIds = [];
      const qLower = q.toLowerCase();
      for (const [moodKey, languages] of Object.entries(localPlaylists || {})) {
        if (qLower.includes(moodKey)) {
          for (const arr of Object.values(languages || {})) (arr || []).forEach(id => fallbackIds.push(id));
        }
      }
      if (fallbackIds.length) {
        return res.json({ playlists: Array.from(new Set(fallbackIds)).slice(0, limit).map(id => ({ id })) });
      }
    }

    return res.json({ playlists });
  } catch (err) {
    console.error('Spotify search failed:', err.response ? err.response.data : err.message);
    const fallback = [];
    for (const mood of Object.values(localPlaylists || {})) {
      for (const arr of Object.values(mood || {})) (arr || []).forEach(id => fallback.push(id));
    }
    return res.json({ playlists: Array.from(new Set(fallback)).slice(0, limit).map(id => ({ id })) });
  }
});

router.get('/local-playlists', (req, res) => {
  if (Object.keys(localPlaylists || {}).length === 0) {
    return res.status(404).json({ error: 'No local playlists configured on server.' });
  }
  res.json({ playlists: localPlaylists });
});

export default router;
