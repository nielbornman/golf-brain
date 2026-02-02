import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

export default function PrivacyPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Privacy</h1>
      <p className="mt-2 text-slate-700">
        Golf Brain is designed to be calm, useful, and respectful of your data.
      </p>

      <Section title="What we collect">
        <div className="space-y-3">
          <Card>
            <div className="text-sm font-semibold text-slate-900">Account data</div>
            <p className="mt-2 text-sm text-slate-700">
              Email and basic profile info required to sign in and keep your data private to you.
            </p>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-900">Product data</div>
            <p className="mt-2 text-sm text-slate-700">
              Your scorecard entries, reflections, and settings — used to run the app and improve your experience.
            </p>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-900">Marketing forms</div>
            <p className="mt-2 text-sm text-slate-700">
              If you register interest or contact us, we store the message to respond.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="How we use it">
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>• To provide the service (sign-in, saving your data, syncing across devices).</p>
          <p>• To support you (responding to contact requests).</p>
          <p>• To improve the product (aggregate learning, never selling your personal data).</p>
        </div>
      </Section>

      <Section title="Your choices">
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>• You can request deletion of your account and associated data.</p>
          <p>• You can opt out of any marketing messages at any time.</p>
        </div>
      </Section>
    </div>
  );
}