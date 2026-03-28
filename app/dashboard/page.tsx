'use client'
import StaffDashboard from "@/components/StaffDashboard";
import Dashboard from "@/components/Dashboard";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function Page() {
    const { data: session, status } = useSession()

    if (!session) redirect("/login")

    if (session.user.role == 'STUDENT') return <Dashboard/>
    if (session.user.role == 'STAFF') return <StaffDashboard/>
}