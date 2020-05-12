import React from "react";

export const useAsyncCall = (asyncCall, arg, initialResult = null) => {
  const [result, setResult] = React.useState(initialResult);

  React.useEffect(() => {
    let ignore = false;

    async function asyncFunc() {
      const res = await asyncCall(arg);
      if (!ignore) setResult(res);
    }

    asyncFunc();
    return () => {
      ignore = true;
    };
  }, [asyncCall, arg]);

  return result;
};

export const useAsyncCall2 = (asyncApi, arg, initialResult = null) => {
  const [result, setResult] = React.useState(initialResult);

  React.useEffect(() => {
    asyncApi.call(setResult, arg);

    if (asyncApi.clean) {
      return () => {
        asyncApi.clean(setResult, arg);
      };
    }
  }, [asyncApi, arg]);

  return result;
};

export const useLazyInitialState = (initialize, arg) => {
  return React.useState(() => {
    const initialState = initialize(arg);
    return initialState;
  });
};

export const useLazyInitialReducer = (reducer, initialize, arg) => {
  return React.useReducer(reducer, arg, initialize);
};

export const useLazyInitialRefObserver = (initialize, arg) => {
  const ref = React.useRef(null);

  function getObserver() {
    if (ref.current === null) {
      ref.current = initialize(arg);
    }
    return ref.current;
  }

  return getObserver;
};

/* 
  Data Fetching Hook
*/

const dataFetchReducer = (state, action) => {
  switch (action.type) {
    case "FETCH_INIT":
      return {
        ...state,
        isLoading: true,
        isError: false,
      };
    case "FETCH_SUCCESS":
      return {
        ...state,
        isLoading: false,
        isError: false,
        data: action.payload,
      };
    case "FETCH_FAILURE":
      return {
        ...state,
        isLoading: false,
        isError: true,
      };
    default:
      throw new Error();
  }
};

export const useDataFetch = (fetch, arg, initialData = null) => {
  const [state, dispatch] = React.useReducer(dataFetchReducer, {
    isLoading: false,
    isError: false,
    data: initialData,
  });

  React.useEffect(() => {
    let didCancel = false;

    const fetchData = async () => {
      dispatch({ type: "FETCH_INIT" });

      try {
        const result = await fetch(arg);

        if (!didCancel) {
          dispatch({ type: "FETCH_SUCCESS", payload: result });
        }
      } catch (error) {
        console.log(error);
        if (!didCancel) {
          dispatch({ type: "FETCH_FAILURE" });
        }
      }
    };
    fetchData();

    return () => {
      didCancel = true;
    };
  }, [fetch, arg]);

  return state;
};

export const useService = (Service, arg, reducer, initialState = null) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);

  React.useEffect(() => {
    const service = new Service(arg);

    service.onmessage = ({ messageType, data }) => {
      dispatch({ type: messageType, payload: data });
    };

    return () => {
      try {
        service.close();
      } catch (e) {}
    };
  }, [Service, arg]);

  return state;
};

export const usePreviousOrLatest = (value) => {
  const ref = React.useRef();

  React.useEffect(() => {
    ref.current = value;
  });

  return ref.current;
};

export const useDerivedStateFromProps = (
  derive,
  props,
  initialState = null
) => {
  const [derivedState, setDerivedState] = React.useState(initialState);

  const curValue = derive(props);
  if (curValue !== derivedState) {
    setDerivedState(curValue);
  }

  return [derivedState, curValue];
};

export const useDerivedControlledState = (
  derive,
  props,
  initialState = null
) => {
  const [state, setState] = React.useState(initialState);
  const [derivedState, setDerivedState] = React.useState(initialState);

  const curValue = derive(props);
  if (curValue !== derivedState) {
    setDerivedState(curValue);
    setState(curValue);
  }

  return [state, setState];
};

export const useForceUpdate = () => {
  const [, forceUpdate] = React.useReducer(
    (x) => (x >= Number.MAX_SAFE_INTEGER ? 0 : x + 1),
    0
  );
  return forceUpdate;
};

export const useCallbackRef = (handleNode) => {
  // `handleNode` should have a stable identity
  const [nodeState, setNodeState] = React.useState(null);
  const ref = React.useCallback(
    (node) => {
      if (node) {
        setNodeState(handleNode(node));
      }
    },
    [handleNode]
  );
  return [ref, nodeState];
};

export const useMemoChild = (ChildComponent, props) => {
  return React.useMemo(() => <ChildComponent {...props} />, [props]);
};

export const useDeepStateSetter = (Context, reducer, initialState = null) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const wrapper = (children) => (
    <Context.Provider value={state}>{children}</Context.Provider>
  );
  return [wrapper, state, dispatch];
};

export const useDeepStateGetter = (Context) => {
  const state = React.useContext(Context);
  return state;
};

export const useDeepDispatchSetter = (
  Context,
  reducer,
  initialState = null
) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const wrapper = (children) => (
    <Context.Provider value={dispatch}>{children}</Context.Provider>
  );
  return [wrapper, state, dispatch];
};

export const useDeepDispatchGetter = (Context) => {
  const dispatch = React.useContext(Context);
  return dispatch;
};

export const useDeepStateDispatchSetter = (
  StateContext,
  DispatchContext,
  reducer,
  initialState = null
) => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  const wrapper = (children) => (
    <DispatchContext.Provider value={dispatch}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </DispatchContext.Provider>
  );
  return [wrapper, state, dispatch];
};

export const useDeepStateDispatchGetter = (StateContext, DispatchContext) => {
  const dispatch = React.useContext(DispatchContext);
  const state = React.useContext(StateContext);
  return [state, dispatch];
};

export const useCallbackWithChangingState = (fn) => {
  const [state, setState] = React.useState(null);
  const stateRef = React.useRef(state);

  React.useEffect(() => {
    stateRef.current = state;
  });

  const callback = React.useCallback(() => {
    fn(stateRef.current);
  }, [fn, stateRef]);

  return [callback, state, setState];
};

export const useEventCallback = (fn, dependencies) => {
  // fn is a function with often-changing dependencies
  const ref = React.useRef(() => {
    throw new Error("Cannot call an event handler while rendering.");
  });

  React.useEffect(() => {
    ref.current = fn;
  }, [fn, ...dependencies]);

  const callback = React.useCallback(() => {
    const fn = ref.current;
    return fn();
  }, [ref]);

  return callback;
};
