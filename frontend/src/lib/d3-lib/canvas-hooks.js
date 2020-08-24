import React from "react";
import { select as d3select } from "d3-selection";

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 600;

export const makeCanvasInit = ({
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  dpi = devicePixelRatio,
}) => (canvas) => {
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  canvas.style.width = width + "px";

  const context = canvas.getContext("2d");
  context.scale(dpi, dpi);

  return context;
};

export const useCanvas = (init) => {
  const [context, setContext] = React.useState(null);

  const containerParams = React.useRef(null);
  const container = React.useCallback(
    (node) => {
      let newContext =
        init && node ? init(d3select(node).append("canvas").node()) : null;

      containerParams.current = {
        node,
        context: newContext,
      };

      if (newContext) {
        newContext = Object.assign(newContext, {
          clear: function () {
            const canvas = this.canvas;
            this.clearRect(0, 0, canvas.width, canvas.height);
          },
        });
      }
      setContext(newContext);
    },
    [init]
  );

  React.useEffect(() => {
    const { node: cnode, context: ccontext } = containerParams.current || {};
    if (cnode && !ccontext) {
      container(cnode);
    }
  }, [container, containerParams]);

  return [container, context];
};
