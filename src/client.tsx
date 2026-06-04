import React from 'react';
import { createFrontendPlugin } from '@vencore/plugin-sdk/react';

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
  setup(vencore) {
    vencore.registerPage('/calendar', CalendarPage);
    vencore.registerPanel('contact', 'calendar-contact-panel', CalendarContactPanel);
    vencore.registerPanel('deal', 'calendar-deal-panel', CalendarDealPanel);
  },
});
