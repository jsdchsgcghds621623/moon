import { Link } from 'react-router-dom';

const WhatIsMoonflix = () => {
  return (
    <div className="px-4 lg:px-16">
        <div className="max-w-4xl mx-auto py-12">
          <h1 className="text-4xl font-bold mb-4">What is Moonflix?</h1>
          <p className="text-muted-foreground mb-10 max-w-3xl">
            Moonflix is our streaming discovery experience on{' '}
            <a
              href="https://moonflix.site/"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              moonflix.site
            </a>{' '}
            and{' '}
            <a
              href="https://moonflix.in/"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              moonflix.in
            </a>
            —both are official Moonflix domains. Fans often search{' '}
            <span className="text-foreground/90">moon flix</span>, <span className="text-foreground/90">moonflix site</span>, or{' '}
            <span className="text-foreground/90">moonflix</span> to find us.
          </p>

          <div className="prose prose-lg max-w-none text-muted-foreground space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">How Moonflix works</h2>
              <p>
                Moonflix helps you browse trends, popular movies, and TV series in one place. Use the home
                experience to explore rows like trending titles, new releases, and themed collections, then
                open a title for details and next steps. For the main catalog, go to{' '}
                <Link to="/browse" className="text-foreground underline underline-offset-4 hover:text-primary">
                  Browse
                </Link>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Features</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Discovery-focused home and category pages for movies and TV shows</li>
                <li>Search to find specific titles quickly</li>
                <li>Continue watching and personal lists when you use profiles on the site</li>
                <li>Trailers and rich detail views where available</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Supported devices</h2>
              <p>
                Moonflix runs in your web browser on desktop, tablet, and phone. Use a modern browser for
                the best layout and performance on moonflix.site or moonflix.in.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-3">Brand &amp; domain</h2>
              <p>
                Official domains:{' '}
                <a
                  href="https://moonflix.site/"
                  className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
                >
                  moonflix.site
                </a>{' '}
                and{' '}
                <a
                  href="https://moonflix.in/"
                  className="text-foreground font-medium underline underline-offset-4 hover:text-primary"
                >
                  moonflix.in
                </a>
                . When you see “Moonflix,” “moonflix,” or “moon flix” in search, both URLs lead to the same
                Moonflix experience.
              </p>
            </section>

            <p>
              <Link to="/disclaimer" className="text-foreground underline underline-offset-4 hover:text-primary">
                Disclaimer
              </Link>
              {' · '}
              <Link to="/browse" className="text-foreground underline underline-offset-4 hover:text-primary">
                Start browsing
              </Link>
            </p>
          </div>
        </div>
    </div>
  );
};

export default WhatIsMoonflix;
