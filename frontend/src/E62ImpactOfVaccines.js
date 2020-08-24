import React from "react";

import { min as d3min, max as d3max, range as d3range } from "d3-array";
import {
  axisTop as d3axisTop,
  axisBottom as d3axisBottom,
  axisLeft as d3axisLeft,
} from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleBand as d3scaleBand,
  scaleSequentialSqrt as d3scaleSequentialSqrt,
} from "d3-scale";
import { format as d3format } from "d3-format";
import { interpolatePuRd as d3interpolatePuRd } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 16;
const margin = { top: 20, right: 1, bottom: 40, left: 40 };

const init = makeSvgInit({
  width: null,
  height: null,
});

const computeParams = (source) => {
  const names = [
    "Alaska",
    "Ala.",
    "Ark.",
    "Ariz.",
    "Calif.",
    "Colo.",
    "Conn.",
    "D.C.",
    "Del.",
    "Fla.",
    "Ga.",
    "Hawaii",
    "Iowa",
    "Idaho",
    "Ill.",
    "Ind.",
    "Kan.",
    "Ky.",
    "La.",
    "Mass.",
    "Md.",
    "Maine",
    "Mich.",
    "Minn.",
    "Mo.",
    "Miss.",
    "Mont.",
    "N.C.",
    "N.D.",
    "Neb.",
    "N.H.",
    "N.J.",
    "N.M",
    "Nev.",
    "N.Y.",
    "Ohio",
    "Okla.",
    "Ore.",
    "Pa.",
    "R.I.",
    "S.C.",
    "S.D.",
    "Tenn.",
    "Texas",
    "Utah",
    "Va.",
    "Vt.",
    "Wash.",
    "Wis.",
    "W.Va.",
    "Wyo.",
  ];
  const values = [];
  const year0 = d3min(source[0].data.values.data, (d) => d[0]);
  const year1 = d3max(source[0].data.values.data, (d) => d[0]);
  const years = d3range(year0, year1 + 1);
  for (const [year, i, value] of source[0].data.values.data) {
    if (value == null) continue;
    (values[i] || (values[i] = []))[year - year0] = value;
  }
  const data = {
    values,
    names,
    years,
    year: source[0].data.chart_options.vaccine_year,
  };

  const innerHeight = height * data.names.length;

  const x = d3scaleLinear()
    .domain([d3min(data.years), d3max(data.years) + 1])
    .rangeRound([margin.left, width - margin.right]);

  const y = d3scaleBand()
    .domain(data.names)
    .rangeRound([margin.top, margin.top + innerHeight]);

  const color = d3scaleSequentialSqrt(
    [0, d3max(data.values, (d) => d3max(d))],
    d3interpolatePuRd
  );

  const xAxis = (g) =>
    g
      .call((g) =>
        g
          .append("g")
          .attr("transform", `translate(0,${margin.top})`)
          .call(d3axisTop(x).ticks(null, "d"))
          .call((g) => g.select(".domain").remove())
      )
      .call((g) =>
        g
          .append("g")
          .attr("transform", `translate(0,${innerHeight + margin.top + 4})`)
          .call(
            d3axisBottom(x)
              .tickValues([data.year])
              .tickFormat((x) => x)
              .tickSize(-innerHeight - 10)
          )
          .call((g) =>
            g
              .select(".tick text")
              .clone()
              .attr("dy", "2em")
              .style("font-weight", "bold")
              .text("Measles vaccine introduced")
          )
          .call((g) => g.select(".domain").remove())
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).tickSize(0))
      .call((g) => g.select(".domain").remove());

  const f = d3format(",d");
  const format = (d) =>
    isNaN(d)
      ? "N/A cases"
      : d === 0
      ? "0 cases"
      : d < 1
      ? "<1 case"
      : d < 1.5
      ? "1 case"
      : `${f(d)} cases`;

  return { data, innerHeight, color, format, x, y, xAxis, yAxis };
};

const draw = (svg, params) => {
  const { data, innerHeight, color, format, x, y, xAxis, yAxis } = params;

  svg
    .attr("viewBox", [0, 0, width, innerHeight + margin.top + margin.bottom])
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  svg
    .append("g")
    .selectAll("g")
    .data(data.values)
    .join("g")
    .attr("transform", (d, i) => `translate(0,${y(data.names[i])})`)
    .selectAll("rect")
    .data((d) => d)
    .join("rect")
    .attr("x", (d, i) => x(data.years[i]) + 1)
    .attr("width", (d, i) => x(data.years[i] + 1) - x(data.years[i]) - 1)
    .attr("height", y.bandwidth() - 1)
    .attr("fill", (d) => (isNaN(d) ? "#eee" : d === 0 ? "#fff" : color(d)))
    .append("title")
    .text((d, i) => `${format(d)} per 100,000 people in ${data.years[i]}`);
};

const ImpactOfVaccines = (props) => {
  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/vaccines.json");

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default ImpactOfVaccines;
