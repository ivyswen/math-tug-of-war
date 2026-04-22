export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function calculateViewState({
  shellWidth,
  shellHeight,
  paddingX,
  paddingY,
  boardWidth,
  boardHeight,
  modalVisible,
  modalWidth,
  modalHeight,
  windowWidth,
  windowHeight,
  zoomPercent,
  minPercent,
  maxPercent,
}) {
  const availW = Math.max(0, shellWidth - paddingX);
  const availH = Math.max(0, shellHeight - paddingY);
  const safeBoardWidth = Math.max(boardWidth || 1, 1);
  const safeBoardHeight = Math.max(boardHeight || 1, 1);

  const fitScale = Math.min(availW / safeBoardWidth, availH / safeBoardHeight, 1);
  const maxFitScale = Math.min(availW / safeBoardWidth, availH / safeBoardHeight);
  const boardMaxPercent = Math.floor(
    (maxFitScale / Math.max(fitScale, 0.0001)) * 100 + 0.0001,
  );

  let modalMaxPercent = maxPercent;

  if (modalVisible && modalWidth && modalHeight) {
    const availModalWidth = Math.max(0, windowWidth * 0.96);
    const availModalHeight = Math.max(0, windowHeight * 0.92);
    const maxModalScale = Math.min(availModalWidth / modalWidth, availModalHeight / modalHeight);
    modalMaxPercent = Math.max(minPercent, Math.floor(maxModalScale * 100));
  }

  const zoomMaxPercent = clamp(
    Math.min(maxPercent, boardMaxPercent, modalMaxPercent),
    minPercent,
    maxPercent,
  );
  const nextZoomPercent = clamp(zoomPercent, minPercent, zoomMaxPercent);
  const zoomScale = nextZoomPercent / 100;

  return {
    zoomMaxPercent,
    zoomPercent: nextZoomPercent,
    gameScale: fitScale * zoomScale,
    modalScale: zoomScale,
  };
}

export function getFullscreenLabel(isFullscreen) {
  return isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
}

export function getFullscreenIconClass(isFullscreen) {
  return isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
}
