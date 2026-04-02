import StaffDashboard from "@/components/dashboard/StaffDashboard";
import AdminDashboard from "@/components/dashboard/admin/AdminDashboard";
import Dashboard from "@/components/dashboard/Dashboard";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function Page() {
    const session = await getServerSession(authOptions)

    if (!session) redirect("/login")

    if (session.user.role === 'STUDENT' || session.user.role === 'ALUMNI') return <Dashboard/>
    if (session.user.role === 'STAFF') return <StaffDashboard/>
    if (session.user.role === 'ADMIN') return <AdminDashboard/>
}
