import React from "react";

import { useSvg } from "./d3-lib/svg-hooks";

const initDraw = (svg) => {
  return svg;
};

const Comp = (props) => {
  const [container, svgRef] = useSvg({ initDraw });
  return <div ref={container}></div>;
};

export default Comp;
