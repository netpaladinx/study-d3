import React from "react";

import { range as d3range, ascending as d3ascending } from "d3-array";
import { scaleLinear as d3scaleLinear } from "d3-scale";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { interpolateRound as d3interpolateRound } from "d3-interpolate";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (data) => {
  const width = 640;
  const height = width;
  const margin = { top: 20, right: 20, bottom: 30, left: 30 };

  const qx = Float64Array.from(data.qx).sort(d3ascending);
  const qy = Float64Array.from(data.qy).sort(d3ascending);
  const n = Math.min(qx.length, qy.length);
  const qmin = Math.min(qx[0], qy[0]);
  const qmax = Math.max(qx[qx.length - 1], qy[qy.length - 1]);

  function q(Q, i) {
    if (Q.length === n) return Q[i];
    const j = (i / (n - 1)) * (Q.length - 1);
    const j0 = Math.floor(j);
    const t = j - j0;
    return t ? Q[j0] * (1 - t) + Q[j0 + 1] * t : Q[j0];
  }

  const x = d3scaleLinear()
    .domain([qmin, qmax])
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain([qmin, qmax])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom + 6})`)
      .call(d3axisBottom(x.copy().interpolate(d3interpolateRound)))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", 0.1)
          .attr("y1", -height)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", width - margin.right)
          .attr("y", -3)
          .attr("fill", "currentColor")
          .attr("font-weight", "bold")
          .text(data.x)
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left - 6},0)`)
      .call(d3axisLeft(y.copy().interpolate(d3interpolateRound)))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", 0.1)
          .attr("x1", width)
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

  return { width, height, x, y, xAxis, yAxis, qmin, qmax, qx, qy, n, q };
};

const draw = (svg, params) => {
  const {
    width,
    height,
    x,
    y,
    xAxis,
    yAxis,
    qmin,
    qmax,
    qx,
    qy,
    n,
    q,
  } = params;

  svg = svg
    .attr("viewBox", [0, 0, width, height])
    .style("max-width", `${width}px`);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("line")
    .attr("stroke", "currentColor")
    .attr("stroke-opacity", 0.3)
    .attr("x1", x(qmin))
    .attr("x2", x(qmax))
    .attr("y1", y(qmin))
    .attr("y2", y(qmax));

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(d3range(n))
    .join("circle")
    .attr("cx", (i) => x(q(qx, i)))
    .attr("cy", (i) => y(q(qy, i)))
    .attr("r", 3);
};

const QQPlot = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo(
    "https://gist.githubusercontent.com/mbostock/f67e6aaae8b2c9151a659cd5e39aaeaa/raw/7893fef292c4507b555a1e0f76fa6ed30ed072ad/JAHANMI2.DAT",
    (text) => {
      const lines = text.split("\r\n").slice(48, -1);
      const [header, , ...rows] = lines.map((l) => l.trim().split(/\s+/g));
      const data = rows.map((r) =>
        Object.fromEntries(header.map((h, i) => [h, +r[i]]))
      );
      return {
        y: "Batch 1",
        x: "Batch 2",
        qy: data.filter((d) => d.Bat === 1).map((d) => d.Y),
        qx: data.filter((d) => d.Bat === 2).map((d) => d.Y),
      };
    }
  );

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default QQPlot;
