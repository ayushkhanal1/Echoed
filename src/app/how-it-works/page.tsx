import Link from "next/link";
import Image from "next/image";

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-8 py-12 sm:py-16 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <Link href="/" className="inline-block hover:opacity-90 transition-opacity">
          <Image
            src="/logo.jpg"
            alt="Echoed Logo"
            width={160}
            height={90}
            className="h-14 w-auto object-contain mx-auto"
            priority
          />
        </Link>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700">
          ✦ Simple Plain-English Guide
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-gray-950 font-serif">
          How Echoed Works
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-xl mx-auto leading-relaxed">
          Echoed helps you discover if someone else in the world has lived through the exact same bizarre coincidence, dream, or life observation as you.
        </p>
      </div>

      {/* 3 Simple Steps */}
      <div className="space-y-8">
        {/* Step 1 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-gray-950 text-white flex items-center justify-center font-bold text-lg shrink-0">
            1
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-950 font-serif">
              Write & Submit in 100% Privacy
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              When you write an experience, it is <strong>never published publicly</strong>. It is stored securely in your private encrypted vault. Your raw text stays strictly private to your account until you choose to connect.
            </p>
            <div className="inline-flex items-center gap-2 pt-2 text-xs font-semibold text-emerald-700">
              <span>🔒 Default is always private — no one can browse or search your private stories.</span>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
            2
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-950 font-serif">
              AI Discovers Parallel Experiences
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              Our intelligent two-stage search engine evaluates contextual meanings and emotional patterns—not just keywords. If someone describes a similar uncanny experience using completely different words, the AI spots the connection.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Meta AI then verifies the candidate match to filter out false positives and writes a neutral 1-sentence summary of what both stories have in common.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="rounded-3xl bg-white/90 backdrop-blur-xl border border-white/90 p-8 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
            3
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-950 font-serif">
              You Choose Whether to Connect & Publish
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              You receive a private notification with the neutral preview summary. You cannot see the other author&apos;s full story, and they cannot see yours.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong>Only when at least 2 matched authors click &ldquo;Accept&rdquo;</strong> does an anonymous shared thread go live on the Home Feed. Community members can then read your parallel stories side-by-side, upvote, and comment anonymously.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Cards */}
      <div className="pt-8 border-t border-gray-200 space-y-6">
        <h3 className="text-2xl font-bold text-gray-950 font-serif text-center">
          Frequently Asked Questions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white/70 border border-white/80 space-y-2">
            <h4 className="font-bold text-sm text-gray-950">Is my real identity ever revealed?</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Never. Stories published in public threads are labeled only as &ldquo;Author #1&rdquo; or &ldquo;Author #2&rdquo;. Even when commenting, you are given a random anonymous pseudonym per thread.
            </p>
          </div>
          <div className="p-6 rounded-3xl bg-white/70 border border-white/80 space-y-2">
            <h4 className="font-bold text-sm text-gray-950">What if no one matches my story?</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your story sits quietly and securely in your private vault. Whenever someone in the future submits an experience that matches, the system will notify you.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center pt-4">
        <Link
          href="/submit"
          className="inline-flex items-center px-8 py-4 rounded-full bg-gray-950 hover:bg-black text-white font-semibold text-sm transition-all shadow-md hover:shadow-lg gap-2"
        >
          Share Your First Experience Now →
        </Link>
      </div>
    </main>
  );
}
