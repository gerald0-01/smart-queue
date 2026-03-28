'use client'
import { RoleContext } from "@/context/roleRegistrationContext"
import { staffRegisterInitialState, staffRegisterReducer } from "@/reducers/staffRegister"
import axios from "axios"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useState, useReducer, useContext, useEffect } from "react"

export default function StaffRegister () {
    const router = useRouter()
    const [ state, dispatch ] = useReducer(staffRegisterReducer, staffRegisterInitialState)
    const [ showPassword, setShowPassword ] = useState(false)
    const [ error, setError ] = useState<String | null>(null)
    const [ loading, setLoading ] = useState(false)
    const [ passError, setPassError ] = useState<String | null>(null)
    const [ isFilled, setIsFilled ] = useState(false)
    const { role, setRole } = useContext(RoleContext)

    useEffect(() => {
        const requiredFields = { ...state };
        const allFieldsFilled = Object.values(requiredFields).every(
            (v) => v !== "" && v !== null
        );

        setIsFilled(allFieldsFilled);

        if (state.confirmPassword === "") {
            setPassError(null)
        } else if (state.password !== state.confirmPassword) {
            setPassError("Passwords do not match")
        } else {
            setPassError(null)
        }
    }, [state])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        dispatch({
            type: 'SET_FIELD',
            field: e.target.name,
            value: e.target.value
        })
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            const res = await axios.post("/api/auth/register", {
                firstName: state.firstName,
                lastName: state.lastName,
                email: state.email,
                idNumber: state.idNumber,
                password: state.password,
                role: "STAFF"
            })

            setLoading(false)

            if (res.status !== 201) {
                setError(res.data.message)
            } else {
                router.push("/login")
            }
        } catch (err: any) {
            console.log(err.response)
            setError(err.response?.data?.message || "Server Error")
            setLoading(false)
        }

    }

    return (
        <div className="w-110 h-150 border-2 rounded-2xl flex flex-col border-secondary bg-primary shadow-2xl ">
            <div className="flex items-center justify-center w-110 h-30">
                <h1 className="text-center font-bold text-secondary">Registration Page</h1>
            </div>
            <div className="flex flex-col items-center justify-center h-120">
                {loading && <p>Loading...</p>}
                {error && <p className="text-red-600">{error}</p>}
                <form onSubmit={handleFormSubmit}>
                    <div className="w-60">
                        <input name="firstName" value={state.firstName} onChange={handleChange} className=""type="text" placeholder="First Name"/>
                        <input name="lastName" value={state.lastName} onChange={handleChange} type="text" placeholder="Last Name"/>
                    </div>
                    <div className="h-60 w-60 flex flex-col">
                        <input name="email" value={state.email} onChange={handleChange} type="email" placeholder="MyIIT Email"/>
                        <input name="idNumber" value={state.idNumber} onChange={handleChange} type="text" placeholder="ID Number(XXXX-XXXX)"/>
                        <input name="password" value={state.password} onChange={handleChange} type={showPassword ? "text" : "password"} placeholder="Password"/>
                        <input name="confirmPassword" value={state.confirmPassword} onChange={handleChange} type={showPassword ? "text" : "password"} placeholder="Confirm Password"/>
                        {passError && <p className="text-red-600">{passError}</p>}
                        <div className="flex items-center">
                            <input className="relative top-0.5" type="checkbox" checked={showPassword} onChange={() => {setShowPassword(prev => !prev)}}/>
                            <label className="mx-1">Show Password</label>
                        </div>
                        <Link href="/register">
                            <p
                                className="no-underline hover:underline cursor-pointer"
                                onClick={() => setRole("STUDENT")}
                            >
                                You're a student? Register here.
                            </p>
                        </Link>
                        <button 
                            type="submit" 
                            className="button-style"
                            disabled={!isFilled || passError !== null || loading}
                        >{loading ? "Registering..." : "Register"}</button>
                    </div>                    
                </form>
            </div>
        </div>
    )
}