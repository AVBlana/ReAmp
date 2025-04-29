export const configureWebGL = () => {
  // Check if WebGL is available
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  if (!gl) {
    console.warn("WebGL not available, falling back to software rendering");
    return;
  }

  // Set WebGL context attributes
  const attributes = {
    alpha: true,
    antialias: true,
    depth: true,
    stencil: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    failIfMajorPerformanceCaveat: false,
  };

  // Apply attributes to the context
  Object.entries(attributes).forEach(([key, value]) => {
    try {
      gl.getContextAttributes()[key] = value;
    } catch (error) {
      console.warn(`Failed to set WebGL attribute: ${key}`, error);
    }
  });
};
