import Link from "next/link";
import Image from "next/image";
import { getSessionUser } from "@/lib/auth";

export default async function Home() {
  const user = await getSessionUser();

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-8 py-10 lg:py-16 space-y-20 sm:space-y-28">
      {/* Hero Section Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* Left Column: Typography & CTAs */}
        <div className="lg:col-span-7 space-y-8">
          {/* Social Proof Pill Badge */}
          <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-white/90 border border-gray-200/80 shadow-sm text-xs text-gray-700">
            <span className="w-5 h-5 rounded-full bg-gray-950 text-white flex items-center justify-center text-[10px] font-bold">
              ✦
            </span>
            <span className="font-semibold text-gray-950">AI-Verified Coincidences</span>
            <span className="text-gray-300">/</span>
            <span className="text-gray-500">100% Private Until Matched</span>
          </div>

          {/* Hero Main Heading with Logo */}
          <div className="space-y-5">
            <div className="inline-block">
              <Image
                src="/logo.jpg"
                alt="Echoed Logo"
                width={220}
                height={120}
                className="h-16 w-auto object-contain"
                priority
              />
            </div>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-950 leading-[1.12] font-serif">
              Discover that you&apos;re not the only one.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-medium leading-relaxed max-w-xl">
              Ever had a strange coincidence and wondered if someone else lived the exact same thing?
            </p>
            <p className="text-base text-gray-500 leading-relaxed max-w-lg">
              Submit your experience in complete privacy. Our AI quietly searches for parallel accounts across the world — only publishing side-by-side once both authors agree.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            {user ? (
              <>
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-gray-950 hover:bg-black rounded-full transition-all shadow-md hover:shadow-lg gap-2"
                >
                  📰 Go to Community Feed →
                </Link>
                <Link
                  href="/submit"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 rounded-full transition-all shadow-sm"
                >
                  ✍️ Add Post
                </Link>
                <Link
                  href="/profile"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-gray-800 bg-white/80 hover:bg-white border border-gray-200 rounded-full transition-all shadow-sm hover:border-gray-300"
                >
                  👤 My Profile
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center px-7 py-3.5 text-sm font-semibold text-white bg-gray-950 hover:bg-black rounded-full transition-all shadow-md hover:shadow-lg"
                >
                  Share an Experience — It&apos;s Free
                </Link>
                <Link
                  href="/feed"
                  className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-gray-800 bg-white/80 hover:bg-white border border-gray-200 rounded-full transition-all shadow-sm hover:border-gray-300"
                >
                  Browse Global Feed ↗
                </Link>
                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center px-5 py-3.5 text-sm font-medium text-gray-500 hover:text-gray-950 transition-colors"
                >
                  How it Works →
                </Link>
              </>
            )}
          </div>

          {/* Micro Review / Metrics Bar */}
          <div className="pt-6 border-t border-gray-200/80 flex items-center gap-4 text-xs text-gray-500">
            <div className="w-8 h-8 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center text-orange-700 font-bold text-xs">
              🔒
            </div>
            <div>
              <p className="font-semibold text-gray-900">Zero Public Exposure Without Mutual Consent</p>
              <p className="text-gray-500">Filtered for personal identifiers and sensitive information</p>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Graphic & Floating Cards */}
        <div className="lg:col-span-5 relative">
          {/* Main Visual Poster Card with Sunset Coral/Amber Gradient */}
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-orange-400 via-orange-500 to-rose-600 p-8 sm:p-10 text-white overflow-hidden shadow-2xl min-h-[460px] flex flex-col justify-between">
            {/* Background Abstract Glow */}
            <div className="absolute -top-16 -right-16 w-64 h-64 bg-amber-300/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-rose-700/40 rounded-full blur-3xl pointer-events-none" />

            {/* Floating Dialogue Bubble 1 */}
            <div className="relative z-10 self-start inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 text-gray-900 shadow-xl backdrop-blur-md text-xs font-semibold">
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>Did you experience this too?</span>
            </div>

            {/* Floating Dialogue Bubble 2 */}
            <div className="relative z-10 self-end -mr-2 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 text-gray-900 shadow-xl backdrop-blur-md text-xs font-semibold">
              <span className="w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                ✓
              </span>
              <span>Matched with 2 other authors</span>
            </div>

            {/* Bottom Frosted Glass Card (Product Preview) */}
            <div className="relative z-10 mt-auto rounded-3xl bg-white/80 backdrop-blur-xl p-5 border border-white/60 text-gray-900 shadow-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 font-semibold text-[11px]">
                  VERIFIED ECHO
                </span>
                <span className="text-gray-500 font-medium">96% Semantic Similarity</span>
              </div>

              <div>
                <h4 className="font-bold text-sm text-gray-950 font-serif">
                  The Strangers with Identical Pocket Watches
                </h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  &ldquo;We both found an identical antique pocket watch stopped at 4:18 PM on opposite sides of the country...&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <span className="text-amber-500">★</span>
                  <span className="font-semibold text-gray-900">4.9</span>
                  <span>(2 consenting authors)</span>
                </div>
                <Link href="/feed" className="font-bold text-orange-600 hover:text-orange-700">
                  Active Thread →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: What is Echoed? (Simple Plain-English Explanation) */}
      <div className="rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 p-8 sm:p-14 shadow-sm space-y-8">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700">
            <span>✦</span> What is Echoed?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-950 font-serif">
            A safe space to find out if your rare experience has an echo.
          </h2>
          <p className="text-base sm:text-lg text-gray-600 leading-relaxed">
            Many of us have had moments in life that felt uncanny: an eerie coincidence, a synchronized event, a recurring dream of an unfamiliar place, or a sensation that felt too specific to be random.
          </p>
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
            Most people never talk about these moments because they worry about being judged or having their personal stories exposed on public social media. <strong>Echoed changes that.</strong> You record your experience in your personal encrypted vault, completely hidden from the public. Our AI looks for other people who lived the exact same occurrence, and only connects you if you both agree.
          </p>
        </div>

        {/* 3 Simple Everyday Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-100">
          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-gray-950 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              Write in Complete Privacy
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Your story stays locked in your account. No strangers can search, browse, or read your private submissions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              Silent AI Finds Your Twin Story
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Our AI analyzes the underlying meaning of submissions worldwide to find anyone who lived through the exact same anomaly.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50/80 border border-gray-100 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              You Decide If It Goes Live
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              If a match is found, you receive a private preview. It is only shared to the community feed if both authors click &ldquo;Accept&rdquo;.
            </p>
          </div>
        </div>
      </div>

      {/* Section 3: Story Examples / Inspiration */}
      <div className="space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-950 font-serif">
            What Can You Share on Echoed?
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Real human experiences that make you wonder about the nature of connection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 p-6 space-y-3 shadow-sm">
            <span className="text-2xl">🕰️</span>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              Uncanny Coincidences
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Unusual timing, identical heirlooms found in strange places, or chance encounters with identical bizarre details.
            </p>
          </div>

          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 p-6 space-y-3 shadow-sm">
            <span className="text-2xl">🌙</span>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              Synchronized Dreams
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Recurring visions of vivid architectural places, landscapes, or encounters that you have never seen in waking life.
            </p>
          </div>

          <div className="rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 p-6 space-y-3 shadow-sm">
            <span className="text-2xl">💡</span>
            <h3 className="font-bold text-base text-gray-950 font-serif">
              Unexplained Phenomena
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Sensory oddities, shared phantom sounds, unexplainable atmospheric lights, or strange patterns that repeat over years.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom CTA Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-gray-950 to-gray-900 text-white p-8 sm:p-14 text-center space-y-6 shadow-xl">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-4xl font-extrabold font-serif">
            Has something rare happened to you?
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            Record it in your private vault today. It takes less than 2 minutes, and it might just connect you with someone who lived the exact same moment.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {user ? (
            <Link
              href="/submit"
              className="px-7 py-3.5 rounded-full bg-white text-gray-950 text-sm font-semibold hover:bg-gray-100 transition-all shadow-md"
            >
              ✍️ Write Your Experience
            </Link>
          ) : (
            <Link
              href="/signup"
              className="px-7 py-3.5 rounded-full bg-white text-gray-950 text-sm font-semibold hover:bg-gray-100 transition-all shadow-md"
            >
              Get Started — It&apos;s 100% Free
            </Link>
          )}

          <Link
            href="/how-it-works"
            className="px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 transition-all"
          >
            Read the Full Guide →
          </Link>
        </div>
      </div>
    </main>
  );
}
