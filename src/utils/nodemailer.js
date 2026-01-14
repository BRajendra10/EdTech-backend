import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendOtp(email, otp) {
    await transporter.sendMail({
        from: `EdTech <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your verification code",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
                <h2>Email Verification</h2>

                <p>Your verification code is:</p>

                <div style="
                    font-size: 24px;
                    font-weight: bold;
                    letter-spacing: 3px;
                    margin: 12px 0;
                ">
                    {${otp}}
                </div>

                <p style="font-size: 13px; color: #555;">
                    This code expires in 10 minutes.
                </p>
            </div>
            `,
    });
}