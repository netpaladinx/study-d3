// https://observablehq.com/@mbostock/the-wealth-health-of-nations

import React from "react";

import {
  scaleLinear as d3scaleLinear,
  scaleLog as d3scaleLog,
  scaleSqrt as d3scaleSqrt,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {
  bisector as d3bisector,
  descending as d3descending,
  range as d3range,
} from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";

import {
  useSvg,
  makeSvgInit,
  useDataFetch,
  useMovingState,
} from "./lib/d3-lib";

const width = 600;
const height = 560;
const margin = { top: 20, right: 20, bottom: 35, left: 40 };

const init = makeSvgInit({
  width,
  height,
});

const computeLayoutAndStyle = (data) => {
  const x = d3scaleLog([200, 1e5], [margin.left, width - margin.right]);
  const y = d3scaleLinear([14, 86], [height - margin.bottom, margin.top]);
  const radius = d3scaleSqrt([0, 5e8], [0, width / 24]);
  const color = d3scaleOrdinal(
    data.map((d) => d.region),
    d3schemeCategory10
  ).unknown("black");

  const layout = { x, y, radius };
  const style = { color };
  return [layout, style];
};

const makeAxesAndGrid = (layout) => {
  const { x, y } = layout;

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3axisBottom(x).ticks(width / 80, ","))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", width)
          .attr("y", margin.bottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text("Income per capita (dollars)")
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", -margin.left)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .text("Life expectancy (years)")
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

  const axes = { xAxis, yAxis };
  return [axes, grid];
};

const bisectYear = d3bisector(([year]) => year).left;

const valueAt = (values, year) => {
  const i = bisectYear(values, year, 0, values.length - 1);
  const a = values[i];
  if (i > 0) {
    const b = values[i - 1];
    const t = (year - a[0]) / (b[0] - a[0]);
    return a[1] * (1 - t) + b[1] * t;
  }
  return a[1];
};

const dataAt = (data, year) => {
  return data.map((d) => ({
    name: d.name,
    region: d.region,
    income: valueAt(d.income, year),
    population: valueAt(d.population, year),
    lifeExpectancy: valueAt(d.lifeExpectancy, year),
  }));
};

const drawAxesAndGrid = (svg, axes, grid) => {
  const { xAxis, yAxis } = axes;
  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);
  svg.append("g").call(grid);
};

const drawCircle = (svg, data, layout, style) => {
  const { x, y, radius } = layout;
  const { color } = style;

  const circle = svg
    .append("g")
    .attr("stroke", "black")
    .selectAll("circle")
    .data(dataAt(data, 1800), (d) => d.name)
    .join("circle")
    .sort((a, b) => d3descending(a.population, b.population))
    .attr("cx", (d) => x(d.income))
    .attr("cy", (d) => y(d.lifeExpectancy))
    .attr("r", (d) => radius(d.population))
    .attr("fill", (d) => color(d.region))
    .call((circle) =>
      circle.append("title").text((d) => [d.name, d.region].join("\n"))
    );

  return circle;
};

const animate = (circle, data, layout) => {
  const { x, y, radius } = layout;
  circle
    .data(data, (d) => d.name)
    .sort((a, b) => d3descending(a.population, b.population))
    .attr("cx", (d) => x(d.income))
    .attr("cy", (d) => y(d.lifeExpectancy))
    .attr("r", (d) => radius(d.population));
};

const Gapminder = (props) => {
  const [container, svg] = useSvg(init);

  /* Loaded data */

  const [nationsResult] = useDataFetch("/data/nations.json");

  /* Computed layout and style data */

  const [layout, style] = React.useMemo(() => {
    if (
      !nationsResult.isLoading &&
      !nationsResult.isError &&
      nationsResult.data
    ) {
      return computeLayoutAndStyle(nationsResult.data);
    } else {
      return [];
    }
  }, [nationsResult]);

  /* Make axes and grid */

  const [axes, grid] = React.useMemo(() => {
    if (layout) {
      return makeAxesAndGrid(layout);
    } else {
      return [];
    }
  }, [layout]);

  /* Draw */

  const data = nationsResult.data;
  const [circle, setCircle] = React.useState(null);

  React.useEffect(() => {
    if (svg && axes && grid && data) {
      drawAxesAndGrid(svg, axes, grid);
      const circle = drawCircle(svg, data, layout, style);

      setCircle(circle);
    }
  }, [svg, axes, grid, data, layout, style]);

  /* Animate */

  const movingYear = useMovingState(!!data, {
    arr: d3range(1800, 2010, 0.1),
    interval: 10,
  });

  React.useEffect(() => {
    if (circle && data) {
      const currentData = dataAt(data, movingYear);
      animate(circle, currentData, layout);
    }
  }, [circle, movingYear, data, layout]);

  return <div ref={container}></div>;
};

export default Gapminder;
