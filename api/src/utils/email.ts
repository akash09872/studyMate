import nodemailer from 'nodemailer';

// In development, log to console instead of sending real email
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Development: log to console
  return {
    sendMail: async (options: any) => {
      console.log('\n📧 [DEV EMAIL]');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Text: ${options.text || options.html}`);
      console.log('─'.repeat(50));
      return { messageId: 'dev-' + Date.now() };
    },
  };
};

const transporter = createTransporter();

export const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'StudyMate <noreply@studymate.com>',
    ...options,
  });
};

export const sendOTPEmail = async (email: string, otp: string, type: 'verify' | 'reset') => {
  const subject = type === 'verify' ? 'Verify Your Email - StudyMate' : 'Password Reset - StudyMate';
  const action = type === 'verify' ? 'verify your email' : 'reset your password';

  await sendEmail({
    to: email,
    subject,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Inter, sans-serif; background: #0A0A0A; color: #F0F0F0; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1A1A1A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
          <h1 style="color: #C8F135; font-size: 28px; margin-bottom: 8px;">StudyMate</h1>
          <p style="color: #9CA3AF; margin-bottom: 32px;">Academic Collaboration Platform</p>
          <h2 style="font-size: 20px; margin-bottom: 16px;">Your OTP Code</h2>
          <p style="color: #9CA3AF; margin-bottom: 24px;">Use this code to ${action}:</p>
          <div style="background: #0A0A0A; border: 2px solid #C8F135; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #C8F135;">${otp}</span>
          </div>
          <p style="color: #6B7280; font-size: 14px;">This code expires in 10 minutes. Never share it with anyone.</p>
        </div>
      </body>
      </html>
    `,
    text: `Your StudyMate OTP: ${otp}. Expires in 10 minutes.`,
  });
};

export const sendApprovalEmail = async (
  email: string,
  resourceTitle: string,
  approved: boolean,
  reason?: string
) => {
  await sendEmail({
    to: email,
    subject: `Resource ${approved ? 'Approved ✅' : 'Rejected ❌'} - ${resourceTitle}`,
    html: `
      <div style="font-family: Inter, sans-serif; background: #0A0A0A; color: #F0F0F0; padding: 40px;">
        <div style="max-width: 480px; margin: 0 auto; background: #1A1A1A; border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.06);">
          <h1 style="color: #C8F135;">StudyMate</h1>
          <h2>${approved ? '🎉 Your resource was approved!' : '❌ Your resource was rejected'}</h2>
          <p><strong>${resourceTitle}</strong></p>
          ${reason ? `<p style="color: #9CA3AF;">Reason: ${reason}</p>` : ''}
          ${approved ? '<p style="color: #C8F135;">+50 XP earned! Check your profile to see your new stats.</p>' : ''}
          <a href="${process.env.FRONTEND_URL}/resources" style="display: inline-block; background: #C8F135; color: #000; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px;">View Resources</a>
        </div>
      </div>
    `,
  });
};
