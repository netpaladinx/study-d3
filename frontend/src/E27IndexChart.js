import React from "react";

import {
  merge as d3merge,
  max as d3max,
  min as d3min,
  extent as d3extent,
  group as d3group,
  groups as d3groups,
  bisector as d3bisector,
} from "d3-array";
import { utcParse as d3utcParse } from "d3-time-format";
import { mouse as d3mouse, event as d3event } from "d3-selection";
import { transition as d3transition } from "d3-transition";
import { easeCubicOut as d3easeCubicOut } from "d3-ease";
import { interpolateDate as d3interpolateDate } from "d3-interpolate";
import { utcDay as d3utcDay } from "d3-time";
import {
  scaleUtc as d3scaleUtc,
  scaleLog as d3scaleLog,
  scaleOrdinal as d3scaleOrdinal,
} from "d3-scale";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import { line as d3line } from "d3-shape";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 600;
const margin = { top: 20, right: 40, bottom: 30, left: 40 };

const parseDate = d3utcParse("%Y-%m-%d");

const init = makeSvgInit({
  width,
  height,
  styles: {
    "-webkit-tap-highlight-color": "transparent",
  },
});

const computeParams = (data) => {
  const series = d3groups(data, (d) => d.name).map(([key, values]) => {
    const v = values[0].value;
    return {
      key,
      values: values.map(({ date, value }) => ({ date, value: value / v })),
    };
  });

  const bisect = d3bisector((d) => d.date).left;

  const x = d3scaleUtc()
    .domain(d3extent(data, (d) => d.date))
    .range([margin.left, width - margin.right])
    .clamp(true);

  const k = d3max(
    d3group(data, (d) => d.name),
    ([, group]) => d3max(group, (d) => d.value) / d3min(group, (d) => d.value)
  );

  const y = d3scaleLog()
    .domain([1 / k, k])
    .rangeRound([height - margin.bottom, margin.top]);

  const z = d3scaleOrdinal(d3schemeCategory10).domain(data.map((d) => d.name));

  const line = d3line()
    .x((d) => x(d.date))
    .y((d) => y(d.value));

  const xAxis = (g) =>
    g
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(
        d3axisBottom(x)
          .ticks(width / 80)
          .tickSizeOuter(0)
      )
      .call((g) => g.select(".domain").remove());

  const yAxis = (g) =>
    g
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3axisLeft(y).ticks(null, (x) => +x.toFixed(6) + "×"))
      .call((g) =>
        g
          .selectAll(".tick line")
          .clone()
          .attr("stroke-opacity", (d) => (d === 1 ? null : 0.2))
          .attr("x2", width - margin.left - margin.right)
      )
      .call((g) => g.select(".domain").remove());

  return { series, bisect, x, y, z, line, xAxis, yAxis };
};

const draw = (svg, params) => {
  const { series, bisect, x, y, z, line, xAxis, yAxis } = params;

  svg.on("mousemove touchmove", moved);

  svg.append("g").call(xAxis);

  svg.append("g").call(yAxis);

  const rule = svg
    .append("g")
    .append("line")
    .attr("y1", height)
    .attr("y2", 0)
    .attr("stroke", "black");

  const serie = svg
    .append("g")
    .style("font", "bold 10px sans-serif")
    .selectAll("g")
    .data(series)
    .join("g");

  serie
    .append("path")
    .attr("fill", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("stroke", (d) => z(d.key))
    .attr("d", (d) => line(d.values));

  serie
    .append("text")
    .datum((d) => ({ key: d.key, value: d.values[d.values.length - 1].value }))
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 3)
    .attr("x", x.range()[1] + 3)
    .attr("y", (d) => y(d.value))
    .attr("dy", "0.35em")
    .text((d) => d.key)
    .clone(true)
    .attr("fill", (d) => z(d.key))
    .attr("stroke", null);

  d3transition()
    .ease(d3easeCubicOut)
    .duration(1500)
    .tween("date", () => {
      const i = d3interpolateDate(x.domain()[1], x.domain()[0]);
      return (t) => update(i(t));
    });

  function update(date) {
    date = d3utcDay.round(date);
    rule.attr("transform", `translate(${x(date) + 0.5},0)`);
    serie.attr("transform", ({ values }) => {
      const i = bisect(values, date, 0, values.length - 1);
      return `translate(0,${y(1) - y(values[i].value / values[0].value)})`;
    });
    svg.property("value", date).dispatch("input");
  }

  function moved() {
    update(x.invert(d3mouse(this)[0]));
    d3event.preventDefault();
  }

  update(x.domain()[0]);
};

const IndexChart = (props) => {
  const [container, svg] = useSvg(init);

  const [aapl] = useDataFetchMemo("/data/AAPL.csv");
  const [amzn] = useDataFetchMemo("/data/AMZN.csv");
  const [goog] = useDataFetchMemo("/data/GOOG.csv");
  const [ibm] = useDataFetchMemo("/data/IBM.csv");
  const [msft] = useDataFetchMemo("/data/MSFT.csv");

  const data = React.useMemo(() => {
    if (aapl && amzn && goog && ibm && msft) {
      aapl.name = "AAPL";
      amzn.name = "AMZN";
      goog.name = "GOOG";
      ibm.name = "IBM";
      msft.name = "MSFT";

      return d3merge(
        [aapl, amzn, goog, ibm, msft].map((d) =>
          d.map((dd) => {
            const date = parseDate(dd["Date"]);
            return { name: d.name, date, value: +dd["Close"] };
          })
        )
      );
    } else {
      return null;
    }
  }, [aapl, amzn, goog, ibm, msft]);

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, params);
  }, [svg, params]);

  return <div ref={container}></div>;
};

export default IndexChart;
