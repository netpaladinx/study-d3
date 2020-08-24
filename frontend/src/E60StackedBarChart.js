import React from "react";

import { sum as d3sum, max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { stack as d3stack } from "d3-shape";
import { schemeSpectral as d3schemeSpectral } from "d3-scale-chromatic";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 10, right: 10, bottom: 20, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const series = d3stack()
    .keys(data.columns.slice(1))(data)
    .map((d) => (d.forEach((v) => (v.key = d.key)), d));

  const x = d3scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3scaleLinear()
    .domain([0, d3max(series, (d) => d3max(d, (d) => d[1]))])
    .rangeRound([height - margin.bottom, margin.top]);

  const color = d3scaleOrdinal()
    .domain(series.map((d) => d.key))
    .range(d3schemeSpectral[series.length])
    .unknown("#ccc");

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).tickSizeOuter(0))
      .call((g) => g.selectAll(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "s"))
      .call((g) => g.selectAll(".domain").remove());

  const formatValue = (x) => (isNaN(x) ? "N/A" : x.toLocaleString("en"));

  return { series, x, y, xAxis, yAxis, color, formatValue };
};

const draw = (svg, data, params) => {
  const { series, x, y, xAxis, yAxis, color, formatValue } = params;

  svg
    .append("g")
    .selectAll("g")
    .data(series)
    .join("g")
    .attr("fill", (d) => color(d.key))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d, i) => x(d.data.name))
    .attr("y", (d) => y(d[1]))
    .attr("height", (d) => y(d[0]) - y(d[1]))
    .attr("width", x.bandwidth())
    .append("title")
    .text(
      (d) => `${d.data.name} ${d.key}
${formatValue(d.data[d.key])}`
    );

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const StackedBarChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/us-population-state-age.csv", (text) =>
    d3csvParse(
      text,
      (d, i, columns) => (
        d3autoType(d), (d.total = d3sum(columns, (c) => d[c])), d
      )
    ).sort((a, b) => b.total - a.total)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default StackedBarChart;
