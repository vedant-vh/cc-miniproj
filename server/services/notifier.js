const cron = require('node-cron');
const nodemailer = require('nodemailer');
const prisma = require('../db');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

cron.schedule('*/5 * * * *', async () => {
  console.log('Reminder Worker: Checking for upcoming contests...');
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
  const oneHourAndFiveLater = new Date(now.getTime() + 65 * 60 * 1000);

  try {
    const reminders = await prisma.reminder.findMany({
      where: {
        contest: {
          startTime: {
            gte: oneHourLater,
            lte: oneHourAndFiveLater,
          },
        },
      },
      include: {
        user: true,
        contest: true,
      },
    });

    for (const reminder of reminders) {
      const { user, contest } = reminder;
      const mailOptions = {
        from: `"Contest Tracker" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: `🔔 Reminder: ${contest.name} starts in 1 hour!`,
        text: `Hello ${user.name || 'Coder'},\n\nYour contest "${contest.name}" on ${contest.platform} starts in exactly 1 hour.\n\nContest Link: ${contest.url}\n\nGood luck!`,
        html: `<p>Hello ${user.name || 'Coder'},</p><p>Your contest <strong>${contest.name}</strong> on <strong>${contest.platform}</strong> starts in exactly 1 hour.</p><p><a href="${contest.url}">Join Contest</a></p><p>Good luck!</p>`,
      };
      await transporter.sendMail(mailOptions);
      console.log(`Reminder Email sent to ${user.email} for contest ${contest.name}`);
    }
  } catch (error) {
    console.error('Reminder Worker Error:', error);
  }
});

module.exports = transporter;
