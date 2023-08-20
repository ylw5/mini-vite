import {
  LoadResult, 
  PartialResolvedId,
  ResolveIdResult,
  SourceDescription,
  TransformResult
} from 'rollup'
import { ServerContext } from './server'

export type ServerHook = (
  server: ServerContext
) => (() => void) | void | Promise<(() => void) | void>

export interface Plugin {
  name: string
  configureServer?: ServerHook
  resolveId?: (
    source: string,
    importer?: string
  ) => Promise<ResolveIdResult | null> | ResolveIdResult | null
  load?: (id: string) => Promise<LoadResult | null> | LoadResult | null
  transform?: (
    code: string,
    id: string
  ) => Promise<TransformResult | null> | TransformResult | null
  transformIndexHtml?: (raw: string) => string | Promise<string>
}