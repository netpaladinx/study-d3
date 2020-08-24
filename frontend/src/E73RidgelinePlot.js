import React from "react";

import {
  extent as d3extent,
  max as d3max,
  group as d3group,
  ascending as d3ascending,
  groups as d3groups,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
  scalePoint as d3scalePoint,
} from "d3-scale";
import { area as d3area, curveBasis as d3curveBasis } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const overlap = 8;
const margin = { top: 40, right: 20, bottom: 30, left: 120 };

const init = makeSvgInit({
  width,
  height: null,
});

const computeParams = (data) => {
  const height = data.series.length * 17;

  const x = d3scaleTime()
    .domain(d3extent(data.dates))
    .range([margin.left, width - margin.right]);

  const y = d3scalePoint()
    .domain(data.series.map((d) => d.name))
    .range([margin.top, height - margin.bottom]);

  const z = d3scaleLinear()
    .domain([0, d3max(data.series, (d) => d3max(d.values))])
    .nice()
    .range([0, -overlap * y.step()]);

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).tickSize(0).tickPadding(4))
      .call((g) => g.select(".domain").remove());

  const area = d3area()
    .curve(d3curveBasis)
    .defined((d) => !isNaN(d))
    .x((d, i) => x(data.dates[i]))
    .y0(0)
    .y1((d) => z(d));

  const line = area.lineY1();

  return { height, x, y, z, xAxis, yAxis, area, line };
};

const draw = (svg, data, params) => {
  const { height, y, xAxis, yAxis, area, line } = params;

  svg.attr("height", height);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const group = svg
    .append("g")
    .selectAll("g")
    .data(data.series)
    .join("g")
    .attr("transform", (d) => `translate(0,${y(d.name) + 1})`);

  group
    .append("path")
    .attr("fill", "#ddd")
    .attr("d", (d) => area(d.values));

  group
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("d", (d) => line(d.values));
};

const RidgelinePlot = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/traffic.csv", (text) => {
    const data = d3csvParse(text, d3autoType);
    const dates = Array.from(d3group(data, (d) => +d.date).keys()).sort(
      d3ascending
    );
    return {
      dates: dates.map((d) => new Date(d)),
      series: d3groups(data, (d) => d.name).map(([name, values]) => {
        const value = new Map(values.map((d) => [+d.date, d.value]));
        return { name, values: dates.map((d) => value.get(d)) };
      }),
    };
  });

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default RidgelinePlot;
