import React from "react";

import {
  min as d3min,
  max as d3max,
  mean as d3mean,
  ascending as d3ascending,
  rollup as d3rollup,
} from "d3-array";
import { scaleLinear as d3scaleLinear, scaleUtc as d3scaleUtc } from "d3-scale";
import { utcMonth as d3utcMonth } from "d3-time";
import { utcFormat as d3utcFormat } from "d3-time-format";
import {
  areaRadial as d3areaRadial,
  pointRadial as d3pointRadial,
  lineRadial as d3lineRadial,
  curveLinearClosed as d3curveLinearClosed,
} from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = width;
const margin = 10;

const innerRadius = width / 5;
const outerRadius = width / 2 - margin;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-width / 2, -height / 2, width, height],
    "stroke-linejoin": "round",
    "stroke-linecap": "round",
  },
});

const computeParams = (rawdata) => {
  const data = Array.from(
    d3rollup(
      rawdata,
      (v) => ({
        date: new Date(
          Date.UTC(2000, v[0].DATE.getUTCMonth(), v[0].DATE.getUTCDate())
        ),
        avg: d3mean(v, (d) => d.TAVG || NaN),
        min: d3mean(v, (d) => d.TMIN || NaN),
        max: d3mean(v, (d) => d.TMAX || NaN),
        minmin: d3min(v, (d) => d.TMIN || NaN),
        maxmax: d3max(v, (d) => d.TMAX || NaN),
      }),
      (d) => `${d.DATE.getUTCMonth()}-${d.DATE.getUTCDate()}`
    ).values()
  ).sort((a, b) => d3ascending(a.date, b.date));

  const x = d3scaleUtc()
    .domain([Date.UTC(2000, 0, 1), Date.UTC(2001, 0, 1) - 1])
    .range([0, 2 * Math.PI]);

  const y = d3scaleLinear()
    .domain([d3min(data, (d) => d.minmin), d3max(data, (d) => d.maxmax)])
    .range([innerRadius, outerRadius]);

  const xAxis = (g) =>
    g
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .call((g) =>
        g
          .selectAll("g")
          .data(x.ticks())
          .join("g")
          .each((d, i) => (d.id = `month-${i}`))
          .call((g) =>
            g
              .append("path")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.2)
              .attr(
                "d",
                (d) => `
              M${d3pointRadial(x(d), innerRadius)}
              L${d3pointRadial(x(d), outerRadius)}
            `
              )
          )
          .call((g) =>
            g
              .append("path")
              .attr("id", (d) => d.id)
              .datum((d) => [d, d3utcMonth.offset(d, 1)])
              .attr("fill", "none")
              .attr(
                "d",
                ([a, b]) => `
              M${d3pointRadial(x(a), innerRadius)}
              A${innerRadius},${innerRadius} 0,0,1 ${d3pointRadial(
                  x(b),
                  innerRadius
                )}
            `
              )
          )
          .call((g) =>
            g
              .append("text")
              .append("textPath")
              .attr("startOffset", 6)
              .attr("xlink:href", (d) => `#${d.id}`)
              .text(d3utcFormat("%B"))
          )
      );

  const yAxis = (g) =>
    g
      .attr("text-anchor", "middle")
      .attr("font-family", "sans-serif")
      .attr("font-size", 10)
      .call((g) =>
        g
          .selectAll("g")
          .data(y.ticks().reverse())
          .join("g")
          .attr("fill", "none")
          .call((g) =>
            g
              .append("circle")
              .attr("stroke", "#000")
              .attr("stroke-opacity", 0.2)
              .attr("r", y)
          )
          .call((g) =>
            g
              .append("text")
              .attr("y", (d) => -y(d))
              .attr("dy", "0.35em")
              .attr("stroke", "#fff")
              .attr("stroke-width", 5)
              .text((x, i) => `${x.toFixed(0)}${i ? "" : "°F"}`)
              .clone(true)
              .attr("y", (d) => y(d))
              .selectAll(function () {
                return [this, this.previousSibling];
              })
              .clone(true)
              .attr("fill", "currentColor")
              .attr("stroke", "none")
          )
      );

  const area = d3areaRadial()
    .curve(d3curveLinearClosed)
    .angle((d) => x(d.date));

  const line = d3lineRadial()
    .curve(d3curveLinearClosed)
    .angle((d) => x(d.date));

  return { data, x, y, xAxis, yAxis, area, line };
};

const draw = (svg, params) => {
  const { data, x, y, xAxis, yAxis, area, line } = params;

  svg
    .append("path")
    .attr("fill", "lightsteelblue")
    .attr("fill-opacity", 0.2)
    .attr(
      "d",
      area.innerRadius((d) => y(d.minmin)).outerRadius((d) => y(d.maxmax))(data)
    );

  svg
    .append("path")
    .attr("fill", "steelblue")
    .attr("fill-opacity", 0.2)
    .attr(
      "d",
      area.innerRadius((d) => y(d.min)).outerRadius((d) => y(d.max))(data)
    );

  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("d", line.radius((d) => y(d.avg))(data));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const RadiaAreaChart = (props) => {
  const [container, svg] = useSvg(init);

  const [rawdata] = useDataFetchMemo("/data/sfo-temperature.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, rawdata), [
    rawdata,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default RadiaAreaChart;
