# Mahesh Babu — Portfolio

<p align="center">
  <img src="favicon.svg" width="64" height="64" alt="Mahesh Babu portfolio favicon" />
</p>

![Portfolio social preview](public/og-image.svg)

> **Understand → Build → Test → Improve**

A responsive, source-first portfolio about learning software engineering by investigating problems, building products, testing what works, and improving the implementation. Built with React and Vite, with a live read-only GitHub explorer.

**Repository:** [BoyidapuMaheshBabu/mahesh-babu-portfolio](https://github.com/BoyidapuMaheshBabu/mahesh-babu-portfolio)

## Features

- Animated hero, orbital glassmorphism, motion-led project cards, scroll reveals, and responsive navigation.
- Three grounded project showcases: TermRunway Android, programming problem-solving, and this portfolio.
- Live public GitHub profile statistics and interactive repository/folder explorer.
- Keyboard-visible focus styles, mobile layouts, and reduced-motion support.
- No backend, GitHub token, database, or deployment configuration.

## Stack

- React + Vite
- CSS animations and responsive layouts
- Lucide icons
- GitHub public REST API

## Run locally

1. Clone or update the repository using GitHub Desktop.
2. Install a current Node.js LTS release.
3. Open the repository folder in VS Code.
4. In the terminal, run:

   ```bash
   npm install
   npm run dev
   ```

5. Open the local URL printed by Vite.

To check a production build locally:

```bash
npm run build
npm run preview
```

The project is intentionally not configured to deploy or publish. It is designed for local development and testing.

## GitHub Explorer

The explorer reads public profile, repository, and folder data from GitHub's unauthenticated API. It does not request private repository access and does not use a personal access token. GitHub's public API rate limits apply. If loading fails, retry later.

## React Bits

The interface uses React component architecture and motion patterns inspired by [DavidHDev/react-bits](https://github.com/DavidHDev/react-bits), a free open-source library of customizable animated React components. See [REACT_BITS_NOTES.md](REACT_BITS_NOTES.md) for the design rationale. No premium components are required.

## Manual test checklist

- [ ] Run `npm install` and `npm run dev`.
- [ ] Check the navigation and all section links on desktop and mobile.
- [ ] Confirm the featured project links open the intended GitHub repositories.
- [ ] Load the GitHub explorer, search repositories, open a folder, and return with breadcrumbs.
- [ ] Test a slow/offline connection and the GitHub retry control.
- [ ] Enable reduced motion in OS settings and verify animations are minimized.
- [ ] Run `npm run build` and resolve any reported errors before treating the migration as complete.

---

**Built to make the process visible—not just the finished screen.**
