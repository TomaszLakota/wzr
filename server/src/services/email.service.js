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

class EmailService {
  async sendEmail(options) {
    try {
      const info = await transporter.sendMail(options);
      return info;
    } catch (error) {
      console.error('Błąd podczas wysyłania emaila:', error);
      throw error;
    }
  }
}

export default new EmailService();
