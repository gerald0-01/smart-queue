'use client'
import StaffRegister from "@/components/StaffRegisterContainer"
import Register from "@/components/RegisterContainer"
import { RoleContext } from "@/context/roleRegistrationContext"
import { useContext } from "react"


export default function Page() {
    const { role, setRole } = useContext(RoleContext) 
    
    if (role === 'STUDENT' || role === 'ALUMNI') return <Register/>
    
    if (role === 'STAFF') return <StaffRegister/>
}