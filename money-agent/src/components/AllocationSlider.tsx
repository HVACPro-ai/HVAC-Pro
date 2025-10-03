"use client";
import * as React from "react";

type Props = {
  extraCents: number;
  onChange: (split: { funCents: number; savingsCents: number; goalsCents: number }) => void;
};

export function AllocationSlider({ extraCents, onChange }: Props) {
  const [funPct, setFunPct] = React.useState(40);
  const [savingsPct, setSavingsPct] = React.useState(40);
  const goalsPct = 100 - funPct - savingsPct;

  React.useEffect(() => {
    const funCents = Math.round((funPct / 100) * extraCents);
    const savingsCents = Math.round((savingsPct / 100) * extraCents);
    const goalsCents = extraCents - funCents - savingsCents;
    onChange({ funCents, savingsCents, goalsCents });
  }, [funPct, savingsPct, extraCents, onChange]);

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <label className="w-24">Fun {funPct}%</label>
        <input type="range" min={0} max={100 - savingsPct} value={funPct} onChange={(e) => setFunPct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="flex gap-4 items-center">
        <label className="w-24">Savings {savingsPct}%</label>
        <input type="range" min={0} max={100 - funPct} value={savingsPct} onChange={(e) => setSavingsPct(Number(e.target.value))} className="w-full" />
      </div>
      <div className="text-sm text-gray-600">Goals {goalsPct}%</div>
    </div>
  );
}
