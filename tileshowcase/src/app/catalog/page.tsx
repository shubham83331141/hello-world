import { getTiles } from "@/lib/tiles";
import CatalogClient from "./CatalogClient";

export default function Page() {
  const tiles = getTiles();
  return <CatalogClient tiles={tiles} />;
}

