'use client';
import { useState, useEffect } from 'react';
import './globals.css';
import Countdown from '../components/Countdown';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Bell, BellOff, History, Calendar, User, LogOut, ChevronRight, Search, CheckCircle } from 'lucide-react';

export default function Home() {
  const { user, logout } = useAuth();
  const [contests, setContests] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [view, setView] = useState('upcoming');
  const [statusMessage, setStatusMessage] = useState('');

  const ALLOWED_PLATFORMS = ['kaggle.com', 'atcoder.jp', 'leetcode.com', 'codechef.com', 'codeforces.com'];
  const PLATFORM_LABELS = {
    'kaggle.com': 'Kaggle',
    'atcoder.jp': 'AtCoder',
    'leetcode.com': 'LeetCode',
    'codechef.com': 'CodeChef',
    'codeforces.com': 'Codeforces'
  };

  useEffect(() => {
    fetchData();
    if (user) fetchReminders();
  }, [user, view]);

  const fetchData = async () => {
    setLoading(true);
    try {
      let endpoint = '/api/contests';
      if (view === 'past') endpoint = '/api/contests/past';
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const [contestsRes, platformsRes] = await Promise.all([
        fetch(`${API_URL}${endpoint}`),
        fetch(`${API_URL}/api/platforms`)
      ]);
      
      if (contestsRes.ok) setContests(await contestsRes.json());
      if (platformsRes.ok) {
        const data = await platformsRes.json();
        setPlatforms(['All', ...data.filter(p => ALLOWED_PLATFORMS.includes(p))]);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const fetchReminders = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/user/reminders`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) setReminders(await res.json());
    } catch (err) { console.error(err); }
  };

  const toggleReminder = async (contestId) => {
    if (!user) return window.location.href = '/auth';
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/user/reminders/toggle`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ contestId })
      });
      if (res.ok) {
        const data = await res.json();
        const isAdded = data.status === 'added';
        setReminders(prev => isAdded ? [...prev, contestId] : prev.filter(id => id !== contestId));
        setStatusMessage(isAdded ? 'Email reminder scheduled for 1hr before start.' : 'Reminder removed.');
        setTimeout(() => setStatusMessage(''), 4000);
      }
    } catch (err) { console.error(err); }
  };

  const filteredContests = contests
    .filter(c => ALLOWED_PLATFORMS.includes(c.platform))
    .filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = selectedPlatform === 'All' || c.platform === selectedPlatform;
      const isBookmarked = view === 'reminders' ? reminders.includes(c.id) : true;
      return matchesSearch && matchesPlatform && isBookmarked;
    });

  return (
    <main className="container">
      {/* Toast Notification */}
      {statusMessage && (
        <div className="toast-fixed">
          <CheckCircle size={18} /> {statusMessage}
        </div>
      )}

      <nav style={{ display: 'flex', justifyContent: 'flex-end', gap: '2rem', marginBottom: '3rem', alignItems: 'center' }}>
        <Link href="/calendar" style={{ textDecoration: 'none', color: 'var(--primary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
          <Calendar size={16} /> Calendar Hub
        </Link>
        {user ? (
          <>
            <Link href="/profile" style={{ textDecoration: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={16} /> My Profile
            </Link>
            <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4d', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <LogOut size={16} /> Sign Out
            </button>
          </>
        ) : (
          <Link href="/auth" className="btn active" style={{ textDecoration: 'none', padding: '8px 24px', borderRadius: '12px' }}>Sign In</Link>
        )}
      </nav>

      <header className="header">
        <h1>Contest Tracker</h1>
        <p>Stay ahead of the competition with real-time tracking.</p>
      </header>

      {/* Segmented Control View Switcher */}
      <div style={{ textAlign: 'center' }}>
        <div className="segmented-control">
          <button className={`segment-btn ${view === 'upcoming' ? 'active' : ''}`} onClick={() => setView('upcoming')}>
            <Calendar size={16} /> Upcoming
          </button>
          <button className={`segment-btn ${view === 'reminders' ? 'active' : ''}`} onClick={() => setView('reminders')}>
            <Bell size={16} /> My Contests
          </button>
          <button className={`segment-btn ${view === 'past' ? 'active' : ''}`} onClick={() => setView('past')}>
            <History size={16} /> History
          </button>
        </div>
      </div>

      <div className="search-container">
        <Search className="search-icon" size={20} />
        <input 
          type="text" 
          className="search-input" 
          placeholder={`Find ${view === 'reminders' ? 'bookmarked' : view} contests...`} 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="filter-bar">
        {platforms.map(p => (
          <button key={p} className={`btn ${selectedPlatform === p ? 'active' : ''}`} onClick={() => setSelectedPlatform(p)}>
            {PLATFORM_LABELS[p] || p}
          </button>
        ))}
      </div>

      <div className="grid">
        {loading ? (
           <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)', padding: '4rem'}}><p>Hydrating contests...</p></div>
        ) : filteredContests.length === 0 ? (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', color: 'var(--text-muted)', padding: '4rem'}}><p>No matches found in your {view} list.</p></div>
        ) : (
          filteredContests.map((contest, index) => (
            <div className="card" key={contest.id} style={{ animationDelay: `${index * 50}ms` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-platform">{PLATFORM_LABELS[contest.platform] || contest.platform}</div>
                {view === 'upcoming' && (
                  <button 
                    onClick={() => toggleReminder(contest.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: reminders.includes(contest.id) ? 'var(--primary)' : 'rgba(255,255,255,0.2)', transition: 'color 0.2s' }}
                  >
                    {reminders.includes(contest.id) ? <Bell size={20} fill="currentColor" /> : <BellOff size={20} />}
                  </button>
                )}
              </div>
              <div className="card-title">{contest.name}</div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                <div className="card-time">
                  <span style={{opacity: 0.5, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase'}}>Timing</span> 
                  {new Date(contest.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} at {new Date(contest.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="card-time">
                  <span style={{opacity: 0.5, display: 'block', fontSize: '0.7rem', textTransform: 'uppercase'}}>Duration</span>
                  {Math.round(contest.duration / 3600)} Hours
                </div>
              </div>

              {view === 'upcoming' && (
                <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '1rem', color: 'var(--primary)', fontWeight: '600' }}>
                  <Countdown startTime={contest.startTime} />
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem' }}>
                 <a href={contest.url} target="_blank" rel="noreferrer" className="segment-btn active" style={{ flex: 1, textDecoration: 'none', justifyContent: 'center' }}>
                  Go to Competition <ChevronRight size={16} />
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
