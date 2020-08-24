import React from "react";

import { min as d3min, max as d3max } from "d3-array";
import { axisLeft as d3axisLeft, axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleLog as d3scaleLog,
  scaleBand as d3scaleBand,
} from "d3-scale";
import { format as d3format } from "d3-format";
import { utcMonday as d3utcMonday, utcDay as d3utcDay } from "d3-time";
import {
  utcParse as d3utcParse,
  utcFormat as d3utcFormat,
} from "d3-time-format";
import { schemeSet1 as d3schemeSet1 } from "d3-scale-chromatic";
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

const formatDate = d3utcFormat("%B %-d, %Y");
const formatValue = d3format(".2f");

const fc = d3format("+.2%");
const formatChange = (y0, y1) => fc((y1 - y0) / y0);

const parseDate = d3utcParse("%Y-%m-%d");

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const x = d3scaleBand()
    .domain(
      d3utcDay
        .range(data[0].date, +data[data.length - 1].date + 1)
        .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6)
    )
    .range([margin.left, width - margin.right])
    .padding(0.2);

  const y = d3scaleLog()
    .domain([d3min(data, (d) => d.low), d3max(data, (d) => d.high)])
    .rangeRound([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .tickValues(
            d3utcMonday
              .every(width > 720 ? 1 : 2)
              .range(data[0].date, data[data.length - 1].date)
          )
          .tickFormat(d3utcFormat("%-m/%-d"))
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(
        d3axisLeft(y)
          .tickFormat(d3format("$~f"))
          .tickValues(d3scaleLinear().domain(y.domain()).ticks())
      )
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", 0.2)
          .attr("x2", width - margin.left - margin.right)
      )
      .call((g) => g.select(".domain").remove());

  return { x, y, xAxis, yAxis };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const g = svg
    .append("g")
    .attr("stroke-linecap", "round")
    .attr("stroke", "black")
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x(d.date)},0)`);

  g.append("line")
    .attr("y1", (d) => y(d.low))
    .attr("y2", (d) => y(d.high));

  g.append("line")
    .attr("y1", (d) => y(d.open))
    .attr("y2", (d) => y(d.close))
    .attr("stroke-width", x.bandwidth())
    .attr("stroke", (d) =>
      d.open > d.close
        ? d3schemeSet1[0]
        : d.close > d.open
        ? d3schemeSet1[2]
        : d3schemeSet1[8]
    );

  g.append("title").text(
    (d) => `${formatDate(d.date)}
Open: ${formatValue(d.open)}
Close: ${formatValue(d.close)} (${formatChange(d.open, d.close)})
Low: ${formatValue(d.low)}
High: ${formatValue(d.high)}`
  );
};

const CandlestickChart = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/aapl-2.csv", (text) =>
    d3csvParse(text, (d) => {
      const date = parseDate(d["Date"]);
      return {
        date,
        high: +d["High"],
        low: +d["Low"],
        open: +d["Open"],
        close: +d["Close"],
      };
    }).slice(-120)
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default CandlestickChart;
