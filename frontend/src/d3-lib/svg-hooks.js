import React from "react";
import { select as d3select } from "d3-selection";

export const makeInitDraw = ({ width, height, draw, attrs, styles }) => (
  svg
) => {
  svg = svg.attr("width", width).attr("height", height);
  for (const [key, value] of Object.entries(attrs)) {
    svg = svg.attr(key, value);
  }
  for (const [key, value] of Object.entries(styles)) {
    svg = svg.attr(key, value);
  }
  return draw ? draw(svg) : svg;
};

export const useSvg = ({ initDraw }) => {
  const svgRef = React.useRef(null);

  const container = React.useCallback(
    (node) => {
      svgRef.current = initDraw
        ? initDraw(d3select(node).append("svg"))
        : d3select(node).append("svg");
    },
    [initDraw]
  );

  return [container, svgRef];
};
