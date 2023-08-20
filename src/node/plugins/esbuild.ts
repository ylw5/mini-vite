import { readFile } from "fs-extra";
import path from 'path'
import { Plugin } from "../plugin";
import { isJsRequest } from "../utils";
import { transform } from "esbuild";

export function esbuildTransformPlugin(): Plugin {
  return {
    name: 'm-vite:esbuild-transform',
    async load(id) {
      if(isJsRequest(id)) {
        try {
          const code = await readFile(id, 'utf-8')
          return code
        } catch (e) {
          return null
        }
      }
    },
    async transform(code, id) {
      if(isJsRequest(id)) {
        const extname = path.extname(id).slice(1)
        const { code: transformedCode, map } = await transform(code, {
          target: 'esnext',
          format: 'esm',
          sourcemap: true,
          jsx: 'automatic',
          loader: extname as 'js' | 'jsx' | 'ts' | 'tsx'
        })
        return {
          code: transformedCode,
          map
        }
      }
      return null
    }
  }
}