import emailService from '../services/email.service.js';

// Send welcome email (currently not used)
export async function sendWelcomeEmail(to) {
  try {
    const mailOptions = {
      from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
      to: to,
      subject: 'Witamy w naszej aplikacji!',
      text: 'Cieszymy się, że do nas dołączyłeś!',
      html: '<b>Cieszymy się, że do nas dołączyłeś!</b>',
    };
    let info = await emailService.sendEmail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila:', error);
    throw error;
  }
}

// Send activation email
export async function sendActivationEmail(to, activationLink) {
  try {
    const mailOptions = {
      from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
      to: to,
      subject: 'Aktywuj swoje konto - Włoski z Roberto',
      text: `Witaj! Dziękujemy za rejestrację. Kliknij poniższy link, aby aktywować swoje konto: ${activationLink}`,
      html: `<b>Witaj!</b><br><br>Dziękujemy za rejestrację. Kliknij poniższy link, aby aktywować swoje konto:<br><a href="${activationLink}">${activationLink}</a>`,
    };
    let info = await emailService.sendEmail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila aktywacyjnego:', error);
    throw error;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(to, resetLink) {
  try {
    const mailOptions = {
      from: `"Włoski z Roberto" <${process.env.EMAIL}>`,
      to: to,
      subject: 'Resetowanie hasła - Włoski z Roberto',
      text: `Witaj! Otrzymaliśmy prośbę o zresetowanie Twojego hasła. Kliknij poniższy link, aby zresetować hasło: ${resetLink}. Link wygaśnie po 1 godzinie. Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.`,
      html: `<b>Witaj!</b><br><br>Otrzymaliśmy prośbę o zresetowanie Twojego hasła.<br><br>Kliknij poniższy link, aby zresetować hasło:<br><a href="${resetLink}">${resetLink}</a><br><br>Link wygaśnie po 1 godzinie.<br><br>Jeśli nie prosiłeś o zresetowanie hasła, zignoruj tę wiadomość.`,
    };
    let info = await emailService.sendEmail(mailOptions);
    return info;
  } catch (error) {
    console.error('Błąd podczas wysyłania emaila resetującego hasło:', error);
    throw error;
  }
}
