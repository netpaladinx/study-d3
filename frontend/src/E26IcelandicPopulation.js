import React from "react";

import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";
import {
  min as d3min,
  max as d3max,
  group as d3group,
  ascending as d3ascending,
  ticks as d3ticks,
  extent as d3extent,
  range as d3range,
} from "d3-array";
import { easeLinear as d3easeLinear } from "d3-ease";
import {
  scaleLinear as d3scaleLinear,
  scaleBand as d3scaleBand,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { axisBottom as d3axisBottom, axisRight as d3axisRight } from "d3-axis";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
  useMovingState,
} from "./lib/d3-lib";

const width = 954;
const height = 500;
const margin = { top: 20, right: 30, bottom: 34, left: 0 };
const delay = 250;

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (source) => {
  const data = Object.assign(source, { x: "Age", y: "Population" });

  const yearMin = d3min(data, (d) => d.year);
  const yearStep = 1;

  const x = d3scaleBand()
    .domain(Array.from(d3group(data, (d) => d.age).keys()).sort(d3ascending))
    .range([width - margin.right, margin.left]);

  const y = d3scaleLinear()
    .domain([0, d3max(data, (d) => d.value)])
    .range([height - margin.bottom, margin.top]);

  const color = d3scaleOrdinal(["M", "F"], ["#4e79a7", "#e15759"]);

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .tickValues(d3ticks(...d3extent(data, (d) => d.age), width / 40))
          .tickSizeOuter(0)
      )
      .call((g) =>
        g
          .append("text")
          .attr("x", margin.right)
          .attr("y", margin.bottom - 4)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(data.x)
      );

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${width - margin.right},0)`)
      .call(d3axisRight(y).ticks(null, "s"))
      .call((g) => g.select(".domain").remove())
      .call((g) =>
        g
          .append("text")
          .attr("x", margin.right)
          .attr("y", 10)
          .attr("fill", "currentColor")
          .attr("text-anchor", "end")
          .text(data.y)
      );

  return { data, yearMin, yearStep, x, y, color, xAxis, yAxis };
};

const draw = (svg, params) => {
  const { data, yearMin, yearStep, x, y, color, xAxis, yAxis } = params;

  svg.append("g").call(xAxis);
  svg.append("g").call(yAxis);

  const group = svg.append("g");
  let rect = group.selectAll("rect");

  const update = (year) => {
    const dx = (x.step() * (year - yearMin)) / yearStep;

    const t = svg.transition().ease(d3easeLinear).duration(delay);

    rect = rect
      .data(
        data.filter((d) => d.year === year),
        (d) => `${d.sex}:${d.year - d.age}`
      )
      .join(
        (enter) =>
          enter
            .append("rect")
            .style("mix-blend-mode", "darken")
            .attr("fill", (d) => color(d.sex))
            .attr("x", (d) => x(d.age) + dx)
            .attr("y", (d) => y(0))
            .attr("width", x.bandwidth() + 1)
            .attr("height", 0),
        (update) => update,
        (exit) =>
          exit.call((rect) =>
            rect.transition(t).remove().attr("y", y(0)).attr("height", 0)
          )
      );

    rect
      .transition(t)
      .attr("y", (d) => y(d.value))
      .attr("height", (d) => y(0) - y(d.value));

    group.transition(t).attr("transform", `translate(${-dx},0)`);
  };

  return update;
};

const IcelandicPopulation = (props) => {
  const [container, svg] = useSvg(init);

  const [source] = useDataFetchMemo("/data/icelandic-population.csv", (text) =>
    d3csvParse(text, d3autoType)
  );

  const params = React.useMemo(() => callIfReady(computeParams, source), [
    source,
  ]);

  const [updateDraw, setUpdateDraw] = React.useState(null);

  React.useEffect(() => {
    if (svg && params) {
      const update = draw(svg, params);
      setUpdateDraw(() => update);
    }
  }, [svg, params]);

  const movingYear = useMovingState(!!updateDraw, {
    arr: d3range(1841, 2020),
    interval: delay,
  });

  React.useEffect(() => {
    if (updateDraw) {
      updateDraw(movingYear);
    }
  }, [updateDraw, movingYear]);

  return <div ref={container}></div>;
};

export default IcelandicPopulation;
