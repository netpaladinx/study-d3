import React from "react";

import { max as d3max, extent as d3extent, group as d3group } from "d3-array";
import { axisLeft as d3axisLeft, axisBottom as d3axisBottom } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleUtc as d3scaleUtc,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import {} from "d3-selection";
import {} from "d3-format";
import { interpolate as d3interpolate } from "d3-interpolate";
import { interpolateSpectral as d3interpolateSpectral } from "d3-scale-chromatic";
import { csvParse as d3csvParse } from "d3-dsv";
import { line as d3line } from "d3-shape";
import { easeLinear as d3easeLinear } from "d3-ease";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 720;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

function intrayear(date) {
  date = new Date(+date);
  date.setUTCFullYear(2000);
  return date;
}

function dashTween() {
  const length = this.getTotalLength();
  return d3interpolate(`0,${length}`, `${length},${length}`);
}

const computeParams = (data) => {
  const x = d3scaleUtc(
    [Date.UTC(2000, 0, 1), Date.UTC(2001, 0, 0)],
    [margin.left, width - margin.right]
  );
  const y = d3scaleLinear(
    [0, d3max(data, (d) => d.value)],
    [height - margin.bottom, margin.top]
  );
  const z = d3scaleSequential(
    d3extent(data, (d) => d.date.getUTCFullYear()),
    (t) => d3interpolateSpectral(1 - t)
  );

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80, "%B")
        .tickSizeOuter(0)
    );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "s"))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick:not(:first-of-type) line")
          .clone()
          .attr("x2", width)
          .attr("stroke", "#ddd")
      )
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y)
      );

  const line = d3line()
    .defined((d) => !isNaN(d.value))
    .x((d) => x(intrayear(d.date)))
    .y((d) => y(d.value));

  return { x, y, z, xAxis, yAxis, line };
};

const draw = async (svg, data, params) => {
  const { x, y, z, xAxis, yAxis, line } = params;

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const g = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-miterlimit", 1);

  for (const [key, values] of d3group(data, (d) => d.date.getUTCFullYear())) {
    await g
      .append("path")
      .attr("d", line(values))
      .attr("stroke", z(key))
      .attr("stroke-dasharray", "0,1")
      .transition()
      .ease(d3easeLinear)
      .attrTween("stroke-dasharray", dashTween)
      .end();

    if (!isNaN(values[values.length - 1].value)) {
      g.append("text")
        .attr("stroke", "white")
        .attr("stroke-width", 3)
        .attr("dx", 4)
        .attr("dy", "0.32em")
        .attr("x", x(intrayear(values[values.length - 1].date)))
        .attr("y", y(values[values.length - 1].value))
        .text(key)
        .clone(true)
        .attr("fill", z(key))
        .attr("stroke", "none");
    }
  }
};

const SeaIceExtent = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/sea-ice-extent.csv", (text) =>
    Object.assign(
      d3csvParse(text, ({ date, extent }) => ({
        date: new Date(date),
        value: 1e6 * extent,
      })).sort((a, b) => a.date - b.date),
      { y: "km^2" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default SeaIceExtent;
