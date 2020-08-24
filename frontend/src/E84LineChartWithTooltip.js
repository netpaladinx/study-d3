import React from "react";

import {
  extent as d3extent,
  max as d3max,
  bisector as d3bisector,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleUtc as d3scaleUtc,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { mouse as d3mouse } from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { line as d3line, curveStep as d3curveStep } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

function formatValue(value) {
  return value.toLocaleString("en", {
    style: "currency",
    currency: "USD",
  });
}

function formatDate(date) {
  return date.toLocaleString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const computeParams = (data) => {
  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g.attr("transform", `translate(0,${height - margin.bottom})`).call(
      d3axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 3)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .text(data.y)
      );

  const bisect0 = d3bisector((d) => d.date).left;
  const bisect = (mx) => {
    const date = x.invert(mx);
    let index = bisect0(data, date, 1);
    index = index >= data.length ? index - 1 : index;
    index = index >= 1 ? index : 1;
    const a = data[index - 1];
    const b = data[index];
    return date - a.date > b.date - date ? b : a;
  };

  const line = d3line()
    .curve(d3curveStep)
    .defined((d) => !isNaN(d.value))
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  return { x, y, xAxis, yAxis, bisect, line };
};

const draw = (svg, data, params) => {
  const { x, y, xAxis, yAxis, bisect, line } = params;

  const callout = (g, value) => {
    if (!value) return g.style("display", "none");

    g.style("display", null)
      .style("pointer-events", "none")
      .style("font", "10px sans-serif");

    const path = g
      .selectAll("path")
      .data([null])
      .join("path")
      .attr("fill", "white")
      .attr("stroke", "black");

    const text = g
      .selectAll("text")
      .data([null])
      .join("text")
      .call((text) =>
        text
          .selectAll("tspan")
          .data((value + "").split(/\n/))
          .join("tspan")
          .attr("x", 0)
          .attr("y", (d, i) => `${i * 1.1}em`)
          .style("font-weight", (_, i) => (i ? null : "bold"))
          .text((d) => d)
      );

    const { x, y, width: w, height: h } = text.node().getBBox();

    text.attr("transform", `translate(${-w / 2},${15 - y})`);
    path.attr(
      "d",
      `M${-w / 2 - 10},5H-5l5,-5l5,5H${w / 2 + 10}v${h + 20}h-${w + 20}z`
    );
  };

  svg
    .style("-webkit-tap-highlight-color", "transparent")
    .style("overflow", "visible");

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", line);

  const tooltip = svg.append("g");

  svg.on("touchmove mousemove", function () {
    const { date, value } = bisect(d3mouse(this)[0]);

    tooltip.attr("transform", `translate(${x(date)},${y(value)})`).call(
      callout,
      `${formatValue(value)}
${formatDate(date)}`
    );
  });

  svg.on("touchend mouseleave", () => tooltip.call(callout, null));
};

const LineChartWidthTooptip = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/aapl.csv", (text) =>
    Object.assign(
      d3csvParse(text, d3autoType).map(({ date, close }) => ({
        date,
        value: close,
      })),
      { y: "$ Close" }
    )
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default LineChartWidthTooptip;
