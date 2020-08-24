import React from "react";

import { treemap as d3treemap, hierarchy as d3hierarchy } from "d3-hierarchy";
import { format as d3format } from "d3-format";
import { scaleSequential as d3scaleSequential } from "d3-scale";
import { interpolateMagma as d3interpolateMagma } from "d3-scale-chromatic";
import { nest as d3nest } from "d3-collection";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 1060;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const format = d3format(",d");
  const color = d3scaleSequential([8, 0], d3interpolateMagma);

  const treemap = (data) =>
    d3treemap()
      .size([width, height])
      .paddingOuter(3)
      .paddingTop(19)
      .paddingInner(1)
      .round(true)(
      d3hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );

  const root = treemap(data);

  return { format, color, treemap, root };
};

const draw = (svg, data, params) => {
  const { format, color, treemap, root } = params;

  svg.style("font", "10px sans-serif");

  svg
    .append("filter")
    .attr("id", "shadow")
    .append("feDropShadow")
    .attr("flood-opacity", 0.3)
    .attr("dx", 0)
    .attr("stdDeviation", 3);

  const node = svg
    .selectAll("g")
    .data(
      d3nest()
        .key((d) => d.height)
        .entries(root.descendants())
    )
    .join("g")
    .attr("filter", `url(#shadow)`)
    .selectAll("g")
    .data((d) => d.values)
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  node.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .reverse()
        .map((d) => d.data.name)
        .join("/")}\n${format(d.value)}`
  );

  node
    .append("rect")
    .attr("id", (d, i) => (d.nodeId = `node-${i}`))
    .attr("fill", (d) => color(d.height))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  node
    .append("clipPath")
    .attr("id", (d, i) => (d.clipId = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.nodeId}`);

  node
    .append("text")
    .attr("clip-path", (d) => `url(#${d.clipId})`)
    .selectAll("tspan")
    .data((d) => d.data.name.split(/(?=[A-Z][^A-Z])/g).concat(format(d.value)))
    .join("tspan")
    .attr("fill-opacity", (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .text((d) => d);

  node
    .filter((d) => d.children)
    .selectAll("tspan")
    .attr("dx", 3)
    .attr("y", 13);

  node
    .filter((d) => !d.children)
    .selectAll("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    );
};

const NestedTreemap = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default NestedTreemap;
