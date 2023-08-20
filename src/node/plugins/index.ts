import { Plugin } from "../plugin";
import { assetPlugin } from "./assets";
import { clientInjectPlugin } from "./clientInject";
import { cssPlugin } from "./css";
import { esbuildTransformPlugin } from "./esbuild";
import { importAnalysisPlugin } from "./importAnalysis";
import { resolvePlugin } from "./resolve";

export function resovlePlugins(): Plugin[] {
  return [
    clientInjectPlugin(),
    resolvePlugin(), 
    esbuildTransformPlugin(), 
    importAnalysisPlugin(),
    cssPlugin(),
    assetPlugin(),
  ];
}