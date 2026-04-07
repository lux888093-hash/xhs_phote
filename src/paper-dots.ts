export type LayoutDirection = 'image-left' | 'image-right' | 'image-top' | 'image-bottom';
export type DotShape = 'circle' | 'square' | 'diamond' | 'star' | 'spark' | 'heart' | 'flower' | 'drop' | 'snowflake' | 'char';
export type DotDistributionMode = 'random' | 'grid' | 'burst' | 'wave' | 'spiral' | 'manual-unpaired' | 'manual-paired';
export type DotColorMode = 'photo' | 'single' | 'duotone' | 'gradient' | 'candy';
export type DotDirectionMode = 'fixed' | 'random';
export type DotActionType = 'add-positive-dot' | 'add-negative-dot' | 'add-paired-dot';

export interface DotPoint {
  xRatio: number;
  yRatio: number;
  varianceSample: number;
  profileSample: number;
}

interface BaseDotShape {
  shape: DotShape;
  rotation: number;
  innerRadiusRatio?: number;
}

export interface RenderDot extends BaseDotShape {
  x: number;
  y: number;
  radius: number;
  charValue?: string;
}

export interface AppState {
  dotSize: number;
  dotVariance: number;
  dotCount: number;
  shuffleCount: number;
  dotDistributionMode: DotDistributionMode;
  dotShape: DotShape;
  dotChar: string;
  dotColorMode: DotColorMode;
  dotDirectionMode: DotDirectionMode;
  dotDirectionAngle: number;
  dotColorPrimary: string;
  dotColorSecondary: string;
  dotColorAccent: string;
  layoutDirection: LayoutDirection;
  seed: number;
  varianceSeed: number;
  backgroundSource: 'color' | 'duotone' | 'image';
  backgroundColor: string;
  backgroundColorSecondary: string;
  backgroundStripeSize: number;
  backgroundImage: HTMLImageElement | null;
  splitRatio: number;
  manualPositiveDots: DotPoint[];
  manualNegativeDots: DotPoint[];
  manualPairedDots: DotPoint[];
  image: HTMLImageElement | null;
  fileName: string | null;
}

export interface SurfaceSize {
  cssWidth: number;
  cssHeight: number;
  renderWidth: number;
  renderHeight: number;
  pixelRatio: number;
}

export interface DotStyleConfig {
  colorMode: DotColorMode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

export type BackgroundConfig =
  | {
      type: 'color';
      color: string;
    }
  | {
      type: 'duotone';
      primaryColor: string;
      secondaryColor: string;
      stripeOrientation: 'vertical' | 'horizontal';
      stripeSize: number;
    }
  | {
      type: 'image';
      image: HTMLImageElement;
    };

type ReducerAction =
  | { type: 'set-size'; value: number }
  | { type: 'set-variance'; value: number }
  | { type: 'set-count'; value: number }
  | { type: 'set-distribution-mode'; value: DotDistributionMode }
  | { type: 'set-shape'; value: DotShape }
  | { type: 'set-dot-char'; value: string }
  | { type: 'set-dot-color-mode'; value: DotColorMode }
  | { type: 'set-dot-direction-mode'; value: DotDirectionMode }
  | { type: 'set-dot-direction-angle'; value: number }
  | { type: 'set-dot-color-primary'; value: string }
  | { type: 'set-dot-color-secondary'; value: string }
  | { type: 'set-dot-color-accent'; value: string }
  | { type: 'set-layout-direction'; value: LayoutDirection }
  | { type: 'set-split-ratio'; value: number }
  | { type: 'set-background-source'; value: AppState['backgroundSource'] }
  | { type: 'set-background-color'; value: string }
  | { type: 'set-background-color-secondary'; value: string }
  | { type: 'set-background-stripe-size'; value: number }
  | { type: 'set-background-image'; image: HTMLImageElement }
  | { type: 'set-image'; image: HTMLImageElement; fileName: string }
  | { type: 'add-positive-dot'; dot: DotPoint }
  | { type: 'add-negative-dot'; dot: DotPoint }
  | { type: 'add-paired-dot'; dot: DotPoint }
  | { type: 'undo-dot' }
  | { type: 'shuffle' };

const FULL_ARC = Math.PI * 2;
const ANGLE_EPSILON = 1e-4;
const PREVIEW_ASPECT_FALLBACK = 0.72;
const EMPTY_PREVIEW_HEIGHT = 18;
const DEFAULT_STRIPE_SIZE = 24;
const JPEG_MIME = 'image/jpeg';
const PNG_MIME = 'image/png';
const JPEG_EXTENSION = 'jpg';
const PNG_EXTENSION = 'png';
const EXPORT_JPEG_QUALITY = 0.9;
const MAX_BLOB_SIZE = 20 * 1024 * 1024;
const MAX_DOWNSCALE_STEPS = 6;
const EASTER_EGG_INTERVAL = 5;
const DEFAULT_EXPORT_MAX_LONG_EDGE = 3_200;
const DEFAULT_EXPORT_MAX_PIXELS = 8_000_000;
const CANVAS_BLOB_TIMEOUT_MS = 12_000;
const MAX_ENCODE_RETRIES = 3;
const FALLBACK_JPEG_QUALITY = 0.88;
const SNOWFLAKE_GRID = [
  [0, 6],
  [1, 6],
  [2, 6],
  [3, 6],
  [4, 6],
  [5, 6],
  [6, 6],
  [7, 6],
  [8, 6],
  [9, 6],
  [10, 6],
  [11, 6],
  [12, 6],
  [6, 0],
  [6, 1],
  [6, 2],
  [6, 3],
  [6, 5],
  [6, 7],
  [6, 9],
  [6, 10],
  [6, 11],
  [6, 12],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 4],
  [7, 8],
  [8, 9],
  [9, 10],
  [10, 11],
  [2, 11],
  [3, 10],
  [4, 9],
  [5, 8],
  [7, 4],
  [8, 3],
  [9, 2],
  [10, 1],
  [4, 5],
  [4, 7],
  [8, 5],
  [8, 7],
];

export const PAPER_THEME = {
  background: '#f2eadf',
  cover: '#efe6da',
  shadow: 'rgba(191, 174, 154, 0.28)',
};

export const RAINBOW_PALETTE = ['#ff45d4', '#34e0ff', '#ffe03a', '#7cff37', '#4f63ff', '#c7fff8'];

export function createInitialState(): AppState {
  return {
    dotSize: 28,
    dotVariance: 0,
    dotCount: 18,
    shuffleCount: 0,
    dotDistributionMode: 'random',
    dotShape: 'circle',
    dotChar: '喵',
    dotColorMode: 'photo',
    dotDirectionMode: 'fixed',
    dotDirectionAngle: 0,
    dotColorPrimary: '#f6efe3',
    dotColorSecondary: '#d8c2ae',
    dotColorAccent: '#c96b4d',
    layoutDirection: 'image-top',
    seed: randomSeed(),
    varianceSeed: randomSeed(),
    backgroundSource: 'color',
    backgroundColor: PAPER_THEME.background,
    backgroundColorSecondary: PAPER_THEME.cover,
    backgroundStripeSize: DEFAULT_STRIPE_SIZE,
    backgroundImage: null,
    splitRatio: 50,
    manualPositiveDots: [],
    manualNegativeDots: [],
    manualPairedDots: [],
    image: null,
    fileName: null,
  };
}

export function isRainbowShuffle(shuffleCount: number): boolean {
  return shuffleCount > 0 && shuffleCount % EASTER_EGG_INTERVAL === 0;
}

export function createDotStyleConfig(state: AppState): DotStyleConfig {
  return {
    colorMode: state.dotColorMode,
    primaryColor: state.dotColorPrimary,
    secondaryColor: state.dotColorSecondary,
    accentColor: state.dotColorAccent,
  };
}

export function reduceState(state: AppState, action: ReducerAction): AppState {
  if (action.type === 'set-size') {
    return { ...state, dotSize: action.value };
  }

  if (action.type === 'set-variance') {
    const nextVarianceSeed = state.dotVariance === 0 && action.value > 0 ? randomSeed() : state.varianceSeed ?? state.seed;
    return { ...state, dotVariance: action.value, varianceSeed: nextVarianceSeed };
  }

  if (action.type === 'set-count') {
    return { ...state, dotCount: action.value, seed: randomSeed(), varianceSeed: randomSeed() };
  }

  if (action.type === 'set-distribution-mode') {
    return { ...state, dotDistributionMode: action.value };
  }

  if (action.type === 'set-shape') {
    return { ...state, dotShape: action.value, seed: randomSeed(), varianceSeed: randomSeed() };
  }

  if (action.type === 'set-dot-char') {
    return { ...state, dotChar: action.value };
  }

  if (action.type === 'set-dot-color-mode') {
    return { ...state, dotColorMode: action.value };
  }

  if (action.type === 'set-dot-direction-mode') {
    return { ...state, dotDirectionMode: action.value };
  }

  if (action.type === 'set-dot-direction-angle') {
    return { ...state, dotDirectionAngle: action.value };
  }

  if (action.type === 'set-dot-color-primary') {
    return { ...state, dotColorPrimary: action.value };
  }

  if (action.type === 'set-dot-color-secondary') {
    return { ...state, dotColorSecondary: action.value };
  }

  if (action.type === 'set-dot-color-accent') {
    return { ...state, dotColorAccent: action.value };
  }

  if (action.type === 'set-layout-direction') {
    return { ...state, layoutDirection: action.value };
  }

  if (action.type === 'set-split-ratio') {
    return { ...state, splitRatio: action.value };
  }

  if (action.type === 'set-background-source') {
    return { ...state, backgroundSource: action.value };
  }

  if (action.type === 'set-background-color') {
    return { ...state, backgroundColor: action.value };
  }

  if (action.type === 'set-background-color-secondary') {
    return { ...state, backgroundColorSecondary: action.value };
  }

  if (action.type === 'set-background-stripe-size') {
    return { ...state, backgroundStripeSize: action.value };
  }

  if (action.type === 'set-background-image') {
    return { ...state, backgroundSource: 'image', backgroundImage: action.image };
  }

  if (action.type === 'set-image') {
    return {
      ...state,
      image: action.image,
      fileName: action.fileName,
      manualPositiveDots: [],
      manualNegativeDots: [],
      manualPairedDots: [],
      seed: randomSeed(),
      varianceSeed: randomSeed(),
    };
  }

  if (action.type === 'add-positive-dot') {
    return { ...state, manualPositiveDots: [...state.manualPositiveDots, action.dot] };
  }

  if (action.type === 'add-negative-dot') {
    return { ...state, manualNegativeDots: [...state.manualNegativeDots, action.dot] };
  }

  if (action.type === 'add-paired-dot') {
    return { ...state, manualPairedDots: [...state.manualPairedDots, action.dot] };
  }

  if (action.type === 'undo-dot') {
    if (state.dotDistributionMode === 'manual-paired') {
      return { ...state, manualPairedDots: state.manualPairedDots.slice(0, -1) };
    }

    if (state.dotDistributionMode === 'manual-unpaired') {
      if (state.manualPositiveDots.length >= state.manualNegativeDots.length && state.manualPositiveDots.length > 0) {
        return { ...state, manualPositiveDots: state.manualPositiveDots.slice(0, -1) };
      }

      if (state.manualNegativeDots.length > 0) {
        return { ...state, manualNegativeDots: state.manualNegativeDots.slice(0, -1) };
      }
    }

    return state;
  }

  const nextShuffleCount = state.shuffleCount + 1;
  if (isRainbowShuffle(nextShuffleCount)) {
    return { ...state, shuffleCount: nextShuffleCount };
  }

  return { ...state, shuffleCount: nextShuffleCount, seed: randomSeed(), varianceSeed: randomSeed() };
}

export function getDotActionForSurface(kind: 'paper' | 'punch', state: AppState): DotActionType | null {
  if (
    !state.image ||
    (state.dotDistributionMode !== 'manual-unpaired' && state.dotDistributionMode !== 'manual-paired')
  ) {
    return null;
  }

  if (state.dotDistributionMode === 'manual-paired') {
    return 'add-paired-dot';
  }

  return kind === 'punch' ? 'add-positive-dot' : 'add-negative-dot';
}

export function createBackgroundConfig(state: AppState): BackgroundConfig {
  if (state.backgroundSource === 'image' && state.backgroundImage) {
    return { type: 'image', image: state.backgroundImage };
  }

  if (state.backgroundSource === 'duotone') {
    return {
      type: 'duotone',
      primaryColor: state.backgroundColor,
      secondaryColor: state.backgroundColorSecondary,
      stripeOrientation: getLayoutAxis(state.layoutDirection) === 'horizontal' ? 'vertical' : 'horizontal',
      stripeSize: state.backgroundStripeSize,
    };
  }

  return {
    type: 'color',
    color: state.backgroundColor,
  };
}

export function computeDots(state: AppState, surface: SurfaceSize): { paperDots: RenderDot[]; punchDots: RenderDot[] } {
  const charValue = state.dotShape === 'char' ? state.dotChar : undefined;

  if (state.dotDistributionMode === 'manual-unpaired') {
    return {
      paperDots: pointsToDots(
        surface,
        state.dotSize,
        state.dotVariance,
        state.dotShape,
        state.manualNegativeDots,
        charValue,
        state.dotDirectionMode,
        state.dotDirectionAngle,
      ),
      punchDots: pointsToDots(
        surface,
        state.dotSize,
        state.dotVariance,
        state.dotShape,
        state.manualPositiveDots,
        charValue,
        state.dotDirectionMode,
        state.dotDirectionAngle,
      ),
    };
  }

  if (state.dotDistributionMode === 'manual-paired') {
    const sharedDots = pointsToDots(
      surface,
      state.dotSize,
      state.dotVariance,
      state.dotShape,
      state.manualPairedDots,
      charValue,
      state.dotDirectionMode,
      state.dotDirectionAngle,
    );
    return {
      paperDots: sharedDots,
      punchDots: sharedDots,
    };
  }

  const generator =
    state.dotDistributionMode === 'grid'
      ? generateGridDots
      : state.dotDistributionMode === 'burst'
        ? generateBurstDots
        : state.dotDistributionMode === 'wave'
          ? generateWaveDots
          : state.dotDistributionMode === 'spiral'
            ? generateSpiralDots
        : generateRandomDots;

  const randomDots = generator({
    width: surface.cssWidth,
    height: surface.cssHeight,
    count: state.dotCount,
    size: state.dotSize,
    variance: state.dotVariance,
    shape: state.dotShape,
    directionMode: state.dotDirectionMode,
    directionAngle: state.dotDirectionAngle,
    seed: state.seed,
    varianceSeed: state.varianceSeed ?? state.seed,
    charValue,
  });

  return {
    paperDots: randomDots,
    punchDots: randomDots,
  };
}

export function getPreviewSurface(containerWidth: number, pixelRatio: number, imageAspect = PREVIEW_ASPECT_FALLBACK): SurfaceSize {
  const cssWidth = Math.max(1, Math.round(Number.isFinite(containerWidth) ? containerWidth : 0));
  const safeAspect = Number.isFinite(imageAspect) && imageAspect > 0 ? imageAspect : PREVIEW_ASPECT_FALLBACK;
  const cssHeight = Math.max(1, Math.round(cssWidth * safeAspect));
  const safePixelRatio = Math.max(1, pixelRatio);
  return {
    cssWidth,
    cssHeight,
    renderWidth: Math.round(cssWidth * safePixelRatio),
    renderHeight: Math.round(cssHeight * safePixelRatio),
    pixelRatio: safePixelRatio,
  };
}

export function getEmptySurface(containerWidth: number, pixelRatio: number): SurfaceSize {
  const cssWidth = Math.max(1, Math.round(Number.isFinite(containerWidth) ? containerWidth : 0));
  const safePixelRatio = Math.max(1, pixelRatio);
  return {
    cssWidth,
    cssHeight: EMPTY_PREVIEW_HEIGHT,
    renderWidth: Math.round(cssWidth * safePixelRatio),
    renderHeight: Math.round(EMPTY_PREVIEW_HEIGHT * safePixelRatio),
    pixelRatio: safePixelRatio,
  };
}

export function getImageAspect(image: HTMLImageElement | null): number {
  if (!image) {
    return PREVIEW_ASPECT_FALLBACK;
  }

  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (width <= 0 || height <= 0) {
    return PREVIEW_ASPECT_FALLBACK;
  }

  return height / width;
}

export function applySurfaceToCanvas(canvas: HTMLCanvasElement, surface: SurfaceSize): void {
  canvas.dataset.cssWidth = String(surface.cssWidth);
  canvas.dataset.cssHeight = String(surface.cssHeight);
  canvas.width = surface.renderWidth;
  canvas.height = surface.renderHeight;
}

export function getCanvasCssSize(canvas: HTMLCanvasElement): { width: number; height: number } {
  return {
    width: Number(canvas.dataset.cssWidth) || canvas.width,
    height: Number(canvas.dataset.cssHeight) || canvas.height,
  };
}

export function renderEmptyPaper(canvas: HTMLCanvasElement, background: BackgroundConfig): void {
  const prepared = prepareCanvasContext(canvas);
  if (!prepared) {
    return;
  }

  fillBackground(prepared.context, prepared.width, prepared.height, background);
}

export function clearCanvas(canvas: HTMLCanvasElement): void {
  const prepared = prepareCanvasContext(canvas);
  if (!prepared) {
    return;
  }

  prepared.context.clearRect(0, 0, prepared.width, prepared.height);
}

export function renderPaperCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  dots: RenderDot[],
  background: BackgroundConfig,
  seed: number,
  dotStyle: DotStyleConfig,
  rainbowMode = false,
): void {
  const prepared = prepareCanvasContext(canvas);
  if (!prepared) {
    return;
  }

  fillBackground(prepared.context, prepared.width, prepared.height, background);

  if (rainbowMode) {
    renderRainbowDots(prepared.context, dots, seed);
    return;
  }

  const photoFillCanvas = dotStyle.colorMode === 'photo' ? createPhotoFillCanvas(image, background, prepared.width, prepared.height) : null;

  for (const dot of dots) {
    if (dot.shape === 'char') {
      drawCharacterMask(prepared.context, dot, fillContext => {
        if (photoFillCanvas) {
          fillContext.drawImage(photoFillCanvas, 0, 0, prepared.width, prepared.height);
          return;
        }
        fillDotVisual(fillContext, dot, image, background, prepared.width, prepared.height, dotStyle, seed);
      });
      continue;
    }

    prepared.context.save();
    drawShapePath(prepared.context, dot);
    prepared.context.clip();
    if (photoFillCanvas) {
      prepared.context.drawImage(photoFillCanvas, 0, 0, prepared.width, prepared.height);
    } else {
      fillDotVisual(prepared.context, dot, image, background, prepared.width, prepared.height, dotStyle, seed);
    }
    prepared.context.restore();
    strokeVisibleCircleOutline(prepared.context, dot, dots, 'rgba(84, 72, 56, 0.08)');
  }
}

export function renderPunchCanvas(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  dots: RenderDot[],
  background: BackgroundConfig,
  seed: number,
  dotStyle: DotStyleConfig,
  rainbowMode = false,
): void {
  const prepared = prepareCanvasContext(canvas);
  if (!prepared) {
    return;
  }

  drawImageCover(prepared.context, image, prepared.width, prepared.height);

  if (rainbowMode) {
    renderRainbowDots(prepared.context, dots, seed);
    return;
  }

  renderPunchDots(prepared, dots, image, background, seed, dotStyle);
}

export function adjustBackgroundForExport(
  background: BackgroundConfig,
  previewCanvas: HTMLCanvasElement | null,
  exportSurface: SurfaceSize,
): BackgroundConfig {
  if (background.type !== 'duotone' || !previewCanvas) {
    return background;
  }

  const previewSize = getCanvasCssSize(previewCanvas);
  const previewAxis = background.stripeOrientation === 'vertical' ? previewSize.width : previewSize.height;
  const exportAxis = background.stripeOrientation === 'vertical' ? exportSurface.cssWidth : exportSurface.cssHeight;
  const scaledStripeSize = Math.max(1, Math.round((background.stripeSize / previewAxis) * exportAxis));
  return {
    ...background,
    stripeSize: scaledStripeSize,
  };
}

export function createExportSurface(
  image: HTMLImageElement,
  previewCanvas: HTMLCanvasElement | null,
  options?: {
    layoutDirection?: LayoutDirection;
    splitRatio?: number;
    maxLongEdge?: number;
    maxPixels?: number;
  },
): SurfaceSize {
  const sourceWidth = Math.max(1, Math.round(image.naturalWidth || image.width || 1));
  const cssHeightFromImage = Math.max(1, Math.round(image.naturalHeight || image.height || 1));
  const layoutDirection = options?.layoutDirection ?? 'image-top';
  const splitRatio = clamp(options?.splitRatio ?? 50, 0, 100);
  const maxLongEdge = Math.max(1_200, Math.round(options?.maxLongEdge ?? DEFAULT_EXPORT_MAX_LONG_EDGE));
  const maxPixels = Math.max(2_000_000, Math.round(options?.maxPixels ?? DEFAULT_EXPORT_MAX_PIXELS));
  const compositionScale = getCompositionScale(layoutDirection, splitRatio);
  const imageAspect = sourceWidth > 0 ? cssHeightFromImage / sourceWidth : PREVIEW_ASPECT_FALLBACK;
  const widthFromLongEdge = Math.floor(maxLongEdge / Math.max(compositionScale.widthFactor, imageAspect * compositionScale.heightFactor));
  const widthFromPixels = Math.floor(
    Math.sqrt(maxPixels / Math.max(0.01, imageAspect * compositionScale.widthFactor * compositionScale.heightFactor)),
  );
  const cssWidth = Math.max(1, Math.min(sourceWidth, widthFromLongEdge, widthFromPixels));
  const limitedImageHeight = Math.max(1, Math.round(cssWidth * imageAspect));
  if (!previewCanvas) {
    return {
      cssWidth,
      cssHeight: limitedImageHeight,
      renderWidth: cssWidth,
      renderHeight: limitedImageHeight,
      pixelRatio: 1,
    };
  }

  const previewSize = getCanvasCssSize(previewCanvas);
  if (previewSize.width <= 0 || previewSize.height <= 0) {
    return {
      cssWidth,
      cssHeight: limitedImageHeight,
      renderWidth: cssWidth,
      renderHeight: limitedImageHeight,
      pixelRatio: 1,
    };
  }

  const cssHeight = Math.max(1, Math.round(cssWidth * (previewSize.height / previewSize.width)));
  return {
    cssWidth,
    cssHeight,
    renderWidth: cssWidth,
    renderHeight: cssHeight,
    pixelRatio: 1,
  };
}

export function createDetachedCanvas(surface: SurfaceSize): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  applySurfaceToCanvas(canvas, surface);
  return canvas;
}

export function composeExportCanvas(
  paperCanvas: HTMLCanvasElement,
  punchCanvas: HTMLCanvasElement,
  background: BackgroundConfig,
  layoutDirection: LayoutDirection,
  splitRatio = 50,
): HTMLCanvasElement {
  const layout = decodeLayout(layoutDirection);
  const ratio = Math.max(0, Math.min(100, splitRatio));
  const imageShare = ratio <= 50 ? (50 - ratio) / 50 : 0;
  const paperShare = ratio >= 50 ? (ratio - 50) / 50 : 0;

  if (layout.axis === 'horizontal') {
    const imageWidth = punchCanvas.width;
    const paperWidth = paperCanvas.width;
    const height = Math.min(punchCanvas.height, paperCanvas.height);
    const cropImage = Math.round(imageWidth * paperShare);
    const cropPaper = Math.round(paperWidth * imageShare);
    const keptImage = Math.max(1, imageWidth - cropImage);
    const keptPaper = Math.max(1, paperWidth - cropPaper);
    const imageSourceX = layoutDirection === 'image-left' ? cropImage : 0;
    const paperSourceX = layoutDirection === 'image-left' ? 0 : cropPaper;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = keptImage + keptPaper;
    exportCanvas.height = height;
    const context = exportCanvas.getContext('2d');
    if (!context) {
      throw new Error('导出画布上下文不可用');
    }

    fillBackground(context, exportCanvas.width, exportCanvas.height, background);
    const firstCanvas = layout.imageFirst ? punchCanvas : paperCanvas;
    const secondCanvas = layout.imageFirst ? paperCanvas : punchCanvas;
    const firstWidth = layout.imageFirst ? keptImage : keptPaper;
    const secondWidth = layout.imageFirst ? keptPaper : keptImage;
    const firstSourceX = layout.imageFirst ? imageSourceX : paperSourceX;
    const secondSourceX = layout.imageFirst ? paperSourceX : imageSourceX;
    context.drawImage(firstCanvas, firstSourceX, 0, firstWidth, height, 0, 0, firstWidth, height);
    context.drawImage(secondCanvas, secondSourceX, 0, secondWidth, height, firstWidth, 0, secondWidth, height);
    return exportCanvas;
  }

  const imageHeight = punchCanvas.height;
  const paperHeight = paperCanvas.height;
  const width = Math.min(punchCanvas.width, paperCanvas.width);
  const cropImage = Math.round(imageHeight * paperShare);
  const cropPaper = Math.round(paperHeight * imageShare);
  const keptImage = Math.max(1, imageHeight - cropImage);
  const keptPaper = Math.max(1, paperHeight - cropPaper);
  const imageSourceY = layoutDirection === 'image-top' ? cropImage : 0;
  const paperSourceY = layoutDirection === 'image-top' ? 0 : cropPaper;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = keptImage + keptPaper;
  const context = exportCanvas.getContext('2d');
  if (!context) {
    throw new Error('导出画布上下文不可用');
  }

  fillBackground(context, exportCanvas.width, exportCanvas.height, background);
  const firstCanvas = layout.imageFirst ? punchCanvas : paperCanvas;
  const secondCanvas = layout.imageFirst ? paperCanvas : punchCanvas;
  const firstHeight = layout.imageFirst ? keptImage : keptPaper;
  const secondHeight = layout.imageFirst ? keptPaper : keptImage;
  const firstSourceY = layout.imageFirst ? imageSourceY : paperSourceY;
  const secondSourceY = layout.imageFirst ? paperSourceY : imageSourceY;
  context.drawImage(firstCanvas, 0, firstSourceY, width, firstHeight, 0, 0, width, firstHeight);
  context.drawImage(secondCanvas, 0, secondSourceY, width, secondHeight, 0, firstHeight, width, secondHeight);
  return exportCanvas;
}

export function getExportSettings(_background: BackgroundConfig): { mimeType: typeof JPEG_MIME | typeof PNG_MIME; quality?: number } {
  return { mimeType: JPEG_MIME, quality: EXPORT_JPEG_QUALITY };
}

export function getExportFileName(fileName: string | null, mimeType: typeof JPEG_MIME | typeof PNG_MIME): string {
  const extension = mimeType === PNG_MIME ? PNG_EXTENSION : JPEG_EXTENSION;
  if (!fileName) {
    return `paper-dots-export.${extension}`;
  }

  const trimmed = fileName.trim();
  if (!trimmed) {
    return `paper-dots-export.${extension}`;
  }

  const withoutExtension = trimmed.replace(/\.[^.]+$/, '') || 'paper-dots-export';
  return `${withoutExtension}-paper-dots.${extension}`;
}

export async function canvasToExportBlob(
  canvas: HTMLCanvasElement,
  mimeType: typeof JPEG_MIME | typeof PNG_MIME,
  quality?: number,
): Promise<Blob | null> {
  let currentCanvas = canvas;
  let currentMimeType = mimeType;
  let currentQuality = quality;

  for (let step = 0; step < MAX_DOWNSCALE_STEPS; step += 1) {
    const blob = await canvasToBlob(currentCanvas, currentMimeType, currentQuality);
    if (!blob) {
      if (step >= MAX_ENCODE_RETRIES - 1) {
        return null;
      }

      const fallbackSize = scaleCanvasSize(currentCanvas, 0.82);
      const fallbackCanvas = resizeCanvas(currentCanvas, fallbackSize.width, fallbackSize.height);
      if (!fallbackCanvas) {
        return null;
      }

      currentCanvas = fallbackCanvas;
      currentMimeType = JPEG_MIME;
      currentQuality = FALLBACK_JPEG_QUALITY;
      continue;
    }

    if (blob.type !== PNG_MIME || blob.size <= MAX_BLOB_SIZE) {
      return blob;
    }

    const scaled = scaleDownToBlobBudget({ width: currentCanvas.width, height: currentCanvas.height }, blob.size);
    if (scaled.width === currentCanvas.width && scaled.height === currentCanvas.height) {
      return blob;
    }

    const downscaledCanvas = resizeCanvas(currentCanvas, scaled.width, scaled.height);
    if (!downscaledCanvas) {
      return blob;
    }

    currentCanvas = downscaledCanvas;
    currentMimeType = PNG_MIME;
    currentQuality = undefined;
  }

  return await canvasToBlob(currentCanvas, currentMimeType, currentQuality);
}

function randomSeed(): number {
  return Date.now() + Math.floor(Math.random() * 100_000);
}

function getLayoutAxis(layoutDirection: LayoutDirection): 'horizontal' | 'vertical' {
  return layoutDirection === 'image-left' || layoutDirection === 'image-right' ? 'horizontal' : 'vertical';
}

function decodeLayout(layoutDirection: LayoutDirection): { axis: 'horizontal' | 'vertical'; imageFirst: boolean } {
  if (layoutDirection === 'image-left') {
    return { axis: 'horizontal', imageFirst: true };
  }

  if (layoutDirection === 'image-right') {
    return { axis: 'horizontal', imageFirst: false };
  }

  if (layoutDirection === 'image-top') {
    return { axis: 'vertical', imageFirst: true };
  }

  return { axis: 'vertical', imageFirst: false };
}

function getCompositionScale(layoutDirection: LayoutDirection, splitRatio: number): { widthFactor: number; heightFactor: number } {
  const safeSplit = clamp(splitRatio, 0, 100);
  const compositionFactor = 2 - Math.abs(safeSplit - 50) / 50;
  if (getLayoutAxis(layoutDirection) === 'horizontal') {
    return {
      widthFactor: compositionFactor,
      heightFactor: 1,
    };
  }

  return {
    widthFactor: 1,
    heightFactor: compositionFactor,
  };
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1_664_525 + 1_013_904_223) >>> 0;
    return value / 4_294_967_296;
  };
}

function normalizeFactor(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function computeBaseRadius(size: number, width: number): number {
  return Math.max(1, Math.round((size / 800) * width));
}

function varyRadius(baseRadius: number, variance: number, sample: number): number {
  const spread = (Math.max(0, Math.min(100, variance)) / 100) * 0.65;
  const factor = 1 + (sample * 2 - 1) * spread;
  return Math.max(1, Math.round(baseRadius * factor));
}

function clampPosition(ratio: number, size: number, radius: number): number {
  const target = normalizeFactor(ratio) * size;
  const max = Math.max(radius, size - radius);
  return Math.min(max, Math.max(radius, target));
}

function normalizeShape(
  shape: DotShape,
  sample: number,
  directionMode: DotDirectionMode,
  directionAngle: number,
): BaseDotShape {
  const normalized = normalizeFactor(sample);
  const rotation = resolveShapeRotation(shape, normalized, directionMode, directionAngle);
  if (shape === 'star') {
    return {
      shape,
      rotation,
      innerRadiusRatio: 0.42 + normalized * 0.16,
    };
  }

  if (shape === 'spark') {
    return {
      shape,
      rotation,
      innerRadiusRatio: 0.22 + normalized * 0.08,
    };
  }

  return {
    shape,
    rotation,
  };
}

function resolveShapeRotation(
  shape: DotShape,
  sample: number,
  directionMode: DotDirectionMode,
  directionAngle: number,
): number {
  if (shape === 'circle' || shape === 'snowflake') {
    return 0;
  }

  const baseRotation = shape === 'diamond' ? Math.PI / 4 : 0;
  if (directionMode === 'random') {
    return baseRotation + normalizeFactor(sample) * FULL_ARC;
  }

  return baseRotation + degreesToRadians(directionAngle);
}

function generateRandomDots(config: {
  width: number;
  height: number;
  count: number;
  size: number;
  variance: number;
  shape: DotShape;
  directionMode: DotDirectionMode;
  directionAngle: number;
  seed: number;
  varianceSeed: number;
  charValue?: string;
}): RenderDot[] {
  const { width, height, count, size, variance, shape, directionMode, directionAngle, seed, varianceSeed, charValue } = config;
  const points: Array<Omit<DotPoint, 'varianceSample'> & { x: number; y: number }> = [];
  const positionRandom = seededRandom(seed);
  const varianceRandom = seededRandom(varianceSeed);
  const baseRadius = computeBaseRadius(size, width);
  const maxAttempts = Math.max(120, count * 80);
  const minGapFactor = 0.7;
  let attempts = 0;

  while (points.length < count && attempts < maxAttempts) {
    attempts += 1;
    const x = baseRadius + positionRandom() * Math.max(1, width - baseRadius * 2);
    const y = baseRadius + positionRandom() * Math.max(1, height - baseRadius * 2);
    const nextPoint = {
      x,
      y,
      xRatio: width > 0 ? x / width : 0.5,
      yRatio: height > 0 ? y / height : 0.5,
      profileSample: positionRandom(),
    };

    const hasCollision = points.some(point => {
      const existingX = width * point.xRatio;
      const existingY = height * point.yRatio;
      return Math.hypot(existingX - nextPoint.x, existingY - nextPoint.y) <= baseRadius * 2 * minGapFactor;
    });

    if (!hasCollision) {
      points.push(nextPoint);
    }
  }

  while (points.length < count) {
    const index = points.length;
    const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
    const rows = Math.max(1, Math.ceil(count / columns));
    const cellWidth = width / columns;
    const cellHeight = height / rows;
    const column = index % columns;
    const row = Math.floor(index / columns);
    points.push({
      x: cellWidth * (column + 0.5),
      y: cellHeight * (row + 0.5),
      xRatio: width > 0 ? (cellWidth * (column + 0.5)) / width : 0.5,
      yRatio: height > 0 ? (cellHeight * (row + 0.5)) / height : 0.5,
      profileSample: positionRandom(),
    });
  }

  return points.map(point => {
    const radius = Math.min(varyRadius(baseRadius, variance, varianceRandom()), width > 0 ? width * 0.34 : baseRadius, height > 0 ? height * 0.34 : baseRadius);
    return {
      radius,
      ...normalizeShape(shape, point.profileSample, directionMode, directionAngle),
      x: clampPosition(point.xRatio, width, radius),
      y: clampPosition(point.yRatio, height, radius),
      ...(charValue !== undefined ? { charValue } : {}),
    };
  });
}

function generateGridDots(config: {
  width: number;
  height: number;
  count: number;
  size: number;
  variance: number;
  shape: DotShape;
  directionMode: DotDirectionMode;
  directionAngle: number;
  seed: number;
  varianceSeed: number;
  charValue?: string;
}): RenderDot[] {
  const { width, height, count, size, variance, shape, directionMode, directionAngle, seed, varianceSeed, charValue } = config;
  const positionRandom = seededRandom(seed);
  const varianceRandom = seededRandom(varianceSeed);
  const columns = Math.max(2, Math.ceil(Math.sqrt(count * (width / Math.max(height, 1)))));
  const rows = Math.max(2, Math.ceil(count / columns));
  const points: DotPoint[] = [];

  for (let row = 0; row < rows && points.length < count; row += 1) {
    for (let column = 0; column < columns && points.length < count; column += 1) {
      const jitterX = (positionRandom() - 0.5) * 0.2;
      const jitterY = (positionRandom() - 0.5) * 0.2;
      points.push({
        xRatio: (column + 0.5 + (row % 2 === 0 ? jitterX : -jitterX)) / columns,
        yRatio: (row + 0.5 + jitterY) / rows,
        varianceSample: varianceRandom(),
        profileSample: positionRandom(),
      });
    }
  }

  return pointsToDots(
    { cssWidth: width, cssHeight: height, renderWidth: width, renderHeight: height, pixelRatio: 1 },
    size,
    variance,
    shape,
    points,
    charValue,
    directionMode,
    directionAngle,
  );
}

function generateBurstDots(config: {
  width: number;
  height: number;
  count: number;
  size: number;
  variance: number;
  shape: DotShape;
  directionMode: DotDirectionMode;
  directionAngle: number;
  seed: number;
  varianceSeed: number;
  charValue?: string;
}): RenderDot[] {
  const { width, height, count, size, variance, shape, directionMode, directionAngle, seed, varianceSeed, charValue } = config;
  const random = seededRandom(seed);
  const varianceRandom = seededRandom(varianceSeed);
  const points: DotPoint[] = [];
  const centerX = 0.5 + (random() - 0.5) * 0.12;
  const centerY = 0.48 + (random() - 0.5) * 0.12;
  const rings = Math.max(2, Math.ceil(Math.sqrt(count)));

  for (let index = 0; index < count; index += 1) {
    const ring = Math.floor((index / Math.max(1, count - 1)) * rings);
    const ringShare = (ring + 1) / (rings + 1);
    const angle = ((index / count) * FULL_ARC * (2 + random())) + random() * 0.5;
    const radialJitter = (random() - 0.5) * 0.08;
    const radius = ringShare * 0.42 + radialJitter;
    points.push({
      xRatio: centerX + Math.cos(angle) * radius * (width > height ? height / width : 1),
      yRatio: centerY + Math.sin(angle) * radius * (height > width ? width / height : 1),
      varianceSample: varianceRandom(),
      profileSample: random(),
    });
  }

  return pointsToDots(
    { cssWidth: width, cssHeight: height, renderWidth: width, renderHeight: height, pixelRatio: 1 },
    size,
    variance,
    shape,
    points,
    charValue,
    directionMode,
    directionAngle,
  );
}

function generateWaveDots(config: {
  width: number;
  height: number;
  count: number;
  size: number;
  variance: number;
  shape: DotShape;
  directionMode: DotDirectionMode;
  directionAngle: number;
  seed: number;
  varianceSeed: number;
  charValue?: string;
}): RenderDot[] {
  const { width, height, count, size, variance, shape, directionMode, directionAngle, seed, varianceSeed, charValue } = config;
  const random = seededRandom(seed);
  const varianceRandom = seededRandom(varianceSeed);
  const points: DotPoint[] = [];
  const ribbons = Math.max(2, Math.min(4, Math.ceil(Math.sqrt(count) / 2)));
  const safeCount = Math.max(1, count);
  const horizontalScale = width > height ? height / Math.max(width, 1) : 1;

  for (let index = 0; index < safeCount; index += 1) {
    const progress = safeCount === 1 ? 0.5 : index / (safeCount - 1);
    const ribbon = index % ribbons;
    const ribbonCenter = (ribbon + 0.5) / ribbons;
    const amplitude = 0.05 + random() * 0.1;
    const frequency = 1.2 + random() * 1.8;
    const phase = ribbon * 0.22 + random() * 0.1;
    const driftX = (random() - 0.5) * 0.06;
    const driftY = (random() - 0.5) * 0.035;

    points.push({
      xRatio: progress + driftX,
      yRatio: ribbonCenter + Math.sin((progress * frequency + phase) * FULL_ARC) * amplitude * horizontalScale + driftY,
      varianceSample: varianceRandom(),
      profileSample: random(),
    });
  }

  return pointsToDots(
    { cssWidth: width, cssHeight: height, renderWidth: width, renderHeight: height, pixelRatio: 1 },
    size,
    variance,
    shape,
    points,
    charValue,
    directionMode,
    directionAngle,
  );
}

function generateSpiralDots(config: {
  width: number;
  height: number;
  count: number;
  size: number;
  variance: number;
  shape: DotShape;
  directionMode: DotDirectionMode;
  directionAngle: number;
  seed: number;
  varianceSeed: number;
  charValue?: string;
}): RenderDot[] {
  const { width, height, count, size, variance, shape, directionMode, directionAngle, seed, varianceSeed, charValue } = config;
  const random = seededRandom(seed);
  const varianceRandom = seededRandom(varianceSeed);
  const points: DotPoint[] = [];
  const centerX = 0.5 + (random() - 0.5) * 0.08;
  const centerY = 0.5 + (random() - 0.5) * 0.08;
  const turns = 1.6 + random() * 1.6;
  const horizontalScale = width > height ? height / Math.max(width, 1) : 1;
  const verticalScale = height > width ? width / Math.max(height, 1) : 1;
  const safeCount = Math.max(1, count);

  for (let index = 0; index < safeCount; index += 1) {
    const progress = safeCount === 1 ? 0.5 : index / (safeCount - 1);
    const angle = progress * FULL_ARC * turns + random() * 0.24;
    const radius = 0.08 + progress * 0.34 + (random() - 0.5) * 0.04;

    points.push({
      xRatio: centerX + Math.cos(angle) * radius * horizontalScale,
      yRatio: centerY + Math.sin(angle) * radius * verticalScale,
      varianceSample: varianceRandom(),
      profileSample: random(),
    });
  }

  return pointsToDots(
    { cssWidth: width, cssHeight: height, renderWidth: width, renderHeight: height, pixelRatio: 1 },
    size,
    variance,
    shape,
    points,
    charValue,
    directionMode,
    directionAngle,
  );
}

function pointsToDots(
  surface: SurfaceSize,
  size: number,
  variance: number,
  shape: DotShape,
  points: DotPoint[],
  charValue?: string,
  directionMode: DotDirectionMode = 'fixed',
  directionAngle = 0,
): RenderDot[] {
  const baseRadius = computeBaseRadius(size, surface.cssWidth);
  return points.map(point => {
    const radius = varyRadius(baseRadius, variance, point.varianceSample);
    return {
      radius,
      ...normalizeShape(shape, point.profileSample, directionMode, directionAngle),
      x: clampPosition(point.xRatio, surface.cssWidth, radius),
      y: clampPosition(point.yRatio, surface.cssHeight, radius),
      ...(charValue !== undefined ? { charValue } : {}),
    };
  });
}

function prepareCanvasContext(canvas: HTMLCanvasElement): {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
} | null {
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const width = Number(canvas.dataset.cssWidth) || canvas.width;
  const height = Number(canvas.dataset.cssHeight) || canvas.height;
  const scaleX = canvas.width / width;
  const scaleY = canvas.height / height;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.setTransform(scaleX, 0, 0, scaleY, 0, 0);
  return { context, width, height };
}

function fillBackground(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  background: BackgroundConfig,
): void {
  if (background.type === 'image') {
    drawImageCover(context, background.image, width, height);
    return;
  }

  if (background.type === 'duotone') {
    const stripeSize = Math.max(1, background.stripeSize ?? DEFAULT_STRIPE_SIZE);
    const stripeCount = Math.ceil((background.stripeOrientation === 'vertical' ? width : height) / stripeSize);
    for (let stripeIndex = 0; stripeIndex < stripeCount; stripeIndex += 1) {
      context.fillStyle = stripeIndex % 2 === 0 ? background.primaryColor : background.secondaryColor;
      if (background.stripeOrientation === 'vertical') {
        context.fillRect(stripeIndex * stripeSize, 0, stripeSize, height);
      } else {
        context.fillRect(0, stripeIndex * stripeSize, width, stripeSize);
      }
    }
    return;
  }

  context.fillStyle = background.color;
  context.fillRect(0, 0, width, height);
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const fit = computeCoverFit(
    {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
    },
    { width, height },
  );

  context.drawImage(image, fit.offsetX, fit.offsetY, fit.drawWidth, fit.drawHeight);
}

function createPhotoFillCanvas(
  image: HTMLImageElement,
  background: BackgroundConfig,
  width: number,
  height: number,
): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  fillBackground(context, width, height, background);
  drawImageCover(context, image, width, height);
  return canvas;
}

function computeCoverFit(
  image: { width: number; height: number },
  target: { width: number; height: number },
): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
  const scale = Math.max(target.width / image.width, target.height / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  return {
    drawWidth,
    drawHeight,
    offsetX: (target.width - drawWidth) / 2,
    offsetY: (target.height - drawHeight) / 2,
  };
}

function renderRainbowDots(context: CanvasRenderingContext2D, dots: RenderDot[], seed: number): void {
  for (const dot of dots) {
    const color = pickRainbowColor(dot, seed);
    if (dot.shape === 'char') {
      drawCharacterMask(context, dot, fillContext => {
        fillContext.fillStyle = color;
        fillContext.fillRect(dot.x - dot.radius, dot.y - dot.radius, dot.radius * 2, dot.radius * 2);
      });
      continue;
    }

    context.save();
    drawShapePath(context, dot);
    context.clip();
    context.fillStyle = color;
    context.fillRect(dot.x - dot.radius, dot.y - dot.radius, dot.radius * 2, dot.radius * 2);
    context.restore();
  }
}

function fillDotVisual(
  context: CanvasRenderingContext2D,
  dot: RenderDot,
  image: HTMLImageElement,
  background: BackgroundConfig,
  width: number,
  height: number,
  dotStyle: DotStyleConfig,
  seed: number,
): void {
  if (dotStyle.colorMode === 'photo') {
    fillBackground(context, width, height, background);
    drawImageCover(context, image, width, height);
    return;
  }

  fillDotStyleOnly(context, dot, image, background, width, height, dotStyle, seed, false);
}

function fillDotStyleOnly(
  context: CanvasRenderingContext2D,
  dot: RenderDot,
  image: HTMLImageElement,
  background: BackgroundConfig,
  width: number,
  height: number,
  dotStyle: DotStyleConfig,
  seed: number,
  invert = false,
): void {
  const x = dot.x - dot.radius;
  const y = dot.y - dot.radius;
  const size = dot.radius * 2;

  if (dotStyle.colorMode === 'gradient') {
    context.fillStyle = buildDotGradient(context, dot, dotStyle, seed, invert);
    context.fillRect(x, y, size, size);
    return;
  }

  const color = resolveDotPaletteColor(dot, dotStyle, seed, invert);
  if (color) {
    context.fillStyle = color;
    context.fillRect(x, y, size, size);
    return;
  }

  if (background.type === 'image') {
    drawImageCover(context, background.image, width, height);
    return;
  }

  if (dotStyle.colorMode === 'photo') {
    fillBackground(context, width, height, background);
    drawImageCover(context, image, width, height);
    return;
  }

  fillBackground(context, width, height, background);
}

function resolveDotPaletteColor(dot: RenderDot, dotStyle: DotStyleConfig, seed: number, invert = false): string | null {
  if (dotStyle.colorMode === 'single') {
    return invert ? dotStyle.primaryColor : dotStyle.accentColor;
  }

  if (dotStyle.colorMode === 'duotone') {
    const base = dotNoise(dot, seed);
    if (base < 0.5) {
      return invert ? dotStyle.secondaryColor : dotStyle.primaryColor;
    }
    return invert ? dotStyle.accentColor : dotStyle.accentColor;
  }

  if (dotStyle.colorMode === 'candy') {
    const palette = invert
      ? [dotStyle.secondaryColor, dotStyle.accentColor, dotStyle.primaryColor]
      : [dotStyle.primaryColor, dotStyle.secondaryColor, dotStyle.accentColor];
    const index = Math.floor(dotNoise(dot, seed) * palette.length) % palette.length;
    return palette[index];
  }

  return null;
}

function buildDotGradient(
  context: CanvasRenderingContext2D,
  dot: RenderDot,
  dotStyle: DotStyleConfig,
  seed: number,
  invert = false,
): CanvasGradient {
  const angle = dotNoise(dot, seed) * FULL_ARC;
  const startX = dot.x + Math.cos(angle) * dot.radius;
  const startY = dot.y + Math.sin(angle) * dot.radius;
  const endX = dot.x - Math.cos(angle) * dot.radius;
  const endY = dot.y - Math.sin(angle) * dot.radius;
  const gradient = context.createLinearGradient(startX, startY, endX, endY);
  gradient.addColorStop(0, invert ? dotStyle.secondaryColor : dotStyle.primaryColor);
  gradient.addColorStop(0.55, dotStyle.accentColor);
  gradient.addColorStop(1, invert ? dotStyle.primaryColor : dotStyle.secondaryColor);
  return gradient;
}

function renderPunchDots(
  prepared: { context: CanvasRenderingContext2D; width: number; height: number },
  dots: RenderDot[],
  image: HTMLImageElement,
  background: BackgroundConfig,
  seed: number,
  dotStyle: DotStyleConfig,
): void {
  if (dots.length === 0) {
    return;
  }

  const imageDots = dots.filter(dot => dot.shape !== 'char');
  const charDots = dots.filter(dot => dot.shape === 'char');

  if (imageDots.length > 0) {
    const renderCanvas = prepared.context.canvas as HTMLCanvasElement;
    const surface: SurfaceSize = {
      cssWidth: prepared.width,
      cssHeight: prepared.height,
      renderWidth: renderCanvas.width,
      renderHeight: renderCanvas.height,
      pixelRatio: renderCanvas.width / prepared.width,
    };
    const tempCanvas = createDetachedCanvas(surface);
    const tempPrepared = prepareCanvasContext(tempCanvas);
    if (tempPrepared) {
      if (background.type === 'image' && dotStyle.colorMode === 'photo') {
        tempPrepared.context.beginPath();
        for (const dot of imageDots) {
          appendShapePath(tempPrepared.context, dot);
        }
        tempPrepared.context.save();
        tempPrepared.context.clip();
        drawImageCover(tempPrepared.context, background.image, prepared.width, prepared.height);
        tempPrepared.context.restore();
      } else {
        for (const dot of imageDots) {
          tempPrepared.context.save();
          tempPrepared.context.beginPath();
          appendShapePath(tempPrepared.context, dot);
          tempPrepared.context.clip();
          fillDotStyleOnly(tempPrepared.context, dot, image, background, prepared.width, prepared.height, dotStyle, seed, true);
          tempPrepared.context.restore();
        }
      }

      const maxRadius = Math.max(...imageDots.map(dot => dot.radius));
      prepared.context.shadowColor = PAPER_THEME.shadow;
      prepared.context.shadowBlur = maxRadius * 0.2;
      prepared.context.drawImage(tempCanvas, 0, 0, prepared.width, prepared.height);
      prepared.context.shadowBlur = 0;
      prepared.context.drawImage(tempCanvas, 0, 0, prepared.width, prepared.height);
    }
  }

  for (const dot of charDots) {
    drawCharacterMask(prepared.context, dot, fillContext => {
      if (background.type === 'image' && dotStyle.colorMode === 'photo') {
        drawImageCover(fillContext, background.image, prepared.width, prepared.height);
        return;
      }

      fillDotStyleOnly(fillContext, dot, image, background, prepared.width, prepared.height, dotStyle, seed, true);
    });
  }

  for (const dot of dots) {
    strokeVisibleCircleOutline(prepared.context, dot, dots, 'rgba(139, 116, 86, 0.09)');
  }
}

function pickRainbowColor(dot: RenderDot, seed: number): string {
  const index = Math.floor(dotNoise(dot, seed) * RAINBOW_PALETTE.length) % RAINBOW_PALETTE.length;
  return RAINBOW_PALETTE[index];
}

function dotNoise(dot: RenderDot, seed: number): number {
  const value = Math.sin(dot.x * 12.9898 + dot.y * 78.233 + dot.radius * 37.719 + seed * 0.12345) * 43_758.5453;
  return value - Math.floor(value);
}

function drawCharacterMask(
  context: CanvasRenderingContext2D,
  dot: RenderDot,
  fill: (context: CanvasRenderingContext2D) => void,
): void {
  const size = dot.radius * 2;
  const offsetX = dot.x - dot.radius;
  const offsetY = dot.y - dot.radius;

  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = Math.ceil(size);
  maskCanvas.height = Math.ceil(size);
  const maskContext = maskCanvas.getContext('2d');
  if (!maskContext) {
    return;
  }

  const value = dot.charValue || '喵';
  let fontSize = dot.radius * 1.8;
  maskContext.font = `${fontSize}px sans-serif`;
  maskContext.textAlign = 'center';
  maskContext.textBaseline = 'middle';
  const textWidth = maskContext.measureText(value).width;
  const maxWidth = maskCanvas.width * 0.9;
  if (textWidth > maxWidth) {
    fontSize *= maxWidth / textWidth;
    maskContext.font = `${fontSize}px sans-serif`;
  }
  maskContext.fillStyle = '#000';
  maskContext.translate(maskCanvas.width / 2, maskCanvas.height / 2);
  maskContext.rotate(dot.rotation);
  maskContext.fillText(value, 0, 0);

  const fillCanvas = document.createElement('canvas');
  fillCanvas.width = Math.ceil(size);
  fillCanvas.height = Math.ceil(size);
  const fillContext = fillCanvas.getContext('2d');
  if (!fillContext) {
    return;
  }

  fillContext.translate(-offsetX, -offsetY);
  fill(fillContext);
  fillContext.setTransform(1, 0, 0, 1, 0, 0);
  fillContext.globalCompositeOperation = 'destination-in';
  fillContext.drawImage(maskCanvas, 0, 0);
  context.drawImage(fillCanvas, offsetX, offsetY);
}

function drawShapePath(context: CanvasRenderingContext2D, dot: RenderDot): void {
  context.beginPath();
  appendShapePath(context, dot);
}

function appendShapePath(context: CanvasRenderingContext2D, dot: RenderDot): void {
  if (dot.shape === 'char') {
    context.moveTo(dot.x + dot.radius, dot.y);
    context.arc(dot.x, dot.y, dot.radius, 0, FULL_ARC);
    return;
  }

  if (dot.shape === 'snowflake') {
    appendSnowflakePath(context, dot);
    return;
  }

  const polygon = getShapePolygon(dot);
  if (!polygon) {
    context.moveTo(dot.x + dot.radius, dot.y);
    context.arc(dot.x, dot.y, dot.radius, 0, FULL_ARC);
    return;
  }

  context.moveTo(polygon[0].x, polygon[0].y);
  for (let index = 1; index < polygon.length; index += 1) {
    context.lineTo(polygon[index].x, polygon[index].y);
  }
  context.closePath();
}

function appendSnowflakePath(context: CanvasRenderingContext2D, dot: RenderDot): void {
  const unit = (dot.radius * 2) / 13;
  const span = unit * 13;
  const originX = dot.x - span / 2;
  const originY = dot.y - span / 2;
  for (const [row, column] of SNOWFLAKE_GRID) {
    context.rect(originX + column * unit, originY + row * unit, unit, unit);
  }
}

function getShapePolygon(dot: RenderDot): Array<{ x: number; y: number }> | null {
  if (dot.shape === 'circle' || dot.shape === 'snowflake' || dot.shape === 'char') {
    return null;
  }

  if (dot.shape === 'heart') {
    const raw = heartPoints(dot.radius, 28).map(point => ({
      x: dot.x + point.x,
      y: dot.y + point.y,
    }));
    return raw.map(point => rotatePoint(point, { x: dot.x, y: dot.y }, dot.rotation));
  }

  if (dot.shape === 'flower') {
    return polarShapePoints(dot, 42, angle => {
      const petals = 4;
      return dot.radius * (0.48 + 0.52 * Math.abs(Math.sin(angle * petals)));
    });
  }

  if (dot.shape === 'drop') {
    const top = { x: dot.x, y: dot.y - dot.radius * 1.16 };
    const bottom = { x: dot.x, y: dot.y + dot.radius * 0.96 };
    const left = cubicBezierPoints(
      top,
      { x: dot.x - dot.radius * 0.16, y: dot.y - dot.radius * 0.96 },
      { x: dot.x - dot.radius * 1.12, y: dot.y + dot.radius * 0.96 },
      bottom,
      12,
      true,
    );
    const right = cubicBezierPoints(
      bottom,
      { x: dot.x + dot.radius * 1.12, y: dot.y + dot.radius * 0.96 },
      { x: dot.x + dot.radius * 0.16, y: dot.y - dot.radius * 0.96 },
      top,
      12,
      false,
    );
    return [...left, ...right].map(point => rotatePoint(point, { x: dot.x, y: dot.y }, dot.rotation));
  }

  if (dot.shape === 'square' || dot.shape === 'diamond') {
    return [
      { x: dot.x - dot.radius, y: dot.y - dot.radius },
      { x: dot.x + dot.radius, y: dot.y - dot.radius },
      { x: dot.x + dot.radius, y: dot.y + dot.radius },
      { x: dot.x - dot.radius, y: dot.y + dot.radius },
    ].map(point => rotatePoint(point, { x: dot.x, y: dot.y }, dot.rotation));
  }

  if (dot.shape === 'star' || dot.shape === 'spark') {
    const innerRadius = dot.radius * (dot.innerRadiusRatio ?? 0.48);
    const points = dot.shape === 'spark' ? 8 : 10;
    return Array.from({ length: points }, (_, index) => {
      const radius = index % 2 === 0 ? dot.radius : innerRadius;
      const angle = dot.rotation - Math.PI / 2 + (index * FULL_ARC) / points;
      return {
        x: dot.x + Math.cos(angle) * radius,
        y: dot.y + Math.sin(angle) * radius,
      };
    });
  }

  return null;
}

function polarShapePoints(
  dot: RenderDot,
  steps: number,
  radiusForAngle: (angle: number) => number,
): Array<{ x: number; y: number }> {
  return Array.from({ length: steps }, (_, index) => {
    const angle = dot.rotation - Math.PI / 2 + (index * FULL_ARC) / steps;
    const radius = radiusForAngle(angle - dot.rotation + Math.PI / 2);
    return {
      x: dot.x + Math.cos(angle) * radius,
      y: dot.y + Math.sin(angle) * radius,
    };
  });
}

function heartPoints(radius: number, steps: number): Array<{ x: number; y: number }> {
  return Array.from({ length: steps }, (_, index) => {
    const t = (index / steps) * FULL_ARC;
    const x = 16 * Math.sin(t) ** 3;
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    return {
      x: (x / 18) * radius,
      y: (-y / 18) * radius,
    };
  });
}

function cubicBezierPoints(
  start: { x: number; y: number },
  c1: { x: number; y: number },
  c2: { x: number; y: number },
  end: { x: number; y: number },
  steps: number,
  includeStart: boolean,
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  const safeSteps = Math.max(1, steps);
  const startIndex = includeStart ? 0 : 1;

  for (let step = startIndex; step <= safeSteps; step += 1) {
    const t = step / safeSteps;
    const inverse = 1 - t;
    points.push({
      x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * c1.x + 3 * inverse * t ** 2 * c2.x + t ** 3 * end.x,
      y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * c1.y + 3 * inverse * t ** 2 * c2.y + t ** 3 * end.y,
    });
  }

  return points;
}

function degreesToRadians(value: number): number {
  const normalized = ((value % 360) + 360) % 360;
  return (normalized / 180) * Math.PI;
}

function rotatePoint(
  point: { x: number; y: number },
  center: { x: number; y: number },
  angle: number,
): { x: number; y: number } {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const offsetX = point.x - center.x;
  const offsetY = point.y - center.y;
  return {
    x: center.x + offsetX * cos - offsetY * sin,
    y: center.y + offsetX * sin + offsetY * cos,
  };
}

function strokeVisibleCircleOutline(
  context: CanvasRenderingContext2D,
  dot: RenderDot,
  allDots: RenderDot[],
  color: string,
): void {
  if (dot.shape !== 'circle') {
    return;
  }

  const visibleArcs = computeVisibleArcs(dot, allDots);
  if (visibleArcs.length === 0) {
    return;
  }

  context.strokeStyle = color;
  context.lineWidth = 1;
  for (const arc of visibleArcs) {
    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius, arc.startAngle, arc.endAngle);
    context.stroke();
  }
}

function computeVisibleArcs(dot: RenderDot, allDots: RenderDot[]): Array<{ startAngle: number; endAngle: number }> {
  const occludedArcs = computeOccludedArcs(dot, allDots);
  if (occludedArcs.length === 0) {
    return [{ startAngle: 0, endAngle: FULL_ARC }];
  }

  if (occludedArcs.length === 1 && occludedArcs[0].startAngle <= ANGLE_EPSILON && occludedArcs[0].endAngle >= FULL_ARC - ANGLE_EPSILON) {
    return [];
  }

  const visibleArcs: Array<{ startAngle: number; endAngle: number }> = [];
  let cursor = 0;

  for (const arc of occludedArcs) {
    if (arc.startAngle > cursor + ANGLE_EPSILON) {
      visibleArcs.push({ startAngle: cursor, endAngle: arc.startAngle });
    }
    cursor = Math.max(cursor, arc.endAngle);
  }

  if (cursor < FULL_ARC - ANGLE_EPSILON) {
    visibleArcs.push({ startAngle: cursor, endAngle: FULL_ARC });
  }

  return visibleArcs;
}

function computeOccludedArcs(dot: RenderDot, allDots: RenderDot[]): Array<{ startAngle: number; endAngle: number }> {
  const rawArcs: Array<{ startAngle: number; endAngle: number }> = [];

  for (const otherDot of allDots) {
    if (otherDot === dot) {
      continue;
    }

    const deltaX = otherDot.x - dot.x;
    const deltaY = otherDot.y - dot.y;
    const distance = Math.hypot(deltaX, deltaY);

    if ((distance <= ANGLE_EPSILON && Math.abs(otherDot.radius - dot.radius) <= ANGLE_EPSILON) || distance >= dot.radius + otherDot.radius - ANGLE_EPSILON) {
      continue;
    }

    if (distance <= Math.abs(otherDot.radius - dot.radius) + ANGLE_EPSILON) {
      if (otherDot.radius >= dot.radius) {
        return [{ startAngle: 0, endAngle: FULL_ARC }];
      }
      continue;
    }

    const centerAngle = Math.atan2(deltaY, deltaX);
    const cosine = (dot.radius ** 2 + distance ** 2 - otherDot.radius ** 2) / (2 * dot.radius * distance);
    const angleOffset = Math.acos(Math.max(-1, Math.min(1, cosine)));
    const startAngle = normalizeAngle(centerAngle - angleOffset);
    const endAngle = normalizeAngle(centerAngle + angleOffset);

    if (startAngle <= endAngle) {
      rawArcs.push({ startAngle, endAngle });
    } else {
      rawArcs.push({ startAngle: 0, endAngle });
      rawArcs.push({ startAngle, endAngle: FULL_ARC });
    }
  }

  return mergeArcs(rawArcs);
}

function normalizeAngle(angle: number): number {
  const normalized = angle % FULL_ARC;
  return normalized >= 0 ? normalized : normalized + FULL_ARC;
}

function mergeArcs(arcs: Array<{ startAngle: number; endAngle: number }>): Array<{ startAngle: number; endAngle: number }> {
  if (arcs.length === 0) {
    return [];
  }

  const sorted = [...arcs].sort((left, right) => left.startAngle - right.startAngle);
  const merged = [sorted[0]];

  for (let index = 1; index < sorted.length; index += 1) {
    const current = sorted[index];
    const previous = merged[merged.length - 1];
    if (current.startAngle <= previous.endAngle + ANGLE_EPSILON) {
      previous.endAngle = Math.max(previous.endAngle, current.endAngle);
      continue;
    }
    merged.push({ ...current });
  }

  return merged;
}

function scaleDownToBlobBudget(size: { width: number; height: number }, bytes: number, limit = MAX_BLOB_SIZE): { width: number; height: number } {
  if (bytes <= limit) {
    return size;
  }

  const scale = Math.sqrt(limit / bytes);
  return {
    width: Math.max(1, Math.floor(size.width * scale)),
    height: Math.max(1, Math.floor(size.height * scale)),
  };
}

function scaleCanvasSize(size: { width: number; height: number }, factor: number): { width: number; height: number } {
  return {
    width: Math.max(1, Math.floor(size.width * factor)),
    height: Math.max(1, Math.floor(size.height * factor)),
  };
}

function resizeCanvas(sourceCanvas: HTMLCanvasElement, width: number, height: number): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(sourceCanvas, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: typeof JPEG_MIME | typeof PNG_MIME,
  quality?: number,
): Promise<Blob | null> {
  if (typeof canvas.toBlob !== 'function') {
    return Promise.resolve(null);
  }

  return new Promise(resolve => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(null);
    }, CANVAS_BLOB_TIMEOUT_MS);

    canvas.toBlob(blob => {
      if (settled) {
        return;
      }
      settled = true;
      window.clearTimeout(timer);
      resolve(blob);
    }, mimeType, quality);
  });
}
