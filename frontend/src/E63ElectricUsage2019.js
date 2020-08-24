import React from "react";

import { extent as d3extent, range as d3range } from "d3-array";
import { axisTop as d3axisTop, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleBand as d3scaleBand,
  scaleDiverging as d3scaleDiverging,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { format as d3format } from "d3-format";
import {
  interpolateRdBu as d3interpolateRdBu,
  interpolateReds as d3interpolateReds,
} from "d3-scale-chromatic";
import { timeDay as d3timeDay, timeDays as d3timeDays } from "d3-time";
import {
  timeParse as d3timeParse,
  timeFormat as d3timeFormat,
} from "d3-time-format";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const margin = { top: 70, right: 0, bottom: 0, left: 40 };

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (source) => {
  const parseDate = d3timeParse("%Y-%m-%dT%H:%M");
  const parseData = (d) => ({
    date: parseDate(`${d["DATE"]}T${d["START TIME"]}`),
    usage: +d["USAGE"],
  });
  const data = source.map(parseData);

  const dateExtent = d3extent(data, (d) => d.date);

  const height =
    margin.top + margin.bottom + (d3timeDay.count(...dateExtent) + 1) * 10;

  const x = d3scaleBand(d3range(24), [margin.left, width - margin.right]).round(
    true
  );
  const y = d3scaleBand(d3timeDays(...dateExtent), [
    margin.top,
    height - margin.bottom,
  ]).round(true);

  let [min, max] = d3extent(data, (d) => d.usage);
  let color;
  if (min < 0) {
    max = Math.max(-min, max);
    color = d3scaleDiverging([-max, 0, max], (t) => d3interpolateRdBu(1 - t));
  } else {
    color = d3scaleSequential([0, max], d3interpolateReds);
  }

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${margin.top})`)
      .call(d3axisTop(x).tickFormat(formatHour))
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).tickFormat(formatDay))
      .call((g) => g.select(".domain").remove());

  const formatUsage = d3format(".2f");
  const formatDate = d3timeFormat("%B %-d, %-I %p");

  const formatMonth = d3timeFormat("%b %-d");
  const formatDate_ = d3timeFormat("%-d");
  const formatDay = (d) => (d.getDate() === 1 ? formatMonth : formatDate_)(d);

  const formatHour = (d) =>
    d === 0 ? "12 AM" : d === 12 ? "12 PM" : (d % 12) + "";

  return { height, data, color, xAxis, yAxis, x, y, formatDate, formatUsage };
};

const draw = (svg, params) => {
  const {
    height,
    data,
    color,
    xAxis,
    yAxis,
    x,
    y,
    formatDate,
    formatUsage,
  } = params;

  svg.attr("viewBox", [0, 0, width, height]).style("background", "white");

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", (d) => x(d.date.getHours()))
    .attr("y", (d) => y(d3timeDay(d.date)))
    .attr("width", x.bandwidth() - 1)
    .attr("height", y.bandwidth() - 1)
    .attr("fill", (d) => color(d.usage))
    .append("title")
    .text(
      (d) => `${formatDate(d.date)}
${formatUsage(d.usage)} kW`
    );
};

const ElectricUsage2019 = (props) => {
  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/pge-electric-data.csv");

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ElectricUsage2019;
