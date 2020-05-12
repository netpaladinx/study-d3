import React from "react";
import { select as d3select } from "d3-selection";

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;

export const makeSvgInit = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  attrs = {},
  styles = {},
  draw,
}) => (svg) => {
  svg = svg.attr("width", width).attr("height", height);

  if (!attrs.viewBox) {
    svg = svg.attr("viewBox", [0, 0, width, height]);
  }

  for (const [key, value] of Object.entries(attrs)) {
    svg = svg.attr(key, value);
  }

  for (const [key, value] of Object.entries(styles)) {
    svg = svg.style(key, value);
  }

  return draw ? draw(svg) : svg;
};

export const useSvg = (init) => {
  const [svg, setSvg] = React.useState(null);

  const container = React.useCallback(
    (node) => {
      setSvg(
        init ? init(d3select(node).append("svg")) : d3select(node).append("svg")
      );
    },
    [init]
  );

  return [container, svg];
};
