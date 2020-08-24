import React from "react";

import { extent as d3extent, min as d3min, max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
} from "d3-scale";
import { timeParse as d3timeParse } from "d3-time-format";
import { schemeRdYlBu as d3schemeRdYlBu } from "d3-scale-chromatic";
import {
  line as d3line,
  area as d3area,
  curveStep as d3curveStep,
} from "d3-shape";
import { tsvParse as d3tsvParse } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const curve = d3curveStep;
const colors = [d3schemeRdYlBu[3][2], d3schemeRdYlBu[3][0]];
const parseDate = d3timeParse("%Y%m%d");

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleTime()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([
      d3min(data, (d) => Math.min(d.value0, d.value1)),
      d3max(data, (d) => Math.max(d.value0, d.value1)),
    ])
    .nice(5)
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .append("g")
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

  return { x, y, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis } = params;

  svg.datum(data);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("clipPath")
    .attr("id", "above-id")
    .append("path")
    .attr(
      "d",
      d3area()
        .curve(curve)
        .x((d) => x(d.date))
        .y0(0)
        .y1((d) => y(d.value1))
    );

  svg
    .append("clipPath")
    .attr("id", "below-id")
    .append("path")
    .attr(
      "d",
      d3area()
        .curve(curve)
        .x((d) => x(d.date))
        .y0(height)
        .y1((d) => y(d.value1))
    );

  svg
    .append("path")
    .attr("clip-path", "url(#above-id)")
    .attr("fill", colors[1])
    .attr(
      "d",
      d3area()
        .curve(curve)
        .x((d) => x(d.date))
        .y0(height)
        .y1((d) => y(d.value0))
    );

  svg
    .append("path")
    .attr("clip-path", "url(#below-id)")
    .attr("fill", colors[0])
    .attr(
      "d",
      d3area()
        .curve(curve)
        .x((d) => x(d.date))
        .y0(0)
        .y1((d) => y(d.value0))
    );

  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr(
      "d",
      d3line()
        .curve(curve)
        .x((d) => x(d.date))
        .y((d) => y(d.value0))
    );
};

const DifferenceChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/weather.tsv", (text) =>
    Object.assign(
      d3tsvParse(text, (d) => ({
        date: parseDate(d.date),
        value0: +d["New York"], // The primary value.
        value1: +d["San Francisco"], // The secondary comparison value.
      })),
      { y: "°F" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default DifferenceChart;
