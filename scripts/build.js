import fs from "fs-extra";
import logUpdate from "log-update";
import pMap from "p-map";
import path from "path";
import { compile } from 'svelte/compiler';

import {
  componentDefinitionTemplate,
  componentTemplate,
  definitionsTemplate,
  moduleTemplate,
} from "./template.js";

import {
  generateIconName,
  getCurrentDirname,
  getIcons,
  getWeights,
  readSVG,
} from "./utils.js";

const isTTY = process.stdout.isTTY;
const __dirname = getCurrentDirname();

const rootDir = path.resolve(__dirname, '..');
const outputDir = path.join(rootDir, 'dist');
const assetsDir = path.join(rootDir, 'core', 'assets');

/** @type {string[]} */
let progress = [];

/** @param {string} str */
const logProgress = (str) => {
  if (isTTY) {
    progress.push(str);
    logUpdate(progress.join("\n"));
  } else {
    console.log(str);
  }

  return {
    done: () => {
      if (isTTY) progress = progress.filter((p) => p !== str);
    },
  };
}

/**
 *
 * @param {string} icon - icon file name, eg. activity.svg
 * @param {string[]} weightVariants - all icon weights
 */
export const generateComponents = async (icon, weightVariants) => {
  try {
    const p = logProgress(`Generating ${icon}...`);
    const iconName = icon.split('.')[0]; // activity.svg -> activity

    const weights = await pMap(weightVariants, async (weight) => {
      const fileName = weight === "regular" ? iconName : `${iconName}-${weight}`
      const svgPath = await readSVG(path.join(assetsDir, weight, `${fileName}.svg`));
      return { weight, svgPath };
    });

    const name = generateIconName(iconName);
    const template = componentTemplate(weights);
    const definition = componentDefinitionTemplate(name);

    await fs.writeFile(path.join(outputDir, 'lib', `${name}.svelte`), template);
    await fs.writeFile(path.join(outputDir, 'lib', `${name}.svelte.d.ts`), definition);

    p.done();

    return { iconName: icon, name, weights };
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

export const main = async () => {
  let concurrency = 5;

  const weights = await getWeights(assetsDir);
  const regularIcons = await getIcons(assetsDir, "regular");

  // TODO: clean output dir first?
  // await fs.remove(outputDir);
  // await fs.mkdirs(path.join(outputDir));

  const components = await pMap(
    regularIcons,
    (icon) => generateComponents(icon, weights),
    {
      concurrency,
    }
  );

  const moduleString = moduleTemplate(components);
  const definitionsString = definitionsTemplate(components);

  await fs.writeFile(path.join(outputDir, 'lib', 'index.js'), moduleString);
  await fs.writeFile(path.join(outputDir, 'lib', 'index.d.ts'), definitionsString);

  await fs.writeFile(path.join(outputDir, 'index.js'), `export * from './lib/index.js';`);
  await fs.writeFile(path.join(outputDir, 'index.d.ts'), `export * from './lib/index.d.ts';`);

  /*
  const source = fs.readFileSync(path.resolve(rootDir, 'src', 'lib', 'IconContext.svelte'), 'utf-8');
  const { js } = compile(source, { filename: 'IconContext.svelte' });
  fs.writeFileSync(path.resolve(rootDir, 'dist', 'lib', 'IconContext.svelte'), js.code);
  */
  fs.copySync(path.resolve(rootDir, 'src', 'lib', 'IconContext.svelte'), path.join(outputDir, 'lib', 'IconContext.svelte'));

  if (isTTY) {
    logUpdate.clear();
    logUpdate.done();
  }

  const passes = components.length;
  console.log(`✔ ${passes} component${passes > 1 ? "s" : ""} generated`);
}

if (process.env.NODE_ENV !== "test") {
  main();
}
