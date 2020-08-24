import React from "react";

import { csvParseRows as d3csvParseRows } from "d3-dsv";
import {
  partition as d3partition,
  hierarchy as d3hierarchy,
} from "d3-hierarchy";
import { scaleOrdinal as d3scaleOrdinal } from "d3-scale";
import { arc as d3arc } from "d3-shape";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const breadcrumbWidth = 75;
const breadcrumbHeight = 30;

const width = 640;

const init = makeSvgInit({
  width: null,
  height: null,
});

function breadcrumbPoints(d, i) {
  const tipWidth = 10;
  const points = [];
  points.push("0,0");
  points.push(`${breadcrumbWidth},0`);
  points.push(`${breadcrumbWidth + tipWidth},${breadcrumbHeight / 2}`);
  points.push(`${breadcrumbWidth},${breadcrumbHeight}`);
  points.push(`0,${breadcrumbHeight}`);
  if (i > 0) {
    // Leftmost breadcrumb; don't include 6th vertex.
    points.push(`${tipWidth},${breadcrumbHeight / 2}`);
  }
  return points.join(" ");
}

function buildHierarchy(csv) {
  // Helper function that transforms the given CSV into a hierarchical format.
  const root = { name: "root", children: [] };
  for (let i = 0; i < csv.length; i++) {
    const sequence = csv[i][0];
    const size = +csv[i][1];
    if (isNaN(size)) {
      // e.g. if this is a header row
      continue;
    }
    const parts = sequence.split("-");
    let currentNode = root;
    for (let j = 0; j < parts.length; j++) {
      const children = currentNode["children"];
      const nodeName = parts[j];
      let childNode = null;
      if (j + 1 < parts.length) {
        // Not yet at the end of the sequence; move down the tree.
        let foundChild = false;
        for (let k = 0; k < children.length; k++) {
          if (children[k]["name"] === nodeName) {
            childNode = children[k];
            foundChild = true;
            break;
          }
        }
        // If we don't already have a child node for this branch, create it.
        if (!foundChild) {
          childNode = { name: nodeName, children: [] };
          children.push(childNode);
        }
        currentNode = childNode;
      } else {
        // Reached the end of the sequence; create a leaf node.
        childNode = { name: nodeName, value: size };
        children.push(childNode);
      }
    }
  }
  return root;
}

const computeSunburstParams = (csv) => {
  const radius = width / 2;

  const data = buildHierarchy(csv);

  const partition = (data) =>
    d3partition().size([2 * Math.PI, radius * radius])(
      d3hierarchy(data)
        .sum((d) => d.value)
        .sort((a, b) => b.value - a.value)
    );

  const color = d3scaleOrdinal()
    .domain(["home", "product", "search", "account", "other", "end"])
    .range(["#5d85cf", "#7c6561", "#da7847", "#6fb971", "#9e70cf", "#bbbbbb"]);

  const arc = d3arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .padAngle(1 / radius)
    .padRadius(radius)
    .innerRadius((d) => Math.sqrt(d.y0))
    .outerRadius((d) => Math.sqrt(d.y1) - 1);

  const mousearc = d3arc()
    .startAngle((d) => d.x0)
    .endAngle((d) => d.x1)
    .innerRadius((d) => Math.sqrt(d.y0))
    .outerRadius(radius);

  return { radius, data, partition, color, arc, mousearc };
};

const drawSunburst = (svg, params, setSunburst) => {
  const { radius, data, partition, color, arc, mousearc } = params;

  const root = partition(data);

  const element = svg.node();
  element.value = { sequence: [], percentage: 0.0 };
  setSunburst(element.value);

  const label = svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("fill", "#888")
    .style("visibility", "hidden");

  label
    .append("tspan")
    .attr("class", "percentage")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "-0.1em")
    .attr("font-size", "3em")
    .text("");

  label
    .append("tspan")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "1.5em")
    .text("of visits begin with this sequence");

  svg
    .attr("viewBox", `${-radius} ${-radius} ${width} ${width}`)
    .style("max-width", `${width}px`)
    .style("font", "12px sans-serif");

  const path = svg
    .append("g")
    .selectAll("path")
    .data(
      root.descendants().filter((d) => {
        // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
        return d.depth && d.x1 - d.x0 > 0.001;
      })
    )
    .join("path")
    .attr("fill", (d) => color(d.data.name))
    .attr("d", arc);

  svg
    .append("g")
    .attr("fill", "none")
    .attr("pointer-events", "all")
    .on("mouseleave", () => {
      path.attr("fill-opacity", 1);
      label.style("visibility", "hidden");
      // Update the value of this view
      element.value = { sequence: [], percentage: 0.0 };
      setSunburst(element.value);
      //element.dispatchEvent(new CustomEvent("input"));
    })
    .selectAll("path")
    .data(
      root.descendants().filter((d) => {
        // Don't draw the root node, and for efficiency, filter out nodes that would be too small to see
        return d.depth && d.x1 - d.x0 > 0.001;
      })
    )
    .join("path")
    .attr("d", mousearc)
    .on("mouseenter", (d) => {
      // Get the ancestors of the current segment, minus the root
      const sequence = d.ancestors().reverse().slice(1);
      // Highlight the ancestors
      path.attr("fill-opacity", (node) =>
        sequence.indexOf(node) >= 0 ? 1.0 : 0.3
      );
      const percentage = ((100 * d.value) / root.value).toPrecision(3);
      label
        .style("visibility", null)
        .select(".percentage")
        .text(percentage + "%");
      // Update the value of this view with the currently hovered sequence and percentage
      element.value = { sequence, percentage };
      setSunburst(element.value);
      //element.dispatchEvent(new CustomEvent("input"));
    });

  return element;
};

const drawBreadcrumb = (svg, params, setUpdateDraw) => {
  const { color } = params;

  svg
    .attr("viewBox", `0 0 ${breadcrumbWidth * 10} ${breadcrumbHeight}`)
    .style("font", "12px sans-serif")
    .style("margin", "5px");

  const text = svg.append("text");

  const updateBreadcrumb = (sunburst) => {
    const g = svg
      .selectAll("g")
      .data(sunburst.sequence)
      .join("g")
      .attr("transform", (d, i) => `translate(${i * breadcrumbWidth}, 0)`);

    g.append("polygon")
      .attr("points", breadcrumbPoints)
      .attr("fill", (d) => color(d.data.name))
      .attr("stroke", "white");

    g.append("text")
      .attr("x", (breadcrumbWidth + 10) / 2)
      .attr("y", 15)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("fill", "white")
      .text((d) => d.data.name);

    text
      .text(sunburst.percentage > 0 ? sunburst.percentage + "%" : "")
      .attr("x", (sunburst.sequence.length + 0.5) * breadcrumbWidth)
      .attr("y", breadcrumbHeight / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle");
  };

  setUpdateDraw(() => updateBreadcrumb);
};

const SequencesSunburst = (props) => {
  const [container0, svg0] = useSvg(init);
  const [container1, svg1] = useSvg(init);

  const [csv] = useDataFetchMemo("/data/visit-sequences@1.csv", (text) =>
    d3csvParseRows(text)
  );

  const params = React.useMemo(() => callIfReady(computeSunburstParams, csv), [
    csv,
  ]);

  const [sunburst, setSunburst] = React.useState(null);
  const [updateDraw, setUpdateDraw] = React.useState(null);

  React.useEffect(() => {
    callIfReady(drawSunburst, svg1, params, setSunburst);
  }, [svg1, params]);

  React.useEffect(() => {
    callIfReady(drawBreadcrumb, svg0, params, setUpdateDraw);
  }, [svg0, params]);

  React.useEffect(() => {
    if (updateDraw && sunburst) {
      updateDraw(sunburst);
    }
  }, [sunburst, updateDraw]);

  return (
    <React.Fragment>
      <div ref={container0}></div>
      <div ref={container1}></div>
    </React.Fragment>
  );
};

export default SequencesSunburst;
