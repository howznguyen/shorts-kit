import {getInputProps} from "remotion";

/**
 * Which part of a video a render draws (`bun run export`). Read from the input
 * props, so every video gets it through its template without passing it down.
 *
 * - `all` (default, Studio and `bun run render`): the finished video;
 * - `picture`: everything visual except the running captions (render it muted);
 * - `captions`: only the running captions, on a transparent background;
 * - `voice`, `music`, `sfx`: one audio stem each. Sounds a scene plays itself
 *   go with `sfx`, so the three stems still add up to the mix.
 */
export const LAYERS = ["all", "picture", "captions", "voice", "music", "sfx"] as const;
export type Layer = (typeof LAYERS)[number];

export const currentLayer = (): Layer => {
  const l = (getInputProps() as {layer?: unknown}).layer;
  return (LAYERS as readonly unknown[]).includes(l) ? (l as Layer) : "all";
};

/** Does the current layer include `part`? (`scenes` also carries the sounds scenes play themselves.) */
export const layerHas = (layer: Layer, part: "picture" | "captions" | "scenes" | "voice" | "music" | "sfx"): boolean => {
  if (layer === "all") return true;
  if (part === "scenes") return layer === "picture" || layer === "sfx";
  return layer === part;
};
