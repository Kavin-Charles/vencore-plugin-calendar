import { Router, type Response } from 'express';
import type { Kysely } from 'kysely';
import type { Database } from '@vantage/db';
import { createCalendarRouter } from './routes/calendar';

function serveUi(res: Response) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth();
  const monthStart = new Date(y, m, 1).toISOString().split('T')[0];
  const monthEnd   = new Date(y, m + 1, 0).toISOString().split('T')[0];
  const monthName  = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Calendar</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f7f6f2;color:#1a1814;font-size:13px;height:100vh;display:flex;flex-direction:column}
header{padding:14px 20px;background:#fff;border-bottom:1px solid #e4e0d8;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
h1{font-size:16px;font-weight:600;letter-spacing:-.3px}
.month{font-size:13px;color:#6b665c}
.content{padding:20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:16px}
.section-label{font-size:10px;font-weight:600;color:#9e998f;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:8px}
.event-card{background:#fff;border:1px solid #e4e0d8;border-radius:10px;padding:12px 16px;display:flex;gap:12px;align-items:flex-start}
.dot{width:10px;height:10px;border-radius:50%;background:var(--c,#6b665c);margin-top:3px;flex-shrink:0}
.event-title{font-size:13px;font-weight:500;color:#1a1814}
.event-meta{font-size:11px;color:#9e998f;margin-top:2px}
.cat{font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;background:#f0ede6;color:#6b665c;text-transform:capitalize}
.empty{padding:40px;text-align:center;color:#9e998f}
</style>
</head>
<body>
<header>
  <h1>Calendar</h1>
  <span class="month" id="month-label">${monthName}</span>
</header>
<div class="content" id="content"><div class="empty">Loading…</div></div>
<script>
const BASE = '/api/plugins/route/com.vantage.calendar';
let TOKEN = null;
const START = '${monthStart}', END = '${monthEnd}';

const CAT_COLORS = {holiday:'#2d6a4f',company_event:'#1e3a8a',meeting:'#92400e',other:'#6b665c'};

window.addEventListener('message', e => {
  if (e.data?.type === 'AUTH_TOKEN') { TOKEN = e.data.token; boot(); }
});

async function boot() {
  const r = await fetch(BASE + '?start=' + START + '&end=' + END, {
    credentials: 'include',
    headers: TOKEN ? { Authorization: 'Bearer ' + TOKEN } : {}
  });
  const json = await r.json();
  const events = json.data ?? [];
  const content = document.getElementById('content');
  if (!events.length) { content.innerHTML = '<div class="empty">No events this month.</div>'; return; }

  // Group by week
  const upcoming = events.filter(e => new Date(e.start_date) >= new Date());
  const past     = events.filter(e => new Date(e.start_date) < new Date());

  let html = '';
  if (upcoming.length) {
    html += '<div><div class="section-label">Upcoming</div>' + upcoming.map(renderEvent).join('') + '</div>';
  }
  if (past.length) {
    html += '<div><div class="section-label">Past</div>' + past.map(renderEvent).join('') + '</div>';
  }
  content.innerHTML = html;
}

function renderEvent(e) {
  const color = CAT_COLORS[e.category] || '#6b665c';
  const start = new Date(e.start_date + 'T00:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const end   = e.end_date ? ' – ' + new Date(e.end_date + 'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}) : '';
  return '<div class="event-card">' +
    '<div class="dot" style="--c:' + color + '"></div>' +
    '<div style="flex:1">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">' +
        '<span class="event-title">' + esc(e.title) + '</span>' +
        '<span class="cat">' + esc(e.category) + '</span>' +
      '</div>' +
      '<div class="event-meta">' + start + end + '</div>' +
      (e.description ? '<div style="font-size:12px;color:#6b665c;margin-top:4px">' + esc(e.description) + '</div>' : '') +
    '</div></div>';
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.parent.postMessage({ type: 'PLUGIN_READY' }, '*');
</script>
</body>
</html>`);
}

export function createRouter(db: Kysely<Database>) {
  const router = Router();
  router.get('/ui', (_req, res) => serveUi(res));
  router.use('/', createCalendarRouter(db));
  return router;
}
