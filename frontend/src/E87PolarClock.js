import React from "react";

import { scaleSequential as d3scaleSequential } from "d3-scale";
import { interpolateRainbow as d3interpolateRainbow } from "d3-scale-chromatic";
import { arc as d3arc } from "d3-shape";

import {
  timeYear as d3timeYear,
  timeMonth as d3timeMonth,
  timeWeek as d3timeWeek,
  timeDay as d3timeDay,
  timeHour as d3timeHour,
  timeMinute as d3timeMinute,
  timeSecond as d3timeSecond,
} from "d3-time";
import { timeFormat as d3timeFormat } from "d3-time-format";

import { useSvg, makeSvgInit, callIfReady } from "./lib/d3-lib";

const width = 954;
const height = width;
const radius = width / 1.67;
const armRadius = radius / 22;
const dotRadius = armRadius - 9;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = () => {
  const fields = [
    {
      radius: 0.2 * radius,
      interval: d3timeYear,
      subinterval: d3timeMonth,
      format: d3timeFormat("%b"),
    },
    {
      radius: 0.3 * radius,
      interval: d3timeMonth,
      subinterval: d3timeDay,
      format: d3timeFormat("%d"),
    },
    {
      radius: 0.4 * radius,
      interval: d3timeWeek,
      subinterval: d3timeDay,
      format: d3timeFormat("%a"),
    },
    {
      radius: 0.6 * radius,
      interval: d3timeDay,
      subinterval: d3timeHour,
      format: d3timeFormat("%H"),
    },
    {
      radius: 0.7 * radius,
      interval: d3timeHour,
      subinterval: d3timeMinute,
      format: d3timeFormat("%M"),
    },
    {
      radius: 0.8 * radius,
      interval: d3timeMinute,
      subinterval: d3timeSecond,
      format: d3timeFormat("%S"),
    },
  ];

  const color = d3scaleSequential(d3interpolateRainbow).domain([
    0,
    2 * Math.PI,
  ]);

  const arcArm = d3arc()
    .startAngle((d) => armRadius / d.radius)
    .endAngle((d) => -Math.PI - armRadius / d.radius)
    .innerRadius((d) => d.radius - armRadius)
    .outerRadius((d) => d.radius + armRadius)
    .cornerRadius(armRadius);

  return { fields, color, arcArm };
};

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

const draw = async (svg, params) => {
  const { fields, color, arcArm } = params;

  svg
    .attr("text-anchor", "middle")
    .style("display", "block")
    .style("font", "700 14px 'Helvetica Neue'");

  const field = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`)
    .selectAll("g")
    .data(fields)
    .enter()
    .append("g");

  field
    .append("circle")
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .attr("r", (d) => d.radius);

  const fieldTick = field
    .selectAll("g")
    .data((d) => {
      const date = d.interval(new Date(2000, 0, 1));
      d.range = d.subinterval.range(date, d.interval.offset(date, 1));
      return d.range.map((t) => ({ time: t, field: d }));
    })
    .enter()
    .append("g")
    .attr("class", "field-tick")
    .attr("transform", (d, i) => {
      const angle = (i / d.field.range.length) * 2 * Math.PI - Math.PI / 2;
      return `translate(${Math.cos(angle) * d.field.radius},${
        Math.sin(angle) * d.field.radius
      })`;
    });

  const fieldCircle = fieldTick
    .append("circle")
    .attr("r", dotRadius)
    .attr("fill", "white")
    .style("color", (d, i) => color((i / d.field.range.length) * 2 * Math.PI))
    .style("transition", "fill 750ms ease-out");

  fieldTick
    .append("text")
    .attr("dy", "0.35em")
    .attr("fill", "#222")
    .text((d) => d.field.format(d.time).slice(0, 2));

  const fieldFocus = field
    .append("circle")
    .attr("r", dotRadius)
    .attr("fill", "none")
    .attr("stroke", "#000")
    .attr("stroke-width", 3)
    .attr("cy", (d) => -d.radius)
    .style("transition", "transform 500ms ease");

  update(Math.floor((Date.now() + 1) / 1000) * 1000);

  while (true) {
    const then = Math.ceil((Date.now() + 1) / 1000) * 1000;
    await when(then, then);
    update(then);
  }

  function update(then) {
    for (const d of fields) {
      const start = d.interval(then);
      const index = d.subinterval.count(start, then);
      d.cycle = (d.cycle || 0) + (index < d.index);
      d.index = index;
    }
    fieldCircle.attr("fill", (d, i) =>
      i === d.field.index ? "currentColor" : "white"
    );
    fieldFocus.attr(
      "transform",
      (d) => `rotate(${(d.index / d.range.length + d.cycle) * 360})`
    );
  }
};

const PolarClock = (props) => {
  const [container, svg] = useSvg(init);

  const params = computeParams();

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default PolarClock;
