// ===================================================================
// Calendar Plugin – Client Bundle
// Renders a full-featured calendar with month navigation, event
// management, and multiple views. Uses DOM injection because the
// Vantage platform's ESM loader cannot resolve bare "react" imports.
// ===================================================================

// -- Marker-based DOM injection --------------------------------------
const MARKER = '\u200B__CALENDAR__\u200B';
const WIDGET_MARKER = '\u200B__CAL_WIDGET__\u200B';
const PANEL_MARKER = '\u200B__CAL_PANEL__\u200B';

function injectHTML(marker: string, builder: () => string) {
  if (typeof document === 'undefined') return;
  requestAnimationFrame(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      if (node.textContent === marker && node.parentElement) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = builder();
        node.parentElement.replaceChild(wrapper, node);
        break;
      }
    }
  });
}

// -- Types -----------------------------------------------------------
interface CalendarEvent {
  id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  time: string;          // HH:mm
  category: string;
  description: string;
}

type ViewMode = 'month' | 'week';

// -- State -----------------------------------------------------------
const STORAGE_KEY = 'vantage_calendar_events';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getDefaultEvents();
  } catch {
    return getDefaultEvents();
  }
}

function saveEvents(events: CalendarEvent[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch { /* storage unavailable */ }
}

function getDefaultEvents(): CalendarEvent[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return [
    { id: generateId(), title: 'Team Standup',   date: `${y}-${m}-03`, time: '09:00', category: 'meeting',  description: 'Daily sync with the engineering team' },
    { id: generateId(), title: 'Sprint Review',  date: `${y}-${m}-07`, time: '14:00', category: 'meeting',  description: 'End-of-sprint demo and retrospective' },
    { id: generateId(), title: 'Client Call',    date: `${y}-${m}-12`, time: '11:00', category: 'external', description: 'Quarterly business review' },
    { id: generateId(), title: 'Product Launch', date: `${y}-${m}-15`, time: '10:00', category: 'milestone', description: 'v2.0 release to production' },
    { id: generateId(), title: 'Design Review',  date: `${y}-${m}-20`, time: '15:30', category: 'review',   description: 'UI/UX review for new dashboard' },
    { id: generateId(), title: '1:1 with Manager', date: `${y}-${m}-25`, time: '16:00', category: 'meeting', description: 'Weekly one-on-one' },
  ];
}

const CATEGORIES: Record<string, { label: string; color: string; bg: string }> = {
  meeting:   { label: 'Meeting',   color: '#4f46e5', bg: '#eef2ff' },
  external:  { label: 'External',  color: '#d97706', bg: '#fef3c7' },
  milestone: { label: 'Milestone', color: '#dc2626', bg: '#fee2e2' },
  review:    { label: 'Review',    color: '#7c3aed', bg: '#f3e8ff' },
  personal:  { label: 'Personal',  color: '#059669', bg: '#d1fae5' },
  other:     { label: 'Other',     color: '#64748b', bg: '#f1f5f9' },
};

// -- Global calendar state (module-scoped) ---------------------------
let calState = {
  year: new Date().getFullYear(),
  month: new Date().getMonth(),
  view: 'month' as ViewMode,
  events: loadEvents(),
  selectedDate: '',
};

function getEventsForDate(dateStr: string): CalendarEvent[] {
  return calState.events
    .filter((e) => e.date === dateStr)
    .sort((a, b) => a.time.localeCompare(b.time));
}

function formatDateStr(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

// -- CSS -------------------------------------------------------------
function calendarCSS(): string {
  return `
    .cp { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1040px; margin: 0 auto; padding: 28px 32px; color: #1e293b; }
    .cp *, .cp *::before, .cp *::after { box-sizing: border-box; }

    /* Header */
    .cp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
    .cp-title { font-size: 22px; font-weight: 700; margin: 0; letter-spacing: -0.3px; color: #0f172a; }
    .cp-controls { display: flex; align-items: center; gap: 8px; }
    .cp-btn { background: #fff; border: 1px solid #d1d5db; border-radius: 6px; padding: 7px 14px; cursor: pointer; font-size: 13px; font-weight: 500; color: #374151; transition: all 0.15s; font-family: inherit; line-height: 1; }
    .cp-btn:hover { background: #f9fafb; border-color: #9ca3af; }
    .cp-btn:active { background: #f3f4f6; }
    .cp-btn-primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
    .cp-btn-primary:hover { background: #4338ca; border-color: #4338ca; }
    .cp-btn-active { background: #eef2ff; color: #4f46e5; border-color: #c7d2fe; }
    .cp-month-label { font-size: 16px; font-weight: 600; color: #1e293b; min-width: 160px; text-align: center; }
    .cp-view-toggle { display: flex; border: 1px solid #d1d5db; border-radius: 6px; overflow: hidden; }
    .cp-view-btn { background: #fff; border: none; border-right: 1px solid #d1d5db; padding: 7px 14px; cursor: pointer; font-size: 12px; font-weight: 500; color: #6b7280; font-family: inherit; transition: all 0.15s; }
    .cp-view-btn:last-child { border-right: none; }
    .cp-view-btn:hover { background: #f9fafb; }
    .cp-view-btn-active { background: #eef2ff; color: #4f46e5; font-weight: 600; }

    /* Grid */
    .cp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: #e2e5e9; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
    .cp-dh { padding: 10px 4px; text-align: center; font-weight: 600; font-size: 11px; color: #64748b; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.8px; }
    .cp-cell { padding: 6px 8px; min-height: 100px; background: #fff; font-size: 13px; cursor: pointer; transition: background 0.12s; position: relative; }
    .cp-cell:hover { background: #f8faff; }
    .cp-cell-empty { padding: 6px 8px; min-height: 100px; background: #fafbfc; }
    .cp-cell-today { background: #f5f3ff; }
    .cp-cell-selected { background: #eef2ff; box-shadow: inset 0 0 0 2px #4f46e5; }
    .cp-cell-outside { color: #cbd5e1; }
    .cp-dn { font-weight: 500; font-size: 12px; color: #64748b; margin-bottom: 4px; }
    .cp-dn-today { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background: #4f46e5; color: #fff; font-weight: 700; font-size: 12px; }
    .cp-ev { margin-top: 2px; font-size: 10px; padding: 2px 6px; border-radius: 3px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; cursor: pointer; transition: opacity 0.15s; line-height: 1.5; }
    .cp-ev:hover { opacity: 0.85; }
    .cp-more { font-size: 10px; color: #6b7280; margin-top: 2px; font-weight: 500; }

    /* Week view */
    .cp-week-grid { display: grid; grid-template-columns: 64px repeat(7, 1fr); gap: 1px; background: #e2e5e9; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 6px rgba(0,0,0,0.05); }
    .cp-week-header { padding: 10px 4px; text-align: center; font-size: 11px; font-weight: 600; color: #64748b; background: #f8fafc; text-transform: uppercase; letter-spacing: 0.5px; }
    .cp-week-header-today { color: #4f46e5; }
    .cp-week-time { padding: 4px 8px; font-size: 11px; color: #94a3b8; background: #fafbfc; text-align: right; min-height: 48px; border-right: 1px solid #e2e5e9; }
    .cp-week-slot { padding: 2px 4px; background: #fff; min-height: 48px; cursor: pointer; position: relative; }
    .cp-week-slot:hover { background: #fafbff; }
    .cp-week-event { font-size: 10px; padding: 3px 6px; border-radius: 3px; font-weight: 500; margin-bottom: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    /* Sidebar / Event detail */
    .cp-layout { display: flex; gap: 20px; }
    .cp-main { flex: 1; min-width: 0; }
    .cp-sidebar { width: 280px; flex-shrink: 0; }
    .cp-panel { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
    .cp-panel-title { font-size: 14px; font-weight: 600; color: #1e293b; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9; }
    .cp-event-item { padding: 8px 0; border-bottom: 1px solid #f8fafc; display: flex; align-items: flex-start; gap: 8px; }
    .cp-event-item:last-child { border-bottom: none; }
    .cp-event-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
    .cp-event-info { flex: 1; min-width: 0; }
    .cp-event-name { font-size: 13px; font-weight: 500; color: #1e293b; }
    .cp-event-time { font-size: 11px; color: #94a3b8; margin-top: 1px; }
    .cp-event-desc { font-size: 11px; color: #64748b; margin-top: 2px; }
    .cp-event-del { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; padding: 2px 4px; border-radius: 4px; transition: all 0.15s; }
    .cp-event-del:hover { color: #ef4444; background: #fef2f2; }
    .cp-empty { font-size: 13px; color: #94a3b8; text-align: center; padding: 20px 0; }

    /* Modal */
    .cp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(2px); }
    .cp-modal { background: #fff; border-radius: 12px; padding: 24px; width: 400px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
    .cp-modal-title { font-size: 16px; font-weight: 600; color: #0f172a; margin: 0 0 16px 0; }
    .cp-form-group { margin-bottom: 12px; }
    .cp-label { display: block; font-size: 12px; font-weight: 500; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .cp-input { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: inherit; color: #1e293b; outline: none; transition: border-color 0.15s; }
    .cp-input:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .cp-select { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: inherit; color: #1e293b; outline: none; background: #fff; }
    .cp-textarea { width: 100%; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; font-family: inherit; color: #1e293b; resize: vertical; min-height: 60px; outline: none; }
    .cp-textarea:focus { border-color: #4f46e5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
    .cp-modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

    @media (max-width: 768px) {
      .cp-layout { flex-direction: column; }
      .cp-sidebar { width: 100%; }
      .cp { padding: 16px; }
    }
  `;
}

// -- Calendar page builder -------------------------------------------
function buildCalendarPage(): string {
  const { year, month, view, selectedDate } = calState;
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const monthName = new Date(year, month, 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : getEventsForDate(todayStr);
  const sidebarDate = selectedDate || todayStr;
  const sidebarLabel = new Date(sidebarDate + 'T00:00:00').toLocaleDateString('default', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  let html = `<style>${calendarCSS()}</style>`;
  html += `<div class="cp" id="calendar-root">`;

  // Header
  html += `
    <div class="cp-header">
      <h1 class="cp-title">Calendar</h1>
      <div class="cp-controls">
        <div class="cp-view-toggle">
          <button class="cp-view-btn ${view === 'month' ? 'cp-view-btn-active' : ''}" onclick="window.__cal_setView('month')">Month</button>
          <button class="cp-view-btn ${view === 'week' ? 'cp-view-btn-active' : ''}" onclick="window.__cal_setView('week')">Week</button>
        </div>
        <button class="cp-btn" onclick="window.__cal_today()">Today</button>
        <button class="cp-btn" onclick="window.__cal_prev()">&larr;</button>
        <span class="cp-month-label">${monthName}</span>
        <button class="cp-btn" onclick="window.__cal_next()">&rarr;</button>
        <button class="cp-btn cp-btn-primary" onclick="window.__cal_addEvent('${sidebarDate}')">+ New Event</button>
      </div>
    </div>
  `;

  // Layout: main + sidebar
  html += `<div class="cp-layout">`;
  html += `<div class="cp-main">`;

  if (view === 'month') {
    html += buildMonthGrid(year, month, today, todayStr, selectedDate);
  } else {
    html += buildWeekView(year, month, today, todayStr);
  }

  html += `</div>`; // .cp-main

  // Sidebar
  html += `<div class="cp-sidebar">`;
  html += `<div class="cp-panel">`;
  html += `<h3 class="cp-panel-title">${sidebarLabel}</h3>`;

  if (selectedEvents.length === 0) {
    html += `<div class="cp-empty">No events scheduled</div>`;
  } else {
    for (const ev of selectedEvents) {
      const cat = CATEGORIES[ev.category] || CATEGORIES.other;
      html += `
        <div class="cp-event-item">
          <div class="cp-event-dot" style="background: ${cat.color};"></div>
          <div class="cp-event-info">
            <div class="cp-event-name">${escapeHtml(ev.title)}</div>
            <div class="cp-event-time">${formatTime(ev.time)} &middot; ${cat.label}</div>
            ${ev.description ? `<div class="cp-event-desc">${escapeHtml(ev.description)}</div>` : ''}
          </div>
          <button class="cp-event-del" onclick="window.__cal_deleteEvent('${ev.id}')" title="Delete">&times;</button>
        </div>
      `;
    }
  }

  html += `<div style="margin-top: 12px;"><button class="cp-btn cp-btn-primary" style="width: 100%;" onclick="window.__cal_addEvent('${sidebarDate}')">+ Add Event</button></div>`;
  html += `</div></div>`; // .cp-panel .cp-sidebar
  html += `</div>`; // .cp-layout
  html += `</div>`; // .cp

  return html;
}

// -- Month grid ------------------------------------------------------
function buildMonthGrid(year: number, month: number, today: Date, todayStr: string, selectedDate: string): string {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let html = `<div class="cp-grid">`;

  for (const name of dayNames) {
    html += `<div class="cp-dh">${name}</div>`;
  }

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cp-cell-empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = formatDateStr(year, month, d);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const events = getEventsForDate(dateStr);
    const MAX_VISIBLE = 3;

    let cls = 'cp-cell';
    if (isToday) cls += ' cp-cell-today';
    if (isSelected) cls += ' cp-cell-selected';

    html += `<div class="${cls}" onclick="window.__cal_selectDate('${dateStr}')">`;
    html += isToday
      ? `<div class="cp-dn"><span class="cp-dn-today">${d}</span></div>`
      : `<div class="cp-dn">${d}</div>`;

    const visible = events.slice(0, MAX_VISIBLE);
    for (const ev of visible) {
      const cat = CATEGORIES[ev.category] || CATEGORIES.other;
      html += `<div class="cp-ev" style="background: ${cat.bg}; color: ${cat.color};" title="${escapeHtml(ev.title)}">${escapeHtml(ev.title)}</div>`;
    }
    if (events.length > MAX_VISIBLE) {
      html += `<div class="cp-more">+${events.length - MAX_VISIBLE} more</div>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// -- Week view -------------------------------------------------------
function buildWeekView(year: number, month: number, today: Date, todayStr: string): string {
  const currentDate = new Date(year, month, today.getMonth() === month && today.getFullYear() === year ? today.getDate() : 1);
  const dayOfWeek = currentDate.getDay();
  const weekStart = new Date(currentDate);
  weekStart.setDate(currentDate.getDate() - dayOfWeek);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 7); // 7am to 6pm

  let html = `<div class="cp-week-grid">`;

  // Header row
  html += `<div class="cp-week-header"></div>`;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    const isToday = dateStr === todayStr;
    html += `<div class="cp-week-header ${isToday ? 'cp-week-header-today' : ''}">${dayNames[i]}<br>${d.getDate()}</div>`;
  }

  // Time slots
  for (const hour of hours) {
    const timeLabel = hour <= 12 ? `${hour} AM` : `${hour - 12} PM`;
    if (hour === 12) {
      html += `<div class="cp-week-time">12 PM</div>`;
    } else {
      html += `<div class="cp-week-time">${timeLabel}</div>`;
    }

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      const hourStr = String(hour).padStart(2, '0');
      const events = calState.events.filter((e) => e.date === dateStr && e.time.startsWith(hourStr));

      html += `<div class="cp-week-slot" onclick="window.__cal_addEvent('${dateStr}')">`;
      for (const ev of events) {
        const cat = CATEGORIES[ev.category] || CATEGORIES.other;
        html += `<div class="cp-week-event" style="background: ${cat.bg}; color: ${cat.color};">${escapeHtml(ev.title)}</div>`;
      }
      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}

// -- Utilities -------------------------------------------------------
function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour12}:${String(m).padStart(2, '0')} ${suffix}`;
}

// -- Re-render -------------------------------------------------------
function rerender(): void {
  const root = document.getElementById('calendar-root');
  if (!root || !root.parentElement) return;
  const container = root!.parentElement!;
  container.innerHTML = buildCalendarPage();
}

// -- Modal: Add Event ------------------------------------------------
function showAddEventModal(dateStr: string): void {
  const existing = document.getElementById('cp-modal-overlay');
  if (existing) existing.remove();

  const categoryOptions = Object.entries(CATEGORIES)
    .map(([key, val]) => `<option value="${key}">${val.label}</option>`)
    .join('');

  const overlay = document.createElement('div');
  overlay.id = 'cp-modal-overlay';
  overlay.className = 'cp-overlay';
  overlay.innerHTML = `
    <div class="cp-modal" onclick="event.stopPropagation()">
      <h2 class="cp-modal-title">New Event</h2>
      <div class="cp-form-group">
        <label class="cp-label">Title</label>
        <input class="cp-input" id="cp-ev-title" type="text" placeholder="Event title" autofocus />
      </div>
      <div class="cp-form-group">
        <label class="cp-label">Date</label>
        <input class="cp-input" id="cp-ev-date" type="date" value="${dateStr}" />
      </div>
      <div class="cp-form-group">
        <label class="cp-label">Time</label>
        <input class="cp-input" id="cp-ev-time" type="time" value="09:00" />
      </div>
      <div class="cp-form-group">
        <label class="cp-label">Category</label>
        <select class="cp-select" id="cp-ev-cat">${categoryOptions}</select>
      </div>
      <div class="cp-form-group">
        <label class="cp-label">Description</label>
        <textarea class="cp-textarea" id="cp-ev-desc" placeholder="Optional description"></textarea>
      </div>
      <div class="cp-modal-actions">
        <button class="cp-btn" onclick="window.__cal_closeModal()">Cancel</button>
        <button class="cp-btn cp-btn-primary" onclick="window.__cal_saveEvent()">Save Event</button>
      </div>
    </div>
  `;
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) (window as any).__cal_closeModal();
  });
  document.body.appendChild(overlay);

  // Inject the CSS if not already present (for modal styling)
  if (!document.getElementById('cp-modal-style')) {
    const style = document.createElement('style');
    style.id = 'cp-modal-style';
    style.textContent = calendarCSS();
    document.head.appendChild(style);
  }

  setTimeout(() => {
    const input = document.getElementById('cp-ev-title') as HTMLInputElement;
    if (input) input.focus();
  }, 50);
}

// -- Window-scoped event handlers ------------------------------------
if (typeof window !== 'undefined') {
  (window as any).__cal_prev = () => {
    if (calState.view === 'month') {
      calState.month--;
      if (calState.month < 0) { calState.month = 11; calState.year--; }
    } else {
      // week view: go back 7 days worth
      calState.month--;
      if (calState.month < 0) { calState.month = 11; calState.year--; }
    }
    calState.selectedDate = '';
    rerender();
  };

  (window as any).__cal_next = () => {
    if (calState.view === 'month') {
      calState.month++;
      if (calState.month > 11) { calState.month = 0; calState.year++; }
    } else {
      calState.month++;
      if (calState.month > 11) { calState.month = 0; calState.year++; }
    }
    calState.selectedDate = '';
    rerender();
  };

  (window as any).__cal_today = () => {
    const now = new Date();
    calState.year = now.getFullYear();
    calState.month = now.getMonth();
    calState.selectedDate = formatDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    rerender();
  };

  (window as any).__cal_setView = (v: ViewMode) => {
    calState.view = v;
    rerender();
  };

  (window as any).__cal_selectDate = (dateStr: string) => {
    calState.selectedDate = dateStr;
    rerender();
  };

  (window as any).__cal_addEvent = (dateStr: string) => {
    showAddEventModal(dateStr);
  };

  (window as any).__cal_closeModal = () => {
    const overlay = document.getElementById('cp-modal-overlay');
    if (overlay) overlay.remove();
  };

  (window as any).__cal_saveEvent = () => {
    const title = (document.getElementById('cp-ev-title') as HTMLInputElement)?.value?.trim();
    const date = (document.getElementById('cp-ev-date') as HTMLInputElement)?.value;
    const time = (document.getElementById('cp-ev-time') as HTMLInputElement)?.value || '09:00';
    const category = (document.getElementById('cp-ev-cat') as HTMLSelectElement)?.value || 'other';
    const description = (document.getElementById('cp-ev-desc') as HTMLTextAreaElement)?.value?.trim() || '';

    if (!title || !date) return;

    calState.events.push({
      id: generateId(),
      title,
      date,
      time,
      category,
      description,
    });
    saveEvents(calState.events);
    (window as any).__cal_closeModal();
    calState.selectedDate = date;
    rerender();
  };

  (window as any).__cal_deleteEvent = (id: string) => {
    calState.events = calState.events.filter((e) => e.id !== id);
    saveEvents(calState.events);
    rerender();
  };
}

// -- Widget builder --------------------------------------------------
function buildWidgetHTML(): string {
  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());
  const events = getEventsForDate(todayStr);

  let html = `<div style="padding: 16px; font-family: 'Inter', sans-serif;">`;
  html += `<div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;">Today's Schedule</div>`;

  if (events.length === 0) {
    html += `<div style="font-size: 13px; color: #94a3b8; text-align: center; padding: 16px 0;">No events today</div>`;
  } else {
    for (const ev of events) {
      const cat = CATEGORIES[ev.category] || CATEGORIES.other;
      html += `
        <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f8fafc; font-size: 13px;">
          <span style="width: 7px; height: 7px; border-radius: 50%; background: ${cat.color}; flex-shrink: 0;"></span>
          <span style="color: #94a3b8; min-width: 58px; font-size: 11px;">${formatTime(ev.time)}</span>
          <span style="color: #334155; font-weight: 500;">${escapeHtml(ev.title)}</span>
        </div>
      `;
    }
  }

  html += `</div>`;
  return html;
}

// -- Panel builder ---------------------------------------------------
function buildPanelHTML(): string {
  return `<div style="padding: 16px; font-family: 'Inter', sans-serif;">
    <div style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">Upcoming Events</div>
    <p style="color: #94a3b8; font-size: 13px; margin: 0;">No upcoming events for this contact.</p>
  </div>`;
}

// -- Components ------------------------------------------------------
const CalendarPage = () => {
  injectHTML(MARKER, buildCalendarPage);
  return MARKER;
};

const CalendarTodayWidget = () => {
  injectHTML(WIDGET_MARKER, buildWidgetHTML);
  return WIDGET_MARKER;
};

const CalendarContactPanel = () => {
  injectHTML(PANEL_MARKER, buildPanelHTML);
  return PANEL_MARKER;
};

// -- Plugin Registration ---------------------------------------------
export default {
  setup(vantage: any) {
    vantage.registerPage('/calendar', CalendarPage);
    vantage.registerWidget('calendar-today', CalendarTodayWidget);
    vantage.registerPanel('contact', 'calendar-contact-panel', CalendarContactPanel);
  },
};
