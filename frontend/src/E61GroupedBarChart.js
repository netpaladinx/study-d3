import React from "react";

import { max as d3max } from "d3-array";
import { axisLeft as d3axisLeft, axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const groupKey = data.columns[0];
  const keys = data.columns.slice(1);

  const x0 = d3scaleBand()
    .domain(data.map((d) => d[groupKey]))
    .rangeRound([margin.left, width - margin.right])
    .paddingInner(0.1);

  const x1 = d3scaleBand()
    .domain(keys)
    .rangeRound([0, x0.bandwidth()])
    .padding(0.05);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d3max(keys, (key) => d[key]))])
    .nice()
    .rangeRound([height - margin.bottom, margin.top]);

  const color = d3scaleOrdinal().range([
    "#98abc5",
    "#8a89a6",
    "#7b6888",
    "#6b486b",
    "#a05d56",
    "#d0743c",
    "#ff8c00",
  ]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x0).tickSizeOuter(0))
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
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

  return { groupKey, keys, color, x0, x1, y, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { groupKey, keys, color, x0, x1, y, xAxis, yAxis } = params;

  svg
    .append("g")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x0(d[groupKey])},0)`)
    .selectAll("rect")
    .data((d) => keys.map((key) => ({ key, value: d[key] })))
    .join("rect")
    .attr("x", (d) => x1(d.key))
    .attr("y", (d) => y(d.value))
    .attr("width", x1.bandwidth())
    .attr("height", (d) => y(0) - y(d.value))
    .attr("fill", (d) => color(d.key));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg.append("g").call(legend);

  function legend(svg) {
    const g = svg
      .attr("transform", `translate(${width},0)`)
      .attr("text-anchor", "end")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .selectAll("g")
      .data(color.domain().slice().reverse())
      .join("g")
      .attr("transform", (d, i) => `translate(0,${i * 20})`);

    g.append("rect")
      .attr("x", -19)
      .attr("width", 19)
      .attr("height", 19)
      .attr("fill", color);

    g.append("text")
      .attr("x", -24)
      .attr("y", 9.5)
      .attr("dy", "0.35em")
      .text((d) => d);
  }
};

const GroupedBarChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/data.csv", (text) =>
    Object.assign(d3csvParse(text, d3autoType), { y: "Population" })
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default GroupedBarChart;
