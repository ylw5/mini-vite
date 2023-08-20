import { isAbsolute,resolve, dirname } from 'path'

export function defaultResolve(source: string, importer: string | null) {
  if (isAbsolute(source)) {
    return source
  }
  const resolvedPath = importer ? resolve(dirname(importer), source) : resolve(source)
  return resolvedPath
}