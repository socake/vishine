import katex from "katex";
import "katex/dist/katex.min.css";
import { useEffect, useRef } from "react";
export default function Formula({ latex }: { latex: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current)
      katex.render(latex, ref.current, {
        throwOnError: false,
        trust: false,
        maxExpand: 100,
        maxSize: 10,
        output: "htmlAndMathml",
      });
  }, [latex]);
  return <div ref={ref} className="ki-formula" />;
}
