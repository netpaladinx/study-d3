import React from "react";

import {
  range as d3range,
  max as d3max,
  descending as d3descending,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
} from "d3-scale";
import { csvParse as d3csvParse } from "d3-dsv";
import { format as d3format } from "d3-format";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 30, right: 0, bottom: 30, left: 40 };
const color = "steelblue";

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleBand()
    .domain(d3range(data.length))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .tickFormat((i) => data[i].name)
        .tickSizeOuter(0)
    );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, data.format))
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

  return { x, y, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis } = params;

  svg
    .append("g")
    .attr("fill", color)
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => y(0) - y(d.value))
    .attr("width", x.bandwidth());

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const BarChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/alphabet.csv", (text) =>
    Object.assign(
      d3csvParse(text, ({ letter, frequency }) => ({
        name: letter,
        value: +frequency,
      })).sort((a, b) => d3descending(a.value, b.value)),
      { format: "%", y: "Frequency" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default BarChart;
