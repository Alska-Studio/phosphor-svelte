<script lang="ts" module>
  /**
   * @example
   * ```svelte
   * <IconContext
   *   values={{
   *     color: "white",
   *     weight: "fill",
   *     size: "20px",
   *     mirrored: false
   *   }}
   * >
   *   <Acorn />
   * </IconContext>
   * ```
   */
  import type { IconContextProps } from "./types";
</script>

<script lang="ts">
  import { setIconContext } from "./context";

  const { children, values }: IconContextProps = $props();

  setIconContext(values);
</script>

{@render children?.()}
