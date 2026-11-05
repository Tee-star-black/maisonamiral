import { WheelLoader } from "@/components/wheel-loader";

export default function ShopLoading() {
  return <main aria-busy="true"><WheelLoader label="Loading collection" /></main>;
}
