import { Link } from "react-router-dom";
import { TelegramBanner } from "./TelegramBanner";
import { SEO_CATEGORY_PAGES } from "@/lib/seo";

export const Footer = () => {
  return (
    <>
      <TelegramBanner />
      <footer className="border-t border-border/60 bg-background mt-12 py-10 px-4 lg:px-16">
        <div className="max-w-6xl mx-auto space-y-8">
          <section className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="text-lg font-semibold text-foreground">
              Watch Free Movies &amp; TV Shows on Moonflix
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Moonflix.site and{" "}
              <a
                href="https://moonflix.in/"
                rel="noopener noreferrer"
                className="text-foreground/80 underline underline-offset-4 hover:text-primary transition-colors"
              >
                moonflix.in
              </a>{" "}
              let you stream Bollywood, Hollywood, Hindi dubbed, anime, and web series in HD.
              Browse by category or open any title for synopsis, ratings, and similar picks.
            </p>
          </section>

          <nav aria-label="Browse categories" className="border-t border-border pt-6">
            <h3 className="text-sm font-medium text-foreground text-center mb-4">
              Popular categories
            </h3>
            <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm">
              {SEO_CATEGORY_PAGES.map((cat) => (
                <li key={cat.path}>
                  <Link
                    to={cat.path}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {cat.h1}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  to="/movies"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  All Movies
                </Link>
              </li>
              <li>
                <Link
                  to="/tv-shows"
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  All TV Shows
                </Link>
              </li>
            </ul>
          </nav>

          <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Learn more on our{" "}
            <Link
              to="/what-is-moonflix"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              About Moonflix
            </Link>{" "}
            page.
          </p>

          <div className="border-t border-border pt-6">
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Link
                to="/disclaimer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Disclaimer
              </Link>
              <Link
                to="/what-is-moonflix"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                What is Moonflix?
              </Link>
              <a
                href="/sitemap.xml"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sitemap
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
