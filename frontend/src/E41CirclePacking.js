import React from "react";

import { hierarchy as d3hierarchy, pack as d3pack } from "d3-hierarchy";
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

const width = 975;
const height = 975;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const format = d3format(",d");
  const color = d3scaleSequential([8, 0], d3interpolateMagma);

  const pack = (data) =>
    d3pack()
      .size([width - 2, height - 2])
      .padding(3)(
      d3hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );

  const root = pack(data);

  return { format, color, pack, root };
};

const draw = (svg, data, params) => {
  const { format, color, pack, root } = params;

  svg.style("font", "10px sans-serif").attr("text-anchor", "middle");

  svg
    .append("filter")
    .attr("id", "shadow")
    .append("feDropShadow")
    .attr("flood-opacity", 0.3)
    .attr("dx", 0)
    .attr("dy", 1);

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
    .attr("transform", (d) => `translate(${d.x + 1},${d.y + 1})`);

  node
    .append("circle")
    .attr("r", (d) => d.r)
    .attr("fill", (d) => color(d.height));

  const leaf = node.filter((d) => !d.children);

  leaf.select("circle").attr("id", (d, i) => (d.leafId = `leaf-${i}`));

  leaf
    .append("clipPath")
    .attr("id", (d, i) => (d.clipId = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.leafId}`);

  leaf
    .append("text")
    .attr("clip-path", (d) => `url(#${d.clipId})`)
    .selectAll("tspan")
    .data((d) => d.data.name.split(/(?=[A-Z][a-z])|\s+/g))
    .join("tspan")
    .attr("x", 0)
    .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.8}em`)
    .text((d) => d);

  node.append("title").text(
    (d) =>
      `${d
        .ancestors()
        .map((d) => d.data.name)
        .reverse()
        .join("/")}\n${format(d.value)}`
  );
};

const CirclePacking = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default CirclePacking;
