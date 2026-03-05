// Test script to run the createNotice server action directly to get the real error
import { createNotice } from "./actions/admin/notices.js"
import { prisma } from "./lib/db.js"

// mock session context 
jest.mock('next-auth', () => ({
    getServerSession: jest.fn().mockResolvedValue({ user: { id: "test", role: "ADMIN" } })
}))

async function run() {
    console.log("Running createNotice payload directly...");

    // fetch an admin user to use their ID for authorId constraint
    const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })

    try {
        const result = await createNotice({
            title: "Test Notice",
            content: "Test Content",
            isImportant: false,
            type: "GENERAL"
        });
        console.log("Result:", result);
    } catch (e) {
        console.error("CAUGHT ERROR:", e);
    }
}

run().catch(console.error);
