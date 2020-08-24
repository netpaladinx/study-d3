import React from "react";

import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { format as d3format } from "d3-format";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { csvParse as d3csvParse } from "d3-dsv";
import { hierarchy as d3hierarchy, pack as d3pack } from "d3-hierarchy";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 932;
const height = width;
const format = d3format(",d");

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const color = d3scaleOrdinal(
    data.map((d) => d.group),
    d3schemeCategory10
  );

  const pack = (data) =>
    d3pack()
      .size([width - 2, height - 2])
      .padding(3)(d3hierarchy({ children: data }).sum((d) => d.value));

  const root = pack(data);

  return { color, root };
};

const draw = (svg, data, params) => {
  const { color, root } = params;

  svg
    .attr("font-size", 10)
    .attr("font-family", "sans-serif")
    .attr("text-anchor", "middle");

  const leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x + 1},${d.y + 1})`);

  leaf
    .append("circle")
    .attr("id", (d, i) => (d.leafId = `leaf-${i}`))
    .attr("r", (d) => d.r)
    .attr("fill-opacity", 0.7)
    .attr("fill", (d) => color(d.data.group));

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

  leaf.append("title").text(
    (d) =>
      `${
        d.data.title === undefined
          ? ""
          : `${d.data.title}
`
      }${format(d.value)}`
  );
};

const ScatterPlot = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare.csv", (text) =>
    d3csvParse(text, ({ id, value }) => ({
      name: id.split(".").pop(),
      title: id.replace(/\./g, "/"),
      group: id.split(".")[1],
      value: +value,
    }))
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ScatterPlot;
