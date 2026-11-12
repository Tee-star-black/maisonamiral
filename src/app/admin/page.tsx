import type { Metadata } from "next";
import { AdminApp } from "./ui";
export const metadata: Metadata = {
  title: "Store management",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminApp />;
}
