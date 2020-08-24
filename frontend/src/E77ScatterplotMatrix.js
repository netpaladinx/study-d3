import React from "react";

import {
  extent as d3extent,
  cross as d3cross,
  range as d3range,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { select as d3select } from "d3-selection";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const padding = 20;

const init = makeSvgInit({
  width,
  height: "auto",
  attrs: {
    viewBox: [-padding, 0, width, width],
  },
  styles: {
    "max-width": "100%",
  },
});

const computeParams = (data) => {
  const columns = data.columns.filter((d) => d !== "species");
  const size =
    (width - (columns.length + 1) * padding) / columns.length + padding;

  const x = columns.map((c) =>
    d3scaleLinear()
      .domain(d3extent(data, (d) => d[c]))
      .rangeRound([padding / 2, size - padding / 2])
  );

  const y = x.map((x) => x.copy().range([size - padding / 2, padding / 2]));

  const z = d3scaleOrdinal()
    .domain(data.map((d) => d.species))
    .range(d3schemeCategory10);

  const axis0 = d3axisBottom()
    .ticks(6)
    .tickSize(size * columns.length);
  const xAxis = (g) =>
    g
      .selectAll("g")
      .data(x)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * size},0)`)
      .each(function (d) {
        return d3select(this).call(axis0.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

  const axis1 = d3axisLeft()
    .ticks(6)
    .tickSize(-size * columns.length);
  const yAxis = (g) =>
    g
      .selectAll("g")
      .data(y)
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * size})`)
      .each(function (d) {
        return d3select(this).call(axis1.scale(d));
      })
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

  return { columns, size, x, y, z, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { columns, size, x, y, z, xAxis, yAxis } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const cell = svg
    .append("g")
    .selectAll("g")
    .data(d3cross(d3range(columns.length), d3range(columns.length)))
    .join("g")
    .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

  cell
    .append("rect")
    .attr("fill", "none")
    .attr("stroke", "#aaa")
    .attr("x", padding / 2 + 0.5)
    .attr("y", padding / 2 + 0.5)
    .attr("width", size - padding)
    .attr("height", size - padding);

  cell.each(function ([i, j]) {
    d3select(this)
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x[i](d[columns[i]]))
      .attr("cy", (d) => y[j](d[columns[j]]));
  });

  const circle = cell
    .selectAll("circle")
    .attr("r", 3.5)
    .attr("fill-opacity", 0.7)
    .attr("fill", (d) => z(d.species));

  svg
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("text")
    .data(columns)
    .join("text")
    .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
    .attr("x", padding)
    .attr("y", padding)
    .attr("dy", ".71em")
    .text((d) => d);
};

const ScatterplotMatrix = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/iris.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ScatterplotMatrix;
