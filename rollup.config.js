import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'bin/cli.ts',
  output: {
    file: 'dist/cli.js',
    format: 'cjs',
    banner: '#!/usr/bin/env node',
    sourcemap: false
  },
  plugins: [
    json(),
    resolve({ preferBuiltins: true }),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' }),
    terser({
      ecma: 2020,
      compress: { passes: 2 },
      mangle: true
    })
  ],
  external: ['commander', 'axios', 'csv-writer', 'ejs', 'jsonwebtoken', 'uuid']
};
