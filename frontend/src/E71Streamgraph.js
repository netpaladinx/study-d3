import React from "react";

import { extent as d3extent, max as d3max, min as d3min } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
  scaleUtc as d3scaleUtc,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {
  stack as d3stack,
  area as d3area,
  stackOffsetWiggle as d3stackOffsetWiggle,
  stackOrderInsideOut as d3stackOrderInsideOut,
} from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 0, right: 20, bottom: 30, left: 20 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const series = d3stack()
    .keys(data.columns.slice(1))
    .offset(d3stackOffsetWiggle)
    .order(d3stackOrderInsideOut)(data);

  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([
      d3min(series, (d) => d3min(d, (d) => d[0])),
      d3max(series, (d) => d3max(d, (d) => d[1])),
    ])
    .range([height - margin.bottom, margin.top]);

  const area = d3area()
    .x((d) => x(d.data.date))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]));

  const color = d3scaleOrdinal()
    .domain(data.columns.slice(1))
    .range(d3schemeCategory10);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove());

  return { series, area, color, xAxis };
};

const draw = (svg, params) => {
  const { series, area, color, xAxis } = params;

  svg
    .append("g")
    .selectAll("path")
    .data(series)
    .join("path")
    .attr("fill", ({ key }) => color(key))
    .attr("d", area)
    .append("title")
    .text(({ key }) => key);

  svg.append("g").call(xAxis);
};

const Streamgraph = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/unemployment-2.csv", (text) =>
    Object.assign(d3csvParse(text, d3autoType), { y: "Unemployment" })
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default Streamgraph;
