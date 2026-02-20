import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export async function sendOtp(email, otp, subject) {
    await transporter.sendMail({
        from: `EdTech <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; color: #111;">
                <h2>${subject}</h2>
                <span>${otp}</span>
            </div>
            `,
    });
}