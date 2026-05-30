import { getTiles } from "@/lib/tiles";
import DealsClient from "./DealsClient";

export default function Page() {
  return <DealsClient tiles={getTiles()} />;
}

