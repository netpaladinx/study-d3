import React from "react";

import { extent as d3extent, max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import {} from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import { interpolateRdBu as d3interpolateRdBu } from "d3-scale-chromatic";
import { csvParse as d3csvParse } from "d3-dsv";

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
  const x = d3scaleTime()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain(d3extent(data, (d) => d.value))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const max = d3max(data, (d) => Math.abs(d.value));
  const z = d3scaleSequential(d3interpolateRdBu).domain([max, -max]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).ticks(width / 80))
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "+"))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .filter((d) => d === 0)
          .clone()
          .attr("x2", width - margin.right - margin.left)
          .attr("stroke", "#ccc")
      )
      .call((g) =>
        g
          .append("text")
          .attr("fill", "#000")
          .attr("x", 5)
          .attr("y", margin.top)
          .attr("dy", "0.32em")
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text("Anomaly (°C)")
      );

  return { x, y, z, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { x, y, z, xAxis, yAxis } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("g")
    .attr("stroke", "#000")
    .attr("stroke-opacity", 0.2)
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.date))
    .attr("cy", (d) => y(d.value))
    .attr("fill", (d) => z(d.value))
    .attr("r", 2.5);
};

const GlobalTemperatureTrends = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/temperatures.csv", (text) => {
    const data = [];
    d3csvParse(text, (d, i, columns) => {
      for (let i = 1; i < 13; ++i) {
        data.push({
          date: new Date(d.Year, i - 1, 1),
          value: +d[columns[i]],
        });
      }
    });
    return data;
  });

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default GlobalTemperatureTrends;
