# TypeScript Express Server

A simple, lightweight Node.js application running on Express with TypeScript.

## Project Structure

```text
├── dist/             # Compiled JavaScript output
├── node_modules/     # Installed dependencies
├── src/
│   └── index.ts      # Application entry point
├── .env              # Environment variables (port, secrets, etc.)
├── .gitignore        # Git ignore rules
├── package.json      # Dependencies and npm scripts
└── tsconfig.json     # TypeScript compiler configuration
```

## Available Scripts

- **Development mode** (with live reload via `tsx`):
  ```bash
  npm run dev
  ```

- **Build** (compile TypeScript to JavaScript in `dist/`):
  ```bash
  npm run build
  ```

- **Start** (run the compiled production build):
  ```bash
  npm start
  ```

## Endpoints

- `GET /` - Root status and welcome message.
