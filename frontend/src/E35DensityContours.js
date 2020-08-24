import React from "react";

import { geoPath as d3geoPath } from "d3-geo";
import { scaleLinear as d3scaleLinear } from "d3-scale";
import { extent as d3extent } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { tsvParse as d3tsvParse } from "d3-dsv";
import { contourDensity as d3contourDensity } from "d3-contour";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleLinear()
    .domain(d3extent(data, (d) => d.x))
    .nice()
    .rangeRound([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain(d3extent(data, (d) => d.y))
    .nice()
    .rangeRound([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).tickSizeOuter(0))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("y", -3)
          .attr("dy", null)
          .attr("font-weight", "bold")
          .text(data.x)
      );

  const yAxis = (g) =>
    g
      .append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).tickSizeOuter(0))
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

  const contours = d3contourDensity()
    .x((d) => x(d.x))
    .y((d) => y(d.y))
    .size([width, height])
    .bandwidth(30)
    .thresholds(30)(data);

  return { x, y, xAxis, yAxis, contours };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, contours } = params;
  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-linejoin", "round")
    .selectAll("path")
    .data(contours)
    .enter()
    .append("path")
    .attr("stroke-width", (d, i) => (i % 5 ? 0.25 : 1))
    .attr("d", d3geoPath());

  svg
    .append("g")
    .attr("stroke", "white")
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 2);
};

const DensityContours = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/faithful.tsv", (text) =>
    Object.assign(
      d3tsvParse(text, ({ waiting: x, eruptions: y }) => ({ x: +x, y: +y })),
      { x: "Idle (min.)", y: "Erupting (min.)" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default DensityContours;
