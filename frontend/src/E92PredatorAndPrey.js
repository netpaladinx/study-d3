import React from "react";

import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { interpolateReds as d3interpolateReds } from "d3-scale-chromatic";
import { rgb as d3rgb } from "d3-color";

import {
  useSvg,
  makeSvgInit,
  useCanvas,
  makeCanvasInit,
  sleep,
} from "./lib/d3-lib";

const width = 954;
const size = Math.min(640, width);
const margin = { top: 20, right: 30, bottom: 30, left: 40 };

const svgInit = makeSvgInit({
  width: size,
  height: size,
});

const canvasInit = makeCanvasInit({
  width: size,
  height: size,
});

const draw = async (svg, context, alpha, beta, gamma, delta) => {
  svg.clear();
  context.clear();

  const x = d3scaleLinear()
    .domain([0, 3])
    .range([margin.left, size - margin.right]);
  const y = d3scaleLinear()
    .domain([0, 3])
    .range([size - margin.bottom, margin.top]);
  const z = d3scaleSequential(d3interpolateReds).domain([0, 20]);

  svg.style("position", "relative");
  context.lineWidth = 0.5;
  context.globalAlpha = 0.5;

  svg
    .append("g")
    .attr("transform", `translate(0,${size - margin.bottom})`)
    .call(d3axisBottom(x).ticks(5))
    .call((g) =>
      g
        .select(".tick:last-of-type text")
        .clone()
        .style("font-size", "24px")
        .attr("y", -6)
        .attr("dy", null)
        .text("🐁")
    );

  svg
    .append("g")
    .attr("transform", `translate(${margin.left},0)`)
    .call(d3axisLeft(y))
    .call((g) =>
      g
        .select(".tick:last-of-type text")
        .clone()
        .style("font-size", "24px")
        .attr("text-anchor", "start")
        .attr("x", 6)
        .text("🐈")
    );

  for (let k = 0; k < 2e5; ++k) {
    let x0 = Math.random() * 5,
      x1,
      dx;
    let y0 = Math.random() * 5,
      y1,
      dy;
    context.beginPath();
    context.moveTo(x(x0), y(y0));
    for (
      let t = 0;
      t < 8;
      t += Math.max(0.01, Math.min(2, Math.sqrt(dx ** 2 + dy ** 2)))
    ) {
      dx = alpha * x0 - beta * x0 * y0;
      dy = gamma * x0 * y0 - delta * y0;
      x1 = x0 + dx / 40;
      y1 = y0 + dy / 40;
      context.lineTo(x(x1), y(y1));
      x0 = x1;
      y0 = y1;
    }
    context.strokeStyle = d3rgb(z((dx / x0) ** 2 + (dy / y0) ** 2)).darker(
      Math.random() * 2
    );
    context.stroke();
    if (k % 1024 === 0) await sleep(10);
  }
};

const PredatorAndPrey = (props) => {
  const [alpha, setAlpha] = React.useState("0.6667");
  const [beta, setBeta] = React.useState("1.3333");
  const [gamma, setGamma] = React.useState("1");
  const [delta, setDelta] = React.useState("1");

  const handleChangeAlpha = (event) => {
    setAlpha(event.target.value);
  };

  const handleChangeBeta = (event) => {
    setBeta(event.target.value);
  };

  const handleChangeGamma = (event) => {
    setGamma(event.target.value);
  };

  const handleChangeDelta = (event) => {
    setDelta(event.target.value);
  };

  const [svgContainer, svg] = useSvg(svgInit);
  const [canvasContainer, context] = useCanvas(canvasInit);

  React.useEffect(() => {
    if (svg && context) {
      draw(svg, context, alpha, beta, gamma, delta);
    }
  }, [svg, context, alpha, beta, gamma, delta]);

  return (
    <React.Fragment>
      <form>
        <label>
          alpha:{" "}
          <input
            type="range"
            min="0"
            max="2"
            value={alpha}
            onChange={handleChangeAlpha}
            step="any"
          />
        </label>
      </form>
      <form>
        <label>
          beta:
          <input
            type="range"
            min="0"
            max="2"
            value={beta}
            onChange={handleChangeBeta}
            step="any"
          />
        </label>
      </form>
      <form>
        <label>
          gamma:
          <input
            type="range"
            min="0"
            max="2"
            value={gamma}
            onChange={handleChangeGamma}
            step="any"
          />
        </label>
      </form>{" "}
      <form>
        <label>
          delta:
          <input
            type="range"
            min="0"
            max="2"
            value={delta}
            onChange={handleChangeDelta}
            step="any"
          />
        </label>
      </form>
      <div ref={svgContainer} style={{ position: "absolute" }}></div>
      <div ref={canvasContainer}></div>
    </React.Fragment>
  );
};

export default PredatorAndPrey;
