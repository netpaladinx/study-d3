import React from "react";

import { event as d3event } from "d3-selection";
import { hierarchy as d3hierarchy } from "d3-hierarchy";
import {
  forceSimulation as d3forceSimulation,
  forceLink as d3forceLink,
  forceManyBody as d3forceManyBody,
  forceX as d3forceX,
  forceY as d3forceY,
} from "d3-force";
import { drag as d3drag } from "d3-drag";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {
  const drag = (simulation) => {
    function dragstarted(d) {
      if (!d3event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(d) {
      d.fx = d3event.x;
      d.fy = d3event.y;
    }

    function dragended(d) {
      if (!d3event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return d3drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  };

  const root = d3hierarchy(data);
  const links = root.links();
  const nodes = root.descendants();

  const simulation = d3forceSimulation(nodes)
    .force(
      "link",
      d3forceLink(links)
        .id((d) => d.id)
        .distance(0)
        .strength(1)
    )
    .force("charge", d3forceManyBody().strength(-50))
    .force("x", d3forceX())
    .force("y", d3forceY());

  return { drag, links, nodes, simulation };
};

const draw = (svg, params) => {
  const { drag, links, nodes, simulation } = params;

  svg.attr("viewBox", [-width / 2, -height / 2, width, height]);

  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg
    .append("g")
    .attr("fill", "#fff")
    .attr("stroke", "#000")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("fill", (d) => (d.children ? null : "#000"))
    .attr("stroke", (d) => (d.children ? null : "#fff"))
    .attr("r", 3.5)
    .call(drag(simulation));

  node.append("title").text((d) => d.data.name);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });
};

const ForceDirectedTree = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/flare-2.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ForceDirectedTree;
