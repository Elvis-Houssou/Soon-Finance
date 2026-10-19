import { notFound } from "next/navigation";
import { MotionLab } from "./lab";

/** Banc d'essai des primitives motion, servi uniquement aux builds e2e (NEXT_PUBLIC_E2E=1). */
export default function MotionLabPage() {
  if (process.env.NEXT_PUBLIC_E2E !== "1") notFound();
  return <MotionLab />;
}
