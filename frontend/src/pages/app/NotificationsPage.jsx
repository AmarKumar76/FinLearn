import React, { useState } from 'react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { INITIAL_NOTIFICATIONS } from '../../utils/mockData';
import {
  Bell,
  CheckCheck,
  CalendarClock,
  PiggyBank,
  GraduationCap,
  Trash2
} from 'lucide-react';

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleClear = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-aubergine">
            Notifications & Alerts
          </h1>
          <p className="text-xs text-aubergine/70">
            Due date reminders • Budget thresholds • Learning updates
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={CheckCheck}
          onClick={handleMarkAllRead}
        >
          Mark All Read
        </Button>
      </div>

      <div className="space-y-3">
        {notifications.map((n) => {
          let Icon = Bell;
          if (n.type === 'commitment') Icon = CalendarClock;
          if (n.type === 'budget') Icon = PiggyBank;
          if (n.type === 'learning') Icon = GraduationCap;

          return (
            <Card
              key={n.id}
              className={`border-brass/25 transition-all ${
                n.isRead ? 'bg-white/60' : 'bg-white border-l-4 border-l-terracotta shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    n.isRead ? 'bg-ivory-dark text-aubergine/60' : 'bg-terracotta/15 text-terracotta'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm ${n.isRead ? 'font-medium text-aubergine/80' : 'font-bold text-aubergine'}`}>
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-terracotta" />
                      )}
                    </div>
                    <p className="text-xs text-aubergine/70 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-aubergine/50 font-mono block">
                      {n.time}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleClear(n.id)}
                  className="p-1 rounded text-aubergine/30 hover:text-rose-600 transition-colors"
                  title="Remove notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default NotificationsPage;
