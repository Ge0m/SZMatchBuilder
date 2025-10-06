# SZ Match Builder

The main SZ Match Builder application for creating and managing DBZ Sparking Zero match configurations.

## Development

```bash
# From the root of the monorepo
npm run dev

# Or from this directory
npm run dev
```

## Building

```bash
# From the root of the monorepo
npm run build

# Or from this directory
npm run build
```

The built files will be output to `../../dist` (relative to this app directory).

## Dependencies

This app uses:
- React 18
- Vite for building and development
- Tailwind CSS for styling
- Lucide React for icons
- Various utility libraries for YAML parsing and floating UI

## Configuration

- `vite.config.js` - Vite configuration with GitHub Pages base path
- `tailwind.config.js` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration for Tailwind