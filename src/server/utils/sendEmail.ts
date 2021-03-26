import nodemailer from 'nodemailer';
import logger from './logger';

export async function sendEmail(to: string, html: string) {
  const testAccount = await nodemailer.createTestAccount();
  logger.debug(testAccount);

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>',
    to,
    subject: 'Change password',
    html,
  });

  logger.debug(`Message sent: ${info.messageId}`);
  logger.debug(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
}
