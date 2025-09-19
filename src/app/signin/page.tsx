import { redirect } from "next/navigation";

export default function SigninPage() {
  // Redirect to landing page - it's now the sign-in hub
  redirect("/");
}
