import { POST_IMAGE_TYPE } from './post.constants';

/**
 * Hands a painted canvas to the browser as a file download. The image is made
 * and saved on the owner's computer: nothing is uploaded or stored anywhere.
 */
export async function downloadCanvas(
  canvas: HTMLCanvasElement,
  fileName: string,
): Promise<boolean> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, POST_IMAGE_TYPE);
  });
  if (blob === null) return false;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
