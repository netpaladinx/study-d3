import React from "react";
import { select as d3select } from "d3-selection";

export const useDiv = () => {
  const [div, setDiv] = React.useState(null);

  const container = React.useCallback((node) => {
    let d3div = d3select(node);

    d3div = Object.assign(d3div, {
      clear: function () {
        const nd = this.node();
        while (nd.hasChildNodes()) {
          nd.removeChild(nd.firstChild);
        }
      },
    });

    setDiv(d3div);
  }, []);

  return [container, div];
};
