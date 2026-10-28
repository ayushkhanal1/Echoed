import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import SubmitClient from "./SubmitClient";

export default async function SubmitPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return <SubmitClient />;
}
