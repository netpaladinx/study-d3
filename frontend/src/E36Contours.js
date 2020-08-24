import React from "react";

import { axisRight as d3axisRight, axisTop as d3axisTop } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleSequentialLog as d3scaleSequentialLog,
} from "d3-scale";
import { contours as d3contours } from "d3-contour";
import { extent as d3extent, range as d3range } from "d3-array";
import { geoPath as d3geoPath } from "d3-geo";
import { interpolateMagma as d3interpolateMagma } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = () => {
  const x = d3scaleLinear([-2, 2], [0, width + 28]);
  const y = d3scaleLinear([-2, 1], [height, 0]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height})`)
      .call(d3axisTop(x).ticks((width / height) * 10))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick")
          .filter((d) => x.domain().includes(d))
          .remove()
      );

  const yAxis = (g) =>
    g
      .attr("transform", "translate(-1,0)")
      .call(d3axisRight(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick")
          .filter((d) => y.domain().includes(d))
          .remove()
      );

  const thresholds = d3range(1, 20).map((i) => Math.pow(2, i));

  const color = d3scaleSequentialLog(d3extent(thresholds), d3interpolateMagma);

  const grid = (function () {
    const q = 4; // The level of detail, e.g., sample every 4 pixels in x and y.
    const x0 = -q / 2,
      x1 = width + 28 + q;
    const y0 = -q / 2,
      y1 = height + q;
    const n = Math.ceil((x1 - x0) / q);
    const m = Math.ceil((y1 - y0) / q);
    const grid = new Array(n * m);
    for (let j = 0; j < m; ++j) {
      for (let i = 0; i < n; ++i) {
        grid[j * n + i] = value(x.invert(i * q + x0), y.invert(j * q + y0));
      }
    }
    grid.x = -q;
    grid.y = -q;
    grid.k = q;
    grid.n = n;
    grid.m = m;
    return grid;
  })();

  const transform = ({ type, value, coordinates }) => {
    return {
      type,
      value,
      coordinates: coordinates.map((rings) => {
        return rings.map((points) => {
          return points.map(([x, y]) => [
            grid.x + grid.k * x,
            grid.y + grid.k * y,
          ]);
        });
      }),
    };
  };

  const contours = d3contours()
    .size([grid.n, grid.m])
    .thresholds(thresholds)(grid)
    .map(transform);

  return { xAxis, yAxis, color, contours };
};

const value = (x, y) =>
  (1 +
    (x + y + 1) ** 2 *
      (19 - 14 * x + 3 * x ** 2 - 14 * y + 6 * x * y + 3 * y ** 2)) *
  (30 +
    (2 * x - 3 * y) ** 2 *
      (18 - 32 * x + 12 * x * x + 48 * y - 36 * x * y + 27 * y ** 2));

const draw = (svg, params) => {
  const { xAxis, yAxis, color, contours } = params;

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-opacity", 0.5)
    .selectAll("path")
    .data(contours)
    .join("path")
    .attr("fill", (d) => color(d.value))
    .attr("d", d3geoPath());

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);
};

const Contours = (props) => {
  const [container, svg] = useSvg(init);

  const params = React.useMemo(() => computeParams(), []);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default Contours;
