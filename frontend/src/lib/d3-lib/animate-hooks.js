import React from "react";

/*
  useMovingState(open, arr, interval)
  useMovingState(open, start, end, inc, interval) (end included)
  useMovingState(open, start, end, interval)
*/
export const useMovingState = (open, params) => {
  let { arr, start, end, interval = 1000, inc = 1, loop = false } = params;

  if (Array.isArray(arr)) {
    start = start ? start : 0;
    end = end ? end : arr.length - 1;
  }

  const [movingState, setMovingState] = React.useState(start);
  const paramsRef = React.useRef({ start, end, interval, arr, inc, loop });

  React.useEffect(() => {
    const { start, end, interval, arr, inc, loop } = paramsRef.current;

    if (open) {
      if (arr) {
        if (movingState + 1 <= end) {
          const id = setInterval(
            () => setMovingState((movingState) => movingState + 1),
            interval
          );

          return () => clearInterval(id);
        } else if (loop) {
          const id = setInterval(() => setMovingState(start), interval);

          return () => clearInterval(id);
        }
      }

      if (inc) {
        if (
          (inc > 0 && movingState + inc <= end) ||
          (inc < 0 && movingState + inc >= end)
        ) {
          const id = setInterval(
            () =>
              setMovingState((movingState) =>
                arr ? movingState + 1 : inc ? movingState + inc : movingState
              ),
            interval
          );

          return () => clearInterval(id);
        } else if (loop) {
          const id = setInterval(() => setMovingState(start), interval);

          return () => clearInterval(id);
        }
      }
    }
  }, [open, movingState, paramsRef]);

  return arr ? arr[movingState] : movingState;
};
