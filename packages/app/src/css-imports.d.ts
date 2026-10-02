// main.tsx imports Mantine's stylesheet for its side effect alone, and TypeScript refuses a
// side-effect import that resolves to no module. Vite bundles the CSS; this only tells the checker so.
declare module '*.css';
