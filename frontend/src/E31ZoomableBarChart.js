import React from "react";

import { csvParse as d3csvParse } from "d3-dsv";
import { zoom as d3zoom } from "d3-zoom";
import {
  scaleLinear as d3scaleLinear,
  scaleBand as d3scaleBand,
} from "d3-scale";
import { max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { event as d3event } from "d3-selection";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 0, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleBand()
    .domain(data.map((d) => d.name))
    .range([margin.left, width - margin.right])
    .padding(0.1);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).tickSizeOuter(0));

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove());

  function zoom(svg) {
    const extent = [
      [margin.left, margin.top],
      [width - margin.right, height - margin.top],
    ];

    svg.call(
      d3zoom()
        .scaleExtent([1, 8])
        .translateExtent(extent)
        .extent(extent)
        .on("zoom", zoomed)
    );

    function zoomed() {
      x.range(
        [margin.left, width - margin.right].map((d) =>
          d3event.transform.applyX(d)
        )
      );
      svg
        .selectAll(".bars rect")
        .attr("x", (d) => x(d.name))
        .attr("width", x.bandwidth());
      svg.selectAll(".x-axis").call(xAxis);
    }
  }

  return { x, y, xAxis, yAxis, zoom };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, zoom } = params;

  svg.call(zoom);

  svg
    .append("g")
    .attr("class", "bars")
    .attr("fill", "steelblue")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.name))
    .attr("y", (d) => y(d.value))
    .attr("height", (d) => y(0) - y(d.value))
    .attr("width", x.bandwidth());

  svg.append("g").attr("class", "x-axis").call(xAxis);

  svg.append("g").attr("class", "y-axis").call(yAxis);
};

const ZoomableBarChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/alphabet.csv", (text) =>
    d3csvParse(text, ({ letter, frequency }) => ({
      name: letter,
      value: +frequency,
    })).sort((a, b) => b.value - a.value)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ZoomableBarChart;
