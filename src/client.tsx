import React from 'react';
import { createFrontendPlugin } from '@vantage/plugin-sdk/react';

function CalendarPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 16px' }}>Calendar</h1>
      <p style={{ color: 'var(--text2)', fontSize: 13 }}>Calendar plugin UI.</p>
    </div>
  );
}

function CalendarContactPanel({ recordId }: { recordId: string }) {
  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text2)' }}>No calendar events for this contact.</p>
    </div>
  );
}

function CalendarDealPanel({ recordId }: { recordId: string }) {
  return (
    <div style={{ padding: 16 }}>
      <p style={{ fontSize: 13, color: 'var(--text2)' }}>No calendar events for this deal.</p>
    </div>
  );
}

export default createFrontendPlugin({
  setup(vantage) {
    vantage.registerPage('/calendar', CalendarPage);
    vantage.registerPanel('contact', 'calendar-contact-panel', CalendarContactPanel);
    vantage.registerPanel('deal', 'calendar-deal-panel', CalendarDealPanel);
  },
});
