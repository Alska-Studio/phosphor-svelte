import type { Plugin} from "vite";
import type { TransformPluginContext } from "rollup";
import type { Node } from 'estree';
import MagicString from "magic-string";
import { walk } from "zimmerframe"; // TODO: Maybe just use acorn and acorn-walk instead of zimmerframe?

// By some reason the type is missing attributes for 'start' and 'end'
type EstreeNode = Node & { start: number; end: number; };

const EXCLUDE_RE = /\/node_modules\/|\/\.svelte-kit\/|virtual:__sveltekit/;

const parseId = (id: string) => {
  const [ filename, rawQuery = '' ] = id.split("?", 2);
  const query = Object.fromEntries(Array.from(new URLSearchParams(rawQuery))
    .map(([ k, v ]) => [k, v === '' ? true : v]));
  return { filename, query };
}

const optimizePhosphorImports = (code: string, plugin: TransformPluginContext) => {
  const s = new MagicString(code);
  const root = plugin.parse(code) as EstreeNode;

  let hasChanges = false;

  const state = { hasChanges };


  walk(root, state, {
    ImportDeclaration(node, { state }) {
      if (node.source.value === "phosphor-svelte") {
        let content = '';

        for (const specifier of node.specifiers) {
          if (specifier.type === "ImportSpecifier" && specifier.imported.type === "Identifier") {
            const fragment = `import ${specifier.local.name} from "phosphor-svelte/lib/${specifier.imported.name}";\n`;

            if (fragment) {
              content += fragment;
            }
          }
        }

        if (content) {
          s.overwrite(node.start, node.end, content);
          state.hasChanges = true;
        }
      }
    }
  });

  if (state.hasChanges) {
    return { code: s.toString(), map: s.generateMap({ hires: true }) };
  }
};

/**
 * Vite plugin to optimize Svelte files for Phosphor icons.
 * @returns {import("vite").Plugin}
 */
export function sveltePhosphorOptimize(): Plugin {
  return {
    name: "vite-plugin-svelte-phosphor-optimize",
    enforce: 'post', // We want to process the transformed code, not the raw code
    transform(code: string, id: string): object | void {
      const { filename } = parseId(id);

      if (!id.endsWith('.svelte')) {
        return;
      }

      if (EXCLUDE_RE.test(filename)) {
        return;
      }

      return optimizePhosphorImports(code, this);
    },
  };
}
