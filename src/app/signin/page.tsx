import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ [key: string]: string | string[] | undefined }> };

export default async function SigninPage({ searchParams }: Props) {
  const params = await searchParams;
  const error = typeof params?.error === "string" ? params.error : undefined;
  // Landing page is the sign-in hub; forward any error so it can show the message
  const target = error ? `/?error=${encodeURIComponent(error)}` : "/";
  redirect(target);
}
