# Vantage Calendar Plugin

A full-featured, professional calendar plugin built for the Vantage platform.

## Features

- **Multiple Views**: Month and Week views.
- **Event Management**: Create, delete, and view events with categorized color coding.
- **Vantage Integration**: Includes a standalone calendar page, a "Today" dashboard widget, and a Contact panel showing upcoming events.
- **Zero-Dependency UI**: Uses DOM injection and native browser APIs instead of React compilation, ensuring compatibility with the Vantage platform's strict iframe ESM environment without needing a custom bundler setup.

## Project Structure

```
calendar-plugin/
├── src/
│   ├── client.tsx       # UI components (DOM injected)
│   └── server.ts        # Backend hooks and event emitters
├── package.json         # Dependencies and scripts
└── plugin.json          # Vantage plugin manifest
```

## Development & Build

This plugin is packaged directly from its source files, bypassing typical bundlers due to platform constraints around bare specifier imports (e.g., `import 'react'`).

To package the plugin for the Vantage platform, simply run:

```bash
npm run build
# or
pnpm build
```

This will generate a `calendar-plugin.zip` file. 

## Deployment

1. Navigate to the **Plugins** section in your Vencore dashboard.
2. Click **Install Plugin** -> **Upload ZIP**.
3. Select the generated `calendar-plugin.zip` file.
4. The Calendar tab, widgets, and panels will now be available in your workspace!
