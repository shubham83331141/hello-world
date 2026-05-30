import { getTiles } from "@/lib/tiles";
import ShortlistClient from "./ShortlistClient";

export default function Page() {
  return <ShortlistClient tiles={getTiles()} />;
}

