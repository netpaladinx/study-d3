import React from "react";

import { pack as d3pack, hierarchy as d3hierarchy } from "d3-hierarchy";
import { scaleLinear as d3scaleLinear } from "d3-scale";
import {
  interpolateZoom as d3interpolateZoom,
  interpolateHcl as d3interpolateHcl,
} from "d3-interpolate";
import { select as d3select, event as d3event } from "d3-selection";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 932;
const height = 932;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: `-${width / 2} -${height / 2} ${width} ${height}`,
  },
});

const compute = (data) => {
  const color = d3scaleLinear()
    .domain([0, 5])
    .range(["hsl(152,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3interpolateHcl);

  const pack = (data) =>
    d3pack().size([width, height]).padding(3)(
      d3hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );

  return { data, color, pack };
};

const draw = (svg, params) => {
  const { data, color, pack } = params;

  const root = pack(data);
  let focus = root;
  let view;

  svg
    .style("display", "block")
    .style("margin", "0 -14px")
    .style("background", color(0))
    .style("cursor", "pointer")
    .on("click", () => zoom(root));

  const node = svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants().slice(1))
    .join("circle")
    .attr("fill", (d) => (d.children ? color(d.depth) : "white"))
    .attr("pointer-events", (d) => (!d.children ? "none" : null))
    .on("mouseover", function () {
      d3select(this).attr("stroke", "#000");
    })
    .on("mouseout", function () {
      d3select(this).attr("stroke", null);
    })
    .on("click", (d) => focus !== d && (zoom(d), d3event.stopPropagation()));

  const label = svg
    .append("g")
    .style("font", "10px sans-serif")
    .attr("pointer-events", "none")
    .attr("text-anchor", "middle")
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .style("fill-opacity", (d) => (d.parent === root ? 1 : 0))
    .style("display", (d) => (d.parent === root ? "inline" : "none"))
    .text((d) => d.data.name);

  zoomTo([root.x, root.y, root.r * 2]);

  function zoomTo(v) {
    const k = width / v[2];
    view = v;
    label.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr(
      "transform",
      (d) => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`
    );
    node.attr("r", (d) => d.r * k);
  }

  function zoom(d) {
    focus = d;
    const transition = svg
      .transition()
      .duration(d3event.altKey ? 7500 : 750)
      .tween("zoom", (d) => {
        const i = d3interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
        return (t) => zoomTo(i(t));
      });
    label
      .filter(function (d) {
        return d.parent === focus || this.style.display === "inline";
      })
      .transition(transition)
      .style("fill-opacity", (d) => (d.parent === focus ? 1 : 0))
      .on("start", function (d) {
        if (d.parent === focus) this.style.display = "inline";
      })
      .on("end", function (d) {
        if (d.parent !== focus) this.style.display = "none";
      });
  }
};

const ZoomableCirclePacking = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(compute, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ZoomableCirclePacking;
