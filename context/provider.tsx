"use client"
import { useState } from "react"
import { RoleContext } from "./roleRegistrationContext"

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState('STUDENT')

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  )
}