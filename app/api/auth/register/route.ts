import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendVerificationEmail } from "@/lib/email"
import bcrypt from "bcrypt"
import crypto from "crypto"
import { rateLimit, getClientIP } from "@/lib/ratelimit"

export async function POST(req: Request) {
  const ip = getClientIP(req)
  const result = rateLimit.auth(ip)

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please try again later." },
      { status: 429 }
    )
  }

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

    if (role !== 'STUDENT' && role !== 'STAFF' && role !== 'ALUMNI' && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, message: "Invalid role." },
        { status: 400 }
      )
    }

    const salt = await bcrypt.genSalt(12)
    const hashedPassword = await bcrypt.hash(password, salt)

    if (role === 'STUDENT' || role === 'ALUMNI') {
      const verificationToken = crypto.randomUUID()

      await prisma.user.create({
        data: {
          name,
          email,
          idNumber,
          password: hashedPassword,
          college,
          course,
          role,
          verified: false,
          verificationToken,
        }
      })

      await sendVerificationEmail(email, verificationToken)

      return NextResponse.json(
        { success: true, message: `${role} registration successful. Please check your email to verify your account.` },
        { status: 201 }
      )
    }

    if (role === 'STAFF') {
      await prisma.user.create({
        data: {
          name,
          email,
          idNumber,
          password: hashedPassword,
          college,
          course,
          role,
          verified: false,
        }
      })

      return NextResponse.json(
        { success: true, message: "Staff registration successful. Your account must be verified by an administrator before you can log in." },
        { status: 201 }
      )
    }

    if (role === 'ADMIN') {
      await prisma.user.create({
        data: {
          name,
          email,
          idNumber,
          password: hashedPassword,
          college,
          course,
          role,
          verified: true,
        }
      })

      return NextResponse.json(
        { success: true, message: "Admin registration successful." },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { success: false, message: "Invalid role." },
      { status: 400 }
    )
  } catch (error) {
    console.error("REGISTER ERROR:", error)

    return NextResponse.json(
      { status: false, message: "Server error" },
      { status: 500 }
    )
  }
}
