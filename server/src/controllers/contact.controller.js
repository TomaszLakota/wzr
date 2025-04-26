import emailService from '../services/email.service.js';

export const handleContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Proszę podać imię, email i wiadomość' });
    }

    // Send email using the email service
    const timestamp = new Date().toLocaleString('pl-PL');
    const targetEmail = 'wloskizroberto@gmail.com';

    const mailOptions = {
      from: `"Formularz kontaktowy" <${process.env.EMAIL}>`,
      to: targetEmail,
      subject: 'Nowa wiadomość z formularza kontaktowego',
      text: `
        Imię: ${name}
        Email: ${email}
        Data: ${timestamp}
        
        Wiadomość:
        ${message}
      `,
      html: `
        <h2>Nowa wiadomość z formularza kontaktowego</h2>
        <p><strong>Imię:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Data:</strong> ${timestamp}</p>
        <p><strong>Wiadomość:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };
    await emailService.sendEmail(mailOptions);

    // Respond to client
    return res.status(200).json({ message: 'Wiadomość została wysłana' });
  } catch (error) {
    console.error('Błąd podczas przetwarzania formularza kontaktowego:', error);
    return res.status(500).json({ error: 'Wystąpił błąd podczas wysyłania wiadomości' });
  }
};
