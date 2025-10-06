# Repository Guidelines

## Overview
- This package contains the Kumis templating engine under the `src/` namespace and a bespoke test harness in `tests.js` and the `tests/` directory.
- Runtime code lives under `src/` and uses the Jymfony autoloader; test doubles and fixtures are located beneath `tests/`.

## Tooling and Commands
- Use `npm run test` (or `npm run test:instrument` for coverage) to execute the test suites.
- The project relies on the standard Node.js toolchain already configured in `package.json`; avoid introducing alternative build tools.

## Code Style
- Follow the existing Jymfony conventions visible in the `src/` tree (e.g., class-per-file structure, PascalCase class names, and `export default` statements).
- Keep import paths aligned with the Jymfony autoloader configuration in `package.json` when adding new modules.

## Node.js Practices
- Keep the codebase in JavaScript (no TypeScript) and respect the existing `npm` scripts.
- Use ES module syntax with `export default` for classes/services instead of `module.exports`, aligning with the autoloader configuration.
- Prefer `async`/`await` over callbacks, and keep `package.json` and `package-lock.json` dependencies in sync.
- Declare dependencies and devDependencies in `package.json` in strict alphabetical order.

## Documentation
- Every new feature must ship with user-facing documentation (e.g., update `README.md`, inline docs, or relevant guides) describing usage and configuration.

## Testing
- Tests must be written with `@jymfony/testing` (see the Messenger component example in the Jymfony repository for reference) and integrated into the existing suites.

## Pull Requests
- Provide a concise English summary of the changes in the PR description.
- Call out any edits to Helm charts or Dockerfiles explicitly.
- Use descriptive English branch names for all PRs.
- Ensure every commit message follows the Conventional Commits specification.
