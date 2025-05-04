export const configureWebGL = () => {
  if (typeof window !== "undefined") {
    try {
      // Create a canvas with the desired WebGL context attributes
      const canvas = document.createElement("canvas");

      // Try hardware acceleration first
      let gl = canvas.getContext("webgl", {
        alpha: true,
        antialias: true,
        depth: true,
        desynchronized: false,
        failIfMajorPerformanceCaveat: true, // Don't fall back to software
        powerPreference: "high-performance",
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        stencil: false,
        xrCompatible: false,
      });

      if (!gl) {
        // If hardware acceleration fails, try with software fallback
        gl = canvas.getContext("webgl", {
          alpha: true,
          antialias: true,
          depth: true,
          desynchronized: false,
          failIfMajorPerformanceCaveat: false,
          powerPreference: "default",
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          stencil: false,
          xrCompatible: false,
        });
      }

      if (!gl) {
        console.warn("WebGL not supported or context creation failed");
        return;
      }

      // Clean up
      canvas.remove();
    } catch (error) {
      console.warn("Error configuring WebGL:", error);
    }
  }
};
