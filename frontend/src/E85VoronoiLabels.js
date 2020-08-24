import React from "react";

import { extent as d3extent, max as d3max, range as d3range } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import { select as d3select } from "d3-selection";
import {
  polygonCentroid as d3polygonCentroid,
  polygonArea as d3polygonArea,
} from "d3-polygon";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { stack as d3stack, area as d3area } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import { randomNormal as d3randomNormal } from "d3-random";
import { Delaunay as d3Delaunay } from "d3-delaunay";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = () => {
  const randomX = d3randomNormal(width / 2, 80);
  const randomY = d3randomNormal(height / 2, 80);
  const data = d3range(200)
    .map(() => [randomX(), randomY()])
    .filter((d) => 0 <= d[0] && d[0] <= width && 0 <= d[1] && d[1] <= height);

  const orient = {
    top: (text) => text.attr("text-anchor", "middle").attr("y", -6),
    right: (text) =>
      text.attr("text-anchor", "start").attr("dy", "0.35em").attr("x", 6),
    bottom: (text) =>
      text.attr("text-anchor", "middle").attr("dy", "0.71em").attr("y", 6),
    left: (text) =>
      text.attr("text-anchor", "end").attr("dy", "0.35em").attr("x", -6),
  };

  const delaunay = d3Delaunay.from(data);
  const voronoi = delaunay.voronoi([-1, -1, width + 1, height + 1]);

  const cells = data.map((d, i) => [d, voronoi.cellPolygon(i)]);

  return { delaunay, orient, voronoi, cells };
};

const draw = (svg, params) => {
  const { delaunay, orient, voronoi, cells } = params;
  svg
    .append("g")
    .attr("stroke", "orange")
    .selectAll("path")
    .data(cells)
    .join("path")
    .attr("d", ([d, cell]) => `M${d3polygonCentroid(cell)}L${d}`);

  svg
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#ccc")
    .attr("d", voronoi.render());

  svg.append("path").attr("d", delaunay.renderPoints(null, 2));

  svg
    .append("g")
    .style("font", "10px sans-serif")
    .selectAll("text")
    .data(cells)
    .join("text")
    .each(function ([[x, y], cell]) {
      const [cx, cy] = d3polygonCentroid(cell);
      const angle =
        (Math.round((Math.atan2(cy - y, cx - x) / Math.PI) * 2) + 4) % 4;
      d3select(this).call(
        angle === 0
          ? orient.right
          : angle === 3
          ? orient.top
          : angle === 1
          ? orient.bottom
          : orient.left
      );
    })
    .attr("transform", ([d]) => `translate(${d})`)
    .attr("display", ([, cell]) =>
      -d3polygonArea(cell) > 2000 ? null : "none"
    )
    .text((d, i) => i);
};

const VoronoiLabels = (props) => {
  const [container, svg] = useSvg(init);

  const params = computeParams();

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default VoronoiLabels;
