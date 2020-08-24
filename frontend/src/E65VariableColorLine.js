import React from "react";

import { extent as d3extent } from "d3-array";
import { axisLeft as d3axisLeft, axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
  scaleUtc as d3scaleUtc,
} from "d3-scale";
import { utcParse as d3utcParse } from "d3-time-format";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { csvParse as d3csvParse } from "d3-dsv";
import { line as d3line, curveStep as d3curveStep } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const parseDate = d3utcParse("%Y-%m-%d %H:%M");

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const line = d3line()
    .curve(d3curveStep)
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .rangeRound([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain(d3extent(data, (d) => d.value))
    .nice()
    .rangeRound([height - margin.bottom, margin.top]);

  const color = d3scaleOrdinal(
    data.conditions === undefined
      ? data.map((d) => d.condition)
      : data.conditions,
    data.colors === undefined ? d3schemeCategory10 : data.colors
  ).unknown("black");

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g.select(".tick:last-of-type text").append("tspan").text(data.y)
      );

  const grid = (g) =>
    g
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(x.ticks())
          .join("line")
          .attr("x1", (d) => 0.5 + x(d))
          .attr("x2", (d) => 0.5 + x(d))
          .attr("y1", margin.top)
          .attr("y2", height - margin.bottom)
      )
      .call((g) =>
        g
          .append("g")
          .selectAll("line")
          .data(y.ticks())
          .join("line")
          .attr("y1", (d) => 0.5 + y(d))
          .attr("y2", (d) => 0.5 + y(d))
          .attr("x1", margin.left)
          .attr("x2", width - margin.right)
      );

  return { x, y, xAxis, yAxis, color, line, grid };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, color, line, grid } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg.append("g").call(grid);

  const colorId = "color-id";

  svg
    .append("linearGradient")
    .attr("id", colorId)
    .attr("gradientUnits", "userSpaceOnUse")
    .attr("x1", 0)
    .attr("x2", width)
    .selectAll("stop")
    .data(data)
    .join("stop")
    .attr("offset", (d) => x(d.date) / width)
    .attr("stop-color", (d) => color(d.condition));

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", `url(#${colorId})`)
    .attr("stroke-width", 2)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);
};

const VariableColorLine = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/FCM.txt", (text) => {
    return Object.assign(
      d3csvParse(text, ({ valid, tmpf, skyc1 }) => {
        return tmpf === "M"
          ? null
          : {
              date: parseDate(valid),
              value: +tmpf,
              condition: skyc1,
            };
      }),
      {
        y: " °F",
        conditions: ["CLR", "FEW", "SCT", "BKN", "OVC", "VV "],
        labels: [
          "Clear",
          "Few clouds",
          "Scattered clouds",
          "Broken clouds",
          "Overcast",
          "Indefinite ceiling (vertical visibility)",
        ],
        colors: [
          "deepskyblue",
          "lightskyblue",
          "lightblue",
          "#aaaaaa",
          "#666666",
          "#666666",
        ],
      }
    );
  });

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default VariableColorLine;
