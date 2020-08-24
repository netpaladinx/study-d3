import React from "react";

import {
  treemapBinary as d3treemapBinary,
  treemapDice as d3treemapDice,
  treemapSlice as d3treemapSlice,
  treemapSliceDice as d3treemapSliceDice,
  treemapSquarify as d3treemapSquarify,
  treemap as d3treemap,
  hierarchy as d3hierarchy,
} from "d3-hierarchy";
import { format as d3format } from "d3-format";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 954;
const tiles = [
  d3treemapBinary,
  d3treemapDice,
  d3treemapSlice,
  d3treemapSliceDice,
  d3treemapSquarify,
];

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data, selected) => {
  const format = d3format(",d");
  const color = d3scaleOrdinal(d3schemeCategory10);

  const treemap = (data) =>
    d3treemap()
      .tile(tiles[selected])
      .size([width, height])
      .padding(1)
      .round(true)(
      d3hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );

  const root = treemap(data);

  return { format, color, treemap, root };
};

const draw = (svg, params) => {
  const { format, color, root } = params;

  svg.style("font", "10px sans-serif");

  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .selectAll("title")
    .data((d) => [d])
    .join("title")
    .text(
      (d) =>
        `${d
          .ancestors()
          .reverse()
          .map((d) => d.data.name)
          .join("/")}\n${format(d.value)}`
    );

  leaf
    .selectAll("rect")
    .data((d) => [d])
    .join("rect")
    .attr("id", (d, i) => (d.leafId = `leaf-${i}`))
    .attr("fill", (d) => {
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .attr("fill-opacity", 0.6)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  leaf
    .selectAll("clipPath")
    .data((d) => [d])
    .join("clipPath")
    .attr("id", (d, i) => (d.clipId = `clip-${i}`))
    .append("use")
    .attr("xlink:href", (d) => `#${d.leafId}`);

  leaf
    .selectAll("text")
    .data((d) => [d])
    .join("text")
    .attr("clip-path", (d) => `url(#${d.clipId})`)
    .selectAll("tspan")
    .data((d) =>
      d.data.name.split(/(?=[A-Z][a-z])|\s+/g).concat(format(d.value))
    )
    .join("tspan")
    .attr("x", 3)
    .attr(
      "y",
      (d, i, nodes) => `${(i === nodes.length - 1) * 0.3 + 1.1 + i * 0.9}em`
    )
    .attr("fill-opacity", (d, i, nodes) =>
      i === nodes.length - 1 ? 0.7 : null
    )
    .text((d) => d);
};

const TreeMap = (props) => {
  const [selected, setSelected] = React.useState(4);

  const handleChange = (event) => setSelected(event.target.value);

  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(
    () => callIfReady(computeParams, data, selected),
    [data, selected]
  );

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return (
    <React.Fragment>
      <form style={{ display: "flex", alignItems: "center", minHeight: 33 }}>
        <select value={selected} onChange={handleChange}>
          <option value={0}>d3.treemapBinary</option>
          <option value={1}>d3.treemapDice</option>
          <option value={2}>d3.treemapSlice</option>
          <option value={3}>d3.treemapSliceDice</option>
          <option value={4}>d3.treemapSquarify</option>
        </select>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default TreeMap;
