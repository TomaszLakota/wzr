import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const emailUser = process.env.EMAIL;
const emailPass = process.env.APPLICATION_SPECIFIC_PASSWORD;

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 465,
  secure: true,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Send welcome email (currently not used)
export async function sendWelcomeEmail(to) {
  const mailOptions = {
    from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
    to: to,
    subject: 'Witamy w naszej aplikacji!',
    text: 'Cieszymy się, że do nas dołączyłeś!',
    html: '<b>Cieszymy się, że do nas dołączyłeś!</b>',
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila:', error);
    throw error;
  }
}

// Send activation email
export async function sendActivationEmail(to, activationLink) {
  const mailOptions = {
    from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
    to: to,
    subject: 'Aktywuj swoje konto - Włoski z Roberto',
    text: `Witaj! Dziękujemy za rejestrację. Kliknij poniższy link, aby aktywować swoje konto: ${activationLink}`,
    html: `<b>Witaj!</b><br><br>Dziękujemy za rejestrację. Kliknij poniższy link, aby aktywować swoje konto:<br><a href="${activationLink}">${activationLink}</a>`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila aktywacyjnego:', error);
    throw error;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(to, resetLink) {
  const mailOptions = {
    from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
    to: to,
    subject: 'Resetowanie hasła - Włoski z Roberto',
    text: `Witaj! Otrzymaliśmy prośbę o zresetowanie Twojego hasła. Kliknij poniższy link, aby zresetować hasło: ${resetLink}. Link wygaśnie po 1 godzinie. Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.`,
    html: `<b>Witaj!</b><br><br>Otrzymaliśmy prośbę o zresetowanie Twojego hasła.<br><br>Kliknij poniższy link, aby zresetować hasło:<br><a href="${resetLink}">${resetLink}</a><br><br>Link wygaśnie po 1 godzinie.<br><br>Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.`,
  };

  try {
    let info = await transporter.sendMail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila resetującego hasło:', error);
    throw error;
  }
}
