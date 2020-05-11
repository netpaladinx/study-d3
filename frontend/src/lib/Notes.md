1. useState

- set async (new value, or functional update), get/set seperated (for sync get/set, use useRef)
- set func reference unchanged, no need to be put in dependencies
- often call set in event handler or effect, less call while rendering
- for get, directly use the state variable (immutable) (when changing inside, the state ref also changes)
- in a component, the order of calling useState() matters (to differentiate state variables)

2. useEffect

- a different arrow function (a different effect) every time we re-render (variables in it don't get stale)
- "side effects" (can't be done during rendering):
  - data fetching (network requests)
  - subscriptions
  - manually DOM mutations
  - logging
- order:
  (a) after render method (after performing the DOM updates) (render != paint)
  (2) order of multiple effects: as the order they were defined
- condition:
  (a) after the first render and after every update
- useEffect (async or after the render is committed to the screen) v.s. useLayoutEffect (sync before updating the screen)
  - useEffect:
    (a) fired after layout and paint during a deferred event (avoid blocking the browser from updating the screen)
    (b) fired before any new renders
  - useLayoutEffect:
- cleanup (avoid memory leak)
  - run cleanup before running the effect next time (not only when unmounted)
- function used by effect
  - Solution 1: move it outside of the component (not reference any props or state)
  - Solution 2: call it outside of the effect, and make the effect depend on the returned value
  - Solution 3: add it to effect dependencies but wrap its definition into useCallback

3. custom hooks

- still call inner logic while rendering
  1. (stateful logic) useState (stateful variable) + useEffect (async call, set state)
  2. range:
     - form handling
     - animation
     - declarative subscriptions
     - timer
  3. args: not initial values

4. useContext

- trigger rerender for the component using useContext even an ancestor uses React.memo
- Steps:
  (1) const MyContext = React.createContext(initialValue)
  (2) <MyContext.Provider value={ ... }></MyContext.Provider>
  (3) const { ... } = useContext(MyContext)

5. useReducer

- dispatch function is stable (won't change on re-renders)
- Steps:
  (1) define reducer
  (2) const [state, dispatch] = useReducer(reducer, initialValue) or useReducer(reducer, initialValue, init) // for lazy initialization

6. useCallback

- make a function stable between re-renders until dependencies change (callback used as prop for child)
- useCallback(fn, deps) <=> useMemo(() => fn, deps)

7. useMemo

- For expansive computation while rendering
- function in useMemo runs while rendering (side effects belong in useEffect not useMemo)

8. useRef

- returns a mutable ref object (persist for the full lifetime, i.e. stable identity on every render)
- (1) access the DOM (2) keep any mutable value
- mutating .current doesn't cause a re-render
- callback ref: triggered when React attaches or detaches a ref to a DOM node

9. useImperativeHandle

- to make a ref to a function component
- useImperativeHandle(ref, createHandle, [deps])
- child (instance value) => parent, parent (react elem) ref.current.xxx => child (DOM) ref2.current.xxx
- used with forwardRef

10. React.memo(Component, areEqual)

- function in props should be put in useCallback to avoid being re-created
