import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncEventsToDbCache } from "@/lib/sync-calendar";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Specifically designed to block and wait for the sync to finish
        const success = await syncEventsToDbCache(session.user.id);

        if (success) {
            return NextResponse.json({ success: true, message: "Sync complete" });
        } else {
            return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
        }
    } catch (error: any) {
        console.error("Manual Sync Error:", error);
        return NextResponse.json(
            { error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
