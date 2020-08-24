import React from "react";

import { interpolate as d3interpolate } from "d3-interpolate";
import {
  geoPath as d3geoPath,
  geoGraticule10 as d3geoGraticule10,
  geoProjectionMutator as d3geoProjectionMutator,
  geoOrthographicRaw as d3geoOrthographicRaw,
  geoEquirectangularRaw as d3geoEquirectangularRaw,
} from "d3-geo";
import { easeCubic as d3easeCubic } from "d3-ease";

import { useCanvas, makeCanvasInit, sleep } from "./lib/d3-lib";

const width = 600;
const height = width / 1.8;

const init = makeCanvasInit({
  width,
  height,
});

const generateData = () => {
  const rotate = d3interpolate([10, -20], [0, 0]);
  const scale = d3interpolate(width / 4, (width - 2) / (2 * Math.PI));
  const equator = {
    type: "LineString",
    coordinates: [
      [-180, 0],
      [-90, 0],
      [0, 0],
      [90, 0],
      [180, 0],
    ],
  };
  const sphere = { type: "Sphere" };
  const graticule = d3geoGraticule10();

  const interpolateProjection = (raw0, raw1) => {
    const mutate = d3geoProjectionMutator((t) => (x, y) => {
      const [x0, y0] = raw0(x, y),
        [x1, y1] = raw1(x, y);
      return [x0 + t * (x1 - x0), y0 + t * (y1 - y0)];
    });
    let t = 0;
    return Object.assign(mutate(t), {
      alpha(_) {
        return arguments.length ? mutate((t = +_)) : t;
      },
    });
  };

  const projection = interpolateProjection(
    d3geoOrthographicRaw,
    d3geoEquirectangularRaw
  )
    .scale(scale(0))
    .translate([width / 2, height / 2])
    .rotate(rotate(0))
    .precision(0.1);

  return { projection, rotate, scale, equator, sphere, graticule };
};

const draw = async (context, data) => {
  const { projection, rotate, scale, equator, sphere, graticule } = data;

  const path = d3geoPath(projection, context);
  while (true) {
    for (let i = 0, n = 480; i < n; ++i) {
      const t = d3easeCubic(2 * i > n ? 2 - (2 * i) / n : (2 * i) / n);
      projection.alpha(t).rotate(rotate(t)).scale(scale(t));
      context.clearRect(0, 0, width, height);
      context.beginPath();
      path(graticule);
      context.lineWidth = 1;
      context.strokeStyle = "#aaa";
      context.stroke();
      context.beginPath();
      path(sphere);
      context.lineWidth = 1.5;
      context.strokeStyle = "#000";
      context.stroke();
      context.beginPath();
      path(equator);
      context.lineWidth = 1.5;
      context.strokeStyle = "#f00";
      context.stroke();
      await sleep(10);
    }
  }
};

const OrthographicToEquirectangualr = (props) => {
  const [container, context] = useCanvas(init);

  const data = React.useMemo(() => {
    return generateData();
  }, []);

  React.useEffect(() => {
    if (context && data) {
      draw(context, data);
    }
  }, [context, data]);

  return <div ref={container}></div>;
};

export default OrthographicToEquirectangualr;
