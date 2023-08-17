module.exports = {
  mount: {
    src: '/',
  },
  devOptions: {
    open: 'none',
    sourcemap: true,
  },
  buildOptions: {
    sourcemap: true,
  },
  optimize: {
    bundle: false, // Ivan turned these off so that `dev` and `build` scripts
    minify: false, // produce identical output, which makes debugging easier.
  },
};
