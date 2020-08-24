// https://observablehq.com/@d3/bar-chart-race

import React from "react";

import {
  scaleLinear as d3scaleLinear,
  scaleBand as d3scaleBand,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import {
  range as d3range,
  rollup as d3rollup,
  ascending as d3ascending,
  pairs as d3pairs,
  descending as d3descending,
  groups as d3groups,
} from "d3-array";
import { utcFormat as d3utcFormat } from "d3-time-format";
import { format as d3format } from "d3-format";
import { axisTop as d3axisTop } from "d3-axis";
import { interpolateNumber as d3interpolateNumber } from "d3-interpolate";
import { easeLinear as d3easeLinear } from "d3-ease";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import { useSvg, makeSvgInit, useDataFetch } from "./lib/d3-lib";

const width = 600;
const margin = { top: 16, right: 6, bottom: 6, left: 0 };
const barSize = 50;
const n = 12;
const duration = 250;
const height = margin.top + barSize * n + margin.bottom;

const formatDate = d3utcFormat("%Y");
const formatNumber = d3format(",d");

const init = makeSvgInit({
  width,
  height,
});

const computeIntermediateData = (dataInput) => {
  const names = new Set(dataInput.map((d) => d.name));

  const dateValues = Array.from(
    d3rollup(
      dataInput,
      ([d]) => d.value,
      (d) => +d.date,
      (d) => d.name
    )
  )
    .map(([date, data]) => [new Date(date), data])
    .sort(([a], [b]) => d3ascending(a, b));

  const rank = (value) => {
    const data = Array.from(names, (name) => ({ name, value: value(name) }));
    data.sort((a, b) => d3descending(a.value, b.value));
    for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i);
    return data;
  };

  const keyframes = [];
  const k = 10;
  let ka, a, kb, b;

  for ([[ka, a], [kb, b]] of d3pairs(dateValues)) {
    for (let i = 0; i < k; ++i) {
      const t = i / k;
      keyframes.push([
        new Date(ka * (1 - t) + kb * t),
        rank((name) => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t),
      ]);
    }
  }
  keyframes.push([new Date(kb), rank((name) => b.get(name) || 0)]);

  const nameframes = d3groups(
    keyframes.flatMap(([, data]) => data),
    (d) => d.name
  );

  const prev = new Map(
    nameframes.flatMap(([, data]) => d3pairs(data, (a, b) => [b, a]))
  );

  const next = new Map(nameframes.flatMap(([, data]) => d3pairs(data)));

  return { keyframes, prev, next };
};

const computeLayout = () => {
  const x = d3scaleLinear([0, 1], [margin.left, width - margin.right]);
  const y = d3scaleBand()
    .domain(d3range(n + 1))
    .rangeRound([margin.top, margin.top + barSize * (n + 1 + 0.1)])
    .padding(0.1);
  return { x, y };
};

const computeStyle = (data) => {
  const scale = d3scaleOrdinal(d3schemeCategory10);
  if (data.some((d) => d.category !== undefined)) {
    const categoryByName = new Map(data.map((d) => [d.name, d.category]));
    scale.domain(Array.from(categoryByName.values()));
    return { color: (d) => scale(categoryByName.get(d.name)) };
  }
  return { color: (d) => scale(d.name) };
};

const drawTicker = (svg, data2) => {
  const { keyframes } = data2;
  const now = svg
    .append("text")
    .style("font", `bold ${barSize}px var(--sans-serif)`)
    .style("font-variant-numeric", "tabular-nums")
    .attr("text-anchor", "end")
    .attr("x", width - 6)
    .attr("y", margin.top + barSize * (n - 0.45))
    .attr("dy", "0.32em")
    .text(formatDate(keyframes[0][0]));

  return ([date], transition) => {
    transition.end().then(() => now.text(formatDate(date)));
  };
};

const drawAxis = (svg, layout) => {
  const { x, y } = layout;

  const g = svg.append("g").attr("transform", `translate(0,${margin.top})`);

  const axis = d3axisTop(x)
    .ticks(width / 160)
    .tickSizeOuter(0)
    .tickSizeInner(-barSize * (n + y.padding()));

  return (_, transition) => {
    g.transition(transition).call(axis);
    g.select(".tick:first-of-type text").remove();
    g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "white");
    g.select(".domain").remove();
  };
};

const drawLabels = (svg, data2, layout) => {
  const { x, y } = layout;
  const { prev, next } = data2;

  let label = svg
    .append("g")
    .style("font", "bold 12px var(--sans-serif)")
    .style("font-variant-numeric", "tabular-nums")
    .attr("text-anchor", "end")
    .selectAll("text");

  const textTween = (a, b) => {
    const i = d3interpolateNumber(a, b);
    return function (t) {
      this.textContent = formatNumber(i(t));
    };
  };

  return ([date, data], transition) =>
    (label = label
      .data(data.slice(0, n), (d) => d.name)
      .join(
        (enter) =>
          enter
            .append("text")
            .attr(
              "transform",
              (d) =>
                `translate(${x((prev.get(d) || d).value)},${y(
                  (prev.get(d) || d).rank
                )})`
            )
            .attr("y", y.bandwidth() / 2)
            .attr("x", -6)
            .attr("dy", "-0.25em")
            .text((d) => d.name)
            .call((text) =>
              text
                .append("tspan")
                .attr("fill-opacity", 0.7)
                .attr("font-weight", "normal")
                .attr("x", -6)
                .attr("dy", "1.15em")
            ),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr(
              "transform",
              (d) =>
                `translate(${x((next.get(d) || d).value)},${y(
                  (next.get(d) || d).rank
                )})`
            )
            .call((g) =>
              g
                .select("tspan")
                .tween("text", (d) =>
                  textTween(d.value, (next.get(d) || d).value)
                )
            )
      )
      .call((bar) =>
        bar
          .transition(transition)
          .attr("transform", (d) => `translate(${x(d.value)},${y(d.rank)})`)
          .call((g) =>
            g
              .select("tspan")
              .tween("text", (d) =>
                textTween((prev.get(d) || d).value, d.value)
              )
          )
      ));
};

const drawBars = (svg, data2, layout, style) => {
  const { prev, next } = data2;
  const { x, y } = layout;
  const { color } = style;
  let bar = svg.append("g").attr("fill-opacity", 0.6).selectAll("rect");

  return ([date, data], transition) =>
    (bar = bar
      .data(data.slice(0, n), (d) => d.name)
      .join(
        (enter) =>
          enter
            .append("rect")
            .attr("fill", color)
            .attr("height", y.bandwidth())
            .attr("x", x(0))
            .attr("y", (d) => y((prev.get(d) || d).rank))
            .attr("width", (d) => x((prev.get(d) || d).value) - x(0)),
        (update) => update,
        (exit) =>
          exit
            .transition(transition)
            .remove()
            .attr("y", (d) => y((next.get(d) || d).rank))
            .attr("width", (d) => x((next.get(d) || d).value) - x(0))
      )
      .call((bar) =>
        bar
          .transition(transition)
          .attr("y", (d) => y(d.rank))
          .attr("width", (d) => x(d.value) - x(0))
      ));
};

const draw = async (svg, data2, layout, style) => {
  const updateBars = drawBars(svg, data2, layout, style);
  const updateAxis = drawAxis(svg, layout);
  const updateLabels = drawLabels(svg, data2, layout);
  const updateTicker = drawTicker(svg, data2);

  const { keyframes } = data2;
  const { x, y } = layout;

  for (const keyframe of keyframes) {
    const transition = svg.transition().duration(duration).ease(d3easeLinear);

    x.domain([0, keyframe[1][0].value]);
    updateAxis(keyframe, transition);
    updateBars(keyframe, transition);
    updateLabels(keyframe, transition);
    updateTicker(keyframe, transition);

    await transition.end();
  }
};

const BarChartRace = (props) => {
  const [container, svg] = useSvg(init);

  /* Load data */

  const [categoryBrands] = useDataFetch("/data/category-brands.csv", (text) =>
    d3csvParse(text, d3autoType)
  );
  const data = categoryBrands.data;

  /* Compute intermediate data */

  const data2 = React.useMemo(() => {
    if (
      !categoryBrands.isLoading &&
      !categoryBrands.isError &&
      categoryBrands.data
    ) {
      return computeIntermediateData(categoryBrands.data);
    } else {
      return null;
    }
  }, [categoryBrands]);

  // /* Compute layout and style */

  const [layout, style] = React.useMemo(() => {
    if (data) {
      return [computeLayout(), computeStyle(data)];
    } else {
      return [];
    }
  }, [data]);

  // /* Draw */

  React.useEffect(() => {
    if (svg && data2 && layout && style) {
      draw(svg, data2, layout, style);
    }
  }, [svg, data2, layout, style]);

  return <div ref={container}></div>;
};

export default BarChartRace;
