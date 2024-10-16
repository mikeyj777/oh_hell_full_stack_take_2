import logo from './logo.svg';
import './App.css';
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Login from './components/Login';
import Settings from './components/Settings';
import MainDashboard from './components/MainDashboard';
import GameDisplay from './components/GameDisplay';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/main-dashboard" element={<MainDashboard />} />
        {/* <Route path="/settings" element={<Settings />} />
        <Route path="/game-display" element={<GameDisplay />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
