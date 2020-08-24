// https://observablehq.com/@d3/multi-line-chart

import React from "react";

import { tsvParse as d3tsvParse } from "d3-dsv";
import { utcParse as d3utcParse } from "d3-time-format";
import { scaleUtc as d3scaleUtc, scaleLinear as d3scaleLinear } from "d3-scale";
import {
  extent as d3extent,
  max as d3max,
  bisectLeft as d3bisectLeft,
  least as d3least,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { line as d3line } from "d3-shape";
import { event as d3event, mouse as d3mouse } from "d3-selection";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleUtc()
    .domain(d3extent(data.dates))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([0, d3max(data.series, (d) => d3max(d.values))])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
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

  const line = d3line()
    .defined((d) => !isNaN(d))
    .x((d, i) => x(data.dates[i]))
    .y((d) => y(d));

  return { x, y, xAxis, yAxis, line };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, line } = params;

  svg.style("overflow", "visible");

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

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
    .attr("d", (d) => line(d.values));

  console.log(data.series);

  svg.call(hover, path);

  function hover(svg, path) {
    if ("ontouchstart" in document)
      svg
        .style("-webkit-tap-highlight-color", "transparent")
        .on("touchmove", moved)
        .on("touchstart", entered)
        .on("touchend", left);
    else
      svg
        .on("mousemove", moved)
        .on("mouseenter", entered)
        .on("mouseleave", left);

    const dot = svg.append("g").attr("display", "none");

    dot.append("circle").attr("r", 2.5);

    dot
      .append("text")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .attr("text-anchor", "middle")
      .attr("y", -8);

    function moved() {
      d3event.preventDefault();
      const mouse = d3mouse(this);
      const xm = x.invert(mouse[0]);
      const ym = y.invert(mouse[1]);
      const i1 = d3bisectLeft(data.dates, xm, 1);
      const i0 = i1 - 1;
      const i = xm - data.dates[i0] > data.dates[i1] - xm ? i1 : i0;
      const s = d3least(data.series, (d) => Math.abs(d.values[i] - ym));
      path
        .attr("stroke", (d) => (d === s ? null : "#ddd"))
        .filter((d) => d === s)
        .raise();
      dot.attr("transform", `translate(${x(data.dates[i])},${y(s.values[i])})`);
      dot.select("text").text(s.name);
    }

    function entered() {
      path.style("mix-blend-mode", null).attr("stroke", "#ddd");
      dot.attr("display", null);
    }

    function left() {
      path.style("mix-blend-mode", "multiply").attr("stroke", null);
      dot.attr("display", "none");
    }
  }
};

const MultiLineChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/unemployment.tsv", (text) => {
    const data = d3tsvParse(text);
    const columns = data.columns.slice(1);
    return {
      y: "% Unemployment",
      series: data.map((d) => ({
        name: d.name.replace(/, ([\w-]+).*/, " $1"),
        values: columns.map((k) => +d[k]),
      })),
      dates: columns.map(d3utcParse("%Y-%m")),
    };
  });

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default MultiLineChart;
