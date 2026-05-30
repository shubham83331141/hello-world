import { getTiles } from "@/lib/tiles";
import CompareClient from "./CompareClient";

export default function Page() {
  return <CompareClient tiles={getTiles()} />;
}

