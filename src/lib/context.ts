import type { IconContextProps } from "./types";
import { getContext, hasContext, setContext } from "svelte";

const CONTEXT_KEY = Symbol("phosphor-svelte");

export const setIconContext = (value: IconContextProps['values']) => {
  setContext(CONTEXT_KEY, value);
}

/**
 *
 * @returns {import("./shared").IconContextProps["values"]}
 */
export const getIconContext = (): IconContextProps['values'] => {
  if (hasContext(CONTEXT_KEY)) {
    return getContext(CONTEXT_KEY);
  }
  return {};
}
