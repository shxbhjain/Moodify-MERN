import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import EmailVerify from './pages/EmailVerify';
import ResetPassword from './pages/ResetPassword';
import { ToastContainer, toast } from 'react-toastify';
import EmotionPage from './components/EmotionPage.jsx';
import PlaylistPage from './pages/PlaylistPage';
import Preferences from './pages/Preferences';

const App = () => {
  return (
    <div>
      <ToastContainer/>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/login' element={<Login />} />
        <Route path='/email-verify' element={<EmailVerify />} />
        <Route path='/reset-password' element={<ResetPassword />} />
        <Route path='/emotion' element={<EmotionPage />} />
        <Route path="/playlist" element={<PlaylistPage />} />
        <Route path="/preferences" element={<Preferences />} />
        {/* optional fallback */}
        <Route path='*' element={<div>404 Not Found</div>} />
      </Routes>
    </div>
  );
};

export default App;
