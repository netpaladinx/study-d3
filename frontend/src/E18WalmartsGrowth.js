import React from "react";
import * as topojson from "topojson-client";

import { timeParse as d3timeParse } from "d3-time-format";
import { timeDay as d3timeDay } from "d3-time";
import { geoAlbersUsa as d3geoAlbersUsa, geoPath as d3geoPath } from "d3-geo";
import { scaleTime as d3scaleTime } from "d3-scale";
import { timeout as d3timeout } from "d3-timer";
import { easeLinear as d3easeLinear } from "d3-ease";
import { interpolateDate as d3interpolateDate } from "d3-interpolate";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 960;
const height = 600;

const init = makeSvgInit({
  width,
  height,
});

const computeData = (us, wData) => {
  us.objects.lower48 = {
    type: "GeometryCollection",
    geometries: us.objects.states.geometries.filter(
      (d) => d.id !== "02" && d.id !== "15"
    ),
  };

  const parseDate = d3timeParse("%m/%d/%Y");
  const projection = d3geoAlbersUsa().scale(1280).translate([480, 300]);

  const walmartData = wData.map((d) => {
    const p = projection(d);
    p.date = parseDate(d.date);
    return p;
  });
  walmartData.sort((a, b) => a.date - b.date);
  return { us, walmartData };
};

const draw = (svg, data) => {
  const { us, walmartData } = data;

  const path = d3geoPath();
  const delay = d3scaleTime()
    .domain([walmartData[0].date, walmartData[walmartData.length - 1].date])
    .range([0, 20000]);

  svg
    .append("path")
    .datum(topojson.merge(us, us.objects.lower48.geometries))
    .attr("fill", "#ddd")
    .attr("d", path);

  svg
    .append("path")
    .datum(topojson.mesh(us, us.objects.lower48, (a, b) => a !== b))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-linejoin", "round")
    .attr("d", path);

  const g = svg.append("g").attr("fill", "red").attr("stroke", "black");

  svg
    .append("circle")
    .attr("fill", "blue")
    .attr("transform", `translate(${walmartData[0]})`)
    .attr("r", 3);

  for (const d of walmartData) {
    d3timeout(() => {
      g.append("circle")
        .attr("transform", `translate(${d})`)
        .attr("r", 3)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 0)
        .transition()
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 1);
    }, delay(d.date));
  }

  svg
    .transition()
    .ease(d3easeLinear)
    .duration(delay.range()[1])
    .tween("date", () => {
      const i = d3interpolateDate(...delay.domain());
      return (t) => d3timeDay(i(t));
    });
};

const E18WalmartsGrowth = (props) => {
  const [container, svg] = useSvg(init);

  const [usResult] = useDataFetch("https://unpkg.com/us-atlas@1/us/10m.json");
  const [walmartDataResult] = useDataFetch(
    "https://gist.githubusercontent.com/mbostock/4330486/raw/fe47cd0f43281cae3283a5b397f8f0118262bf55/walmart.tsv"
  );

  const data = React.useMemo(() => {
    if (
      !usResult.isLoading &&
      !usResult.isError &&
      usResult.data &&
      !walmartDataResult.isLoading &&
      !walmartDataResult.isError &&
      walmartDataResult.data
    ) {
      return computeData(usResult.data, walmartDataResult.data);
    } else {
      return null;
    }
  }, [usResult, walmartDataResult]);

  React.useEffect(() => {
    if (data) {
      draw(svg, data);
    }
  }, [svg, data]);

  return <div ref={container}></div>;
};

export default E18WalmartsGrowth;
