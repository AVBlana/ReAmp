export const configureWebGL = () => {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");

    if (!gl) {
      console.warn("WebGL not supported");
      return;
    }

    // Set WebGL context attributes
    const attributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    };

    // Create a new context with the desired attributes
    const newCanvas = document.createElement("canvas");
    const newGl = newCanvas.getContext("webgl", attributes);

    if (!newGl) {
      console.warn("Failed to create WebGL context with desired attributes");
      return;
    }

    // Clean up
    canvas.remove();
    newCanvas.remove();
  } catch (error) {
    console.warn("Error configuring WebGL:", error);
  }
};
