import { defineConfig } from 'tsup';

// DTS generation is delegated to `tsc --emitDeclarationOnly` via the package.json
// `build` script. The monorepo's tsconfig.base.json sets `composite: true`, which
// makes tsup's bundled rollup-plugin-dts fail with TS6307 on this package.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: false,
  tsconfig: './tsconfig.json',
  clean: true,
  sourcemap: false,
  splitting: false,
  treeshake: true,
});
