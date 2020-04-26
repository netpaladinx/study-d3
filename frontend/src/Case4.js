import React from "react";
import { scaleTime, scaleLinear } from "d3-scale";
import { max } from "d3-array";

import { useSVG_2 } from "./use-svg";

const draw = (svg) => {
  const width = 700;
  const height = 525;
  const padding = 40;

  svg.attr("width", width + padding * 2).attr("height", height + padding * 2);

  const y = scaleTime
    .domain([new Date(2011, 0, 1), new Date(2011, 0, 1, 23, 59)])
    .range([0, height]);
  const x = scaleTime
    .domain([new Date(2011, 0, 1), new Date(2011, 11, 31)])
    .range([0, width]);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "April",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const data = [
    { date: new Date(2011, 0, 1), sunrise: [7, 51], sunset: [16, 42] },
    { date: new Date(2011, 0, 15), sunrise: [7, 48], sunset: [16, 58] },
    { date: new Date(2011, 1, 1), sunrise: [7, 33], sunset: [17, 21] },
    { date: new Date(2011, 1, 15), sunrise: [7, 14], sunset: [17, 41] },
    { date: new Date(2011, 2, 1), sunrise: [6, 51], sunset: [18, 0] },
    { date: new Date(2011, 2, 12), sunrise: [6, 32], sunset: [18, 15] }, // dst - 1 day
    { date: new Date(2011, 2, 13), sunrise: [7, 30], sunset: [19, 16] }, // dst
    { date: new Date(2011, 2, 14), sunrise: [7, 28], sunset: [19, 18] }, // dst + 1 day
    { date: new Date(2011, 2, 14), sunrise: [7, 26], sunset: [19, 19] },
    { date: new Date(2011, 2, 20), sunrise: [07, 17], sunset: [19, 25] }, // equinox
    { date: new Date(2011, 3, 1), sunrise: [6, 54], sunset: [19, 41] },
    { date: new Date(2011, 3, 15), sunrise: [6, 29], sunset: [19, 58] },
    { date: new Date(2011, 4, 1), sunrise: [6, 3], sunset: [20, 18] },
    { date: new Date(2011, 4, 15), sunrise: [5, 44], sunset: [20, 35] },
    { date: new Date(2011, 5, 1), sunrise: [5, 30], sunset: [20, 52] },
    { date: new Date(2011, 5, 15), sunrise: [5, 26], sunset: [21, 1] },
    { date: new Date(2011, 5, 21), sunrise: [5, 26], sunset: [21, 3] }, // solstice
    { date: new Date(2011, 6, 1), sunrise: [5, 30], sunset: [21, 3] },
    { date: new Date(2011, 6, 15), sunrise: [5, 41], sunset: [20, 57] },
    { date: new Date(2011, 7, 1), sunrise: [5, 58], sunset: [20, 40] },
    { date: new Date(2011, 7, 15), sunrise: [6, 15], sunset: [20, 20] },
    { date: new Date(2011, 8, 1), sunrise: [6, 35], sunset: [19, 51] },
    { date: new Date(2011, 8, 15), sunrise: [6, 51], sunset: [19, 24] },
    { date: new Date(2011, 8, 23), sunrise: [7, 1], sunset: [19, 9] }, // equinox
    { date: new Date(2011, 9, 1), sunrise: [7, 11], sunset: [18, 54] },
    { date: new Date(2011, 9, 15), sunrise: [7, 28], sunset: [18, 29] },
    { date: new Date(2011, 10, 1), sunrise: [7, 51], sunset: [18, 2] },
    { date: new Date(2011, 10, 5), sunrise: [7, 57], sunset: [17, 56] }, // last day of dst
    { date: new Date(2011, 10, 6), sunrise: [6, 58], sunset: [16, 55] }, // standard time
    { date: new Date(2011, 10, 7), sunrise: [6, 59], sunset: [16, 54] }, // standard time + 1
    { date: new Date(2011, 10, 15), sunrise: [7, 10], sunset: [16, 44] },
    { date: new Date(2011, 11, 1), sunrise: [7, 31], sunset: [16, 33] },
    { date: new Date(2011, 11, 15), sunrise: [7, 44], sunset: [16, 32] },
    { date: new Date(2011, 11, 22), sunrise: [7, 49], sunset: [16, 35] }, // solstice
    { date: new Date(2011, 11, 31), sunrise: [7, 51], sunset: [16, 41] },
  ];

  function yAxisLabel(d) {
    if (d == 12) {
      return "noon";
    }
    if (d < 12) {
      return d;
    }
    return d - 12;
  }

  function midMonthDates() {
    return d3.range(0, 12).map(function (i) {
      return new Date(2011, i, 15);
    });
  }

  return svg;
};

const Case4 = (props) => {
  const container = useSVG_2(draw);
  return <div ref={container}></div>;
};

export default Case4;
