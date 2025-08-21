import { FaGithub, FaTwitter, FaLinkedin } from "react-icons/fa";

// Import atomic design components
import Icon from "@/app/components/atoms/Icon";
import Button from "@/app/components/atoms/Button";

interface FooterProps {
  className?: string;
  showSocialLinks?: boolean;
}

const SocialIcons = ({ isYouTube = true }: { isYouTube?: boolean }) => (
  <div className="flex space-x-4 relative z-10">
    <a
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 hover:text-[#FF6B6B]"
      style={{ pointerEvents: "auto" }}
    >
      <Icon icon={<FaGithub size={20} />} color="gray" animated={false} />
    </a>
    <a
      href="https://twitter.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 hover:text-[#FF6B6B]"
      style={{ pointerEvents: "auto" }}
    >
      <Icon icon={<FaTwitter size={20} />} color="gray" animated={false} />
    </a>
    <a
      href="https://linkedin.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-gray-400 transition-colors duration-300 cursor-pointer relative z-10 hover:text-[#FF6B6B]"
      style={{ pointerEvents: "auto" }}
    >
      <Icon icon={<FaLinkedin size={20} />} color="gray" animated={false} />
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
      className={`bg-gradient-to-r from-black/90 to-gray-900/90 border-t border-white/20 mt-6 ${className} relative z-10`}
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm font-medium">
            © {currentYear}{" "}
            <span className="text-[#FF6B6B] font-semibold">ReAMP</span>. All
            rights reserved.
          </div>
          {showSocialLinks && <SocialIcons isYouTube={true} />}
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
      className={`bg-gradient-to-r from-black/90 to-gray-900/90 border-t border-white/20 mt-6 ${className} relative z-10`}
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="text-gray-400 text-sm font-medium">
            © {currentYear}{" "}
            <span className="text-[#FF6B6B] font-semibold">ReAMP</span>. All
            rights reserved.
          </div>
          {showSocialLinks && <SocialIcons isYouTube={false} />}
        </div>
      </div>
    </footer>
  );
}
