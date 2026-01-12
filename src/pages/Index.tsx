import { ImageUploader } from "@/components/ImageUploader";
import { AnalysisResults } from "@/components/AnalysisResults";
import { useSkinAnalysis } from "@/hooks/useSkinAnalysis";
import { Sparkles, Shield, Zap } from "lucide-react";

const Index = () => {
  const { isLoading, results, imageUrl, error, analyzeImage, reset } = useSkinAnalysis();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="font-display text-xl font-semibold">Dermalyze</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </a>
            <a href="#privacy" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
          </nav>
        </div>
      </header>

      <main className="container max-w-4xl mx-auto px-4 py-8 md:py-12">
        {!results ? (
          <>
            {/* Hero Section */}
            <section className="text-center mb-12 animate-fade-in">
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
                AI-Powered
                <br />
                <span className="text-accent">Skin Analysis</span>
              </h1>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
                Get a comprehensive analysis of your skin health and personalized product recommendations in seconds.
              </p>
            </section>

            {/* Upload Section */}
            <section className="max-w-lg mx-auto mb-16">
              <ImageUploader onImageSelect={analyzeImage} isLoading={isLoading} />

              {/* Error Display */}
              {error && !isLoading && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mt-0.5">
                      <span className="text-red-600 dark:text-red-400 text-xs font-bold">!</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">Analysis Failed</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                      <button
                        onClick={reset}
                        className="mt-3 text-xs font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Features */}
            <section id="how-it-works" className="grid md:grid-cols-3 gap-6 mb-16 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Zap className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Instant Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Advanced AI analyzes 11 skin metrics in under 30 seconds for accurate results.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized product suggestions based on your unique skin concerns.
                </p>
              </div>
              <div className="p-6 rounded-lg border border-border bg-card hover:border-accent/50 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-lg font-semibold mb-2">Privacy First</h3>
                <p className="text-sm text-muted-foreground">
                  Your photos are analyzed and immediately deleted. We never store your images.
                </p>
              </div>
            </section>

            {/* What We Analyze */}
            <section className="mb-16 animate-slide-up" style={{ animationDelay: "0.3s" }}>
              <h2 className="font-display text-2xl font-bold text-center mb-8">What We Analyze</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  "Acne & Blemishes",
                  "Wrinkles",
                  "Pore Size",
                  "Skin Texture",
                  "Hydration",
                  "Oil Balance",
                  "Redness",
                  "Dark Circles",
                  "Firmness",
                  "Radiance",
                  "Dark Spots",
                ].map((item) => (
                  <span
                    key={item}
                    className="px-4 py-2 rounded-full border border-border text-sm hover:border-accent hover:text-accent transition-colors cursor-default"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section>
            <div className="text-center mb-8">
              <h2 className="font-display text-3xl font-bold mb-2">Your Skin Analysis</h2>
              <p className="text-muted-foreground">Based on AI-powered computer vision analysis</p>
            </div>
            <AnalysisResults results={results} imageUrl={imageUrl!} onReset={reset} />
          </section>
        )}
      </main>

      {/* Footer */}
      <footer id="privacy" className="border-t border-border mt-auto">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-accent-foreground" />
              </div>
              <span className="font-display font-semibold text-foreground">Dermalyze</span>
            </div>
            <p className="text-center md:text-left">
              Powered by Perfect Corp AI. Photos are processed securely and never stored.
            </p>
            <p>© {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
