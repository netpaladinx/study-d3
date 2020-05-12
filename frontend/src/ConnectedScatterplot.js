// https://observablehq.com/@d3/connected-scatterplot

import React from "react";

import { create as d3create, select as d3select } from "d3-selection";
import { scaleLinear as d3scaleLinear } from "d3-scale";
import { extent as d3extent } from "d3-array";
import { line as d3line, curveCatmullRom as d3curveCatmullRom } from "d3-shape";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { easeLinear as d3easeLinear } from "d3-ease";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 600;
const height = 600;
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeData = (drivingInput) => {
  const data = drivingInput.map(({ side, year, miles, gas }) => ({
    orient: side,
    name: year,
    x: +miles,
    y: +gas,
  }));
  data.x = "Miles per person per year";
  data.y = "Cost per gallon";
  return data;
};

const computeLayout = (data) => {
  const x = d3scaleLinear()
    .domain(d3extent(data, (d) => d.x))
    .nice()
    .range([margin.left, width - margin.right]);

  const y = d3scaleLinear()
    .domain(d3extent(data, (d) => d.y))
    .nice()
    .range([height - margin.bottom, margin.top]);

  const line = d3line()
    .curve(d3curveCatmullRom)
    .x((d) => x(d.x))
    .y((d) => y(d.y));

  const length = (path) => {
    return d3create("svg:path").attr("d", path).node().getTotalLength();
  };

  return { x, y, line, length };
};

const makeAxes = (data, layout) => {
  const { x, y } = layout;

  const halo = (text) => {
    text
      .select(function () {
        return this.parentNode.insertBefore(this.cloneNode(true), this);
      })
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-width", 4)
      .attr("stroke-linejoin", "round");
  };

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).ticks(width / 80))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("y2", -height)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", width - 4)
          .attr("y", -4)
          .attr("font-weight", "bold")
          .attr("text-anchor", "end")
          .attr("fill", "black")
          .text(data.x)
          .call(halo)
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, "$.2f"))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("x2", width)
          .attr("stroke-opacity", 0.1)
      )
      .call((g) =>
        g
          .select(".tick:last-of-type text")
          .clone()
          .attr("x", 4)
          .attr("text-anchor", "start")
          .attr("font-weight", "bold")
          .attr("fill", "black")
          .text(data.y)
          .call(halo)
      );

  return { xAxis, yAxis, halo };
};

const draw = (svg, data, layout, axes) => {
  const { x, y, line, length } = layout;
  const { xAxis, yAxis } = axes;

  const l = length(line(data));

  svg.append("g").call(yAxis);

  svg.append("g").call(xAxis);

  svg
    .append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", `0,${l}`)
    .attr("d", line)
    .transition()
    .duration(5000)
    .ease(d3easeLinear)
    .attr("stroke-dasharray", `${l},${l}`);

  svg
    .append("g")
    .attr("fill", "white")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", 3);
};

const drawLabeles = (svg, data, layout, axes) => {
  const { x, y, line, length } = layout;
  const { halo } = axes;

  const l = length(line(data));

  const label = svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (d) => `translate(${x(d.x)},${y(d.y)})`)
    .attr("opacity", 0);

  label
    .append("text")
    .text((d) => d.name)
    .each(function (d) {
      const t = d3select(this);
      switch (d.orient) {
        case "top":
          t.attr("text-anchor", "middle").attr("dy", "-0.7em");
          break;
        case "right":
          t.attr("text-anchor", "start")
            .attr("dx", "0.5em")
            .attr("dy", "0.32em");
          break;
        case "bottom":
          t.attr("text-anchor", "middle").attr("dx", "1.4em");
          break;
        case "left":
          t.attr("text-anchor", "end")
            .attr("dx", "-0.5em")
            .attr("dy", "0.32em");
          break;
      }
    })
    .call(halo);

  label
    .transition()
    .delay((d, i) => (length(line(data.slice(0, i + 1))) / l) * (5000 - 125))
    .attr("opacity", 1);
};

const ConnectedScatterplot = (props) => {
  const [container, svg] = useSvg(init);

  /* Loaded data */

  const [drivingResult] = useDataFetch("/data/driving.csv");

  /* Processed data */

  const data = React.useMemo(() => {
    if (
      !drivingResult.isLoading &&
      !drivingResult.isError &&
      drivingResult.data
    ) {
      return computeData(drivingResult.data);
    } else {
      return null;
    }
  }, [drivingResult]);

  /* Layout data */

  const layout = React.useMemo(() => {
    if (data) {
      return computeLayout(data);
    } else {
      return null;
    }
  }, [data]);

  /* Make axes */

  const axes = React.useMemo(() => {
    if (data && layout) {
      return makeAxes(data, layout);
    } else {
      return null;
    }
  }, [data, layout]);

  /* Draw */

  React.useEffect(() => {
    if (svg && data && layout && axes) {
      draw(svg, data, layout, axes);
      drawLabeles(svg, data, layout, axes);
    }
  }, [svg, data, layout, axes]);

  return <div ref={container}></div>;
};

export default ConnectedScatterplot;
