import React from "react";

import { ascending as d3ascending, descending as d3descending } from "d3-array";
import { select as d3select } from "d3-selection";

import * as rwg from "random-words";

import { useSvg, makeSvgInit, callIfReady, sleep } from "./lib/d3-lib";

import "./occlusion.css";

const width = 954;
const height = 400;

const init = makeSvgInit({
  width,
  height,
});

function intersect(a, b) {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

function occlusion(svg) {
  const texts = [];
  svg.selectAll("text").each((d, i, e) => {
    const bbox = e[i].getBoundingClientRect();
    texts.push({
      priority: +e[i].getAttribute("data-priority"),
      node: e[i],
      text: d,
      bbox,
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    });
  });

  texts.sort((a, b) => d3descending(a.priority, b.priority));

  const filled = [];

  texts.forEach((d) => {
    const isOccluded = filled.some((e) => intersect(d, e));
    d3select(d.node).classed("occluded", isOccluded);
    if (!isOccluded) filled.push(d);
  });

  return filled;
}

const draw = async (svg) => {
  const n = 1000;
  svg
    .selectAll("text")
    .data(rwg(n).sort(d3ascending))
    .join("text")
    .text((d) => d)
    .attr("x", () => (width * Math.random()) | 0)
    .attr("y", () => (height * Math.random()) | 0);

  // change the priority on mouseover
  svg
    .selectAll("text")
    .on("mouseover", (d, i, e) => {
      e[i].setAttribute("data-priority", 2);
      occlusion(svg);
    })
    .on("mouseout", (d, i, e) => {
      e[i].setAttribute("data-priority", 0);
      occlusion(svg);
    });

  // maybe some changes are automatic
  do {
    const i = (Math.random() * n) | 0;
    svg
      .select(`text:nth-of-type(${i})`)
      .attr("data-priority", Math.random() * 2);

    occlusion(svg);

    await sleep(300);
  } while (true);
};

const Occlusion = (props) => {
  const [container, svg] = useSvg(init);

  React.useEffect(() => {
    callIfReady(draw, svg);
  }, [svg]);

  return <div ref={container}></div>;
};

export default Occlusion;
