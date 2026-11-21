// Config for export-maltese.gen.mjs. It runs under the simulator's vitest (see that file), so it
// imports nothing: vitest is not a dependency of this site.
const config = {
  test: {
    environment: 'node',
    include: ['export-maltese.gen.mjs'],
    testTimeout: 600_000,
  },
  server: { fs: { strict: false } },
};

export default config;
