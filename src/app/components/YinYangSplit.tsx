import React from "react";

interface YinYangSplitProps {
  leftActive?: boolean;
  rightActive?: boolean;
  onLeftHover?: () => void;
  onRightHover?: () => void;
  onLeftLeave?: () => void;
  onRightLeave?: () => void;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
}

const YinYangSplit: React.FC<YinYangSplitProps> = ({
  leftActive = false,
  rightActive = false,
  onLeftHover,
  onRightHover,
  onLeftLeave,
  onRightLeave,
  leftContent,
  rightContent,
}) => {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full absolute top-0 left-0"
        preserveAspectRatio="none"
      >
        {/* White half */}
        <path
          d="M 50,0
             A 50,50 0 1,0 50,100
             A 25,25 0 1,1 50,50
             A 25,25 0 1,0 50,0
             Z"
          fill="#fff"
          style={{
            filter: leftActive ? "drop-shadow(0 0 10px #fff8)" : undefined,
            transition: "filter 0.3s",
          }}
        />
        {/* Black half */}
        <path
          d="M 50,0
             A 50,50 0 1,1 50,100
             A 25,25 0 1,0 50,50
             A 25,25 0 1,1 50,0
             Z"
          fill="#121212"
          style={{
            filter: rightActive ? "drop-shadow(0 0 10px #0008)" : undefined,
            transition: "filter 0.3s",
          }}
        />
        {/* Small black circle in white half */}
        <circle cx="50" cy="25" r="8" fill="#121212" />
        {/* Small white circle in black half */}
        <circle cx="50" cy="75" r="8" fill="#fff" />
      </svg>
      {/* Overlay content for each half */}
      <div
        className={`absolute left-0 top-0 w-1/2 h-full flex items-center justify-center z-10 transition-all duration-500 ${
          leftActive ? "scale-105" : ""
        }`}
        onMouseEnter={onLeftHover}
        onMouseLeave={onLeftLeave}
        style={{ pointerEvents: "auto" }}
      >
        {leftContent}
      </div>
      <div
        className={`absolute right-0 top-0 w-1/2 h-full flex items-center justify-center z-10 transition-all duration-500 ${
          rightActive ? "scale-105" : ""
        }`}
        onMouseEnter={onRightHover}
        onMouseLeave={onRightLeave}
        style={{ pointerEvents: "auto" }}
      >
        {rightContent}
      </div>
    </div>
  );
};

export default YinYangSplit;
