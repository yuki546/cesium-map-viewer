"use client";

import dynamic from "next/dynamic";

const CesiumViewer = dynamic(() => import("@/components/CesiumViewer"), {
  ssr: false,
});

export default function PageClient() {
  return (
    <main className="min-h-screen">
      <CesiumViewer />
    </main>
  );
}
