import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

export default function TermsPage() {
  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Terms</h1>
      <p className="mt-2 text-slate-700">
        A simple product deserves simple terms.
      </p>

      <Section title="Service">
        <div className="space-y-3">
          <Card>
            <p className="text-sm text-slate-700 leading-relaxed">
              Golf Brain provides mental-performance tools designed to support golfers during practice and play.
              It’s not medical advice and not a replacement for coaching.
            </p>
          </Card>
        </div>
      </Section>

      <Section title="Accounts and responsibility">
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>• You’re responsible for your account access.</p>
          <p>• Don’t misuse the service, attempt to access other users’ data, or disrupt the app.</p>
        </div>
      </Section>

      <Section title="Availability">
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            We aim for high availability, but the service may occasionally be unavailable due to maintenance or outages.
          </p>
        </div>
      </Section>

      <Section title="Changes">
        <div className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <p>
            The product will evolve. If we make material changes to these terms, we’ll update this page.
          </p>
        </div>
      </Section>
    </div>
  );
}