import React from "react";

import { ascending as d3ascending, descending as d3descending } from "d3-array";
import { hierarchy as d3hierarchy, cluster as d3cluster } from "d3-hierarchy";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;

const init = makeSvgInit({
  width,
  height: null,
});

const computeParams = (data) => {
  const tree = (data) => {
    const root = d3hierarchy(data).sort(
      (a, b) =>
        d3descending(a.height, b.height) ||
        d3ascending(a.data.name, b.data.name)
    );
    root.dx = 10;
    root.dy = width / (root.height + 1);
    return d3cluster().nodeSize([root.dx, root.dy])(root);
  };

  const root = tree(data);

  return { root };
};

const draw = (svg, params) => {
  const { root } = params;

  svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#555")
    .attr("stroke-opacity", 0.4)
    .attr("stroke-width", 1.5)
    .selectAll("path")
    .data(root.links())
    .join("path")
    .attr(
      "d",
      (d) => `
        M${d.target.y},${d.target.x}
        C${d.source.y + root.dy / 2},${d.target.x}
         ${d.source.y + root.dy / 2},${d.source.x}
         ${d.source.y},${d.source.x}
      `
    );

  svg
    .append("g")
    .selectAll("circle")
    .data(root.descendants())
    .join("circle")
    .attr("cx", (d) => d.y)
    .attr("cy", (d) => d.x)
    .attr("fill", (d) => (d.children ? "#555" : "#999"))
    .attr("r", 2.5);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("stroke-linejoin", "round")
    .attr("stroke-width", 3)
    .selectAll("text")
    .data(root.descendants())
    .join("text")
    .attr("x", (d) => d.y)
    .attr("y", (d) => d.x)
    .attr("dy", "0.31em")
    .attr("dx", (d) => (d.children ? -6 : 6))
    .text((d) => d.data.name)
    .filter((d) => d.children)
    .attr("text-anchor", "end")
    .clone(true)
    .lower()
    .attr("stroke", "white");

  const { x, y, width, height } = svg.node().getBBox();
  svg.attr("viewBox", [x, y, width, height]);
};

const ClusterDendrogram = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ClusterDendrogram;
