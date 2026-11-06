import nodemailer from "nodemailer";
import type { IMailService } from "@application/interfaces/services/IMailServices";

const OTP_VALID_MINUTES = 10;

/**
 * Builds the HTML for the Kudai verification email.
 *
 * Email-client rules this follows:
 *  - table layout + inline styles only (Gmail/Outlook ignore most <style> CSS)
 *  - no external images (many clients block them), so the logo is text/emoji
 *  - a hidden "preheader" line shows as the preview text in the inbox
 */
function buildOtpEmailHtml(otp: string): string {
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>Your Kudai verification code</title>
</head>
<body style="margin:0;padding:0;background-color:#EEF3FB;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Preheader: inbox preview text -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#EEF3FB;">
    Your Kudai code is ${otp}. It expires in ${OTP_VALID_MINUTES} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EEF3FB;">
    <tr>
      <td align="center" style="padding:32px 12px;">

        <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
               style="width:100%;max-width:560px;background-color:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #DCE6F5;">

          <!-- Header -->
          <tr>
            <td align="center" style="background-color:#2D8CFF;background-image:linear-gradient(135deg,#2D8CFF 0%,#1B63D6 100%);padding:34px 24px 30px;">
              <div style="font-size:34px;line-height:1;margin-bottom:8px;">🏠</div>
              <div style="font-size:28px;font-weight:800;letter-spacing:1px;color:#FFFFFF;">Kudai</div>
              <div style="font-size:13px;color:#D6E8FF;margin-top:6px;letter-spacing:0.3px;">
                Find your people. Find your place.
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:34px 32px 8px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#14233C;">
                Verify your email address
              </h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#4A5B75;">
                Welcome to Kudai! You're one step away from meeting roommates who
                fit your lifestyle and rooms that fit your budget. Enter the code
                below to continue.
              </p>
            </td>
          </tr>

          <!-- OTP box -->
          <tr>
            <td align="center" style="padding:24px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td align="center"
                      style="background-color:#F1F7FF;border:2px dashed #9CC6FF;border-radius:12px;padding:22px 12px;">
                    <div style="font-size:12px;font-weight:600;color:#5B7BA6;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">
                      Your verification code
                    </div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:800;letter-spacing:10px;color:#1B63D6;padding-left:10px;">
                      ${otp}
                    </div>
                  </td>
                </tr>
              </table>
              <p style="margin:14px 0 0;font-size:13px;color:#7A8AA3;">
                ⏱ This code expires in <strong style="color:#14233C;">${OTP_VALID_MINUTES} minutes</strong>.
              </p>
            </td>
          </tr>

          <!-- Why Kudai -->
       

          <!-- Security note -->
          <tr>
            <td style="padding:20px 32px 30px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color:#FFF8E6;border-left:4px solid #F5B301;border-radius:6px;padding:12px 14px;">
                    <p style="margin:0;font-size:12.5px;line-height:1.55;color:#6B5200;">
                      <strong>Keep this code private.</strong> Kudai will never ask
                      you to share it by phone, chat or email. If you didn't request
                      this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color:#F7F9FD;border-top:1px solid #E6EDF8;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#4A5B75;">
                Kudai &middot; Roommate matching made simple
              </p>
              <p style="margin:0;font-size:11px;line-height:1.5;color:#98A5BA;">
                You received this email because this address was used on Kudai.<br />
                &copy; ${year} Kudai. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text version for email clients that don't render HTML (also helps spam filters). */
function buildOtpEmailText(otp: string): string {
    return [
        "Kudai - Find your people. Find your place.",
        "",
        "Verify your email address",
        "",
        `Your verification code is: ${otp}`,
        `This code expires in ${OTP_VALID_MINUTES} minutes.`,
        "",
        "Keep this code private. Kudai will never ask you to share it.",
        "If you didn't request this, you can safely ignore this email.",
    ].join("\n");
}

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
            from: `"Kudai" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `${otp} is your Kudai verification code`,
            text: buildOtpEmailText(otp),
            html: buildOtpEmailHtml(otp),
        };

        await this._transporter.sendMail(mailOptions);
    }
}