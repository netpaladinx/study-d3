import React from "react";

import {
  range as d3range,
  transpose as d3transpose,
  max as d3max,
} from "d3-array";
import { stack as d3stack } from "d3-shape";
import {
  scaleBand as d3scaleBand,
  scaleLinear as d3scaleLinear,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { interpolateBlues as d3interpolateBlues } from "d3-scale-chromatic";
import { axisBottom as d3axisBottom } from "d3-axis";

import { useSvg, makeSvgInit, useMovingState } from "./lib/d3-lib";

const width = 600;
const height = 500;
const margin = { top: 0, right: 0, bottom: 10, left: 0 };

const n = 5; // number of series
const m = 58; // number of values per series

const init = makeSvgInit({
  width,
  height,
});

const generateData = () => {
  // Returns an array of m psuedorandom, smoothly-varying non-negative numbers.
  // Inspired by Lee Byron’s test data generator.
  // http://leebyron.com/streamgraph/
  function bumps(m) {
    const values = [];

    // Initialize with uniform random values in [0.1, 0.2).
    for (let i = 0; i < m; ++i) {
      values[i] = 0.1 + 0.1 * Math.random();
    }

    // Add five random bumps.
    for (let j = 0; j < 5; ++j) {
      const x = 1 / (0.1 + Math.random());
      const y = 2 * Math.random() - 0.5;
      const z = 10 / (0.1 + Math.random());
      for (let i = 0; i < m; i++) {
        const w = (i / m - y) * z;
        values[i] += x * Math.exp(-w * w);
      }
    }

    // Ensure all values are positive.
    for (let i = 0; i < m; ++i) {
      values[i] = Math.max(0, values[i]);
    }

    return values;
  }

  const xz = d3range(m);

  const yz = d3range(n).map(() => bumps(m));

  const y01z = d3stack()
    .keys(d3range(n))(d3transpose(yz))
    .map((data, i) => data.map(([y0, y1]) => [y0, y1, i]));

  const yMax = d3max(yz, (y) => d3max(y));

  const y1Max = d3max(y01z, (y) => d3max(y, (d) => d[1]));

  return { xz, yz, y01z, yMax, y1Max };
};

const computeLayout = (data) => {
  const { xz, y1Max } = data;

  const x = d3scaleBand()
    .domain(xz)
    .rangeRound([margin.left, width - margin.right])
    .padding(0.08);

  const y = d3scaleLinear()
    .domain([0, y1Max])
    .range([height - margin.bottom, margin.top]);

  const z = d3scaleSequential(d3interpolateBlues).domain([-0.5 * n, 1.5 * n]);

  return { x, y, z };
};

const computeAxes = (svg, layout) => {
  const { x } = layout;

  const xAxis = (svg) =>
    svg
      .append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .tickSizeOuter(0)
          .tickFormat(() => "")
      );

  return { xAxis };
};

const draw = (svg, data, layout, axes) => {
  const { y01z, yMax, y1Max } = data;

  const { x, y, z } = layout;

  const { xAxis } = axes;

  const rect = svg
    .selectAll("g")
    .data(y01z)
    .join("g")
    .attr("fill", (d, i) => z(i))
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d, i) => x(i))
    .attr("y", height - margin.bottom)
    .attr("width", x.bandwidth())
    .attr("height", 0);

  svg.append("g").call(xAxis);

  function transitionGrouped() {
    y.domain([0, yMax]);

    rect
      .transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .attr("x", (d, i) => x(i) + (x.bandwidth() / n) * d[2])
      .attr("width", x.bandwidth() / n)
      .transition()
      .attr("y", (d) => y(d[1] - d[0]))
      .attr("height", (d) => y(0) - y(d[1] - d[0]));
  }

  function transitionStacked() {
    y.domain([0, y1Max]);

    rect
      .transition()
      .duration(500)
      .delay((d, i) => i * 20)
      .attr("y", (d) => y(d[1]))
      .attr("height", (d) => y(d[0]) - y(d[1]))
      .transition()
      .attr("x", (d, i) => x(i))
      .attr("width", x.bandwidth());
  }

  return { transitionGrouped, transitionStacked };
};

const StackedToGroupedBars = (props) => {
  const [container, svg] = useSvg(init);

  const data = React.useMemo(() => {
    return generateData();
  }, []);

  const layout = React.useMemo(() => {
    if (data) {
      return computeLayout(data);
    } else {
      return null;
    }
  }, [data]);

  const axes = React.useMemo(() => {
    if (svg && layout) {
      return computeAxes(svg, layout);
    } else {
      return null;
    }
  }, [svg, layout]);

  const [animation, setAnimation] = React.useState(null);

  React.useEffect(() => {
    if (svg && data && layout && axes) {
      const { transitionGrouped, transitionStacked } = draw(
        svg,
        data,
        layout,
        axes
      );
      setAnimation({ transitionGrouped, transitionStacked });
    }
  }, [svg, data, layout, axes]);

  const movingIndex = useMovingState(!!animation, {
    start: 0,
    end: 1,
    interval: 2500,
    loop: true,
  });

  React.useEffect(() => {
    if (animation) {
      if (movingIndex === 0) {
        animation.transitionStacked();
      } else {
        animation.transitionGrouped();
      }
    }
  }, [animation, movingIndex]);

  return <div ref={container}></div>;
};

export default StackedToGroupedBars;
