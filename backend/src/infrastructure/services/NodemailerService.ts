import nodemailer from "nodemailer";
import type { IMailService } from "../../application/interfaces/services/IMailServices.js";

export class NodemailerMailService implements IMailService {
    private readonly _transporter;

    constructor() {
        this._transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
    }

    async sendOtpEmail(email: string, otp: string): Promise<void> {
        const mailOptions = {
            from: `"Project 2.0 Auth" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Your OTP Verification Code",
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; border: 1px solid #e0e0e0; border-radius: 8px;">
                    <h2 style="color: #333;">Email Verification</h2>
                    <p style="color: #555;">Thank you for signing up. Please use the following OTP code to verify your account:</p>
                    <div style="background-color: #f4f4f4; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
                        <h1 style="color: #2D8CFF; letter-spacing: 5px; margin: 0;">${otp}</h1>
                    </div>
                    <p style="color: #888; font-size: 12px;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
                </div>
            `,
        };

        await this._transporter.sendMail(mailOptions);
    }
}