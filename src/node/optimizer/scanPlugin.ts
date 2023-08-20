import { Plugin } from 'esbuild'
import { BARE_IMPORT_RE, EXTERNAL_TYPES } from '../constants'

export function scanPlugin(deps: Set<string>): Plugin {
  return {
    name: 'esbuild:scan-deps',
    setup(build) {
      // ignore deps
      build.onResolve(
        { filter: new RegExp(`\.(${EXTERNAL_TYPES.join('|')})$`) },
        (resolveInfo) => {
          return {
            path: resolveInfo.path,
            // tag external
            external: true
          }
        }
      )
      // collect deps
      build.onResolve(
        { filter: BARE_IMPORT_RE },
        (resolveInfo) => {
          console.log('scan', resolveInfo)
          const { path: id } = resolveInfo
          deps.add(id)
          return {
            path: id,
            external: true
          }
        }
      )
    }
  }
}