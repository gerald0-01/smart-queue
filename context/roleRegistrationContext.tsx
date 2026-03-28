import { createContext } from "react"

type UserContextType = {
  role: string
  setRole: (user: string) => void
}

export const RoleContext = createContext<UserContextType>({
    role: 'STUDENT',
    setRole: () => {}
})