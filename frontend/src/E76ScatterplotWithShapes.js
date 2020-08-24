import React from "react";

import { extent as d3extent } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { symbols as d3symbols, symbol as d3symbol } from "d3-shape";
import { csvParse as d3csvParse } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 25, right: 20, bottom: 35, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleLinear()
    .domain(d3extent(data, (d) => d.x))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain(d3extent(data, (d) => d.y))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const color = d3scaleOrdinal(
    data.map((d) => d.category),
    d3schemeCategory10
  );

  const shape = d3scaleOrdinal(
    data.map((d) => d.category),
    d3symbols.map((s) => d3symbol().type(s)())
  );

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).ticks(width / 80))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", width)
          .attr("y", margin.bottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(data.x)
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text(data.y)
      );

  const grid = (g) =>
    g
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
          .attr("x1", (d) => 0.5 + x(d))
          .attr("x2", (d) => 0.5 + x(d))
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
      )
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => 0.5 + y(d))
          .attr("y2", (d) => 0.5 + y(d))
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
      );

  return { x, y, color, shape, xAxis, yAxis, grid };
};

const draw = (svg, data, params) => {
  const { x, y, color, shape, xAxis, yAxis, grid } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg.append("g").call(grid);

  svg
    .append("g")
    .attr("stroke-width", 1.5)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("path")
    .data(data)
    .join("path")
    .attr("transform", (d) => `translate(${x(d.x)},${y(d.y)})`)
    .attr("fill", (d) => color(d.category))
    .attr("d", (d) => shape(d.category));
};

const ScatterplotWithShapes = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/iris.csv", (text) =>
    Object.assign(
      d3csvParse(
        text,
        ({ species: category, sepalLength: x, sepalWidth: y }) => ({
          category,
          x: +x,
          y: +y,
        })
      ),
      { x: "Sepal length (cm)", y: "Sepal width (cm)" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ScatterplotWithShapes;
