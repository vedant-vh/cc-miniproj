'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronLeft, Save, TrendingUp, User as UserIcon } from 'lucide-react';
import '@/app/globals.css';

export default function ProfilePage() {
  const { user, setUser, loading } = useAuth();
  const router = useRouter();
  const [handle, setHandle] = useState(user?.codeforcesHandle || '');
  const [analytics, setAnalytics] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/auth');
    if (user?.codeforcesHandle) fetchAnalytics(user.codeforcesHandle);
  }, [user, loading]);

  const fetchAnalytics = async (cfHandle) => {
    setFetchingData(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/user/analytics/codeforces?handle=${cfHandle}`);
      if (res.ok) {
        const data = await res.json();
        const chartData = data.map(item => ({
          date: new Date(item.ratingUpdateTimeSeconds * 1000).toLocaleDateString(),
          rating: item.newRating,
          contest: item.contestName
        }));
        setAnalytics(chartData);
      }
    } catch (err) { console.error(err); }
    finally { setFetchingData(false); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/user/profile`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ codeforcesHandle: handle })
      });
      if (res.ok) {
        const updatedUser = { ...user, codeforcesHandle: handle };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Persistent update
        fetchAnalytics(handle);
      }
    } catch (err) { console.error(err); }
    finally { setUpdating(false); }
  };

  if (loading || !user) return <div className="container" style={{ textAlign: 'center', opacity: 0.5 }}><h1>Verifying Credentials...</h1></div>;

  return (
    <main className="container" style={{ animation: 'fadeInUp 0.6s ease' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '3rem', fontSize: '0.9rem' }}>
        <ChevronLeft size={20} /> Back to Hub
      </Link>

      <header className="header" style={{ textAlign: 'left', marginBottom: '4rem' }}>
        <h1>My Profile</h1>
        <p>Sync your coding personas and monitor your growth.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2.5rem' }}>
        {/* Account Summary */}
        <div className="card" style={{ height: 'fit-content', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--gradient)', padding: '12px', borderRadius: '14px' }}>
              <UserIcon size={24} color="#white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{user.name}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user.email}</p>
            </div>
          </div>

          <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Codeforces Identity</label>
              <input 
                type="text" 
                className="search-input" 
                style={{ paddingLeft: '1.2rem' }} 
                placeholder="Enter handle (e.g. tourist)" 
                value={handle} 
                onChange={(e) => setHandle(e.target.value)} 
              />
            </div>
            <button className="segment-btn active" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={updating}>
              <Save size={18} /> {updating ? 'Syncing...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Analytics Visualization */}
        <div className="card" style={{ gridColumn: 'span 1', minHeight: '400px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem' }}>
              <TrendingUp size={20} color="var(--primary)" /> Performance Index
            </h3>
            {fetchingData && <div className="toast-tag" style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase' }}>Updating...</div>}
          </div>

          {analytics.length > 0 ? (
            <div style={{ height: '300px', width: '100%', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 50', 'dataMax + 50']} />
                  <Tooltip 
                    contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px' }}
                    itemStyle={{ color: 'var(--primary)', fontWeight: '700' }}
                    labelStyle={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '4px' }}
                  />
                  <Line 
                    type="natural" 
                    dataKey="rating" 
                    stroke="var(--primary)" 
                    strokeWidth={4} 
                    dot={false}
                    activeDot={{ r: 6, fill: '#fff', stroke: 'var(--primary)', strokeWidth: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Initial: {analytics[0].rating}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '700' }}>Current: {analytics[analytics.length-1].rating}</span>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>
              <p style={{ marginBottom: '1rem' }}>{user.codeforcesHandle ? 'No historical data found.' : 'Connect your accounts to visualize your rating trajectory.'}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
