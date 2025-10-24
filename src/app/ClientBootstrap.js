"use client";
import { useEffect } from "react"


export default function ClientBootstrap() {
  useEffect(() => {
    (async () => {
      if (typeof window !== "undefined") {
        await import("bootstrap/dist/js/bootstrap.bundle.min.js");
      }
    })();
  }, []);

  return null;
}
