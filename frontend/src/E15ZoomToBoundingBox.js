import React from "react";
import * as topojson from "topojson-client";

import { geoPath as d3geoPath } from "d3-geo";
import {
  zoom as d3zoom,
  zoomIdentity as d3zoomIdentity,
  zoomTransform as d3zoomTransform,
} from "d3-zoom";
import { event as d3event, mouse as d3mouse } from "d3-selection";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 975;
const height = 610;
const path = d3geoPath();

const init = makeSvgInit({
  width,
  height,
});

const draw = (svg, data) => {
  function zoomed() {
    const { transform } = d3event;
    g.attr("transform", transform);
    g.attr("stroke-width", 1 / transform.k);
  }

  const zoom = d3zoom().scaleExtent([1, 8]).on("zoom", zoomed);

  function reset() {
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3zoomIdentity,
        d3zoomTransform(svg.node()).invert([width / 2, height / 2])
      );
  }

  svg.on("click", reset);

  const g = svg.append("g");

  function clicked(d) {
    const [[x0, y0], [x1, y1]] = path.bounds(d);
    d3event.stopPropagation();
    svg
      .transition()
      .duration(750)
      .call(
        zoom.transform,
        d3zoomIdentity
          .translate(width / 2, height / 2)
          .scale(
            Math.min(8, 0.9 / Math.max((x1 - x0) / width, (y1 - y0) / height))
          )
          .translate(-(x0 + x1) / 2, -(y0 + y1) / 2),
        d3mouse(svg.node())
      );
  }

  g.append("g")
    .attr("fill", "#444")
    .attr("cursor", "pointer")
    .selectAll("path")
    .data(topojson.feature(data, data.objects.states).features)
    .join("path")
    .on("click", clicked)
    .attr("d", path)
    .append("title")
    .text((d) => d.properties.name);

  g.append("path")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr(
      "d",
      path(topojson.mesh(data, data.objects.states, (a, b) => a !== b))
    );

  svg.call(zoom);
};

const ZoomToBoundingBox = (props) => {
  const [container, svg] = useSvg(init);

  const [us] = useDataFetch("/data/states-albers-10m.json");

  React.useEffect(() => {
    if (svg && !us.isLoading && !us.isError && us.data) {
      draw(svg, us.data);
    }
  }, [svg, us]);

  return <div ref={container}></div>;
};

export default ZoomToBoundingBox;
