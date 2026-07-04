"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { TruthDNAScore } from "@/lib/types";

const METRIC_LABELS: { key: keyof TruthDNAScore; label: string }[] = [
  { key: "reliability", label: "Reliability" },
  { key: "evidence", label: "Evidence" },
  { key: "sourceTrust", label: "Source Trust" },
  { key: "consensus", label: "Consensus" },
  { key: "context", label: "Context" },
  { key: "manipulation", label: "Clean of Manipulation" },
];

/** Six-metric TruthDNA radar. Single series → no legend; the title names it.
 *  Series color: validated dark categorical slot 1. */
export default function ScoreChart({ scores }: { scores: TruthDNAScore }) {
  const data = METRIC_LABELS.map((m) => ({
    metric: m.label,
    value: Math.round(scores[m.key]),
  }));

  return (
    <div className="h-80 w-full md:h-96">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="#2c2c2a" strokeWidth={1} />
          <PolarAngleAxis
            dataKey="metric"
            tick={{ fill: "#c3c2b7", fontSize: 12 }}
          />
          <PolarRadiusAxis
            domain={[0, 100]}
            tick={{ fill: "#898781", fontSize: 10 }}
            tickCount={5}
            stroke="#2c2c2a"
            axisLine={false}
          />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "#1a1a19",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "#ffffff",
              fontSize: 13,
            }}
            formatter={(value) => [`${value} / 100`, "Score"]}
          />
          <Radar
            name="TruthDNA"
            dataKey="value"
            stroke="#3987e5"
            strokeWidth={2}
            fill="#3987e5"
            fillOpacity={0.12}
            dot={{ r: 4, fill: "#3987e5", stroke: "#1a1a19", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: "#3987e5", stroke: "#1a1a19", strokeWidth: 2 }}
            isAnimationActive
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
