# Calendar Plugin Design

## Goal

Build a complete internal workspace calendar plugin for Vantage. The plugin should feel like a finished scheduling product: fast calendar navigation, rich event creation, recurring meetings, reminders, CRM links, record panels, search/commands, settings, and ICS import/export. This version is internal-only. It must not implement Google Calendar, Outlook, CalDAV, or any external live sync.

## Current State

`vantage-plugin-calendar` currently has:

- `plugin.json` with basic nav/page/panel surfaces, two permission keys, one `calendar_events` migration, and a simple settings field.
- `src/routes/calendar.ts` with basic date-range CRUD over `calendar_events`.
- `src/server-entry.ts` with a small iframe HTML list.
- `src/client.tsx` with stub React page and stub contact/deal panels.
- `src/server.ts` with a minimal hook that emits a bus event on `contact.created`.

The plugin SDK supports the needed internal product surface:

- Backend plugin setup through `createPlugin`.
- Plugin tables and SQL migrations through `plugin.json`.
- Frontend pages, widgets, panels, modals, search, commands, navigation, and toast.
- Backend storage, settings, bus, cron, notifications, files, user/workspace context, permissions, and table access.
- Generic resource access for contacts, companies, deals, tasks, and activity when declared through `data_access`.

## Scope

### In Scope

- Internal workspace calendars.
- Month, week, day, and agenda views.
- Event create, read, update, delete, duplicate, drag/drop reschedule, and time resize.
- All-day and timed events.
- Recurring events with exceptions.
- Internal attendees and RSVP state.
- Reminder notifications.
- Contact, company, deal, and task links.
- Contact and deal record panels.
- Command palette actions and plugin search results.
- Workspace and user calendar settings.
- Internal holidays and company milestones.
- ICS import and export as file-based one-shot operations.
- Activity logging for CRM-linked event changes.
- Strong tests for date math, recurrence, routes, permissions, and UI flows.

### Out of Scope

- Google Calendar sync.
- Outlook or Microsoft Graph sync.
- CalDAV sync.
- External booking pages.
- Email invitations sent from calendar.
- Cross-workspace shared calendars.
- Host SDK changes unless implementation discovers a blocker that cannot be solved inside the plugin.

## Product Principles

- The first screen is the usable calendar, not an explanation page.
- The UI should match Vantage: dense, operational, calm, and built for repeated use.
- Every important action should work from both the main calendar and linked record panels.
- Internal-only does not mean minimal. The plugin should be feature-rich but self-contained.
- Recurrence and reminders must be correct before decorative UI polish.
- Permissions should be explicit enough for team use, not only admin/member shortcuts.

## Feature Set

### Calendar Views

The main `/calendar` page has:

- Toolbar with Today, previous/next, date picker, create button, filters, and view switcher.
- View modes: month, week, day, agenda.
- Mini-calendar for quick navigation.
- Calendar visibility toggles.
- Category filters.
- Attendee/owner filter.
- Linked-record filter when opened from a panel or deep link.
- Empty states for no events, no filtered results, and permission-limited views.
- Loading and error states that do not shift layout.

Month view shows compact event chips, multi-day bars, more-count overflow, and today highlight.

Week/day views show a timed grid, all-day lane, current-time indicator, drag/drop, resize, and working-hours shading.

Agenda view groups events by day and supports keyboard scanning.

### Event Model

Events support:

- Title.
- Description or notes.
- Calendar id.
- Category.
- Color override.
- Location text.
- Start and end timestamp.
- All-day flag.
- Timezone.
- Organizer.
- Visibility: workspace, private, or busy-only.
- Status: confirmed, tentative, cancelled.
- Linked records.
- Attendees.
- Reminders.
- Recurrence rule and recurrence exceptions.
- Created/updated audit fields.

Categories:

- Meeting.
- Task deadline.
- Company event.
- Holiday.
- Focus block.
- Out of office.
- Reminder.
- Milestone.
- Other.
- Custom category label through settings.

### Event Workflows

Users can:

- Create from toolbar.
- Create by clicking a day or time slot.
- Create from contact panel with contact prelinked.
- Create from deal panel with deal prelinked.
- Create from command palette.
- Edit event details.
- Duplicate an event.
- Delete one event.
- Delete one recurrence occurrence.
- Delete a recurrence series.
- Move an event by drag/drop.
- Resize timed events.
- Convert all-day event to timed event.
- Add/remove linked records.
- Add/remove attendees.
- RSVP as accepted, declined, tentative, or needs action.
- Add one or more reminders.

Recurring edits must ask for scope:

- This occurrence only.
- This and following occurrences.
- Entire series.

### Recurrence

Supported recurrence:

- Daily.
- Weekly.
- Monthly by date.
- Monthly by weekday position.
- Yearly.
- Custom interval.
- Selected weekdays.
- End never.
- End after count.
- End on date.

The backend stores the recurrence rule on the series event and stores exceptions separately. Occurrences are generated for requested ranges. Edited or deleted single occurrences are represented as exceptions. The generator must cap expansion to prevent runaway rules.

### Attendees And RSVP

Attendees include:

- Internal Vantage users.
- Optional external email text entries for reference only.

The plugin records:

- Attendee type.
- User id or email.
- Display name.
- RSVP status.
- Required/optional flag.
- Organizer flag.

No external email invitations are sent in this version.

### Reminders

Events can have multiple reminders:

- At event time.
- 5 minutes before.
- 10 minutes before.
- 15 minutes before.
- 30 minutes before.
- 1 hour before.
- 1 day before.
- Custom minute offset.

A cron job checks due reminders and calls `vantage.notify`. Reminder delivery must be idempotent, using persisted delivery rows or delivery timestamps so repeated cron runs do not duplicate notifications.

### Links To Vantage Records

Events can link to:

- Contacts.
- Companies.
- Deals.
- Tasks.

Linked events show in record panels. CRM-linked event create/update/delete should log Vantage activity when `activity:write` data access is available. The activity body should mention only the event title, date, action, and linked record context.

### Panels

Contact panel:

- Shows upcoming events linked to the contact.
- Shows recent past events.
- Create event with contact prelinked.
- Open event in calendar.
- Filter calendar page to this contact.

Deal panel:

- Shows upcoming events and milestones linked to the deal.
- Shows missed or overdue linked events.
- Create follow-up, review, milestone, or meeting with deal prelinked.
- Open event in calendar.
- Filter calendar page to this deal.

Panels should work without requiring a full calendar page reload.

### Search And Commands

Plugin search should return calendar events matching:

- Title.
- Description.
- Location.
- Linked record names when available.

Commands:

- Create calendar event.
- Jump to date.
- Open today.
- Open agenda.
- Create follow-up for current record when context has a contact or deal.

### Import And Export

ICS export:

- Export selected date range.
- Export selected calendars.
- Include recurrence and exceptions when possible.
- Download through a normal HTTP response.

ICS import:

- Import from uploaded `.ics` file.
- Preview parsed events before insert.
- Allow target calendar/category selection.
- Deduplicate by UID when present.
- Report skipped, created, and failed rows.

ICS import/export is file-based only. It is not synchronization.

### Settings

Workspace settings:

- Week starts on Monday or Sunday.
- Show weekends.
- Working days.
- Working hours start/end.
- Default event duration.
- Default calendar.
- Default reminder offsets.
- Show internal holidays.
- Category list and default colors.
- Allow members to create calendars.

User settings:

- Default view.
- Visible calendars.
- Timezone display preference.
- Agenda density.

The manifest `settings_schema` can expose simple top-level settings. Complex nested settings should be stored in plugin tables or plugin settings through backend APIs.

## Permissions

Replace the current two-key permission model with:

- `calendar:view`: View non-private calendar events.
- `calendar:create`: Create events.
- `calendar:manage_own`: Edit and delete events where the user is organizer or creator.
- `calendar:manage_all`: Edit and delete any workspace event.
- `calendar:settings`: Manage workspace calendar settings, calendars, categories, and holidays.

Default roles:

- Admin: all permissions.
- Member: view, create, manage own.

Private events:

- Creator, organizer, and attendees can see full details.
- Other users see only a busy-only block if event visibility is busy-only.
- Other users do not see private event details.

## Data Access

Declare only what the plugin needs:

- `contacts:read` for contact-linked panels/search labels.
- `companies:read` for company links.
- `deals:read` for deal-linked panels/search labels.
- `tasks:read` and `tasks:write` for task links and optional task deadline creation.
- `activity:write` for CRM-linked event audit activity.
- `files:read` or file capability if SDK manifest supports it later; current SDK exposes files namespace but not a manifest permission key for it.

If the SDK permission union does not support a desired file permission key, use the current SDK files namespace as documented and keep manifest data access limited to existing union values.

## Backend API

All route responses use:

```json
{ "data": {}, "error": null }
```

or:

```json
{ "data": null, "error": { "code": "INVALID_INPUT", "message": "..." } }
```

Routes:

- `GET /events?start=&end=&view=&calendar_ids=&category=&owner_id=&linked_type=&linked_id=&q=`
- `GET /events/:id`
- `POST /events`
- `PATCH /events/:id`
- `DELETE /events/:id?scope=single|following|series&occurrence_start=`
- `POST /events/:id/duplicate`
- `POST /events/:id/rsvp`
- `GET /events/:id/occurrences?start=&end=`
- `POST /events/:id/exceptions`
- `GET /calendars`
- `POST /calendars`
- `PATCH /calendars/:id`
- `DELETE /calendars/:id`
- `GET /links?linked_type=&linked_id=&start=&end=`
- `POST /events/:id/links`
- `DELETE /events/:id/links/:link_id`
- `GET /agenda?start=&end=&limit=`
- `GET /availability?user_ids=&start=&end=`
- `GET /settings`
- `PATCH /settings`
- `GET /ics/export?start=&end=&calendar_ids=`
- `POST /ics/import/preview`
- `POST /ics/import/commit`

Validation:

- Require valid ISO dates/timestamps.
- Require `end_at` after `start_at`.
- Require timezone for timed events or derive from settings.
- Validate category/calendar exists.
- Validate recurrence rule shape and expansion caps.
- Validate reminder offsets are non-negative and within allowed max.
- Validate linked record type is one of contact, company, deal, task.
- Validate attendee user ids belong to the workspace when internal.

## Tables

### `calendar_calendars`

Workspace/user calendars.

- `id uuid primary key`
- `workspace_id uuid not null`
- `owner_user_id uuid null`
- `name text not null`
- `description text null`
- `color text null`
- `visibility text not null default 'workspace'`
- `is_default boolean not null default false`
- `is_archived boolean not null default false`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(workspace_id, is_archived)`
- `(workspace_id, owner_user_id)`

### `calendar_events`

Event series and single events.

- `id uuid primary key`
- `workspace_id uuid not null`
- `calendar_id uuid null`
- `created_by uuid not null`
- `organizer_user_id uuid null`
- `title text not null`
- `description text null`
- `location text null`
- `category text not null default 'other'`
- `color text null`
- `visibility text not null default 'workspace'`
- `status text not null default 'confirmed'`
- `start_at timestamptz not null`
- `end_at timestamptz not null`
- `all_day boolean not null default false`
- `timezone text not null default 'UTC'`
- `recurrence_rule jsonb null`
- `recurrence_end_at timestamptz null`
- `source text not null default 'internal'`
- `external_uid text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(workspace_id, start_at)`
- `(workspace_id, end_at)`
- `(workspace_id, calendar_id, start_at)`
- `(workspace_id, organizer_user_id, start_at)`
- unique partial `(workspace_id, external_uid)` where `external_uid is not null`

### `calendar_event_exceptions`

Recurrence exceptions.

- `id uuid primary key`
- `workspace_id uuid not null`
- `event_id uuid not null`
- `occurrence_start_at timestamptz not null`
- `exception_type text not null`
- `override_event jsonb null`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(workspace_id, event_id, occurrence_start_at)`

### `calendar_event_attendees`

Attendee records.

- `id uuid primary key`
- `workspace_id uuid not null`
- `event_id uuid not null`
- `attendee_type text not null`
- `user_id uuid null`
- `email text null`
- `display_name text null`
- `required boolean not null default true`
- `organizer boolean not null default false`
- `rsvp_status text not null default 'needs_action'`
- `responded_at timestamptz null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(workspace_id, event_id)`
- `(workspace_id, user_id)` where `user_id is not null`

### `calendar_event_links`

Links to Vantage records.

- `id uuid primary key`
- `workspace_id uuid not null`
- `event_id uuid not null`
- `linked_type text not null`
- `linked_id uuid not null`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`

Indexes:

- `(workspace_id, linked_type, linked_id)`
- `(workspace_id, event_id)`
- unique `(workspace_id, event_id, linked_type, linked_id)`

### `calendar_reminders`

Reminder rules.

- `id uuid primary key`
- `workspace_id uuid not null`
- `event_id uuid not null`
- `attendee_id uuid null`
- `offset_minutes integer not null`
- `channel text not null default 'in_app'`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`

Indexes:

- `(workspace_id, event_id)`

### `calendar_reminder_deliveries`

Idempotent reminder delivery tracking.

- `id uuid primary key`
- `workspace_id uuid not null`
- `reminder_id uuid not null`
- `event_id uuid not null`
- `occurrence_start_at timestamptz not null`
- `user_id uuid not null`
- `delivered_at timestamptz not null default now()`

Indexes:

- unique `(workspace_id, reminder_id, occurrence_start_at, user_id)`

### `calendar_holidays`

Internal holidays.

- `id uuid primary key`
- `workspace_id uuid not null`
- `name text not null`
- `date date not null`
- `calendar_id uuid null`
- `created_by uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indexes:

- `(workspace_id, date)`

### `calendar_user_settings`

User-specific calendar preferences.

- `id uuid primary key`
- `workspace_id uuid not null`
- `user_id uuid not null`
- `settings jsonb not null default '{}'`
- `updated_at timestamptz not null default now()`

Indexes:

- unique `(workspace_id, user_id)`

### `calendar_workspace_settings`

Workspace defaults.

- `workspace_id uuid primary key`
- `settings jsonb not null default '{}'`
- `updated_by uuid null`
- `updated_at timestamptz not null default now()`

## Frontend Components

Recommended file responsibilities:

- `src/client.tsx`: registers plugin surfaces only.
- `src/calendar/CalendarPage.tsx`: main page composition.
- `src/calendar/CalendarToolbar.tsx`: navigation, view switcher, filters.
- `src/calendar/MonthView.tsx`: month grid.
- `src/calendar/WeekView.tsx`: week time grid.
- `src/calendar/DayView.tsx`: day time grid.
- `src/calendar/AgendaView.tsx`: agenda list.
- `src/calendar/EventDrawer.tsx`: create/edit/details form.
- `src/calendar/RecurrenceEditor.tsx`: recurrence UI.
- `src/calendar/AttendeeEditor.tsx`: attendees and RSVP.
- `src/calendar/ReminderEditor.tsx`: reminders.
- `src/calendar/CalendarSidebar.tsx`: mini-calendar and toggles.
- `src/panels/ContactCalendarPanel.tsx`: contact panel.
- `src/panels/DealCalendarPanel.tsx`: deal panel.
- `src/lib/calendar-api.ts`: route client.
- `src/lib/date.ts`: date helpers.
- `src/lib/recurrence.ts`: recurrence helper used by UI previews.
- `src/lib/types.ts`: plugin-specific frontend types.

Use stable dimensions for grids and toolbar controls. Avoid cards inside cards. Use icon buttons for navigation/actions where icon meaning is standard, with tooltips for less obvious controls.

## Backend Components

Recommended file responsibilities:

- `src/server.ts`: plugin setup, hooks, cron registration, bus emissions.
- `src/server-entry.ts`: express router composition.
- `src/routes/events.ts`: event CRUD, recurrence scope handling.
- `src/routes/calendars.ts`: calendar CRUD.
- `src/routes/settings.ts`: workspace/user settings.
- `src/routes/links.ts`: linked-record event listing and link CRUD.
- `src/routes/agenda.ts`: agenda endpoint.
- `src/routes/availability.ts`: busy block calculation.
- `src/routes/ics.ts`: import/export.
- `src/lib/validation.ts`: zod schemas.
- `src/lib/recurrence.ts`: recurrence expansion and exceptions.
- `src/lib/reminders.ts`: due reminder calculation and idempotency.
- `src/lib/permissions.ts`: plugin permission checks.
- `src/lib/activity.ts`: CRM activity logging.
- `src/lib/ics.ts`: ICS parse/export helpers.
- `src/lib/errors.ts`: response error helpers.
- `src/types.ts`: route and domain types.

The current `src/routes/calendar.ts` can either be replaced by focused route files or kept as a compatibility wrapper. The finished version should avoid one large route file doing everything.

## Bus Events

Declare and emit:

- `com.vantage.calendar.event.created`
- `com.vantage.calendar.event.updated`
- `com.vantage.calendar.event.deleted`
- `com.vantage.calendar.event.rsvp_updated`
- `com.vantage.calendar.reminder.fired`
- `com.vantage.calendar.ics.imported`

Payloads should include:

- `workspace_id`
- `event_id`
- `occurrence_start_at` when occurrence-specific
- `actor_user_id`
- `linked_records`
- `changed_fields` for updates when practical

## Hooks

Use host hooks only where useful:

- `contact.deleted`: remove or orphan contact links based on policy.
- `deal.deleted`: remove or orphan deal links based on policy.
- `task.updated`: if a linked task due date changes, optionally update linked task deadline event when it was created by the plugin.

If host hook payloads do not include enough detail, the plugin should ignore the hook safely rather than guessing.

## Error Handling

Backend:

- All validation failures return `400 INVALID_INPUT`.
- Permission failures return `403 FORBIDDEN`.
- Missing rows return `404 NOT_FOUND`.
- Recurrence expansion over caps returns `400 RECURRENCE_TOO_LARGE`.
- Conflicting edit scope returns `400 INVALID_RECURRENCE_SCOPE`.
- ICS parse failures return row-level errors in preview and do not mutate data.

Frontend:

- Every view has loading, empty, and error states.
- Failed saves keep the drawer open and show field-specific messages when available.
- Failed drag/drop reverts the event chip position.
- Failed reminder or RSVP changes show toast and preserve previous UI state.
- Permission-limited users see disabled or hidden management actions.

## Testing Strategy

Unit tests:

- Date helper parsing/formatting.
- Month grid and week/day range calculation.
- Recurrence expansion for daily, weekly, monthly, yearly, custom intervals.
- Recurrence exceptions for deleted and overridden occurrences.
- Reminder due calculation and duplicate prevention.
- ICS import parse and export serialization.

Route tests:

- Event list by date range.
- Create/update/delete single events.
- Create/update/delete recurring series.
- Edit/delete single occurrence.
- Attendee RSVP.
- Linked record filtering.
- Calendar CRUD.
- Settings read/update.
- ICS preview and commit.
- Permission checks for view/create/manage own/manage all/settings.

Frontend tests:

- View switching.
- Create event from toolbar and time slot.
- Edit event in drawer.
- Delete event and recurrence scope prompt.
- Panel prefill from contact and deal.
- Filter by calendar/category.
- Agenda grouping.
- Error state after failed save.

Verification commands:

- `pnpm lint`
- `pnpm build`
- Plugin package route/unit test command once tests are added.

## Migration Strategy

The existing `calendar_events` table is too small for the finished plugin. Migration should:

1. Preserve existing rows.
2. Add new columns needed by the richer model.
3. Create new related tables.
4. Backfill `start_at` and `end_at` from existing `start_date`, `end_date`, and `all_day`.
5. Keep legacy `start_date` and `end_date` only if compatibility is needed during rollout.
6. Drop legacy columns only after the plugin no longer reads them.

Because this plugin already declares an initial SQL migration in `plugin.json`, the finished spec should either replace that migration before release or add a new versioned migration if existing installs are expected.

## Acceptance Criteria

- Calendar nav item opens a functional calendar page.
- Users can create, edit, duplicate, delete, drag, and resize events.
- Month, week, day, and agenda views all show the same event data correctly.
- Recurring events render correctly across queried date ranges.
- Single-occurrence recurrence edits and deletes work.
- Reminder cron sends in-app notifications once per due reminder occurrence.
- Contact and deal panels show linked events and can create prelinked events.
- Permissions prevent unauthorized edits and settings changes.
- Search and commands are registered and useful.
- ICS import/export works for ordinary single and recurring events.
- Settings persist and affect the calendar UI.
- Empty/loading/error states are polished.
- Build and test commands pass.

## Non-Goals For This Version

- External calendar live sync.
- Sending invite emails.
- Public booking links.
- Mobile app implementation.
- Changes to Vantage core SDK unless a blocker is discovered during implementation.
