import os from 'os'
import path from 'path'
import { CLIENT_PUBLIC_PATH, JS_TYPE_RE } from './constants'

export function slash(p: string): string {
  return p.replace(/\\/g, '/')
}

export const isWindows = os.platform() === 'win32'

export function normalizePath(id: string): string {
  return path.posix.normalize(isWindows ? slash(id) : id)
}

export function isJsRequest(id: string): boolean {
  id = cleanUrl(id)
  if(JS_TYPE_RE.test(id)) {
    return true
  }
  if(!path.extname(id) && !id.endsWith('/')) {
    return true
  }
  return false
}

export function isCSSRequest(id: string): boolean {
  return cleanUrl(id).endsWith('.css')
}

export function isImportRequest(url: string): boolean {
  return url.endsWith('?import')
}

const INTERNAL_LIST = [
  CLIENT_PUBLIC_PATH, 
  "/@react-refresh"
];

export function isInternalRequest(id: string): boolean {
  return INTERNAL_LIST.includes(id)
}

export function removeImportQuery(url: string) {
  return url.replace(/\?import$/, '')
}

export function getShortName(file: string, root: string) {
  return file.startsWith(root + '/') ? path.posix.relative(root, file) : file
}

export function cleanUrl(url: string):string {
  return url.replace(/\?.*$/, '').replace(/#.*$/, '')
}