import React from "react";

import { axisTop as d3axisTop } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
} from "d3-scale";
import { mouse as d3mouse } from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import * as d3sc from "d3-scale-chromatic";

import { useDiv } from "./lib/d3-lib";

const width = 954;
const margin = { top: 30, right: 10, bottom: 0, left: 10 };

const step = 29;

function walk(v) {
  return Math.max(0, Math.min(1, v + (Math.random() - 0.5) * 0.05));
}

function generateData() {
  const n = 20;
  const m = 964;
  const data = new Array(n);
  for (let i = 0; i < n; ++i) {
    const d = (data[i] = new Float64Array(m));
    for (let j = 0, v = 0; j < m; ++j) {
      d[j] = v = walk(v);
    }
  }
  return data;
}

const computeParams = (data, scheme, overlap) => {
  const height = data.length * (step + 1) + margin.top + margin.bottom;

  const color = (i) =>
    d3sc[scheme][Math.max(3, overlap)][i + Math.max(0, 3 - overlap)];

  const x = d3scaleTime().range([0, width]);

  const y = d3scaleLinear().rangeRound([0, -overlap * step]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${margin.top})`)
      .call(
        d3axisTop(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) =>
        g
          .selectAll(".tick")
          .filter((d) => x(d) < margin.left || x(d) >= width - margin.right)
          .remove()
      )
      .call((g) => g.select(".domain").remove());

  return { height, color, x, y, xAxis };
};

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

function makeSvg(width, height) {
  var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", [0, 0, width, height]);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  return svg;
}

function constant(x) {
  return function () {
    return x;
  };
}

var timeouts = new Map();

function timeout(now, time) {
  var t = new Promise(function (resolve) {
    timeouts.delete(time);
    var delay = time - now;
    if (!(delay > 0)) throw new Error("invalid time");
    if (delay > 0x7fffffff) throw new Error("too long to wait");
    setTimeout(resolve, delay);
  });
  timeouts.set(time, t);
  return t;
}

function when(time, value) {
  var now;
  return (now = timeouts.get((time = +time)))
    ? now.then(constant(value))
    : (now = Date.now()) >= time
    ? Promise.resolve(value)
    : timeout(now, time).then(constant(value));
}

const draw = async (div, scheme, overlap) => {
  const data = generateData();
  const { height, color, x, y, xAxis } = computeParams(data, scheme, overlap);

  div.clear();

  const canvas = div
    .selectAll("canvas")
    .data(data)
    .enter()
    .append(() => makeContext2d(width, step, 1).canvas)
    .style("position", "absolute")
    .style("image-rendering", "pixelated")
    .style("top", (d, i) => `${i * (step + 1) + margin.top + 115}px`)
    .property("context", function () {
      return this.getContext("2d");
    })
    .each(horizon);

  function horizon(d) {
    const { context } = this;
    const { length: k } = d;
    if (k < width)
      context.drawImage(this, k, 0, width - k, step, 0, 0, width - k, step);
    context.fillStyle = "#fff";
    context.fillRect(width - k, 0, k, step);
    for (let i = 0; i < overlap; ++i) {
      context.save();
      context.translate(width - k, (i + 1) * step);
      context.fillStyle = color(i);
      for (let j = 0; j < k; ++j) {
        context.fillRect(j, y(d[j]), 1, -y(d[j]));
      }
      context.restore();
    }
  }

  const svg = div
    .append(() => makeSvg(width, height))
    .style("position", "relative")
    .style("font", "10px sans-serif");

  const gX = svg.append("g");

  svg
    .append("g")
    .selectAll("text")
    .data(data)
    .join("text")
    .attr("x", 4)
    .attr("y", (d, i) => (i + 0.5) * (step + 1) + margin.top)
    .attr("dy", "0.35em")
    .text((d, i) => i);

  const rule = svg
    .append("line")
    .attr("stroke", "#000")
    .attr("y1", margin.top - 6)
    .attr("y2", height - margin.bottom - 1)
    .attr("x1", 0.5)
    .attr("x2", 0.5);

  svg.on("mousemove touchmove", () => {
    const x = d3mouse(svg.node())[0] + 0.5;
    rule.attr("x1", x).attr("x2", x);
  });

  const update = (data) => {
    canvas.data(data).each(horizon);
    gX.call(xAxis);
  };

  const period = 250;
  const m = data[0].length;
  const tail = data.map((d) => d.subarray(m - 1, m));
  while (true) {
    const then = new Date(Math.ceil((Date.now() + 1) / period) * period);
    await when(then, then);
    for (const d of data) {
      d.copyWithin(0, 1, m);
      d[m - 1] = walk(d[m - 1]);
    }
    x.domain([then - period * width, then]);
    update(tail);
  }
};

const RealtimeHorizonChart = (props) => {
  const [scheme, setScheme] = React.useState("schemeGreens");
  const [overlap, setOverlap] = React.useState(7);

  const handleChangeScheme = (event) => {
    setScheme(event.target.value);
  };

  const handleChangeOverlap = (event) => {
    setOverlap(event.target.value);
  };

  const [container, div] = useDiv();

  React.useEffect(() => {
    if (div) {
      draw(div, scheme, overlap);
    }
  }, [div, scheme, overlap]);

  return (
    <React.Fragment>
      <form>
        <select value={scheme} onChange={handleChangeScheme}>
          <option value="schemeBlues">Blues</option>
          <option value="schemeGreens">Greens</option>
          <option value="schemeGreys">Greys</option>
          <option value="schemeOranges">Oranges</option>
          <option value="schemePurples">Purples</option>
          <option value="schemeReds">Reds</option>
          <option value="schemeBuGn">BuGn</option>
          <option value="schemeBuPu">BuPu</option>
          <option value="schemeGnBu">GnBu</option>
          <option value="schemeOrRd">OrRd</option>
          <option value="schemePuBu">PuBu</option>
          <option value="schemePuBuGn">PuBuGn</option>
          <option value="schemePuRd">PuRd</option>
          <option value="schemeRdPu">RdPu</option>
          <option value="schemeYlGn">YlGn</option>
          <option value="schemeYlGnBu">YlGnBu</option>
          <option value="schemeYlOrBr">YlOrBr</option>
          <option value="schemeYlOrRd">YlOrRd</option>
        </select>
      </form>
      <form>
        <input
          type="range"
          min="1"
          max="9"
          value={overlap}
          step="1"
          onChange={handleChangeOverlap}
        />
        <output>&nbsp;{overlap} bands</output>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default RealtimeHorizonChart;
