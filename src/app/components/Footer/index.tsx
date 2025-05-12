import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

interface FooterProps {
  className?: string;
  showSocialLinks?: boolean;
}

const SocialIcons = ({ isYouTube = true }: { isYouTube?: boolean }) => (
  <div className="flex space-x-6 relative z-10">
    <a
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 ${
        isYouTube ? "hover:text-[#FF0000]" : "hover:text-[#1DB954]"
      }`}
      style={{ pointerEvents: "auto" }}
    >
      <FaGithub size={24} />
    </a>
    <a
      href="https://twitter.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 ${
        isYouTube ? "hover:text-[#FF0000]" : "hover:text-[#1DB954]"
      }`}
      style={{ pointerEvents: "auto" }}
    >
      <FaTwitter size={24} />
    </a>
    <a
      href="https://linkedin.com"
      target="_blank"
      rel="noopener noreferrer"
      className={`text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 ${
        isYouTube ? "hover:text-[#FF0000]" : "hover:text-[#1DB954]"
      }`}
      style={{ pointerEvents: "auto" }}
    >
      <FaLinkedin size={24} />
    </a>
  </div>
);

export function YouTubeFooter({
  className = "",
  showSocialLinks = true,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-black/80 border-t border-white/10 mt-8 ${className} relative z-10`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          {showSocialLinks && <SocialIcons isYouTube={true} />}
          <div className="text-center text-gray-400">
            <p>© {currentYear} ReAMP. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function SpotifyFooter({
  className = "",
  showSocialLinks = true,
}: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`bg-black/80 border-t border-white/10 mt-8 ${className} relative z-10`}
    >
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col items-center space-y-4">
          {showSocialLinks && <SocialIcons isYouTube={false} />}
          <div className="text-center text-gray-400">
            <p>© {currentYear} ReAMP. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
