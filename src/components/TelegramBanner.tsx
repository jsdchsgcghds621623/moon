import { ExternalLink } from "lucide-react";

export const TelegramBanner = () => {
  return (
    <div className="w-full py-8 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="max-w-4xl mx-auto">
        <a
          href="https://t.me/Moonflix_official_Channel"
          target="_blank"
          rel="noopener noreferrer"
          className="block group hover:scale-[1.02] transition-transform duration-300"
        >
          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 lg:p-8 border border-white/10">
            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
              {/* Telegram Logo */}
              <div className="flex-shrink-0">
                <div className="bg-white rounded-xl p-4 lg:p-6 shadow-lg group-hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-blue-500"
                    >
                      <path
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.91 1.21-5.41 3.56-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.47-.81-.26-1.46-.4-1.4-.85.03-.23.36-.47.98-.72 3.85-1.68 6.43-2.79 7.73-3.34 3.68-1.54 4.45-1.8 4.95-1.81.11 0 .35.03.51.17.13.12.17.27.19.38-.01.06-.01.24-.03.42z"
                        fill="currentColor"
                      />
                    </svg>
                    <div className="text-blue-600 font-bold text-lg lg:text-xl">
                      TELEGRAM<br />
                      <span className="text-sm font-medium">CHANNEL</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 text-center lg:text-left">
                <h2 className="text-white text-2xl lg:text-3xl font-bold mb-4 lg:mb-6">
                  Join Our TeleGram Channel Now
                </h2>
                
                <div className="space-y-2 lg:space-y-3">
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-green-400">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-base lg:text-lg font-medium">Latest App/Website Updates</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2 text-green-400">
                    <span className="text-yellow-400 text-lg">⭐</span>
                    <span className="text-base lg:text-lg font-medium">Report Bugs and Errors</span>
                  </div>
                </div>
              </div>

              {/* Arrow Icon */}
              <div className="flex-shrink-0">
                <ExternalLink className="text-white w-6 h-6 lg:w-8 lg:h-8 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
};