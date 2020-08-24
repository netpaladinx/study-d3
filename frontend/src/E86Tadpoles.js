import React from "react";

import { extent as d3extent, max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import {} from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { stack as d3stack, area as d3area } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import { useCanvas, makeCanvasInit, sleep } from "./lib/d3-lib";

const width = 954;
const height = 600;

const n = 100;
const m = 12;
const v = 2;

const init = makeCanvasInit({
  width,
  height,
});

const draw = async (context) => {
  context.lineJoin = "round";
  context.lineCap = "round";

  const tadpoles = new Array(n).fill().map(() => ({
    vx: (Math.random() - 0.5) * v,
    vy: (Math.random() - 0.5) * v,
    px: new Array(m).fill(Math.random() * width),
    py: new Array(m).fill(Math.random() * height),
    count: 0,
  }));

  while (true) {
    context.clearRect(0, 0, width, height);

    for (const t of tadpoles) {
      let dx = t.vx;
      let dy = t.vy;
      let x = (t.px[0] += dx);
      let y = (t.py[0] += dy);
      let speed = Math.sqrt(dx * dx + dy * dy);
      const count = speed * 10;
      const k1 = -5 - speed / 3;

      // Bounce off the walls.
      if (x < 0 || x > width) t.vx *= -1;
      if (y < 0 || y > height) t.vy *= -1;

      // Swim!
      for (var j = 1; j < m; ++j) {
        const vx = x - t.px[j];
        const vy = y - t.py[j];
        const k2 = Math.sin(((t.count += count) + j * 3) / 300) / speed;
        t.px[j] = (x += (dx / speed) * k1) - dy * k2;
        t.py[j] = (y += (dy / speed) * k1) + dx * k2;
        speed = Math.sqrt((dx = vx) * dx + (dy = vy) * dy);
      }

      // Head
      context.save();
      context.translate(t.px[0], t.py[0]);
      context.rotate(Math.atan2(t.vy, t.vx));
      context.beginPath();
      context.ellipse(0, 0, 6.5, 4, 0, 0, 2 * Math.PI);
      context.fill();
      context.restore();

      // Body
      context.beginPath();
      context.moveTo(t.px[0], t.py[0]);
      for (let i = 1; i < 3; ++i) context.lineTo(t.px[i], t.py[i]);
      context.lineWidth = 4;
      context.stroke();

      // Tail
      context.beginPath();
      context.moveTo(t.px[0], t.py[0]);
      for (let i = 1; i < m; ++i) context.lineTo(t.px[i], t.py[i]);
      context.lineWidth = 2;
      context.stroke();
    }
    await sleep(10);
  }
};

const Tadpoles = (props) => {
  const [container, context] = useCanvas(init);

  React.useEffect(() => {
    if (context) {
      draw(context);
    }
  }, [context]);

  return <div ref={container}></div>;
};

export default Tadpoles;
