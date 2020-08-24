import React from "react";

import {} from "d3-array";
import {} from "d3-axis";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import {} from "d3-selection";
import { format as d3format } from "d3-format";
import {} from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import {
  sankey as d3sankey,
  sankeyLeft as d3sankeyLeft,
  sankeyRight as d3sankeyRight,
  sankeyCenter as d3sankeyCenter,
  sankeyJustify as d3sankeyJustify,
  sankeyLinkHorizontal as d3sankeyLinkHorizontal,
} from "d3-sankey";

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

const sankeyAligns = [
  d3sankeyLeft,
  d3sankeyRight,
  d3sankeyCenter,
  d3sankeyJustify,
];
const edgeColors = ["input", "output", "path", "none"];

const computeParams = (links) => {
  const nodes = Array.from(
    new Set(links.flatMap((l) => [l.source, l.target])),
    (name) => ({ name, category: name.replace(/ .*/, "") })
  );
  const data = { nodes, links, units: "TWh" };

  const color0 = d3scaleOrdinal(d3schemeCategory10);
  const color = (d) => color0(d.category === undefined ? d.name : d.category);

  const format0 = d3format(",.0f");
  const format = data.units ? (d) => `${format0(d)} ${data.units}` : format0;

  const sankey0 = (sankeyAlign) =>
    d3sankey()
      .nodeId((d) => d.name)
      .nodeAlign(sankeyAlign)
      .nodeWidth(15)
      .nodePadding(10)
      .extent([
        [1, 5],
        [width - 1, height - 5],
      ]);
  const sankey = (sankeyAlign, { nodes, links }) =>
    sankey0(sankeyAlign)({
      nodes: nodes.map((d) => Object.assign({}, d)),
      links: links.map((d) => Object.assign({}, d)),
    });

  return { data, sankey, color, format };
};

const draw = (svg, params, sankeyAlign, edgeColor) => {
  svg.clear();

  const { data, sankey, color, format } = params;

  const { nodes, links } = sankey(sankeyAlign, data);

  svg
    .append("g")
    .attr("stroke", "#000")
    .selectAll("rect")
    .data(nodes)
    .join("rect")
    .attr("x", (d) => d.x0)
    .attr("y", (d) => d.y0)
    .attr("height", (d) => d.y1 - d.y0)
    .attr("width", (d) => d.x1 - d.x0)
    .attr("fill", color)
    .append("title")
    .text((d) => `${d.name}\n${format(d.value)}`);

  const link = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-opacity", 0.5)
    .selectAll("g")
    .data(links)
    .join("g")
    .style("mix-blend-mode", "multiply");

  if (edgeColor === "path") {
    const gradient = link
      .append("linearGradient")
      .attr("id", (d, i) => (d.id = `link-${i}`))
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", (d) => d.source.x1)
      .attr("x2", (d) => d.target.x0);

    gradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", (d) => color(d.source));

    gradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", (d) => color(d.target));
  }

  link
    .append("path")
    .attr("d", d3sankeyLinkHorizontal())
    .attr("stroke", (d) =>
      edgeColor === "none"
        ? "#aaa"
        : edgeColor === "path"
        ? `url(#${d.id})`
        : edgeColor === "input"
        ? color(d.source)
        : color(d.target)
    )
    .attr("stroke-width", (d) => Math.max(1, d.width));

  link
    .append("title")
    .text((d) => `${d.source.name} → ${d.target.name}\n${format(d.value)}`);

  svg
    .append("g")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .selectAll("text")
    .data(nodes)
    .join("text")
    .attr("x", (d) => (d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6))
    .attr("y", (d) => (d.y1 + d.y0) / 2)
    .attr("dy", "0.35em")
    .attr("text-anchor", (d) => (d.x0 < width / 2 ? "start" : "end"))
    .text((d) => d.name);
};

const SankeyDiagram = (props) => {
  const [colorBy, setColorBy] = React.useState(2);
  const [aligned, setAligned] = React.useState(3);

  const handleChangeColorBy = (event) => {
    setColorBy(event.target.value);
  };

  const handleChangeAligned = (event) => {
    setAligned(event.target.value);
  };

  const [container, svg] = useSvg(init);

  const [links] = useDataFetchMemo("/data/energy.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, links), [
    links,
  ]);

  React.useEffect(() => {
    if (svg && params) {
      const sankeyAlign = sankeyAligns[aligned];
      const edgeColor = edgeColors[colorBy];

      draw(svg, params, sankeyAlign, edgeColor);
    }
  }, [svg, params, aligned, colorBy]);

  return (
    <React.Fragment>
      <form>
        <select value={colorBy} onChange={handleChangeColorBy}>
          <option value={0}>Color by input</option>
          <option value={1}>Color by output</option>
          <option value={2}>Color by input-output</option>
          <option value={3}>No color</option>
        </select>
      </form>
      <form>
        <select value={aligned} onChange={handleChangeAligned}>
          <option value={0}>Left-aligned</option>
          <option value={1}>Right-aligned</option>
          <option value={2}>Centered</option>
          <option value={3}>Justified</option>
        </select>
      </form>
      <div ref={container}></div>
    </React.Fragment>
  );
};

export default SankeyDiagram;
