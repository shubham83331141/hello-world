import { getTiles } from "@/lib/tiles";
import DealClient from "./DealClient";

export default function Page() {
  return <DealClient tiles={getTiles()} />;
}

