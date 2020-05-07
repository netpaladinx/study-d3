import React from "react";

import { useSvg } from "./d3-lib/svg-hooks";

const initDraw = (svg) => {
  const width = 900;
  const height = 400;

  svg.attr("width", width).attr("height", height);

  const nodes = [
    { x: 30, y: 50 },
    { x: 50, y: 80 },
    { x: 90, y: 120 },
  ];

  svg
    .selectAll("circle.nodes")
    .data(nodes)
    .enter()
    .append("circle")
    .attr("class", "nodes")
    .attr("cx", function (d) {
      return d.x;
    })
    .attr("cy", function (d) {
      return d.y;
    })
    .attr("r", "10px")
    .attr("fill", "black");

  const links = [
    { source: nodes[0], target: nodes[1] },
    { source: nodes[2], target: nodes[1] },
  ];

  svg
    .selectAll("line")
    .data(links)
    .enter()
    .append("line")
    .attr("x1", function (d) {
      return d.source.x;
    })
    .attr("y1", function (d) {
      return d.source.y;
    })
    .attr("x2", function (d) {
      return d.target.x;
    })
    .attr("y2", function (d) {
      return d.target.y;
    })
    .style("stroke", "rgb(6,120,155)");

  return svg;
};

const ThreeNodes = (props) => {
  const [container] = useSvg({ initDraw });

  return <div ref={container}></div>;
};

export default ThreeNodes;
