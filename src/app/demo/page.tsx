import React from "react";
import AtomicDesignDemo from "@/app/components/demo/AtomicDesignDemo";
import DJPlayerSimplified from "@/app/components/organisms/DJSetPlayer/DJPlayerSimplified";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <AtomicDesignDemo />

      {/* DJ Player Demo */}
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-[#FF6B6B]">
            Simplified DJ Player Demo
          </h2>
          <p className="text-center text-gray-400 mb-8">
            This demonstrates the simplified DJ player using atomic design
            components
          </p>
          <DJPlayerSimplified />
        </div>
      </div>
    </div>
  );
}
