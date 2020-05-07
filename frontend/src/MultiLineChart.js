// https://observablehq.com/@d3/multi-line-chart

import React from "react";
import { text } from "d3-fetch";
import { tsvParse } from "d3-dsv";
import { utcParse } from "d3-time-format";
import { scaleUtc, scaleLinear } from "d3-scale";
import { extent, max, bisectLeft, min } from "d3-array";
import { axisBottom, axisLeft } from "d3-axis";
import { line } from "d3-shape";
import { event } from "d3-selection";

import { useSvg } from "./d3-lib/svg-hooks";

const getData = async () => {
  const data = tsvParse(await text("/data/unemployment.tsv"));
  const columns = data.columns.slice(1);
  return {
    y: "% Unemployment",
    series: data.map((d) => ({
      name: d.name.replace(/, ([\w-]+).*/, " $1"),
      values: columns.map((k) => +d[k]),
    })),
    dates: columns.map(utcParse("%Y-%m")),
  };
};

const hover = (svg, data, path, x, y) => {
  const moved = () => {
    event.preventDefault();
    const ym = y.invert(event.layerY); // The SVG element should be positioned and hold the viewBox [0, 0, width, height]
    const xm = x.invert(event.layerX);
    const i1 = bisectLeft(data.dates, xm, 1, data.dates.length - 1);
    const i0 = i1 - 1;
    const i = xm > 0.5 * (data.dates[i0] + data.dates[i1]) ? i1 : i0;
    const s = min(data.series, (d) => Math.abs(d.values[i] - ym));
    path.attr("stroke", (d) => (d === s ? null : "#ddd"));
  };

  const entered = () => {};

  const left = () => {};

  if ("ontouchstart" in document) {
    svg
      .style("-webkit-tap-highlight-color", "transparent")
      .on("touchmove", moved)
      .on("touchstart", entered)
      .on("touchend", left);
  } else {
    svg.on("mousemove", moved).on("mouseenter", entered).on("mouseleave", left);
  }
};

const initDraw = async (svg) => {
  const data = await getData();

  const width = 800;
  const height = 400;
  const margin = { top: 20, right: 20, bottom: 30, left: 30 };

  svg
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("position", "relative");

  const x = scaleUtc()
    .domain(extent(data.dates))
    .range([margin.left, width - margin.right]);

  const xAxis = (g) =>
    g.attr("transform", `translate(0, ${height - margin.bottom})`).call(
      axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const y = scaleLinear()
    .domain([0, max(data.series, (d) => max(d.values))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y)
      );

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  const li = line()
    .defined((d) => !isNaN(d))
    .x((d, i) => x(data.dates[i]))
    .y((d) => y(d));

  const path = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .selectAll("path")
    .data(data.series)
    .join("path")
    .style("mix-blend-mode", "multiply")
    .attr("d", (d) => li(d.values));

  svg.call(hover, data, path, x, y);

  return svg;
};

const MultiLineChart = (props) => {
  const [container] = useSvg({ initDraw });

  return <div ref={container} style={{ marginLeft: 100 }}></div>;
};

export default MultiLineChart;
