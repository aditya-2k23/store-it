"use client";
import { calculatePercentage, convertFileSize } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { Button } from "./ui/button";
import type { CSSProperties } from "react";
import Link from "next/link";

const Chart = ({
  used = 0,
  insightText,
  snapshotText,
  workspaceId,
}: {
  used: number;
  insightText: string;
  snapshotText?: string | null;
  workspaceId: string;
}) => {
  const percentage = Number(calculatePercentage(used));
  const clampedPercentage = Math.min(Math.max(percentage, 0), 100);
  const totalCapacity = 2 * 1024 * 1024 * 1024;
  const remaining = Math.max(totalCapacity - used, 0);
  const statusLabel =
    clampedPercentage >= 90
      ? "Critical"
      : clampedPercentage >= 70
        ? "Getting full"
        : "Healthy";
  const statusTone =
    clampedPercentage >= 90
      ? "bg-white/25 text-white"
      : clampedPercentage >= 70
        ? "bg-white/20 text-white"
        : "bg-white/15 text-white";
  const circleStyle = {
    background: `conic-gradient(rgba(255,255,255,0.95) ${clampedPercentage * 3.6}deg, rgba(255,255,255,0.2) 0deg)`,
  } as CSSProperties;

  return (
    <section className="chart" aria-label="Storage overview">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-white/40 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-14 left-18 h-52 w-52 rounded-full bg-white/40 blur-[60px]" />

      <div className="relative w-full grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] items-center">
        {/* Circle Chart (Hidden on small & medium devices < lg) */}
        <div className="hidden lg:flex flex-col items-center lg:items-start space-y-3 lg:space-y-4 shrink-0">
          <p className="font-medium font-dynapuff uppercase tracking-[0.2em] text-white/70 text-xs sm:text-sm">
            Storage usage
          </p>

          <div className="relative size-32 sm:size-40 shrink-0">
            <div
              className="absolute inset-0 rounded-full"
              style={circleStyle}
              aria-hidden="true"
            />
            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-brand">
              <p className="text-2xl sm:text-3xl font-semibold text-white">
                {clampedPercentage.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* AI Insights Section (Centered on small & medium devices < lg) */}
        <div className="flex h-full flex-col justify-center items-center text-center lg:items-start lg:text-left gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-4xl bg-white/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white">
            <Sparkles className="size-4" />
            AI Insights
          </div>

          <div className="w-full grid gap-3 rounded-2xl bg-white/10 p-4 shadow-inner text-left">
            <div className="flex items-center justify-between text-sm text-white/85">
              <span>Usage status</span>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone}`}
              >
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/85">
              <span>Used space</span>
              <span className="font-semibold text-white">{insightText}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-white/85">
              <span>Remaining</span>
              <span className="font-semibold text-white">
                {convertFileSize(remaining)}
              </span>
            </div>
          </div>

          {snapshotText && (
            <p className="text-xs text-white/70 mt-0.5">
              {snapshotText}
            </p>
          )}

          <Link href={`/workspaces/${workspaceId}/settings/privacy`}>
            <Button
              type="button"
              className="h-10 w-fit rounded-xl bg-white/95 px-4 text-sm font-semibold text-slate-700 shadow-lg transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white cursor-pointer"
            >
              Review AI Insights
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Chart;
