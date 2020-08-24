import React from "react";

import { linkVertical as d3linkVertical } from "d3-shape";
import { hierarchy as d3hierarchy, tree as d3tree } from "d3-hierarchy";

import { useSvg, makeSvgInit } from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = 20;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = () => {
  let root = { value: [0, 1] };
  const queue = [root];
  let p;
  let size = 0;
  let n = 1 << 6;
  while (++size < n && (p = queue.shift())) {
    const k = p.value.length - 1;
    const a = { value: p.value.slice(0, k).concat(p.value[k] + 1) };
    const b = { value: p.value.slice(0, k).concat(p.value[k] - 1, 2) };
    p.children = k & 1 ? [a, b] : [b, a];
    queue.push(a, b);
  }
  const data = root;

  function collapse(f) {
    let n = 1,
      d = 0,
      i = f.length;
    while (--i >= 0) [n, d] = [f[i] * n + d, n];
    return [n, d];
  }

  const tree = (data) =>
    d3tree()
      .size([width, height - margin * 2])
      .separation(() => 1)(d3hierarchy(data));

  root = tree(data);

  return { collapse, root };
};

const draw = (svg, params) => {
  const { collapse, root } = params;

  svg
    .attr("viewBox", `0 ${-margin} ${width} ${height}`)
    .style("width", "100%")
    .style("height", "auto")
    .style("font", "10px sans-serif");

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .selectAll("path")
    .data(root.links())
    .enter()
    .append("path")
    .attr(
      "d",
      d3linkVertical()
        .source((d) => [d.source.x, d.source.y + 12])
        .target((d) => [d.target.x, d.target.y - 12])
    );

  const label = svg
    .append("g")
    .attr("text-anchor", "middle")
    .selectAll("g")
    .data(root.descendants())
    .enter()
    .append("g")
    .attr(
      "transform",
      (d) => `translate(${Math.round(d.x)},${Math.round(d.y)})`
    );

  label.append("line").attr("x1", -5).attr("x2", 5).attr("stroke", "black");

  label
    .append("text")
    .datum((d) => collapse(d.data.value))
    .call((t) =>
      t
        .append("tspan")
        .attr("y", -2.5)
        .text((d) => d[0])
    )
    .call((t) =>
      t
        .append("tspan")
        .attr("x", 0)
        .attr("y", 9.5)
        .text((d) => d[1])
    );
};

const SternBrocotTree = (props) => {
  const [container, svg] = useSvg(init);

  const params = computeParams();

  React.useEffect(() => {
    if (svg) {
      draw(svg, params);
    }
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default SternBrocotTree;
