'use client'
import { signOut, useSession } from "next-auth/react"
import Link from "next/link"

export default function Navbar() {
    const { data: session, status } = useSession();

    const notLoggedIn = <div className="h-20 justify-between flex items-center">
        <Link className="mx-3 button-style" href={"/login"}>Login</Link>
        <Link className="mx-3 button-style" href={"/register"}>Register</Link>
    </div>

    const loggedIn = <div className="h-20 flex items-center">
        <Link className="mx-3 button-style" href="/login" onClick={() => signOut()}>Log Out</Link>
    </div>

    return (
        <nav className="flex h-20 fixed w-screen self-start items-center font-bold bg-secondary justify-between text-tertiary">
            <div className="text-center w-60">
                Logo
            </div>
            <div className="w-100 h-20 items-center flex mx-10">
                {!session && notLoggedIn}
                {session && loggedIn}
                <div className="w-40 items-center">
                    <h1 className="text-center">
                        {session ? session.user.name?.trim().split(' ')[0] : "Profile"}
                    </h1>
                </div>
            </div>
        </nav>
    )
}