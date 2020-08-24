import React from "react";

import { max as d3max } from "d3-array";
import { axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleUtc as d3scaleUtc,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { line as d3line } from "d3-shape";
import { tsvParse as d3tsvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 30, right: 50, bottom: 30, left: 30 };

const labelPadding = 3;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const series = data.columns
    .slice(1)
    .map((key) => data.map(({ [key]: value, date }) => ({ key, date, value })));

  const x = d3scaleUtc()
    .domain([data[0].date, data[data.length - 1].date])
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([0, d3max(series, (s) => d3max(s, (d) => d.value))])
    .range([height - margin.bottom, margin.top]);

  const z = d3scaleOrdinal(data.columns.slice(1), d3schemeCategory10);

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  return { series, x, y, z, xAxis };
};

const draw = (svg, data, params) => {
  const { series, x, y, z, xAxis } = params;
  svg.append("g").call(xAxis);

  const serie = svg.append("g").selectAll("g").data(series).join("g");

  serie
    .append("path")
    .attr("fill", "none")
    .attr("stroke", (d) => z(d[0].key))
    .attr("stroke-width", 1.5)
    .attr(
      "d",
      d3line()
        .x((d) => x(d.date))
        .y((d) => y(d.value))
    );

  serie
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("stroke-linecap", "round")
    .attr("stroke-linejoin", "round")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data((d) => d)
    .join("text")
    .text((d) => d.value)
    .attr("dy", "0.35em")
    .attr("x", (d) => x(d.date))
    .attr("y", (d) => y(d.value))
    .call((text) =>
      text
        .filter((d, i, data) => i === data.length - 1)
        .append("tspan")
        .attr("font-weight", "bold")
        .text((d) => ` ${d.key}`)
    )
    .clone(true)
    .lower()
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 6);
};

const InlineLabels = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/apples-bananas.tsv", (text) =>
    d3tsvParse(text, (d) => {
      d3autoType(d).date = new Date(Date.UTC(d.date, 0, 1));
      return d;
    })
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default InlineLabels;
