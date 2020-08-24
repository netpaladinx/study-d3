import React from "react";

import TinyQueue from "tinyqueue";
import { easeCubicInOut as d3easeCubicInOut } from "d3-ease";
import { interpolate as d3interpolate } from "d3-interpolate";

import {
  useCanvas,
  makeCanvasInit,
  useDataFetchMemo,
  callIfReady,
  sleep,
} from "./lib/d3-lib";

const width = 1024;
const area_power = 0.25;

const init = makeCanvasInit({
  width,
  height: width,
});

function makeContext2d(width, height, dpi) {
  if (dpi == null) dpi = devicePixelRatio;
  var canvas = document.createElement("canvas");
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + "px";
  var context = canvas.getContext("2d");
  context.scale(dpi, dpi);
  return context;
}

const computeParams = (imageData) => {
  const imageContext = makeContext2d(width, width, 1);
  imageContext.drawImage(imageData, 0, 0, width, width);

  function computeHistogram(x, y, w, h) {
    const { data } = imageContext.getImageData(x, y, w, h);
    const histogram = new Uint32Array(1024);
    for (let i = 0, n = data.length; i < n; i += 4) {
      ++histogram[0 * 256 + data[i + 0]];
      ++histogram[1 * 256 + data[i + 1]];
      ++histogram[2 * 256 + data[i + 2]];
      ++histogram[3 * 256 + data[i + 3]];
    }
    return histogram;
  }

  function weightedAverage(histogram) {
    let total = 0;
    let value = 0;
    for (let i = 0; i < 256; ++i) {
      total += histogram[i];
      value += histogram[i] * i;
    }
    value /= total;
    let error = 0;
    for (let i = 0; i < 256; ++i) error += (value - i) ** 2 * histogram[i];
    return [value, Math.sqrt(error / total)];
  }

  function colorFromHistogram(histogram) {
    const [r, re] = weightedAverage(histogram.subarray(0, 256));
    const [g, ge] = weightedAverage(histogram.subarray(256, 512));
    const [b, be] = weightedAverage(histogram.subarray(512, 768));
    return [
      Math.round(r),
      Math.round(g),
      Math.round(b),
      re * 0.2989 + ge * 0.587 + be * 0.114,
    ];
  }

  return { computeHistogram, weightedAverage, colorFromHistogram };
};

const draw = async (context, params) => {
  const { computeHistogram, weightedAverage, colorFromHistogram } = params;

  class Quad {
    constructor(x, y, w, h) {
      const [r, g, b, error] = colorFromHistogram(computeHistogram(x, y, w, h));
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.color = `#${(0x1000000 + (r << 16) + (g << 8) + b)
        .toString(16)
        .substring(1)}`;
      this.score = error * Math.pow(w * h, area_power);
    }
    split() {
      const dx = this.w / 2,
        x1 = this.x,
        x2 = this.x + dx;
      const dy = this.h / 2,
        y1 = this.y,
        y2 = this.y + dy;
      return [
        new Quad(x1, y1, dx, dy),
        new Quad(x2, y1, dx, dy),
        new Quad(x1, y2, dx, dy),
        new Quad(x2, y2, dx, dy),
      ];
    }
  }

  const quads = new TinyQueue(
    [new Quad(0, 0, width, width)],
    (a, b) => b.score - a.score
  );

  context.canvas.style.width = "100%";
  for (let i = 0; true; ++i) {
    const q = quads.pop();
    if (q === undefined || q.score < 50) break;
    const qs = q.split();
    const qsi = d3interpolate([q, q, q, q], qs);
    qs.forEach(quads.push, quads);
    for (let j = 1, m = Math.max(1, Math.floor(q.w / 10)); j <= m; ++j) {
      const t = d3easeCubicInOut(j / m);
      context.clearRect(q.x, q.y, q.w, q.h);
      for (const s of qsi(t)) {
        context.fillStyle = s.color;
        context.beginPath();
        context.moveTo(s.x + s.w, s.y + s.h / 2);
        context.arc(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, 0, 2 * Math.PI);
        context.fill();
      }
      await sleep(10);
    }
  }
};

const OwlsToTheMax = (props) => {
  const [container, context] = useCanvas(init);

  const [imageData] = useDataFetchMemo("/data/owl.jpg");

  const params = React.useMemo(() => callIfReady(computeParams, imageData), [
    imageData,
  ]);

  React.useEffect(() => {
    callIfReady(draw, context, params);
  }, [context, params]);

  return <div ref={container}></div>;
};

export default OwlsToTheMax;
