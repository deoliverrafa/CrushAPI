import nodemailer from "nodemailer";

export async function sendVerificationEmail(userEmail, token) {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Servidor SMTP
    port: 587, // Porta (use 465 para SSL ou 587 para TLS)
    secure: false, // False para TLS, True para SSL
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const verificationUrl = `${process.env.VERIFICATION_EMAIL_API_URL}/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: "support@crushif.app",
    to: userEmail,
    subject: "Verifique seu e-mail",
    html: `
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 20px; background-color: #f4f4f4;">
                <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);">
                    <h1 style="color: #333;">Verifique seu e-mail</h1>
                    <img src="https://i.postimg.cc/zX3sb4zs/login-art.png" alt="Verificação de E-mail" style="width: 100%; max-width: 300px; margin-bottom: 20px;" />
                    <p style="color: #555;">Para confirmar seu e-mail, clique no botão abaixo:</p>
                    <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #db2777; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 10px 0; font-size: 16px;">
                        Verificar e-mail
                    </a>
                    <p style="color: #888; font-size: 12px; margin-top: 20px;">Se você não solicitou essa verificação, ignore este e-mail.</p>
                </div>
                <footer style="margin-top: 20px; color: #aaa; font-size: 12px;">
                    © 2024 CrushIF. Todos os direitos reservados.
                </footer>
            </div>
        `,
  };

  await transporter.sendMail(mailOptions);
}
