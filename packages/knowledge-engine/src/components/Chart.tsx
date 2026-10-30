import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart, BarChart, ScatterChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  AriaComponent,
} from "echarts/components";
import { SVGRenderer } from "echarts/renderers";
import type { Value } from "../protocol/types";
echarts.use([
  LineChart,
  BarChart,
  ScatterChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  DataZoomComponent,
  AriaComponent,
  SVGRenderer,
]);
export default function Chart({
  points,
  kind,
  label,
  onSelect,
  xDomain,
  yDomain,
}: {
  xDomain?: number[];
  yDomain?: number[];
  points: Value[];
  kind: string;
  label: string;
  onSelect: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef({ points, kind, label, onSelect, xDomain, yDomain });
  current.current = { points, kind, label, onSelect, xDomain, yDomain };
  const updateRef = useRef<() => void>(() => {});
  useEffect(() => {
    const el = ref.current!;
    const chart = echarts.init(el, undefined, { renderer: "svg" });
    chart.setOption({ dataZoom: [{ type: "inside" }] });
    const update = () => {
      const { points, kind, label, xDomain, yDomain } = current.current;
      const s = getComputedStyle(el);
      const token = (name: string) => s.getPropertyValue(name).trim();
      chart.setOption({
        animation: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        color: [token("--accent")],
        textStyle: {
          color: token("--ink"),
          fontFamily: s.fontFamily,
        },
        aria: { enabled: true },
        tooltip: {
          trigger: "axis",
          renderMode: "richText",
          backgroundColor: token("--card"),
          borderColor: token("--line"),
          textStyle: { color: token("--ink") },
        },
        grid: { left: 48, right: 24, top: 35, bottom: 45 },
        xAxis: {
          min: xDomain?.[0] ?? null,
          max: xDomain?.[1] ?? null,
          type: "value",
          axisLabel: { color: token("--ink-2") },
          splitLine: { lineStyle: { color: token("--line") } },
          axisLine: { lineStyle: { color: token("--ink-2") } },
        },
        yAxis: {
          min: yDomain?.[0] ?? null,
          max: yDomain?.[1] ?? null,
          type: "value",
          axisLabel: { color: token("--ink-2") },
          axisLine: { lineStyle: { color: token("--ink-2") } },
          splitLine: { lineStyle: { color: token("--line") } },
        },
        legend: { top: 0, textStyle: { color: token("--ink") } },
        series: [
          {
            name: label,
            type: kind,
            data: points,
            showSymbol: kind === "scatter",
          },
        ],
      });
    };
    updateRef.current = update;
    chart.on("click", (p) => current.current.onSelect(String(p.dataIndex)));
    const size = new ResizeObserver(() => chart.resize());
    size.observe(el);
    const theme = new MutationObserver(update);
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-scheme"],
    });
    return () => {
      size.disconnect();
      theme.disconnect();
      chart.dispose();
    };
  }, []);
  useEffect(() => updateRef.current(), [points, kind, label, xDomain, yDomain]);
  return <div ref={ref} className="ki-chart" role="img" aria-label={label} />;
}
