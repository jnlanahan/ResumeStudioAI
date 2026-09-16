"use client";

import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useStore } from "@/store/useStore";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    useStore.persist.rehydrate();
    setReady(true);
  }, []);
  return <Layout>{ready ? children : null}</Layout>;
}
