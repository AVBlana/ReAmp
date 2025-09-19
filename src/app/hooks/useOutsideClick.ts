import { useEffect, RefObject } from "react";

export default function useOutsideClick(
  ref: RefObject<HTMLElement>,
  onOutside: () => void
) {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(event.target as Node)) {
        onOutside();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [ref, onOutside]);
}
