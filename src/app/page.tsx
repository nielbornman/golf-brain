import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard"); // or "/login" if you prefer
}
