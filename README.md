# React + TypeScript + Vite

## Decision Register

This repository maintains an audit trail of architecture decisions and operational policies in [`/decisions/`](./decisions/INDEX.md). Each Architecture Decision Record (ADR) carries a Status (`Inferred — Awaiting Confirmation`, `Confirmed`, `Superseded`, or `Reserved`) and an Implementation Tag linking the decision to the git tag that shipped the code. Read the [register index](./decisions/INDEX.md) to understand the calculated decisions made on the client's behalf and the reversal paths attached to each one.

## Recent shipped tags

| Date       | Tag                                                 | Summary                                                                                                                                                                                                                                                                                |
| ---------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-05 | `hotfix-jeanic1-contact-add-2026-05-05`             | US-J1: Client Management — cannot add contacts (Jeanic UAT, 5 May 2026)                                                                                                                                                                                                                |
| 2026-05-05 | `hotfix-jeanic2-remove-site-requisition-2026-05-05` | US-J2: Remove Site Requisition field from Job Card and Job Board (Jeanic UAT, 5 May 2026)                                                                                                                                                                                              |
| 2026-05-05 | `hotfix-jeanic4-compiled-by-dropdown-2026-05-05`    | US-J4: Compiled By field becomes a system_dropdowns-backed dropdown (Jeanic UAT, 5 May 2026)                                                                                                                                                                                           |
| 2026-05-06 | `hotfix-jeanic3-delivery-propagation-2026-05-07`    | US-J3: Workshop Board parent->child delivery field propagation (Jeanic UAT, 6 May 2026 build, tagged retroactively 7 May 2026). See [ADR-003 Audit Trail Reconciliation Note](./decisions/ADR-003-child-row-lockdown-forward-only-policy.md#audit-trail-reconciliation-note).          |
| 2026-05-07 | `us-009-job-card-rfq-suppression-2026-05-07`        | US-009: Suppress empty Client RFQ No cell on printed Direct Job cards (2026-05-07).                                                                                                                                                                                                    |

---

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
