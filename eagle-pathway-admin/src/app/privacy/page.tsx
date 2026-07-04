import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Eagle Pathway',
  description:
    'How Eagle Pathway collects, uses, stores, and protects your personal data, and the choices you have.',
};

// Public, unauthenticated route (lives outside the (dashboard) group) so it can
// be linked from the Google Play listing and from the app's Settings screen.
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12 text-gray-800">
      <h1 className="text-3xl font-bold text-gray-900">Privacy Policy — Eagle Pathway</h1>
      <p className="mt-2 text-sm text-gray-500">
        <strong>Effective date:</strong> 5 June 2026 &middot; <strong>Last updated:</strong> 5 June 2026
      </p>

      <p className="mt-6 leading-relaxed">
        Eagle Pathway (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;the app&rdquo;) helps students in
        Ethiopia and across Africa find scholarships, prepare applications, and connect with tutors.
        This policy explains what personal data we collect, why, how it is stored, and the choices you
        have. By creating an account you agree to this policy.
      </p>

      <Section title="1. Who we are">
        <p>
          Eagle Pathway is operated by the Eagle Pathway team. For any privacy question or request,
          contact us at <ContactEmail />.
        </p>
      </Section>

      <Section title="2. Data we collect">
        <h3 className="mt-4 font-semibold text-gray-900">You provide directly</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Account details:</strong> full name, email address, phone number, and password
            (passwords are handled by our authentication provider and are never visible to us).
          </li>
          <li>
            <strong>Profile / academic details:</strong> city, grade level, GPA, intended degree level,
            fields and countries of interest, English-proficiency status, academic summary, and career
            goals.
          </li>
          <li>
            <strong>Documents you upload:</strong> e.g. transcripts, degree certificates, passport, CV,
            IELTS certificates, statements of purpose, and recommendation letters.
          </li>
          <li>
            <strong>Content you generate:</strong> scholarship applications, statements of purpose,
            tutor bookings, messages, and payment/receipt information you submit.
          </li>
          <li>
            <strong>AI assistant input:</strong> text you send to the in-app assistant, SOP review, or
            mock-interview features.
          </li>
        </ul>

        <h3 className="mt-4 font-semibold text-gray-900">Collected automatically</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Push notification token</strong> (to deliver reminders and updates).
          </li>
          <li>
            <strong>Basic app/diagnostic data</strong> needed to operate the service (e.g. error logs).
          </li>
        </ul>

        <h3 className="mt-4 font-semibold text-gray-900">Device permissions we may request</h3>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Camera &amp; storage / photos:</strong> only to let you upload documents and a
            profile photo.
          </li>
          <li>
            <strong>Notifications:</strong> to send deadline reminders and status updates.
          </li>
        </ul>
        <p className="mt-2">
          These are used only for the stated purpose and only after you grant them.
        </p>
      </Section>

      <Section title="3. How we use your data">
        <ul className="list-disc space-y-1 pl-6">
          <li>Create and manage your account and profile.</li>
          <li>Match you with scholarships and tutors and process applications and bookings.</li>
          <li>Review documents and provide consulting/tutoring services.</li>
          <li>Provide AI-assisted SOP review, an assistant, and mock interviews.</li>
          <li>Send reminders and notifications you have enabled (you can turn these off in Settings).</li>
          <li>Process payments and payouts and keep required transaction records.</li>
          <li>Maintain security, prevent abuse, and comply with law.</li>
        </ul>
        <p className="mt-3">
          We do <strong>not</strong> sell your personal data, and we do <strong>not</strong> use it for
          third-party advertising.
        </p>
      </Section>

      <Section title="4. Where your data is stored and who processes it">
        <p>Your data is stored using trusted service providers acting on our behalf:</p>
        <ul className="mt-2 list-disc space-y-1 pl-6">
          <li>
            <strong>Supabase</strong> — database, authentication, and file storage for your account,
            profile, and documents.
          </li>
          <li>
            <strong>Groq</strong> — processes the text you submit to AI features (SOP review, assistant,
            mock interview) to generate responses. Submit only information you are comfortable sharing
            with an AI processor.
          </li>
          <li>
            <strong>Expo / Google</strong> — delivery of push notifications.
          </li>
          <li>
            <strong>Vercel</strong> — hosting of our backend API used by the AI features.
          </li>
        </ul>
        <p className="mt-3">
          These providers may process data on servers outside your country. We share data with them only
          as needed to run the service.
        </p>
      </Section>

      <Section title="5. Data retention">
        <p>
          We keep your data while your account is active. You can request deletion of your account and
          associated personal data at any time (see Section 7). We may retain limited records where
          required for legal, accounting, or fraud-prevention purposes.
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          We use industry-standard measures including encrypted connections (HTTPS), authenticated
          access, and database row-level security so that you can only access your own data. No system
          is perfectly secure, but we work to protect your information.
        </p>
      </Section>

      <Section title="7. Your rights and choices">
        <ul className="list-disc space-y-1 pl-6">
          <li>
            <strong>Access / correction:</strong> view and edit your profile in the app.
          </li>
          <li>
            <strong>Notifications:</strong> enable or disable each type in Settings.
          </li>
          <li>
            <strong>Account &amp; data deletion:</strong> request deletion in the app (Settings &rarr;
            Delete Account) or by emailing <ContactEmail />. We will delete your personal data except
            where retention is legally required.
          </li>
        </ul>
      </Section>

      <Section title="8. Children">
        <p>
          Eagle Pathway is intended for prospective and current students. If you are a minor, use the
          app only with the involvement of a parent or guardian. Parents may link to a student account to
          support and monitor their child&rsquo;s progress.
        </p>
      </Section>

      <Section title="9. Changes to this policy">
        <p>
          We may update this policy from time to time. Material changes will be reflected by updating the
          &ldquo;Last updated&rdquo; date above and, where appropriate, an in-app notice.
        </p>
      </Section>

      <Section title="10. Contact">
        <p>
          Questions or requests: <ContactEmail />
        </p>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-2 space-y-2 leading-relaxed">{children}</div>
    </section>
  );
}

// Single source of truth for the contact address so it is trivial to update.
const CONTACT_EMAIL = 'support@eaglepathway.app';

function ContactEmail() {
  return (
    <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-blue-700 underline">
      {CONTACT_EMAIL}
    </a>
  );
}
