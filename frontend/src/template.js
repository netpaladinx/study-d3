import React from "react";

import { extent as d3extent, max as d3max } from "d3-array";
import { axisBottom as d3axisBottom, axisLeft as d3axisLeft } from "d3-axis";
import {
  scaleLinear as d3scaleLinear,
  scaleTime as d3scaleTime,
  scaleSequential as d3scaleSequential,
} from "d3-scale";
import {} from "d3-selection";
import {} from "d3-format";
import {} from "d3-interpolate";
import { schemeCategory10 as d3schemeCategory10 } from "d3-scale-chromatic";
import { stack as d3stack, area as d3area } from "d3-shape";
import { csvParse as d3csvParse, autoType as d3autoType } from "d3-dsv";

import {
  useSvg,
  makeSvgInit,
  useDataFetchMemo,
  callIfReady,
} from "./lib/d3-lib";

const width = 954;
const height = 420;
const margin = { top: 20, right: 20, bottom: 30, left: 30 };

const init = makeSvgInit({
  width,
  height,
});

const computeParams = (data) => {};

const draw = (svg, data, params) => {};

const ABC = (props) => {
  const [container, svg] = useSvg(init);

  const [data] = useDataFetchMemo("/data/...");

  const params = React.useMemo(() => callIfReady(computeParams, data), [data]);

  React.useEffect(() => {
    callIfReady(draw, svg, data, params);
  }, [svg, data, params]);

  return <div ref={container}></div>;
};

export default ABC;
