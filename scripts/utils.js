import fs from "fs-extra";
import { minify } from "html-minifier-terser";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * @param {string} assetsDir
 * @returns
 */
export const getWeights = async (assetsDir) => {
  const dirents = await fs.readdir(assetsDir, { withFileTypes: true });

  return dirents
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);
}

/**
 *
 * @param {string} str
 * @returns
 */
export const generateIconName = (str) => {
  const name = str.split("-");
  return name
    .map((substr) => substr.replace(/^\w/, (c) => c.toUpperCase()))
    .join("");
}

/**
 *
 * @param {string} filepath
 * @returns
 */
export const readSVG = async (filepath) => {
  const svg = await fs.readFile(filepath, "utf-8");

  // prettier-ignore
  return minify(
    svg
      .replace(/<svg.*?>/g, "")
      .replace(/<\/svg>/g, ""),
    {
      collapseWhitespace: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      keepClosingSlash: true,
    }
  );
}

/**
 *
 * @param {string} assetsDir
 * @param {string} weight
 * @returns
 */
export const getIcons = async (assetsDir, weight) => {
  return fs.readdir(join(assetsDir, weight));
}

export const getCurrentDirname = () => {
  return dirname(fileURLToPath(import.meta.url));
}

/**
 * Process items concurrently with a limit
 * @param {Array} items - Array of items to process
 * @param {Function} processor - Function to process each item
 * @param {number} concurrency - Maximum number of concurrent operations
 * @returns {Promise<Array>} Array of results
 */
export async function processConcurrently(items, processor, concurrency = 5) {
  const results = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchPromises = batch.map(processor);
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}
