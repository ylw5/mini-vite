import path from 'path'
import { build } from 'esbuild'
import { green } from 'picocolors'
import { scanPlugin } from './scanPlugin'
import { PRE_BUNDLE_DIR } from '../constants'
import { preBundlePlugin } from './preBundlePlugin'


export async function optimize(root: string) {
  // 1.确定入口（这里写死了）
  const entry = path.resolve(root, 'src/main.tsx')
  // 2.从入口处扫描依赖
  const deps = new Set<string>()
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    plugins: [scanPlugin(deps)]
  })
  // 3.预构建依赖
  await build({
    entryPoints: [...deps],
    write: true,
    bundle: true,
    format: 'esm',
    splitting: true,
    outdir: path.resolve(root, PRE_BUNDLE_DIR),
    plugins: [preBundlePlugin(deps)]
  })

  console.log(
    `${green('需要预构建的依赖')}:
    ${[...deps].map((dep) => green(dep)).join('\n')}`
  )
}