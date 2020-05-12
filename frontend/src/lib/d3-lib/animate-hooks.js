import React from "react";

export const useMovingState = (open, ...args) => {
  let start, end, interval, arr, inc;
  if (Array.isArray(args[0])) {
    arr = args[0];
    start = 0;
    end = arr.length - 1;
    interval = args[1];
  } else {
    start = args[0];
    end = args[1];
    inc = args.length === 4 ? args[2] : 1;
    interval = args.length === 4 ? args[3] : args[2];
  }

  const [movingState, setMovingState] = React.useState(start);
  const paramsRef = React.useRef({ start, end, interval, arr, inc });

  React.useEffect(() => {
    const { end, interval, arr, inc } = paramsRef.current;

    if (
      open &&
      ((arr && movingState + 1 <= end) ||
        (inc &&
          ((inc > 0 && movingState + inc <= end) ||
            (inc < 0 && movingState + inc >= end))))
    ) {
      const id = setInterval(
        () =>
          setMovingState((movingState) =>
            arr ? movingState + 1 : inc ? movingState + inc : movingState
          ),
        interval
      );

      return () => clearInterval(id);
    }
  }, [open, movingState, paramsRef]);

  return arr ? arr[movingState] : movingState;
};
