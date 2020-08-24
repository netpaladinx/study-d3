import React from "react";

import { format as d3format } from "d3-format";
import {
  hierarchy as d3hierarchy,
  partition as d3partition,
} from "d3-hierarchy";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { quantize as d3quantize } from "d3-interpolate";
import { interpolateRainbow as d3interpolateRainbow } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 975;
const height = 1200;

const init = makeSvgInit({
  width,
  height,
  styles: {
    font: "10px sans-serif",
  },
});

const computeParams = (data) => {
  const format = d3format(",d");
  const color = d3scaleOrdinal(
    d3quantize(d3interpolateRainbow, data.children.length + 1)
  );

  const partition = (data) => {
    const root = d3hierarchy(data)
      .sum((d) => d.value)
      .sort((a, b) => b.height - a.height || b.value - a.value);
    return d3partition().size([height, ((root.height + 1) * width) / 3])(root);
  };

  return { format, color, partition };
};

const draw = (svg, data, params) => {
  const { format, color, partition } = params;

  const root = partition(data);
  let focus = root;

  const cell = svg
    .selectAll("g")
    .data(root.descendants())
    .join("g")
    .attr("transform", (d) => `translate(${d.y0},${d.x0})`);

  const rect = cell
    .append("rect")
    .attr("width", (d) => d.y1 - d.y0 - 1)
    .attr("height", (d) => rectHeight(d))
    .attr("fill-opacity", 0.6)
    .attr("fill", (d) => {
      if (!d.depth) return "#ccc";
      while (d.depth > 1) d = d.parent;
      return color(d.data.name);
    })
    .style("cursor", "pointer")
    .on("click", clicked);

  const text = cell
    .append("text")
    .style("user-select", "none")
    .attr("pointer-events", "none")
    .attr("x", 4)
    .attr("y", 13)
    .attr("fill-opacity", (d) => +labelVisible(d));

  text.append("tspan").text((d) => d.data.name);

  const tspan = text
    .append("tspan")
    .attr("fill-opacity", (d) => labelVisible(d) * 0.7)
    .text((d) => ` ${format(d.value)}`);

  function clicked(p) {
    focus = focus === p && p.parent ? (p = p.parent) : p;

    root.each(
      (d) =>
        (d.target = {
          x0: ((d.x0 - p.x0) / (p.x1 - p.x0)) * height,
          x1: ((d.x1 - p.x0) / (p.x1 - p.x0)) * height,
          y0: d.y0 - p.y0,
          y1: d.y1 - p.y0,
        })
    );

    const t = cell
      .transition()
      .duration(750)
      .attr("transform", (d) => `translate(${d.target.y0},${d.target.x0})`);

    rect.transition(t).attr("height", (d) => rectHeight(d.target));
    text.transition(t).attr("fill-opacity", (d) => +labelVisible(d.target));
    tspan
      .transition(t)
      .attr("fill-opacity", (d) => labelVisible(d.target) * 0.7);
  }

  function rectHeight(d) {
    return d.x1 - d.x0 - Math.min(1, (d.x1 - d.x0) / 2);
  }

  function labelVisible(d) {
    return d.y1 <= width && d.y0 >= 0 && d.x1 - d.x0 > 16;
  }
};

const ZoomableIcicle = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ZoomableIcicle;
