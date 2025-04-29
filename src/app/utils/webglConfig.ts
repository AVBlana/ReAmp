export const configureWebGL = () => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl") as WebGLRenderingContext | null;

  if (!gl) {
    console.warn("WebGL not supported");
    return;
  }

  const attributes = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  };

  Object.entries(attributes).forEach(([key, value]) => {
    try {
      const contextAttributes = gl.getContextAttributes();
      if (contextAttributes) {
        (contextAttributes as any)[key] = value;
      }
    } catch (error) {
      console.warn(`Failed to set WebGL attribute: ${key}`, error);
    }
  });
};
