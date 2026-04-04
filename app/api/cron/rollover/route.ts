import { NextResponse } from "next/server"
import { runRollover } from "@/lib/rollover"

export async function GET() {
    try {
        const result = await runRollover()
        return NextResponse.json({
            success: true,
            message: `Rollover complete. ${result.requeued} requests requeued.`,
            ...result,
        })
    } catch (err) {
        console.error("ROLLOVER ERROR:", err)
        return NextResponse.json(
            { success: false, message: "Rollover failed" },
            { status: 500 }
        )
    }
}
