import type { PluginManifest } from '@vantage/plugin-types';

export const manifest: PluginManifest = {
  id: 'com.vantage.calendar',
  name: 'Calendar',
  version: '1.0.0',
  description: 'Workspace calendar with events, holidays, and company milestones.',
  permissions: [],
  tables: [],
  migrations: [
    {
      version: '1.0.0',
      up: `
        CREATE TABLE IF NOT EXISTS calendar_events (
          id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          workspace_id UUID NOT NULL,
          created_by  UUID NOT NULL,
          title       VARCHAR NOT NULL,
          description TEXT,
          category    VARCHAR NOT NULL DEFAULT 'other',
          color       VARCHAR,
          start_date  DATE NOT NULL,
          end_date    DATE,
          all_day     BOOLEAN NOT NULL DEFAULT true,
          created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        CREATE INDEX IF NOT EXISTS calendar_events_workspace_id_idx
          ON calendar_events (workspace_id);
        CREATE INDEX IF NOT EXISTS calendar_events_start_date_idx
          ON calendar_events (workspace_id, start_date);
      `,
      down: `DROP TABLE IF EXISTS calendar_events;`,
    },
  ],
};
