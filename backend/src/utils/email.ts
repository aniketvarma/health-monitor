import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_SENDER!,
    pass: process.env.GMAIL_APP_PASSWORD!,
  },

  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
});

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await transporter.sendMail({
    from: `"KinLog" <${process.env.GMAIL_SENDER}>`,
    to: email,
    subject: "Login OTP",
    text:
      `Your KinLog sign-in code is ${code}. It expires in 10 minutes. ` +
      `If you didn't request this, you can ignore this email.`,

    html: `<p>Your KinLog sign-in code is <b style="font-size:24px">${code}</b></p>
       <p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
  });
}
