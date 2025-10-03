"use client";
import { useEffect, useState } from "react";
import { AllocationSlider } from "@/components/AllocationSlider";

export default function DashboardPage() {
  const [extraCents, setExtraCents] = useState(0);
  const [split, setSplit] = useState({ funCents: 0, savingsCents: 0, goalsCents: 0 });

  useEffect(() => {
    setExtraCents(100000);
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <div className="mb-6">
        <div className="text-sm text-gray-600">Extra money this month</div>
        <div className="text-3xl font-bold">${(extraCents / 100).toFixed(2)}</div>
      </div>

      <AllocationSlider extraCents={extraCents} onChange={setSplit} />

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-600">Fun</div>
          <div className="text-xl font-semibold">${(split.funCents / 100).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Savings</div>
          <div className="text-xl font-semibold">${(split.savingsCents / 100).toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-600">Goals</div>
          <div className="text-xl font-semibold">${(split.goalsCents / 100).toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
