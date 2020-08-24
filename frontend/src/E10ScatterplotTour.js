// https://observablehq.com/@d3/scatterplot-tour

import React from "react";

import { zoom as d3zoom, zoomIdentity as d3zoomIdentity } from "d3-zoom";
import { event as d3event } from "d3-selection";
import { randomNormal as d3randomNormal } from "d3-random";
import { groups as d3groups, extent as d3extent } from "d3-array";
import {
  scaleLinear as d3scaleLinear,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { axisTop as d3axisTop, axisRight as d3axisRight } from "d3-axis";

import { useSvg, makeSvgInit, useMovingState } from "./lib/d3-lib";

const width = 600;
const height = 600;
const k = height / width;

const init = makeSvgInit({
  width,
  height,
});

const generateData = () => {
  const random = d3randomNormal(0, 0.2);
  const sqrt3 = Math.sqrt(3);
  return [].concat(
    Array.from({ length: 300 }, () => [random() + sqrt3, random() + 1, 0]),
    Array.from({ length: 300 }, () => [random() - sqrt3, random() + 1, 1]),
    Array.from({ length: 300 }, () => [random(), random() - 1, 2])
  );
};

const computeLayout = (data) => {
  const x = d3scaleLinear().domain([-4.5, 4.5]).range([0, width]);
  const y = d3scaleLinear()
    .domain([-4.5 * k, 4.5 * k])
    .range([height, 0]);
  const z = d3scaleOrdinal()
    .domain(data.map((d) => d[2]))
    .range(d3schemeCategory10);

  return { x, y, z };
};

const computeAnimation = (data, layout) => {
  const { x, y, z } = layout;

  const transforms = [["Overview", d3zoomIdentity]].concat(
    d3groups(data, (d) => d[2]).map(([key, data]) => {
      const [x0, x1] = d3extent(data, (d) => d[0]).map(x);
      const [y1, y0] = d3extent(data, (d) => d[1]).map(y);
      const k = 0.9 * Math.min(width / (x1 - x0), height / (y1 - y0));
      const tx = (width - k * (x0 + x1)) / 2;
      const ty = (height - k * (y0 + y1)) / 2;
      return [`Cluster ${key}`, d3zoomIdentity.translate(tx, ty).scale(k)];
    })
  );

  return { transforms };
};

const makeAxes = () => {
  const xAxis = (g, x) =>
    g
      .attr("transform", `translate(0,${height})`)
      .call(d3axisTop(x).ticks(12))
      .call((g) => g.select(".domain").attr("display", "none"));

  const yAxis = (g, y) =>
    g
      .call(d3axisRight(y).ticks(12 * k))
      .call((g) => g.select(".domain").attr("display", "none"));

  return { xAxis, yAxis };
};

const draw = (svg, data, layout) => {
  const { x, y, z } = layout;

  const g = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-linecap", "round");

  g.selectAll("path")
    .data(data)
    .join("path")
    .attr("d", (d) => `M${x(d[0])},${y(d[1])}h0`)
    .attr("stroke", (d) => z(d[2]));

  const gx = svg.append("g");
  const gy = svg.append("g");

  return { g, gx, gy };
};

const animateInit = (svg, layout, axes, animation, elements) => {
  const { x, y, z } = layout;
  const { xAxis, yAxis } = axes;
  const { transforms } = animation;
  const { g, gx, gy } = elements;

  function zoomed() {
    const transform = d3event.transform;
    g.attr("transform", transform).attr("storke-width", 5 / transform.k);
    gx.call(xAxis, transform.rescaleX(x));
    gy.call(yAxis, transform.rescaleY(y));
  }

  const zoom = d3zoom().on("zoom", zoomed);

  svg.call(zoom.transform, transforms[0][1]);

  return { transforms, zoom };
};

const animateUpdate = (svg, animation, i) => {
  const { transforms, zoom } = animation;
  svg.transition().duration(1500).call(zoom.transform, transforms[i][1]);
};

const ScatterplotTour = (props) => {
  const [container, svg] = useSvg(init);

  /* Generate data */

  const data = React.useMemo(() => {
    return generateData();
  }, []);

  /* Compute layout data */

  const layout = React.useMemo(() => {
    if (data) {
      return computeLayout(data);
    } else {
      return null;
    }
  }, [data]);

  /* Compute animation data */

  const animation = React.useMemo(() => {
    if (layout) {
      return computeAnimation(data, layout);
    } else {
      return null;
    }
  }, [data, layout]);

  /* Make axes */

  const axes = React.useMemo(() => {
    return makeAxes();
  }, []);

  /* Draw and animate */
  const [animation2, setAnimation2] = React.useState(null);

  React.useEffect(() => {
    if (svg && data && layout && axes && animation) {
      const elems = draw(svg, data, layout);
      const anim = animateInit(svg, layout, axes, animation, elems);
      setAnimation2(anim);
    }
  }, [svg, data, layout, axes, animation]);

  /* Animate */

  const movingIndex = useMovingState(!!animation, {
    start: 0,
    end: 3,
    interval: 2500,
    loop: true,
  });

  React.useEffect(() => {
    if (svg && animation2) {
      animateUpdate(svg, animation2, movingIndex);
    }
  }, [svg, animation2, movingIndex]);

  return <div ref={container}></div>;
};

export default ScatterplotTour;
