import { redirect } from "next/navigation";

export default function RootPage() {
  // Pick the default entry for the app:
  redirect("/login");
}