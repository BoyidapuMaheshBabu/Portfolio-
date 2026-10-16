# Mahesh Babu — Portfolio

![Portfolio social preview](public/og-image.svg)

> **Understand → Build → Test → Improve**

A responsive personal portfolio built with **React** and **Vite**. It presents my engineering journey, selected projects, and a read-only explorer for browsing public GitHub repositories and source files.

This project is maintained for **local development and testing**. It is not currently deployed.

## Overview

The portfolio is designed to show both the work and the process behind it: exploring problems, making implementation decisions, building practical software, and improving through testing.

### Features

- **Portfolio presentation** — responsive navigation, animated sections, project cards, and glass-inspired visual styling.
- **Project highlights** — showcases TermRunway Android, programming problem-solving, and the portfolio itself.
- **GitHub Explorer** — browse public repository details and source folders through an interactive, read-only interface.
- **Public profile data** — displays GitHub information retrieved from public API endpoints.
- **Accessibility considerations** — visible keyboard-focus styles, responsive layouts, and reduced-motion support.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| Vite | Local development server and build tooling |
| CSS | Responsive layouts, visual styling, and animations |
| Lucide | Interface icons |
| GitHub REST API | Public profile and repository data |

## Run Locally

### Prerequisites

- [Node.js](https://nodejs.org/) with npm
- [Git](https://git-scm.com/) or GitHub Desktop

### Setup

1. Clone the repository or open your local clone.
2. Open the project folder in a terminal.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL shown in the terminal.

### Build and Preview

Create a production build:

```bash
npm run build
```

Preview the generated build locally:

```bash
npm run preview
```

## GitHub Explorer: Data and Privacy

The explorer uses GitHub's public, unauthenticated API to retrieve public profile and repository information.

- No personal access token is required.
- The project does not use a custom backend or database.
- It does not provide access to private repositories.
- Requests may be affected by GitHub's public API rate limits. If data fails to load, retry later.

## Design Acknowledgment

Some React motion and component patterns were explored with reference to [React Bits by DavidHDev](https://github.com/DavidHDev/react-bits), an open-source collection of customizable React components. The design rationale is documented in [REACT_BITS_NOTES.md](REACT_BITS_NOTES.md).

## Verification

When reviewing changes, check the following locally:

- Start the app with `npm run dev` and navigate through each section.
- Test the layout on desktop and mobile screen sizes.
- Use the GitHub Explorer to search repositories, open a folder, and navigate back through breadcrumbs.
- Check the interface with reduced motion enabled.
- Run `npm run build` and address any reported errors.

---

## Developer

**Boyidapu Mahesh Babu**  
Diploma in Computer Science Engineering student
