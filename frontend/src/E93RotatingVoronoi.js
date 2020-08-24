import React from "react";

import { curveBasisClosed as d3curveBasisClosed } from "d3-shape";
import { Delaunay as d3Delaunay } from "d3-delaunay";

import { useCanvas, makeCanvasInit, sleep } from "./lib/d3-lib";

const width = 954;
const height = 600;

const init = makeCanvasInit({
  width,
  height,
});

function* circle(cx, cy, r, n, da) {
  for (let i = 0; i < n; ++i) {
    const a = (i * 2 * Math.PI) / n + da;
    yield [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  }
}

function* circles(now) {
  const t = now / 60,
    cx = width / 2,
    cy = height / 2;
  yield* circle(cx, cy, 120, 96, -0.001 * t);
  yield* circle(cx, cy, 30, 10, 0.03 * t);
  yield* circle(cx, cy, 60, 3, -0.05 * t);
  yield* circle(cx, cy, 15, 4, -0.02 * t);
  yield* circle(cx, cy, 0, 1, -0.02 * t);
  yield* circle(240 + cx, -120 + cy, 80, 4, -0.02 * t);
  yield* circle(240 + cx, -120 + cy, 0, 1, -0.02 * t);
  yield* circle(280 + cx, 120 + cy, 40, 8, 0.02 * t);
  yield* circle(280 + cx, 120 + cy, 20, 8, -0.02 * t);
  yield* circle(280 + cx, 120 + cy, 0, 1, 0.02 * t);
}

function resample(curve, points) {
  const n = points.length;
  let p0,
    p1 = points[n - 1];
  let x0,
    x1 = p1[0];
  let y0,
    y1 = p1[1];
  curve.lineStart();
  for (let i = 0; i < n; ++i) {
    p0 = p1;
    x0 = x1;
    y0 = y1;
    p1 = points[i];
    x1 = p1[0];
    y1 = p1[1];
    if (x0 === x1 && y0 === y1) continue;
    curve.point((x0 * 2 + x1) / 3, (y0 * 2 + y1) / 3);
    curve.point((x0 + x1 * 2) / 3, (y0 + y1 * 2) / 3);
    curve.point(...p1);
  }
  curve.lineEnd();
}

const draw = async (context) => {
  const r = 2.5;
  const curve = d3curveBasisClosed(context);
  context.lineWidth = 1.5;
  while (true) {
    const points = [...circles(Date.now())];
    const voronoi = d3Delaunay.from(points).voronoi([0, 0, width, height]);
    context.fillStyle = "#000";
    context.fillRect(0, 0, width, height);
    context.fillStyle = "#fff";
    context.beginPath();
    for (let i = 0, n = points.length; i < n; ++i) {
      const cell = voronoi.cellPolygon(i);
      if (cell === null) continue;
      resample(curve, cell);
    }
    context.fill();
    context.stroke();
    await sleep(10);
  }
};

const RotatingVoronoi = (props) => {
  const [container, context] = useCanvas(init);

  React.useEffect(() => {
    if (context) {
      draw(context);
    }
  }, [context]);

  return <div ref={container}></div>;
};

export default RotatingVoronoi;
