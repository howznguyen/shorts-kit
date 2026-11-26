import React from "react";
import {Img, staticFile} from "remotion";

/**
 * The channel avatar: a round image with an accent ring. Used by `ChapterHud`
 * (`brand`). The file is the channel's own: put it at `public/img/avatar.jpg`
 * (or pass `src`); the kit ships none.
 */
export const Avatar: React.FC<{size?: number; ring: string; src?: string; shadow?: boolean}> = ({size = 84, ring, src = "img/avatar.jpg", shadow = true}) => (
  <Img
    src={staticFile(src)}
    width={size}
    height={size}
    style={{borderRadius: "50%", border: `3px solid ${ring}`, boxShadow: shadow ? "0 2px 14px rgba(0,0,0,0.9)" : undefined, objectFit: "cover", flexShrink: 0, boxSizing: "border-box"}}
  />
);
