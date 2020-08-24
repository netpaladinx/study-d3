import React from "react";

import { max as d3max } from "d3-array";
import {
  scaleSqrt as d3scaleSqrt,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { interpolateRainbow as d3interpolateRainbow } from "d3-scale-chromatic";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import {
  geoEquirectangular as d3geoEquirectangular,
  geoPath as d3geoPath,
} from "d3-geo";

import * as topojson from "topojson-client";

import {
  useCanvas,
  makeCanvasInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 975;
const margin = 10;

const computeParams = (data, world) => {
  const scale = d3scaleSqrt([0, d3max(data, (d) => d.speed)], [0, 2]);
  const color = d3scaleSequential([0, 360], d3interpolateRainbow);
  const projection = d3geoEquirectangular();

  let height;
  const points = {
    type: "MultiPoint",
    coordinates: data.map((d) => [d.longitude, d.latitude]),
  };
  const [[x0, y0], [x1, y1]] = d3geoPath(
    projection.fitWidth(width - margin * 2, points)
  ).bounds(points);
  const [tx, ty] = projection.translate();
  height = Math.ceil(y1 - y0);
  projection.translate([tx + margin, ty + margin]);
  height = height + margin * 2;

  const init = makeCanvasInit({
    width,
    height,
  });

  const land = topojson.feature(world, world.objects.land);

  return { scale, color, height, init, land, data, projection };
};

const draw = (context, params) => {
  const { scale, height, projection, data, color, land } = params;

  const path = d3geoPath(projection, context);
  context.canvas.style.maxWidth = "100%";
  context.fillRect(0, 0, width, height);
  context.strokeStyle = "#eee";
  context.lineWidth = 1.5;
  context.lineJoin = "round";
  context.beginPath();
  path(land);
  context.stroke();
  for (const { longitude, latitude, speed, dir } of data) {
    context.save();
    context.translate(...projection([longitude, latitude]));
    context.scale(scale(speed), scale(speed));
    context.rotate((dir * Math.PI) / 180);
    context.beginPath();
    context.moveTo(-2, -2);
    context.lineTo(2, -2);
    context.lineTo(0, 8);
    context.closePath();
    context.fillStyle = color(dir);
    context.fill();
    context.restore();
  }
};

const VectorField = (props) => {
  const [data] = useDataFetchMemo("/data/wind.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const [world] = useDataFetchMemo(
    "https://cdn.jsdelivr.net/npm/world-atlas@2/land-50m.json"
  );

  const params = React.useMemo(() => callIfReady(computeParams, data, world), [
    data,
    world,
  ]);

  const [container, context] = useCanvas(params ? params.init : null);

  React.useEffect(() => {
    callIfReady(draw, context, params);
  }, [context, params]);

  return <div ref={container}></div>;
};

export default VectorField;
