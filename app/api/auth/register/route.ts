import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const { idNumber, email, password, firstName, lastName, college, course, role } = await req.json()

    if (!idNumber || !email || !password || !firstName || !lastName || !role ) {
      return NextResponse.json(
        { success: false, message: "Enter all required fields." },
        { status: 400 }
      )
    }

    const name = firstName + " " + lastName

    if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json(
      { success: false, message: "Email already used." },
      { status: 400 }
    )

    if (await prisma.user.findUnique({ where: { idNumber } })) return NextResponse.json(
      { success: false, message: "ID number already used." },
      { status: 400 }
    )

    if (!/^\d{4}-\d{4}$/.test(idNumber)) return NextResponse.json(
      { success: false, message: "ID number must be XXXX-XXXX format." },
      { status: 400 }
    )

    if (role === 'STUDENT' || role === 'STAFF') {
      const normalizedEmail = email.toLowerCase().trim()
      const domain = normalizedEmail.split("@")[1]

      if (domain !== "g.msuiit.edu.ph") {
        return NextResponse.json(
          { message: "Only MSU-IIT emails are allowed" },
          { status: 400 }
        )
      }
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    await prisma.user.create({
      data: {
        name,
        email,
        idNumber,
        password: hashedPassword,
        college,
        course,
        role
      }
    })

    return NextResponse.json(
      { success: true, message: `${role} registration successful.`},
      { status: 201 } 
    )
  } catch (error) {
    console.error("REGISTER ERROR:", error)

    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    )
  }
}