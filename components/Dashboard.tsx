'use client'

import { requestInitialState, requestReducer } from "@/reducers/request"
import axios from "axios"
import { useSession } from "next-auth/react"
import { useReducer, useState } from "react"

const documents: string[] = ["Certificate of Grades", "Certificate of Good Moral", "Transciption of Records", "Diploma"]

export default function Dashboard () {
    const [state, dispatch] = useReducer(requestReducer, requestInitialState)
    const [requests, setRequests] = useState({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<String | null>(null)
    const { data: session, status } = useSession()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target

        dispatch({
            type: 'SET_FIELD',
            field: name,
            value
        })
    }

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const res = await axios.post("/api/student/request", state)

            setLoading(false)

            if (res.status !== 201) {
                setError(res.data.message)
            }
        } catch (err: any) {
            console.log(err.response)
            setError(err.response?.data?.message || "Server Error")
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col w-100 h-129 bg-primary">
            <form>
                
            </form>
        </div>
    )
}