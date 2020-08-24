import React from "react";

import {
  range as d3range,
  transpose as d3transpose,
  min as d3min,
  max as d3max,
} from "d3-array";
import {
  stack as d3stack,
  stackOffsetExpand as d3stackOffsetExpand,
  stackOffsetNone as d3stackOffsetNone,
  stackOffsetSilhouette as d3stackOffsetSilhouette,
  stackOffsetWiggle as d3stackOffsetWiggle,
  stackOrderNone as d3stackOrderNone,
  area as d3area,
} from "d3-shape";
import { scaleLinear as d3scaleLinear } from "d3-scale";
import { interpolateCool as d3interpolateCool } from "d3-scale-chromatic";

import { useSvg, makeSvgInit, useMovingState } from "./lib/d3-lib";

const width = 800;
const height = 600;

const n = 20; // number of layers
const m = 200; // number of samples per layer
const k = 10; // number of bumps per layer

const init = makeSvgInit({
  width,
  height,
});

const computeDataAndLayout = () => {
  const stack = (offset) =>
    d3stack().keys(d3range(n)).offset(offset).order(d3stackOrderNone);

  function bump(a, n) {
    const x = 1 / (0.1 + Math.random()); // 0.91 ~ 10
    const y = 2 * Math.random() - 0.5; // -0.5 ~ 1.5
    const z = 10 / (0.1 + Math.random()); // 9.1 ~ 100
    for (let i = 0; i < n; ++i) {
      const w = (i / n - y) * z;
      a[i] += x * Math.exp(-w * w);
    }
  }

  function bumps(n, m) {
    const a = [];
    for (let i = 0; i < n; ++i) a[i] = 0;
    for (let i = 0; i < m; ++i) bump(a, n);
    return a;
  }

  const x = d3scaleLinear([0, m - 1], [0, width]);
  const y = d3scaleLinear([0, 1], [height, 0]);
  const z = d3interpolateCool;
  const area = d3area()
    .x((d, i) => x(i))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]));

  const randomize = (offset) => () => {
    const layers = stack(offset)(
      d3transpose(Array.from({ length: n }, () => bumps(m, k)))
    );
    y.domain([
      d3min(layers, (l) => d3min(l, (d) => d[0])),
      d3max(layers, (l) => d3max(l, (d) => d[1])),
    ]);
    return layers;
  };

  return [{ randomize }, { x, y, z, area }];
};

const draw = (svg, data, layout, offset) => {
  const { randomize } = data;
  const { z, area } = layout;
  const path = svg
    .selectAll("path")
    .data(randomize(offset))
    .join("path")
    .attr("d", area)
    .attr("fill", () => z(Math.random()));

  return () =>
    path
      .data(randomize(offset))
      .transition()
      .delay(1000)
      .duration(1500)
      .attr("d", area)
      .end();
};

const StreamgraphTransition = (props) => {
  const [container, svg] = useSvg(init);

  const [data, layout] = React.useMemo(() => computeDataAndLayout(), []);

  const offset = useMovingState(true, {
    arr: [
      d3stackOffsetExpand,
      d3stackOffsetNone,
      d3stackOffsetSilhouette,
      d3stackOffsetWiggle,
    ],
    interval: 10000,
    loop: true,
  });

  const [animate, setAnimate] = React.useState(null);

  React.useEffect(() => {
    if (svg && data && layout) {
      const anim = draw(svg, data, layout, offset);
      setAnimate((animate) => anim);
    }
  }, [svg, data, layout, offset]);

  const movingIndex = useMovingState(!!animate, {
    start: 0,
    end: 3,
    interval: 2500,
    loop: true,
  });

  React.useEffect(() => {
    if (animate) {
      animate();
    }
  }, [animate, movingIndex]);

  return <div ref={container}></div>;
};

export default StreamgraphTransition;
