// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// `npm run build` -> `production` is true
// `npm run dev` -> `production` is false
const production = !process.env.ROLLUP_WATCH;

export default {
    input: 'src/main.ts',
    output: {
        file: 'public/bundle.js',
        format: 'iife',    // immediately-invoked function expression — suitable for <script> tags
        sourcemap: true
    },
    plugins: [
        resolve(), // tells Rollup how to find stuff in node_modules
        typescript({ sourceMap: !production, inlineSources: !production }), // Typescript support
        production && terser() // minify, but only in production
    ]
};