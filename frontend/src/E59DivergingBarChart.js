import React from "react";

import {
  ascending as d3ascending,
  extent as d3extent,
  range as d3range,
} from "d3-array";
import { axisTop as d3axisTop, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleBand as d3scaleBand,
} from "d3-scale";
import { format as d3format, formatPrefix as d3formatPrefix } from "d3-format";
import { schemeSet1 as d3schemeSet1 } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const barHeight = 25;
const margin = { top: 30, right: 60, bottom: 10, left: 60 };

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (source, metric) => {
  const data = source
    .map(({ State: name, "2010": value0, "2019": value1 }) => ({
      name,
      value:
        metric === "absolute" ? value1 - value0 : (value1 - value0) / value0,
    }))
    .sort((a, b) => d3ascending(a.value, b.value));

  const height =
    Math.ceil((data.length + 0.1) * barHeight) + margin.top + margin.bottom;

  const format = d3format(metric === "absolute" ? "+,d" : "+,.0%");

  const tickFormat =
    metric === "absolute" ? d3formatPrefix("+.1", 1e6) : format;

  const x = d3scaleLinear()
    .domain(d3extent(data, (d) => d.value))
    .rangeRound([margin.left, width - margin.right]);

  const y = d3scaleBand()
    .domain(d3range(data.length))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${margin.top})`)
      .call(
        d3axisTop(x)
          .ticks(width / 80)
          .tickFormat(tickFormat)
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${x(0)},0)`)
      .call(
        d3axisLeft(y)
          .tickFormat((i) => data[i].name)
          .tickSize(0)
          .tickPadding(6)
      )
      .call((g) =>
        g
          .selectAll(".tick text")
          .filter((i) => data[i].value < 0)
          .attr("text-anchor", "start")
          .attr("x", 6)
      );

  return { data, height, format, x, y, xAxis, yAxis };
};

const draw = (svg, params) => {
  svg.clear();

  const { data, height, format, x, y, xAxis, yAxis } = params;

  svg.attr("viewBox", [0, 0, width, height]);

  svg
    .append("g")
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("fill", (d) => d3schemeSet1[d.value > 0 ? 1 : 0])
    .attr("x", (d) => x(Math.min(d.value, 0)))
    .attr("y", (d, i) => y(i))
    .attr("width", (d) => Math.abs(x(d.value) - x(0)))
    .attr("height", y.bandwidth());

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("text-anchor", (d) => (d.value < 0 ? "end" : "start"))
    .attr("x", (d) => x(d.value) + Math.sign(d.value - 0) * 4)
    .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .text((d) => format(d.value));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const DivergingBarChart = (props) => {
  const [metric, setMetric] = React.useState("absolute");

  const handleChange = (event) => {
    setMetric(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/state-population-2010-2019.tsv");

  const params = React.useMemo(
    () => callIfReady(computeParams, source, metric),
    [source, metric]
  );

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return (
    <React.Fragment>
      <form>
        <label>
          <input
            type="radio"
            value="absolute"
            checked={metric === "absolute"}
            onChange={handleChange}
          />
          Absolute change
        </label>
        <label>
          <input
            type="radio"
            value="relative"
            checked={metric === "relative"}
            onChange={handleChange}
          />
          Relative change
        </label>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default DivergingBarChart;
