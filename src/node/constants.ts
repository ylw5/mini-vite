import path from 'path'
export const EXTERNAL_TYPES = [
  "css",
  "less",
  "sass",
  "scss",
  "styl",
  "stylus",
  "pcss",
  "postcss",
  "vue",
  "svelte",
  "marko",
  "astro",
  "png",
  "jpe?g",
  "gif",
  "svg",
  "ico",
  "webp",
  "avif",
];

export const BARE_IMPORT_RE = /^[\w@][^:]/;

// 预构建产物默认存放在 node_modules/.m-vite 目录下
export const PRE_BUNDLE_DIR = path.join('node_modules', '.m-vite');

export const JS_TYPE_RE = /\.(t|j)sx?$|\.mjs/;

export const DEFAULT_EXTENSION = ['.js', '.ts', '.jsx', '.tsx', '.mjs', '.cjs'];

export const HMR_PORT = 24678

export const CLIENT_PUBLIC_PATH = '/@vite/client'