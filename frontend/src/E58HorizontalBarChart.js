import React from "react";

import {
  range as d3range,
  max as d3max,
  descending as d3descending,
} from "d3-array";
import { axisTop as d3axisTop, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
} from "d3-scale";
import { csvParse as d3csvParse } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const barHeight = 25;
const margin = { top: 30, right: 0, bottom: 10, left: 30 };

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (data) => {
  const height =
    Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;

  const x = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .range([margin.left, width - margin.right]);

  const y = d3scaleBand()
    .domain(d3range(data.length))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3axisTop(x).ticks(width / 80, data.format))
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g.attr("transform", `translate(${margin.left},0)`).call(
      d3axisLeft(y)
        .tickFormat((i) => data[i].name)
        .tickSizeOuter(0)
    );

  const format = x.tickFormat(20, data.format);

  return { height, x, y, xAxis, yAxis, format };
};

const draw = (svg, data, params) => {
  const { height, x, y, xAxis, yAxis, format } = params;

  svg.attr("viewBox", [0, 0, width, height]);

  svg
    .append("g")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", (d) => x(d.value) - x(0))
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .attr("font-family", "sans-serif")
    .attr("font-size", 12)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", (d) => x(d.value))
    .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text((d) => format(d.value))
    .call((text) =>
      text
        .filter((d) => x(d.value) - x(0) < 20) // short bars
        .attr("dx", +4)
        .attr("fill", "black")
        .attr("text-anchor", "start")
    );

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const HorizontalBarChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/alphabet.csv", (text) =>
    Object.assign(
      d3csvParse(text, ({ letter, frequency }) => ({
        name: letter,
        value: +frequency,
      })).sort((a, b) => d3descending(a.value, b.value)),
      { format: "%" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default HorizontalBarChart;
