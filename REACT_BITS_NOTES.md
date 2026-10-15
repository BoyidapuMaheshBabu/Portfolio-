# React Bits integration notes

This portfolio migration uses React and Vite, with custom React components and motion patterns inspired by the free, open-source React Bits library: https://github.com/DavidHDev/react-bits

## Design decisions
- Reusable React component structure and React state for the live GitHub explorer.
- Animated text-adjacent hero styling, layered orbital shapes, animated bars, reveal-on-scroll sections, and micro-interactions.
- No premium React Bits assets or components are required.
- All animations are CSS-based and respect `prefers-reduced-motion`.
- GitHub explorer reads public repositories only; no token or backend is used.

React Bits offers copy-ready source components in multiple JavaScript/TypeScript and CSS/Tailwind variants. If a specific component is later copied directly from React Bits, retain the upstream license and attribution requirements that apply to that component.
