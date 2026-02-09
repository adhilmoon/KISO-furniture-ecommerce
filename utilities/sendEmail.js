import nodemailer from "nodemailer"

export const sendOTP = async (email, otp) => {
    const transpoter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    await transpoter.sendMail({
        from: '"KISO furniture" <kisofurniture@gmail.com>',
        to: email,
        subject: "Verify Your Account",
        html: otpTemplate(otp)
    })
    console.log('Email sended')
}
const otpTemplate=(otp)=>{
    return `
    <!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background:#f4f6f8; font-family: Arial, sans-serif;">
    <div style="max-width:520px; margin:40px auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:#2C3E50; padding:20px; text-align:center;">
        <h1 style="margin:0; color:#ffffff; font-size:22px; letter-spacing:1px;">
          KISO
        </h1>
      </div>
      
      <!-- Body -->
      <div style="padding:30px; color:#333;">
        <p style="margin-top:0;">Hello,</p>
        <p>
          You requested to verify your <strong>KISO</strong> account.
          Please use the One-Time Password (OTP) below:
        </p>
        
        <!-- OTP Box -->
        <div style="margin:30px 0; text-align:center;">
          <span style="
            display:inline-block;
            padding:15px 30px;
            font-size:28px;
            letter-spacing:6px;
            color:#2C3E50;
            background:#eef3f6;
            border-radius:8px;
            font-weight:bold;
          ">
            ${otp}
          </span>
        </div>
        
        <p style="font-size:14px; color:#555;">
          This OTP is valid for <strong>1 minute</strong>.  
          Do not share this code with anyone.
        </p>
        
        <hr style="border:none; border-top:1px solid #eee; margin:30px 0;">
        
        <p style="font-size:12px; color:#888;">
          If you did not request this verification, you can safely ignore this email.
        </p>
      </div>
      
      <!-- Footer -->
      <div style="background:#f0f3f6; padding:15px; text-align:center;">
        <p style="margin:0; font-size:12px; color:#2C3E50;">
          © ${new Date().getFullYear()} KISO. All rights reserved.
        </p>
      </div>
      
    </div>
  </body>
</html>   
    `
}