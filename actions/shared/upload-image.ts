"use server"

// ============================================================================
// CAMPUSTRACK - IMAGE UPLOAD UTILITY
// Admin+Faculty file upload with validation
// ============================================================================

import { getSession } from "@/lib/auth"
import { ActionResult, successResponse, errorResponse } from "@/types/api"
import { v2 as cloudinary } from "cloudinary"

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Upload notice image
 * Admin & Faculty access
 */
export async function uploadNoticeImage(formData: FormData): Promise<ActionResult<{ fileUrl: string }>> {
    try {
        // 1. Validate session (Admin or Faculty)
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized: Admin or Faculty access required", "UNAUTHORIZED")
        }

        // 2. Get file from form data
        const file = formData.get("file") as File | null
        if (!file) {
            return errorResponse("No file provided")
        }

        // 3. Validate file type
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return errorResponse("Invalid file type. Only JPG, PNG, and WebP images are allowed.")
        }

        // 4. Validate file size
        if (file.size > MAX_IMAGE_SIZE) {
            return errorResponse(`File size exceeds maximum limit of ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`)
        }

        // 5. Convert File to Buffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // 6. Upload directly to Cloudinary via stream
        const uploadResult = await new Promise<{ secure_url: string }>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "campustrack/notices",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) reject(error)
                    else resolve(result as { secure_url: string })
                }
            )

            // Write buffer to stream and end it
            uploadStream.end(buffer)
        })

        return successResponse({ fileUrl: uploadResult.secure_url }, "Image uploaded successfully")
    } catch (error) {
        console.error("Upload notice image error:", error)
        return errorResponse("Failed to upload image")
    }
}

/**
 * Delete notice image
 * Admin & Faculty access
 */
export async function deleteNoticeImage(imageUrl: string): Promise<ActionResult<{ deleted: boolean }>> {
    try {
        // 1. Validate session (Admin or Faculty)
        const session = await getSession()
        if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "FACULTY")) {
            return errorResponse("Unauthorized", "UNAUTHORIZED")
        }

        // 2. Extract public_id from Cloudinary URL
        // Example URL: https://res.cloudinary.com/do3xxxxxxx/image/upload/v1234567/campustrack/notices/filename.jpg
        // We need to extract: "campustrack/notices/filename"
        const isCloudinary = imageUrl.includes("cloudinary.com")

        if (isCloudinary) {
            // Split by '/' and get everything after 'upload/'
            const parts = imageUrl.split("/")
            const uploadIndex = parts.indexOf("upload")

            if (uploadIndex !== -1) {
                // Remove version tag (v1234567) if present, then join the rest
                let publicIdParts = parts.slice(uploadIndex + 1)
                if (publicIdParts[0].startsWith("v") && !isNaN(parseInt(publicIdParts[0].substring(1)))) {
                    publicIdParts = publicIdParts.slice(1)
                }

                // Join back together and remove file extension
                let publicId = publicIdParts.join("/")
                const lastDotIndex = publicId.lastIndexOf(".")
                if (lastDotIndex !== -1) {
                    publicId = publicId.substring(0, lastDotIndex)
                }

                if (publicId) {
                    // 3. Delete from Cloudinary
                    const result = await cloudinary.uploader.destroy(publicId)
                    if (result.result === "ok") {
                        return successResponse({ deleted: true }, "Image deleted successfully")
                    }
                }
            }
        } else {
            // Fallback for old local files if any exist (won't work on Vercel, but good for local dev transition)
            const { existsSync } = require("fs")
            const { unlink } = require("fs/promises")
            const { join } = require("path")
            const filePath = join(process.cwd(), "public", imageUrl)
            if (existsSync(filePath)) {
                await unlink(filePath)
                return successResponse({ deleted: true }, "Local image deleted successfully")
            }
        }

        return successResponse({ deleted: false }, "Image not found or could not be deleted")
    } catch (error) {
        console.error("Delete notice image error:", error)
        return errorResponse("Failed to delete image")
    }
}
