// Line Chart
import React from "react";
import { text } from "d3-fetch";
import { csvParse, autoType } from "d3-dsv";
import { max, extent } from "d3-array";
import { scaleLinear, scaleUtc } from "d3-scale";
import { axisLeft, axisBottom } from "d3-axis";
import { line } from "d3-shape";

import { useSvg, makeSvgInit } from "./lib/d3-lib";

const width = 800;
const height = 500;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const draw = async (svg) => {
  const data = Object.assign(
    csvParse(await text("/data/aapl.csv"), autoType).map(({ date, close }) => ({
      date,
      value: close,
    })),
    { y: "$ Close" }
  );

  const x = scaleUtc()
    .domain(extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = scaleLinear()
    .domain([0, max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const li = line()
    .defined((d) => !isNaN(d.value))
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

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
  svg
    .append("path")
    .datum(data)
    .attr("d", li)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  return svg;
};

const LineChart = (props) => {
  const [container, svg] = useSvg(init);

  React.useEffect(() => {
    if (svg) {
      draw(svg);
    }
  }, [svg]);

  return <div ref={container}></div>;
};

export default LineChart;
