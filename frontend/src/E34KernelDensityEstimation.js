import React from "react";

import { scaleLinear as d3scaleLinear } from "d3-scale";
import {
  extent as d3extent,
  histogram as d3histogram,
  max as d3max,
  mean as d3mean,
} from "d3-array";
import { line as d3line, curveBasis as d3curveBasis } from "d3-shape";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {} from "d3-scale";
import {} from "d3-scale";

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

const computeParams = (source) => {
  const data = Object.assign(source, {
    title: "Time between eruptions (min.)",
  });

  const x = d3scaleLinear()
    .domain(d3extent(data))
    .nice()
    .range([margin.left, width - margin.right]);

  const thresholds = x.ticks(40);

  const bins = d3histogram().domain(x.domain()).thresholds(thresholds)(data);

  const y = d3scaleLinear()
    .domain([0, d3max(bins, (d) => d.length) / data.length])
    .range([height - margin.bottom, margin.top]);

  const line = d3line()
    .curve(d3curveBasis)
    .x((d) => x(d[0]))
    .y((d) => y(d[1]));

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x))
      .call((g) =>
        g
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", -6)
          .attr("fill", "#000")
          .attr("text-anchor", "end")
          .attr("font-weight", "bold")
          .text(data.title)
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "%"))
      .call((g) => g.select(".domain").remove());

  return { data, x, y, thresholds, bins, line, xAxis, yAxis };
};

const draw = (svg, params) => {
  const { data, x, y, thresholds, bins, line, xAxis, yAxis } = params;

  svg
    .append("g")
    .attr("fill", "#bbb")
    .selectAll("rect")
    .data(bins)
    .join("rect")
    .attr("x", (d) => x(d.x0) + 1)
    .attr("y", (d) => y(d.length / data.length))
    .attr("width", (d) => x(d.x1) - x(d.x0) - 1)
    .attr("height", (d) => y(0) - y(d.length / data.length));

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const path = svg.append("path");

  function update(bandwidth) {
    const density = kde(epanechnikov(bandwidth), thresholds, data);

    path
      .datum(density)
      .attr("fill", "none")
      .attr("stroke", "#000")
      .attr("stroke-width", 1.5)
      .attr("stroke-linejoin", "round")
      .attr("d", line);
  }

  function kde(kernel, thresholds, data) {
    return thresholds.map((t) => [t, d3mean(data, (d) => kernel(t - d))]);
  }

  function epanechnikov(bandwidth) {
    return (x) =>
      Math.abs((x /= bandwidth)) <= 1 ? (0.75 * (1 - x * x)) / bandwidth : 0;
  }

  return update;
};

const KernelDensityEstimation = (props) => {
  const [bandwidth, setBandwidth] = React.useState(7);
  const [update, setUpdate] = React.useState(null);

  const handleChange = (event) => {
    setBandwidth(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/faithful.json");

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  React.useEffect(() => {
    if (svg && params) {
      const newUpdate = draw(svg, params);
      setUpdate(() => newUpdate);
    }
  }, [svg, params]);

  React.useEffect(() => {
    if (update) {
      update(bandwidth);
    }
  }, [update, bandwidth]);

  return (
    <React.Fragment>
      <form>
        <input
          type="range"
          min="1"
          max="20"
          value={bandwidth}
          step="any"
          style={{ width: 180 }}
          onChange={handleChange}
        />
        <output style={{ fontSize: "smaller", fontStyle: "oblique" }}>
          7.0 bandwidth
        </output>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default KernelDensityEstimation;
