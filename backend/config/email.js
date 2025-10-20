import sgMail from '@sendgrid/mail';

const sendVerificationEmail = async (email, code) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    const msg = {
      to: email,
      from: process.env.EMAIL_FROM,
      subject: 'TheLùůpa Authentication Confirmation',
      html: `
        <div style="font-family: Arial, sans-serif; text-align: center; color: #333;">
          <h2>Welcome to TheLùůpa!</h2>
          <p>Your one-time login code is:</p>
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 5px; background: #f2f2f2; padding: 10px 20px; border-radius: 5px; display: inline-block;">
            ${code}
          </p>
          <p>This code is valid for 10 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        </div>
      `,
    };

    await sgMail.send(msg);

  } catch (error) {
    console.error('Error sending verification email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
    }
    throw new Error('Failed to send confirmation email.');
  }
};

export { sendVerificationEmail };

