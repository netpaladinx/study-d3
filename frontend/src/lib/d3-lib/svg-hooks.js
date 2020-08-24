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
  if (width) svg = svg.attr("width", width);
  if (height) svg = svg.attr("height", height);

  if (!attrs.viewBox && width && height) {
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

  const containerParams = React.useRef(null);
  const container = React.useCallback(
    (node) => {
      let newSvg = init && node ? init(d3select(node).append("svg")) : null;

      containerParams.current = {
        node,
        svg: newSvg,
      };

      if (newSvg) {
        newSvg = Object.assign(newSvg, {
          clear: function () {
            const svgNode = this.node();
            while (svgNode.hasChildNodes()) {
              svgNode.removeChild(svgNode.firstChild);
            }
          },
        });
      }
      setSvg(newSvg);
    },
    [init]
  );

  React.useEffect(() => {
    const { node: cnode, svg: csvg } = containerParams.current || {};
    if (cnode && !csvg) {
      container(cnode);
    }
  }, [container, containerParams]);

  return [container, svg];
};
