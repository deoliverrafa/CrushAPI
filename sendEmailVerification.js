import nodemailer from 'nodemailer';

export async function sendVerificationEmail(userEmail, token) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ytsecretgames38@gmail.com',
            pass: 'awbs uhix srwf krvz' 
        }
    });

    const verificationUrl = `https://crushif.vercel.app/auth/verify?token=${token}`;

    const mailOptions = {
        from: 'deoliverrafa@gmail.com',
        to: userEmail,
        subject: 'Verifique seu e-mail',
        text: `Clique no link para verificar seu e-mail: ${verificationUrl}`,
    };

    await transporter.sendMail(mailOptions);
}