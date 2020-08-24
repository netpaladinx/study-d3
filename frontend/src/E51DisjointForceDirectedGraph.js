import React from "react";

import {} from "d3-array";
import {} from "d3-axis";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { event as d3event } from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {} from "d3-hierarchy";
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
const height = 680;

const init = makeSvgInit({
  width,
  height,
  attrs: {
    viewBox: [-width / 2, -height / 2, width, height],
  },
});

const computeParams = (data) => {
  const scale = d3scaleOrdinal(d3schemeCategory10);
  const color = (d) => scale(d.group);

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

  const links = data.links.map((d) => Object.create(d));
  const nodes = data.nodes.map((d) => Object.create(d));

  const simulation = d3forceSimulation(nodes)
    .force(
      "link",
      d3forceLink(links).id((d) => d.id)
    )
    .force("charge", d3forceManyBody())
    .force("x", d3forceX())
    .force("y", d3forceY());

  return { color, links, nodes, simulation, drag };
};

const draw = (svg, params) => {
  const { color, links, nodes, simulation, drag } = params;

  const link = svg
    .append("g")
    .attr("stroke", "#999")
    .attr("stroke-opacity", 0.6)
    .selectAll("line")
    .data(links)
    .join("line")
    .attr("stroke-width", (d) => Math.sqrt(d.value));

  const node = svg
    .append("g")
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", 5)
    .attr("fill", color)
    .call(drag(simulation));

  node.append("title").text((d) => d.id);

  simulation.on("tick", () => {
    link
      .attr("x1", (d) => d.source.x)
      .attr("y1", (d) => d.source.y)
      .attr("x2", (d) => d.target.x)
      .attr("y2", (d) => d.target.y);

    node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
  });
};

const DisjointForceDirectedGraph = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/graph.json");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default DisjointForceDirectedGraph;
