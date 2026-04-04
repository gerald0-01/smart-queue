import { authOptions } from "@/lib/authOptions"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import Welcome from "@/components/Welcome"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/dashboard")
  return <Welcome />
}
