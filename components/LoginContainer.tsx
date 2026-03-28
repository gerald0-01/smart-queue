'use client'
import { signIn } from "next-auth/react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { useState } from "react"

export default function LoginContainer() {
    const [ idOrEmail, setIdOrEmail ] = useState('')
    const [ password, setPassword ] = useState('')
    const [ showPassword, setShowPassword ] = useState(false)
    const [ error, setError ] = useState<String | null>(null)
    const [ loading, setLoading] = useState<boolean>(false)

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        const res = await signIn("credentials", {
            idOrEmail,
            password,
            redirect: false
        })

        setIdOrEmail("")
        setPassword("")

        setLoading(false)

        if (res?.error) {
            setError("Invalid Credentials.")
        } else {
            redirect("/dashboard")
        }
    }

    return (
            <div className="w-110 h-130 border-2 rounded-2xl flex flex-col border-secondary bg-primary shadow-2xl ">
                <div className="flex items-center justify-center w-110 h-30">
                    <h1 className="text-center font-bold text-secondary">Login Page</h1>
                </div>
                <div className="grid place-items-center h-77">
                    <div className="h-10">
                        {loading && <p className="text-secondary">Loading...</p>}
                        {error != null && <p className="text-secondary">{error}</p>}
                    </div>
                    <div className="">
                        <form onSubmit={handleFormSubmit}>
                            <div className="relative flex flex-col">
                                <input type="text" value={idOrEmail} onChange={(e) => {setIdOrEmail(e.target.value)}} className="input-style" placeholder="ID number or MyIIT email"/>
                                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => {setPassword(e.target.value)}} className="input-style" placeholder="Password"/>
                                <div className="flex items-center">
                                    <input className="relative top-0.5" type="checkbox" checked={showPassword} onChange={() => {setShowPassword(prev => !prev)}}/>
                                    <label className="mx-1">Show Password</label>
                                </div>
                                <div className="flex flex-col w-60 items-center my-4">
                                    <button type="submit" className="button-style">Log In</button>
                                    <Link href={"/forgot-password"} className="my-1 no-underline hover:underline decoration-secondary text-secondary"><p>Forgot password?</p></Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
    )
}