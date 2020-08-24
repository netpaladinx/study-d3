import React from "react";

import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import { zoom as d3zoom } from "d3-zoom";
import { scaleLinear as d3scaleLinear, scaleUtc as d3scaleUtc } from "d3-scale";
import { max as d3max, extent as d3extent } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { event as d3event } from "d3-selection";
import { area as d3area, curveStepAfter as d3curveStepAfter } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 420;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g, x) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const yAxis = (g, y) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "s"))
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

  const area = (data, x) =>
    d3area()
      .curve(d3curveStepAfter)
      .x((d) => x(d.date))
      .y0(y(0))
      .y1((d) => y(d.value))(data);

  return { x, y, xAxis, yAxis, area };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, area } = params;

  const zoom = d3zoom()
    .scaleExtent([1, 32])
    .extent([
      [margin.left, 0],
      [width - margin.right, height],
    ])
    .translateExtent([
      [margin.left, -Infinity],
      [width - margin.right, Infinity],
    ])
    .on("zoom", zoomed);

  const clipId = "clip-0";

  svg
    .append("clipPath")
    .attr("id", clipId)
    .append("rect")
    .attr("x", margin.left)
    .attr("y", margin.top)
    .attr("width", width - margin.left - margin.right)
    .attr("height", height - margin.top - margin.bottom);

  const path = svg
    .append("path")
    .attr("clip-path", `url(#${clipId})`)
    .attr("fill", "steelblue")
    .attr("d", area(data, x));

  const gx = svg.append("g").call(xAxis, x);

  svg.append("g").call(yAxis, y);

  svg
    .call(zoom)
    .transition()
    .duration(750)
    .call(zoom.scaleTo, 4, [x(Date.UTC(2001, 8, 1)), 0]);

  function zoomed() {
    const xz = d3event.transform.rescaleX(x);
    path.attr("d", area(data, xz));
    gx.call(xAxis, xz);
  }
};

const ZoomableAreaChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flights.csv", (text) =>
    Object.assign(d3csvParse(text, d3autoType), { y: "Flights" })
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ZoomableAreaChart;
