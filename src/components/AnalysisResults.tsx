import { useMemo } from "react";
import { ShoppingCart, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SkinConcern {
  type: string;
  ui_score: number;
  raw_score: number;
  mask_urls?: string[];
}

interface AnalysisResultsProps {
  results: SkinConcern[];
  imageUrl: string;
  onReset: () => void;
}

const CONCERN_LABELS: Record<string, { label: string; description: string }> = {
  wrinkle: { label: "Wrinkles", description: "Fine lines" },
  pore: { label: "Pores", description: "Pore visibility" },
  texture: { label: "Texture", description: "Smoothness" },
  acne: { label: "Acne", description: "Blemishes" },
  moisture: { label: "Hydration", description: "Moisture" },
  oiliness: { label: "Oil Control", description: "Sebum balance" },
  redness: { label: "Redness", description: "Irritation" },
  dark_circle_v2: { label: "Dark Circles", description: "Under-eye" },
  firmness: { label: "Firmness", description: "Elasticity" },
  radiance: { label: "Radiance", description: "Glow" },
  age_spot: { label: "Dark Spots", description: "Pigmentation" },
};

const PRODUCT_RECOMMENDATIONS: Record<string, Array<{ name: string; brand: string; amazonSearch: string }>> = {
  acne: [
    { name: "Salicylic Acid Cleanser", brand: "CeraVe", amazonSearch: "CeraVe+Salicylic+Acid+Cleanser" },
    { name: "Niacinamide Serum", brand: "The Ordinary", amazonSearch: "The+Ordinary+Niacinamide+10%25" },
  ],
  wrinkle: [
    { name: "Retinol Serum", brand: "Paula's Choice", amazonSearch: "Paula's+Choice+1%25+Retinol" },
    { name: "Peptide Cream", brand: "Olay", amazonSearch: "Olay+Regenerist+Cream" },
  ],
  moisture: [
    { name: "Hyaluronic Acid", brand: "The Ordinary", amazonSearch: "The+Ordinary+Hyaluronic+Acid" },
    { name: "Ceramide Cream", brand: "CeraVe", amazonSearch: "CeraVe+Moisturizing+Cream" },
  ],
  oiliness: [
    { name: "Oil-Free Gel", brand: "Neutrogena", amazonSearch: "Neutrogena+Hydro+Boost" },
    { name: "Clay Mask", brand: "Aztec Secret", amazonSearch: "Aztec+Healing+Clay" },
  ],
  pore: [
    { name: "BHA Exfoliant", brand: "Paula's Choice", amazonSearch: "Paula's+Choice+2%25+BHA" },
    { name: "Niacinamide", brand: "The Inkey List", amazonSearch: "Inkey+List+Niacinamide" },
  ],
  redness: [
    { name: "Centella Serum", brand: "COSRX", amazonSearch: "COSRX+Centella+Cream" },
    { name: "Azelaic Acid", brand: "The Ordinary", amazonSearch: "The+Ordinary+Azelaic+Acid" },
  ],
  dark_circle_v2: [
    { name: "Caffeine Serum", brand: "The Ordinary", amazonSearch: "The+Ordinary+Caffeine+5%25" },
    { name: "Retinol Eye Cream", brand: "RoC", amazonSearch: "RoC+Retinol+Eye+Cream" },
  ],
  texture: [
    { name: "AHA Exfoliant", brand: "The Ordinary", amazonSearch: "The+Ordinary+Glycolic+Acid" },
    { name: "Enzyme Cleanser", brand: "Tatcha", amazonSearch: "Tatcha+Rice+Polish" },
  ],
  radiance: [
    { name: "Vitamin C Serum", brand: "Drunk Elephant", amazonSearch: "Drunk+Elephant+C-Firma" },
    { name: "Glow Toner", brand: "Pixi", amazonSearch: "Pixi+Glow+Tonic" },
  ],
  firmness: [
    { name: "Peptide Serum", brand: "The Ordinary", amazonSearch: "The+Ordinary+Buffet" },
    { name: "Collagen Cream", brand: "Elemis", amazonSearch: "Elemis+Pro-Collagen+Cream" },
  ],
  age_spot: [
    { name: "Alpha Arbutin", brand: "The Ordinary", amazonSearch: "The+Ordinary+Alpha+Arbutin" },
    { name: "Dark Spot Corrector", brand: "Murad", amazonSearch: "Murad+Age+Spot+Serum" },
  ],
};

function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

function getScoreStatus(score: number): { icon: typeof CheckCircle; text: string } {
  if (score >= 80) return { icon: CheckCircle, text: "Great" };
  if (score >= 60) return { icon: TrendingUp, text: "Good" };
  return { icon: AlertCircle, text: "Needs Care" };
}

export function AnalysisResults({ results, imageUrl, onReset }: AnalysisResultsProps) {
  const sortedResults = useMemo(() => {
    return [...results].sort((a, b) => a.ui_score - b.ui_score);
  }, [results]);

  const overallScore = useMemo(() => {
    if (!results || results.length === 0) return 0;

    // Filter out any invalid scores and ensure we have valid numbers
    const validScores = results
      .map(r => r.ui_score)
      .filter(score => typeof score === 'number' && !isNaN(score) && score >= 0 && score <= 100);

    if (validScores.length === 0) return 0;

    const sum = validScores.reduce((acc, score) => acc + score, 0);
    const avg = sum / validScores.length;

    return Math.round(avg);
  }, [results]);

  const topConcerns = useMemo(() => {
    return sortedResults.filter(r => r.ui_score < 70).slice(0, 3);
  }, [sortedResults]);

  const recommendedProducts = useMemo(() => {
    const products: Array<{ name: string; brand: string; amazonSearch: string; forConcern: string }> = [];

    topConcerns.forEach(concern => {
      const concernProducts = PRODUCT_RECOMMENDATIONS[concern.type];
      if (concernProducts) {
        concernProducts.forEach(product => {
          products.push({ ...product, forConcern: CONCERN_LABELS[concern.type]?.label || concern.type });
        });
      }
    });

    return products.slice(0, 4);
  }, [topConcerns]);

  return (
    <div className="grid md:grid-cols-[400px,1fr] gap-6 animate-fade-in">
      {/* Left: Image */}
      <div className="space-y-4">
        <img
          src={imageUrl}
          alt="Analysis"
          className="w-full rounded-lg border border-border"
        />
        <div className="text-center p-4 rounded-lg bg-secondary/50">
          <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-4xl font-display font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}
            </span>
            <span className="text-xl text-muted-foreground">/100</span>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={onReset}
        >
          Analyze Another Photo
        </Button>
      </div>

      {/* Right: Results */}
      <div className="space-y-6">
        {/* Scores Grid */}
        <div>
          <h3 className="font-display text-lg mb-3">Skin Analysis</h3>
          <div className="grid grid-cols-2 gap-2">
            {sortedResults.map((concern) => {
              const info = CONCERN_LABELS[concern.type] || { label: concern.type, description: "" };
              const status = getScoreStatus(concern.ui_score);
              const StatusIcon = status.icon;

              return (
                <div key={concern.type} className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <StatusIcon className={`w-3.5 h-3.5 ${getScoreColor(concern.ui_score)}`} />
                      <span className="text-sm font-medium">{info.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(concern.ui_score)}`}>
                      {concern.ui_score}
                    </span>
                  </div>
                  <Progress value={concern.ui_score} className="h-1.5" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Product Recommendations */}
        {recommendedProducts.length > 0 && (
          <div>
            <h3 className="font-display text-lg mb-3">Recommended Products</h3>
            <div className="grid gap-2">
              {recommendedProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-accent transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{product.brand}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent">
                        {product.forConcern}
                      </span>
                    </div>
                  </div>
                  <a
                    href={`https://www.amazon.com/s?k=${product.amazonSearch}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3"
                  >
                    <Button size="sm" variant="outline" className="gap-1.5 h-8">
                      <ShoppingCart className="w-3 h-3" />
                      Buy
                    </Button>
                  </a>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Links open on Amazon. Consult a dermatologist for personalized advice.
            </p>
          </div>
        )}

        {/* Routine */}
        <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
          <h4 className="text-sm font-medium mb-2">Daily Routine</h4>
          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>AM:</strong> Cleanser → Serum → Moisturizer → SPF 30+</p>
            <p><strong>PM:</strong> Cleanser → Treatment → Night Cream</p>
            <p><strong>Weekly:</strong> Exfoliate 2-3x, Mask 1-2x</p>
          </div>
        </div>
      </div>
    </div>
  );
}
