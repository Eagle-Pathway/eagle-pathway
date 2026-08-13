/**
 * Resend Email Utility for Eagle Pathway Admin
 * Direct HTTPS fetch implementation targeting Resend API (https://api.resend.com/emails)
 * Configured for verified domain: eaglespathway.com
 */

const RESEND_API_URL = 'https://api.resend.com/emails';
const DEFAULT_SENDER = 'Eagle Pathway <support@eaglespathway.com>';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn('[Resend] Skipping email dispatch: RESEND_API_KEY is not configured in environment.');
    return { success: false, error: 'RESEND_API_KEY is missing' };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: DEFAULT_SENDER,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[Resend] Failed to send email:', data);
      return { success: false, error: data.message || 'Failed to send email via Resend' };
    }

    console.log('[Resend] Email sent successfully to:', to, 'ID:', data.id);
    return { success: true, id: data.id };
  } catch (err: any) {
    console.error('[Resend] Network exception while sending email:', err);
    return { success: false, error: err.message || 'Network exception' };
  }
}

/**
 * Send Tutor Application Approval Email
 */
export async function sendTutorApprovalEmail(params: { to: string; fullName: string }) {
  const { to, fullName } = params;
  const name = fullName || 'Tutor';
  const subject = 'Congratulations! Your Tutor Verification is Approved 🎉';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background-color: #1E4D9B; padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Eagle Pathway</h1>
          <p style="color: #D4AF37; margin: 4px 0 0 0; font-size: 14px; font-weight: 600;">Empowering Ethiopian Education</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #1f2937;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Welcome to the Eagle Pathway Tutor Network, ${name}! 🎉</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Great news! Our administrative team has reviewed and verified your credentials. Your profile is now officially active on <strong>Eagle Pathway</strong>.
          </p>

          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #166534; font-weight: 600;">
              ✓ Profile Verified & Active
            </p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #15803d;">
              You can now browse open tutoring jobs, submit applications, and connect with students and parents across Ethiopia.
            </p>
          </div>

          <h3 style="font-size: 16px; color: #111827; margin-top: 24px;">Next Steps:</h3>
          <ol style="font-size: 14px; color: #4b5563; line-height: 1.6; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Open the <strong>Eagle Pathway Mobile App</strong>.</li>
            <li style="margin-bottom: 8px;">Navigate to the <strong>Jobs</strong> tab on your dashboard.</li>
            <li style="margin-bottom: 8px;">Apply to open tutoring requests matching your subject expertise and preferred schedule.</li>
          </ol>

          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="https://eaglespathway.com" style="background-color: #1E4D9B; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Open Eagle Pathway App
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">If you have any questions, reply directly to this email or contact support at <a href="mailto:support@eaglespathway.com" style="color: #1E4D9B; text-decoration: none;">support@eaglespathway.com</a>.</p>
          <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Eagle Pathway EdTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}

/**
 * Send Tutor Application Rejection / Update Email
 */
export async function sendTutorRejectionEmail(params: { to: string; fullName: string; reason?: string }) {
  const { to, fullName, reason } = params;
  const name = fullName || 'Applicant';
  const subject = 'Eagle Pathway Tutor Application Update';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e5e7eb;">
        <!-- Header -->
        <div style="background-color: #1E4D9B; padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">Eagle Pathway</h1>
          <p style="color: #D4AF37; margin: 4px 0 0 0; font-size: 14px; font-weight: 600;">Empowering Ethiopian Education</p>
        </div>

        <!-- Body -->
        <div style="padding: 32px 24px; color: #1f2937;">
          <h2 style="color: #111827; margin-top: 0; font-size: 20px; font-weight: 600;">Tutor Verification Status Update</h2>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Hello ${name}, thank you for your interest in joining the Eagle Pathway tutor network.
          </p>
          <p style="font-size: 15px; line-height: 1.6; color: #4b5563;">
            Our team has completed the review of your submitted documents and profile details. At this time, we are unable to verify your tutor account.
          </p>

          ${reason ? `
          <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 13px; color: #991b1b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Feedback / Reason:</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #7f1d1d; line-height: 1.5;">
              ${reason}
            </p>
          </div>
          ` : ''}

          <h3 style="font-size: 16px; color: #111827; margin-top: 24px;">How to Re-apply:</h3>
          <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
            You may log back into the <strong>Eagle Pathway Mobile App</strong>, update your profile or re-upload clear transcript/certificate documents, and re-submit your verification application for review.
          </p>

          <div style="text-align: center; margin-top: 32px; margin-bottom: 16px;">
            <a href="https://eaglespathway.com" style="background-color: #1E4D9B; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; display: inline-block;">
              Update Application in App
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">If you believe this decision was made in error, contact support at <a href="mailto:support@eaglespathway.com" style="color: #1E4D9B; text-decoration: none;">support@eaglespathway.com</a>.</p>
          <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} Eagle Pathway EdTech. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({ to, subject, html });
}
