import React from "react";
import { create, select } from "d3-selection";

export const useSVG_1 = (draw) => {
  const container = React.useCallback((node) => {
    const svg = draw(create("svg"));
    node.appendChild(svg.node());
  }, []);

  return container;
};

export const useSVG_2 = (draw) => {
  const container = React.useCallback((node) => {
    const svg = draw(select(node).append("svg"));
  }, []);

  return container;
};
