import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Contest Tracker | Ultimate Coding Dashboard',
  description: 'Track upcoming contests from LeetCode, Codeforces, and more with reminders and analytics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
