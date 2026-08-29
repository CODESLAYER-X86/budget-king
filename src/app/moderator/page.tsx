import { redirect } from "next/navigation";

export default function ModeratorRedirectPage() {
  redirect("/admin");
}
