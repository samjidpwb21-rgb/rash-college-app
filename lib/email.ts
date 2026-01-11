// ============================================================================
// EMAIL SERVICE - OTP DELIVERY
// ============================================================================
// Nodemailer configuration for sending OTP verification emails

import nodemailer from "nodemailer"

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
})

// Verify transporter configuration on import
transporter.verify((error, success) => {
    if (error) {
        console.error("Email transporter verification failed:", error)
    } else {
        console.log("Email server is ready to send messages")
    }
})

/**
 * Send OTP verification email
 * @param email Recipient email address
 * @param otp 6-digit OTP code
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"R.A.S.H College App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Your R.A.S.H College App Verification Code",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Email Verification</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>Thank you for registering with <strong>R.A.S.H College App</strong>. To complete your registration, please verify your email address using the code below:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; font-size: 14px; color: #666;">Your Verification Code</p>
                                <p class="otp-code">${otp}</p>
                            </div>
                            
                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            
                            <p>If you didn't request this code, please ignore this email.</p>
                            
                            <p>Best regards,<br>R.A.S.H College App Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hello,

Your verification code for R.A.S.H College App registration is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
R.A.S.H College App Team
            `.trim(),
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("OTP email sent successfully:", info.messageId)
        return true
    } catch (error) {
        console.error("Failed to send OTP email:", error)
        return false
    }
}

/**
 * Send password reset OTP email
 * @param email Recipient email address
 * @param otp 6-digit OTP code
 * @returns Promise<boolean> - true if sent successfully
 */
export async function sendPasswordResetEmail(email: string, otp: string): Promise<boolean> {
    try {
        const mailOptions = {
            from: process.env.SMTP_FROM || `"R.A.S.H College App" <${process.env.SMTP_USER}>`,
            to: email,
            subject: "Password Reset Request - R.A.S.H College App",
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 36px; font-weight: bold; color: #667eea; letter-spacing: 8px; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; border-radius: 4px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Password Reset Request</h1>
                        </div>
                        <div class="content">
                            <p>Hello,</p>
                            <p>We received a request to reset your password for your <strong>R.A.S.H College App</strong> account. Use the verification code below to reset your password:</p>
                            
                            <div class="otp-box">
                                <p style="margin: 0; font-size: 14px; color: #666;">Your Password Reset Code</p>
                                <p class="otp-code">${otp}</p>
                            </div>
                            
                            <p><strong>This code will expire in 10 minutes.</strong></p>
                            
                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged.
                            </div>
                            
                            <p>Best regards,<br>R.A.S.H College App Team</p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message. Please do not reply to this email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Hello,

We received a request to reset your password for your R.A.S.H College App account.

Your password reset code is: ${otp}

This code will expire in 10 minutes.

SECURITY NOTICE: If you didn't request a password reset, please ignore this email. Your password will remain unchanged.

Best regards,
R.A.S.H College App Team
            `.trim(),
        }

        const info = await transporter.sendMail(mailOptions)
        console.log("Password reset email sent successfully:", info.messageId)
        return true
    } catch (error) {
        console.error("Failed to send password reset email:", error)
        return false
    }
}

