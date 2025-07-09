import { useRef, useLayoutEffect } from "react";

/**
 * A custom hook that returns a ref with the latest value of a variable.
 * This is useful for accessing the latest value of a prop or state
 * from within a callback that has a stale closure.
 *
 * @param value The value to store in the ref.
 * @returns A ref with the latest value.
 */
export function useLatest<T>(value: T) {
  const ref = useRef(value);
  useLayoutEffect(() => {
    ref.current = value;
  });
  return ref;
}
