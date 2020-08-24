import React from "react";

import { ascending as d3ascending } from "d3-array";
import { hierarchy as d3hierarchy, tree as d3tree } from "d3-hierarchy";
import { linkRadial as d3linkRadial } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const radius = width / 2;

const init = makeSvgInit({
  width,
  height: null,
});

const computeParams = (data) => {
  const data2 = d3hierarchy(data).sort((a, b) =>
    d3ascending(a.data.name, b.data.name)
  );

  const tree = d3tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

  const root = tree(data2);

  return { root };
};

const draw = (svg, params) => {
  const { root } = params;

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      d3linkRadial()
        .angle((d) => d.x)
        .radius((d) => d.y)
    );

  svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
    .attr(
      "transform",
      (d) => `
        rotate(${(d.x * 180) / Math.PI - 90})
        translate(${d.y},0)
      `
    )
    .attr("fill", (d) => (d.children ? "#555" : "#999"))
    .attr("r", 2.5);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr(
      "transform",
      (d) => `
        rotate(${(d.x * 180) / Math.PI - 90}) 
        translate(${d.y},0) 
        rotate(${d.x >= Math.PI ? 180 : 0})
      `
    )
    .attr("dy", "0.31em")
    .attr("x", (d) => (d.x < Math.PI === !d.children ? 6 : -6))
    .attr("text-anchor", (d) =>
      d.x < Math.PI === !d.children ? "start" : "end"
    )
    .text((d) => d.data.name)
    .clone(true)
    .lower()
    .attr("stroke", "white");

  const { x, y, width, height } = svg.node().getBBox();
  svg.attr("viewBox", [x, y, width, height]);
};

const RadialTidyTree = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default RadialTidyTree;
