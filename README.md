# Moodify — Emotion-Based Music Recommendation (MERN)

Realtime emotion detection from face landmarks + Spotify-powered playlist recommendations.

---

## 📌 Features

* Real-time emotion inference from **face landmarks**.
* Spotify API integration for mood-aware playlist recommendations.
* REST API for inference, playlist search, and user preference handling.
* Lightweight inference pipeline optimized for low latency.
* MERN stack with clean client–server separation.

---

## 🛠 Tech Stack

**Frontend:** React, Axios, WebRTC (getUserMedia)

**Backend:** Node.js, Express

**Database:** MongoDB

**Auth / External:** Spotify Web API (OAuth), JWT (optional)

**Deployment:** Vercel (client), Render/Railway/Heroku/Vercel (server)

---

## 🧩 Architecture Overview

1. Client captures webcam feed → extracts **face landmarks**.
2. Landmarks sent to backend → backend infers emotion.
3. Emotion mapped to **mood tags** → queried against Spotify.
4. Client displays recommended tracks/playlists.

---

## 🚀 Getting Started (Local Setup)

### 1. Clone repository

```
git clone https://github.com/shxbhjain/Moodify-MERN.git
cd Moodify-MERN
```

### 2. Install dependencies

**Server:**

```
cd server
npm install
```

**Client:**

```
cd ../client
npm install
```

### 3. Add environment variables

Create `.env` in **server**:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://localhost:5000/api/auth/spotify/callback
FRONTEND_URL=http://localhost:3000
```

Create `.env` in **client**:

```
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 4. Run project

**Server:**

```
cd server
npm run dev
```

**Client:**

```
cd client
npm start
```

Open: `http://localhost:3000`

---

## 🔌 API Endpoints

### **Auth**

* `GET /api/auth/spotify` — start OAuth
* `GET /api/auth/spotify/callback` — OAuth callback

### **Inference**

* `POST /api/infer/landmarks`

```
{
  "landmarks": [...]
}
```

Response:

```
{
  "emotion": "happy",
  "confidence": 0.86
}
```

### **Recommendations**

* `POST /api/recommend/playlists`

```
{
  "emotion": "happy"
}
```

### **User**

* `POST /api/user/preferences`
* `POST /api/user/save-playlist`

---

## 🖥 Client Flow

1. User allows webcam.
2. Client extracts face landmarks.
3. Sends landmarks → backend.
4. Backend infers mood.
5. Client requests playlists → displays them.

---

## ☁ Deployment Notes

### **Client (Vercel)**

* Set env `REACT_APP_API_BASE_URL` to your deployed backend.

### **Server**

Deploy on: Render / Railway / Heroku / Vercel.

* Enable CORS for your client URL.
* Set production Spotify redirect URI.

### Spotify Dashboard Setup

Add redirect:

```
https://<your-server>/api/auth/spotify/callback
```

---

## 🧪 Testing

* Backend: Jest / Mocha
* Client: Testing-library / Cypress
* OAuth flow needs manual verification.

---

## 🛠 Common Issues

**CORS errors:** Add your frontend domain to CORS.

**OAuth redirect mismatch:** Fix redirect URI in Spotify dashboard.

**Face not detected:** Check webcam permissions and lighting.

---

## 📈 Roadmap

* Better emotion smoothing
* User-based personalization
* Faster on-device inference
* Dark/light UI themes

---

## 🤝 Contributing

1. Fork repo
2. Create branch: `feat/<feature>`
3. Commit + push
4. Open PR

---

## 📄 License & Contact

* License: MIT (add LICENSE file if needed)
* Author: Shubh Jain

---

# Quick Copy Header

```
# Moodify — Emotion-Based Music Recommendation
Realtime emotion detection from face landmarks + Spotify-powered playlist recommendations.
```
