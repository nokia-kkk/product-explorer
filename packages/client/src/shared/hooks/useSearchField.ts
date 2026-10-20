import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from './useDebouncedValue';

/** How long typing must pause before a term is committed. Shared by both search inputs. */
const SEARCH_DEBOUNCE_MS = 500;

/**
 * A debounced text input backed by an external value, so several inputs can show
 * the same search term. Typing settles into `onCommit`; a change in `value` from
 * outside (the other input, "Clear filters", back/forward) is adopted instead of
 * being committed back.
 *
 * @param onCommit Must be stable (e.g. a `useCallback` or router setter).
 */
export function useSearchField(
  value: string,
  onCommit: (q: string) => void
): [string, (term: string) => void] {
  const [term, setTerm] = useState(value);
  const debouncedTerm = useDebouncedValue(term, SEARCH_DEBOUNCE_MS);
  // The last value this field committed or absorbed, so the effects below can
  // tell "the user typed this" apart from "the value changed elsewhere".
  const lastSeen = useRef(value);

  useEffect(() => {
    // A debounced value from before an external update must not be committed
    // back: that would undo the other input's change (clear one, the other
    // re-sends its own stale term).
    if (debouncedTerm !== term) return;
    if (debouncedTerm === lastSeen.current) return;
    lastSeen.current = debouncedTerm;
    onCommit(debouncedTerm.trim());
  }, [debouncedTerm, term, onCommit]);

  useEffect(() => {
    if (value === lastSeen.current) return;
    lastSeen.current = value;
    setTerm(value);
  }, [value]);

  return [term, setTerm];
}
