import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/Footer";

// Re-use the marketing homepage content (no duplication)
import MarketingHomePage from "./(marketing)/page";

export default function RootPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <MarketingHeader />

      <main className="mx-auto max-w-md px-4">
        <MarketingHomePage />
      </main>

      <MarketingFooter />
    </div>
  );
}