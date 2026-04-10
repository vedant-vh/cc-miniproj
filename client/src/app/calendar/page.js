'use client';
import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '../globals.css';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeft, Bell, Code2 } from 'lucide-react';
import Link from 'next/link';

const locales = { 'en-US': enUS };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
});

const PLATFORM_COLORS = {
  'leetcode.com':    '#ffa116',
  'codeforces.com':  '#3b82f6',
  'codechef.com':    '#84cc16',
  'atcoder.jp':      '#8b5cf6',
  'kaggle.com':      '#20beff',
};

const PLATFORM_LABELS = {
  'leetcode.com': 'LeetCode',
  'codeforces.com': 'Codeforces',
  'codechef.com': 'CodeChef',
  'atcoder.jp': 'AtCoder',
  'kaggle.com': 'Kaggle',
};

export default function CalendarPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  useEffect(() => {
    if (user) fetchReminders();
  }, [user]);

  const fetchData = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      // Fetch both upcoming AND recent past so the calendar is always populated
      const [upcomingRes, pastRes] = await Promise.all([
        fetch(`${API_URL}/api/contests`),
        fetch(`${API_URL}/api/contests/past`),
      ]);
      const ALLOWED = ['kaggle.com', 'atcoder.jp', 'leetcode.com', 'codechef.com', 'codeforces.com'];
      const allContests = [];
      if (upcomingRes.ok) allContests.push(...await upcomingRes.json());
      if (pastRes.ok) allContests.push(...await pastRes.json());
      
      const formatted = allContests
        .filter(c => ALLOWED.includes(c.platform))
        .map(c => ({
          id: c.id,
          title: c.name,
          start: new Date(c.startTime),
          end: c.endTime ? new Date(c.endTime) : new Date(new Date(c.startTime).getTime() + (c.duration || 3600) * 1000),
          url: c.url,
          platform: c.platform,
        }));
      console.log(`Calendar loaded ${formatted.length} events (${allContests.length} total from DB)`);
      setEvents(formatted);
    } catch (err) {
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReminders = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/user/reminders`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (res.ok) setReminders(await res.json());
    } catch (err) { console.error(err); }
  };

  const eventStyleGetter = (event) => {
    const isReminder = reminders.includes(event.id);
    const color = PLATFORM_COLORS[event.platform] || '#3b82f6';
    return {
      style: {
        backgroundColor: isReminder ? '#7c3aed' : color,
        border: isReminder ? '2px solid #fff' : 'none',
        boxShadow: isReminder ? '0 0 12px rgba(124,58,237,0.8)' : 'none',
        borderRadius: '6px',
        fontSize: '0.72rem',
        padding: '2px 6px',
        fontWeight: '600',
        color: '#fff',
        cursor: 'pointer',
      },
    };
  };

  if (!mounted) return null;

  return (
    <main className="container" style={{ maxWidth: '1400px' }}>
      {/* Event Detail Popup */}
      {selectedEvent && (
        <div
          onClick={() => setSelectedEvent(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="card"
            style={{ width: '420px', padding: '2rem', animation: 'fadeInUp 0.3s ease' }}
          >
            <div className="card-platform" style={{ marginBottom: '1rem' }}>
              {PLATFORM_LABELS[selectedEvent.platform] || selectedEvent.platform}
            </div>
            <h2 className="card-title" style={{ marginBottom: '1.5rem', fontSize: '1.15rem' }}>
              {selectedEvent.title}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Starts</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedEvent.start.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase' }}>Ends</span>
                <span style={{ fontSize: '0.9rem' }}>{selectedEvent.end.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            {reminders.includes(selectedEvent.id) && (
              <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: '10px', padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#a78bfa' }}>
                <Bell size={16} fill="currentColor" /> Email reminder is set for this contest.
              </div>
            )}
            <a
              href={selectedEvent.url}
              target="_blank"
              rel="noreferrer"
              className="segment-btn active"
              style={{ textDecoration: 'none', display: 'flex', justifyContent: 'center', padding: '12px' }}
            >
              <Code2 size={16} /> Open Competition Page
            </a>
          </div>
        </div>
      )}

      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            <ChevronLeft size={20} /> Back to Hub
          </Link>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Contest Calendar
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Click any event to view details</p>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--card-border)', minWidth: '180px' }}>
          {Object.entries(PLATFORM_LABELS).map(([key, label]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: PLATFORM_COLORS[key], flexShrink: 0 }}></div>
              <span style={{ color: 'var(--text-muted)' }}>{label}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: '#7c3aed', flexShrink: 0, border: '1px solid #fff' }}></div>
            <span style={{ color: '#a78bfa' }}>My Reminders</span>
          </div>
        </div>
      </header>

      {loading ? (
        <div style={{ height: '700px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
          <p>Loading contests...</p>
        </div>
      ) : (
        <div style={{ background: 'rgba(15, 22, 41, 0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '1.5rem', overflow: 'hidden' }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '750px', background: 'transparent' }}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={(event) => setSelectedEvent(event)}
            views={['month', 'week', 'agenda']}
            defaultView="month"
            popup
            showMultiDayTimes
            components={{
              event: ({ event }) => (
                <span title={event.title} style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {event.title}
                </span>
              )
            }}
          />
        </div>
      )}
    </main>
  );
}
