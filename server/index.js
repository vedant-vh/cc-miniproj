const express = require('express');
const cors = require('cors');
require('dotenv').config();
const prisma = require('./db');
const axios = require('axios');
const cron = require('node-cron');

// Import Auth and Service modules
const authRoutes = require('./routes/auth');
const verifyAuth = require('./middleware/auth');
require('./services/notifier');

const app = express();

// Clean FRONTEND_URL to prevent CORS trailing slash errors
let frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
if (frontendOrigin.endsWith('/')) {
  frontendOrigin = frontendOrigin.slice(0, -1);
}

const corsOptions = {
  origin: frontendOrigin,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.get('/', (req, res) => res.json({ status: 'API is running', version: '1.0.0' }));
app.use('/api/auth', authRoutes);

// ----------------------------------------------------
// GET /api/contests - Retrieve upcoming contests
// ----------------------------------------------------
app.get('/api/contests', async (req, res) => {
  console.log('GET /api/contests - Fetching upcoming contests');
  try {
    const contests = await prisma.contest.findMany({
      where: { startTime: { gt: new Date() } },
      orderBy: { startTime: 'asc' },
    });
    console.log(`Success: Found ${contests.length} upcoming contests`);
    res.json(contests);
  } catch (error) {
    console.error('Error fetching contests:', error);
    res.status(500).json({ error: 'Failed to fetch contests' });
  }
});

// ----------------------------------------------------
// GET /api/contests/past - Retrieve historical contests
// ----------------------------------------------------
app.get('/api/contests/past', async (req, res) => {
  try {
    const contests = await prisma.contest.findMany({
      where: { endTime: { lt: new Date() } },
      orderBy: { endTime: 'desc' },
      take: 50
    });
    res.json(contests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch past contests' });
  }
});

// ----------------------------------------------------
// REMINDERS - Toggle & List
// ----------------------------------------------------
app.post('/api/user/reminders/toggle', verifyAuth, async (req, res) => {
  const { contestId } = req.body;
  const userId = req.user.userId;
  try {
    const existing = await prisma.reminder.findUnique({
      where: { userId_contestId: { userId, contestId } }
    });
    if (existing) {
      await prisma.reminder.delete({ where: { id: existing.id } });
      return res.json({ status: 'removed' });
    } else {
      await prisma.reminder.create({ data: { userId, contestId } });
      return res.json({ status: 'added' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle reminder' });
  }
});

app.get('/api/user/reminders', verifyAuth, async (req, res) => {
  try {
    const reminders = await prisma.reminder.findMany({
      where: { userId: req.user.userId },
      include: { contest: true }
    });
    res.json(reminders.map(r => r.contestId));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// ----------------------------------------------------
// ANALYTICS - Codeforces
// ----------------------------------------------------
app.get('/api/user/analytics/codeforces', async (req, res) => {
  const { handle } = req.query;
  if (!handle) return res.status(400).json({ error: 'Handle required' });
  try {
    const response = await axios.get(`https://codeforces.com/api/user.rating?handle=${handle}`);
    res.json(response.data.result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch CF analytics' });
  }
});

// ----------------------------------------------------
// PROFILE - Update handle
// ----------------------------------------------------
app.post('/api/user/profile', verifyAuth, async (req, res) => {
  const { codeforcesHandle } = req.body;
  try {
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { codeforcesHandle }
    });
    res.json({ message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ----------------------------------------------------
// GET /api/platforms - Current Platforms
// ----------------------------------------------------
app.get('/api/platforms', async (req, res) => {
  try {
    const platforms = await prisma.contest.findMany({
      select: { platform: true },
      distinct: ['platform'],
    });
    res.json(platforms.map(p => p.platform));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// ----------------------------------------------------
// SYNC - Periodic update from CLIST
// ----------------------------------------------------
const SYNC_PLATFORMS = ['kaggle.com', 'atcoder.jp', 'leetcode.com', 'codechef.com', 'codeforces.com'];

const syncContests = async () => {
  if (!process.env.CLIST_USERNAME || !process.env.CLIST_API_KEY) return;
  console.log('Running scheduled sync from CLIST...');
  try {
    const response = await axios.get('https://clist.by/api/v4/contest/', {
      headers: { Authorization: `ApiKey ${process.env.CLIST_USERNAME}:${process.env.CLIST_API_KEY}` },
      params: {
        limit: 200,
        upcoming: true,
        order_by: 'start',
        resource: SYNC_PLATFORMS.join(','),
      }
    });
    const clistContests = response.data.objects || [];
    let upserted = 0;
    for (const item of clistContests) {
      if (!SYNC_PLATFORMS.includes(item.resource)) continue;
      await prisma.contest.upsert({
        where: { url: item.href },
        update: {
          name: item.event,
          startTime: new Date(item.start),
          endTime: new Date(item.end),
          duration: item.duration,
          platform: item.resource
        },
        create: {
          platform: item.resource,
          name: item.event,
          url: item.href,
          startTime: new Date(item.start),
          endTime: new Date(item.end),
          duration: item.duration
        }
      });
      upserted++;
    }
    console.log(`Sync complete: ${upserted} contests updated.`);
  } catch (error) {
    console.error('Auto-sync failed:', error.message);
  }
};

app.post('/api/contests/sync', async (req, res) => {
  await syncContests();
  res.json({ message: 'Sync successful' });
});

cron.schedule('0 * * * *', syncContests);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}...`);
});
