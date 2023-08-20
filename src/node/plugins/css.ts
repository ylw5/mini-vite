import { readFile } from "fs-extra";
import { Plugin } from "../plugin";
import { CLIENT_PUBLIC_PATH } from "../constants";
import { ServerContext } from "../server";
import { getShortName } from "../utils";

export function cssPlugin(): Plugin {
  let serverContext: ServerContext
  return {
    name: 'm-vite:css',
    configureServer(s) {
      serverContext = s
    },
    load(id) {
      if(id.endsWith('.css')) {
        return readFile(id, 'utf-8')
      }
    },
    async transform(code, id) {
      if(id.endsWith('.css')) {
        const jsContent = `
          import { createHotContext as __vite__createHotContext } from "${CLIENT_PUBLIC_PATH}";
          import { updateStyle, removeStyle } from "${CLIENT_PUBLIC_PATH}"
          import.meta.hot = __vite__createHotContext("/${getShortName(id, serverContext.root)}");
          const css = '${code.replace(/\n/g, '')}';
          const id = '${id}';
          updateStyle(id, css);
          import.meta.hot.accept();
          import.meta.hot.prune(() => removeStyle(id));
          export default css;
        `.trim()
        return {
          code: jsContent
        }
      }
      return null
    },
  }
}