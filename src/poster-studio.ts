export type PosterRatio = 'free' | 'square' | 'three-four' | 'four-five' | 'nine-sixteen';
export type PosterFrameStyle = 'editorial' | 'stamp' | 'film' | 'ticket' | 'clean';
export type PosterBackdropStyle = 'solid' | 'mesh' | 'grid' | 'burst';
export type PosterThemeId = 'atelier' | 'sorbet' | 'midnight' | 'ticket' | 'gallery';

type RatioSize = {
  width: number;
  height: number;
};

type RgbColor = {
  r: number;
  g: number;
  b: number;
};

export type PosterThemePreset = {
  id: PosterThemeId;
  label: string;
  kicker: string;
  description: string;
  ratio: PosterRatio;
  frameStyle: PosterFrameStyle;
  backdropStyle: PosterBackdropStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  badge: string;
  footer: string;
};

export interface PosterState {
  themeId: PosterThemeId;
  ratio: PosterRatio;
  frameStyle: PosterFrameStyle;
  backdropStyle: PosterBackdropStyle;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  badge: string;
  footer: string;
}

export const POSTER_RATIO_OPTIONS: Array<{ value: PosterRatio; label: string }> = [
  { value: 'free', label: '自由' },
  { value: 'square', label: '1:1' },
  { value: 'three-four', label: '3:4' },
  { value: 'four-five', label: '4:5' },
  { value: 'nine-sixteen', label: '9:16' },
];

export const POSTER_FRAME_OPTIONS: Array<{ value: PosterFrameStyle; label: string }> = [
  { value: 'editorial', label: '编辑框' },
  { value: 'stamp', label: '邮票边' },
  { value: 'film', label: '胶片框' },
  { value: 'ticket', label: '票根框' },
  { value: 'clean', label: '极简框' },
];

export const POSTER_BACKDROP_OPTIONS: Array<{ value: PosterBackdropStyle; label: string }> = [
  { value: 'solid', label: '纯底' },
  { value: 'mesh', label: '云雾渐层' },
  { value: 'grid', label: '网格刊物' },
  { value: 'burst', label: '放射海报' },
];

const POSTER_RATIO_MAP: Record<Exclude<PosterRatio, 'free'>, RatioSize> = {
  square: { width: 1, height: 1 },
  'three-four': { width: 3, height: 4 },
  'four-five': { width: 4, height: 5 },
  'nine-sixteen': { width: 9, height: 16 },
};

export const POSTER_THEME_PRESETS: PosterThemePreset[] = [
  {
    id: 'atelier',
    label: '编辑部留白',
    kicker: 'EDITORIAL',
    description: '细线边框 + 留白标题，适合做封面首图。',
    ratio: 'four-five',
    frameStyle: 'editorial',
    backdropStyle: 'mesh',
    primaryColor: '#f6efe3',
    secondaryColor: '#d7c8ba',
    accentColor: '#cf5b3e',
    title: '今日灵感海报',
    subtitle: '把照片变成更像成品的小红书封面',
    badge: 'VOL. 07',
    footer: 'PAPER DOTS STUDIO',
  },
  {
    id: 'sorbet',
    label: '糖纸贴贴',
    kicker: 'STICKER',
    description: '柔和彩底 + 邮票感边缘，适合偏可爱氛围。',
    ratio: 'square',
    frameStyle: 'stamp',
    backdropStyle: 'solid',
    primaryColor: '#fff0df',
    secondaryColor: '#ffd7d4',
    accentColor: '#ff6b8c',
    title: '贴纸感日常',
    subtitle: '像一本被随手拼好的软糖色手账',
    badge: 'SWEET CUT',
    footer: 'SHARE YOUR MOOD',
  },
  {
    id: 'midnight',
    label: '午夜电波',
    kicker: 'NOCTURNE',
    description: '暗底霓虹 + 胶片框，适合更醒目的内容图。',
    ratio: 'nine-sixteen',
    frameStyle: 'film',
    backdropStyle: 'grid',
    primaryColor: '#101524',
    secondaryColor: '#23324c',
    accentColor: '#87f0ff',
    title: '夜间采样',
    subtitle: '把照片做成带光感的杂志感版面',
    badge: 'AFTER DARK',
    footer: 'SIGNAL / 24-07',
  },
  {
    id: 'ticket',
    label: '旅途票根',
    kicker: 'TICKET',
    description: '票券切口 + 放射底板，适合纪念和攻略图。',
    ratio: 'three-four',
    frameStyle: 'ticket',
    backdropStyle: 'burst',
    primaryColor: '#f7e6c8',
    secondaryColor: '#f0b16d',
    accentColor: '#2b3a67',
    title: '旅途纪念册',
    subtitle: '像被夹在书里的那张旧票根一样有故事',
    badge: 'BOARDING PASS',
    footer: 'MEMO / CITY WALK',
  },
  {
    id: 'gallery',
    label: '片场存档',
    kicker: 'ARCHIVE',
    description: '极简框 + 中性色，更稳，更像品牌视觉。',
    ratio: 'four-five',
    frameStyle: 'clean',
    backdropStyle: 'grid',
    primaryColor: '#ebe7df',
    secondaryColor: '#d4cdc4',
    accentColor: '#171312',
    title: '画面存档',
    subtitle: '更克制的排版，更适合系列内容统一风格',
    badge: 'ARCHIVE',
    footer: 'CURATED FRAME / 2026',
  },
];

const PREVIEW_FALLBACK_WIDTH = 720;

export function createInitialPosterState(): PosterState {
  return applyPosterTheme(
    {
      themeId: 'atelier',
      ratio: 'four-five',
      frameStyle: 'editorial',
      backdropStyle: 'mesh',
      primaryColor: '#f6efe3',
      secondaryColor: '#d7c8ba',
      accentColor: '#cf5b3e',
      title: '',
      subtitle: '',
      badge: '',
      footer: '',
    },
    'atelier',
  );
}

export function applyPosterTheme(state: PosterState, themeId: PosterThemeId, preserveCopy = false): PosterState {
  const preset = getPosterThemePreset(themeId);
  return {
    ...state,
    themeId,
    ratio: preset.ratio,
    frameStyle: preset.frameStyle,
    backdropStyle: preset.backdropStyle,
    primaryColor: preset.primaryColor,
    secondaryColor: preset.secondaryColor,
    accentColor: preset.accentColor,
    title: preserveCopy && state.title.trim() ? state.title : preset.title,
    subtitle: preserveCopy && state.subtitle.trim() ? state.subtitle : preset.subtitle,
    badge: preserveCopy && state.badge.trim() ? state.badge : preset.badge,
    footer: preserveCopy && state.footer.trim() ? state.footer : preset.footer,
  };
}

export function pickRandomPosterTheme(currentThemeId: PosterThemeId): PosterThemeId {
  const candidates = POSTER_THEME_PRESETS.map(theme => theme.id).filter(themeId => themeId !== currentThemeId);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? currentThemeId;
}

export function extractPosterPalette(image: HTMLImageElement): Pick<PosterState, 'primaryColor' | 'secondaryColor' | 'accentColor'> {
  const canvas = document.createElement('canvas');
  canvas.width = 52;
  canvas.height = 52;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) {
    return {
      primaryColor: '#f6efe3',
      secondaryColor: '#d7c8ba',
      accentColor: '#cf5b3e',
    };
  }

  drawImageCover(context, image, canvas.width, canvas.height);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let count = 0;
  let brightest: { color: RgbColor; lightness: number } | null = null;
  let darkest: { color: RgbColor; lightness: number } | null = null;
  let vivid: { color: RgbColor; score: number } | null = null;

  for (let index = 0; index < pixels.length; index += 16) {
    const alpha = pixels[index + 3] / 255;
    if (alpha < 0.8) {
      continue;
    }

    const color = {
      r: pixels[index],
      g: pixels[index + 1],
      b: pixels[index + 2],
    };

    totalR += color.r;
    totalG += color.g;
    totalB += color.b;
    count += 1;

    const { lightness, saturation } = rgbToHsl(color);
    if (!brightest || lightness > brightest.lightness) {
      brightest = { color, lightness };
    }
    if (!darkest || lightness < darkest.lightness) {
      darkest = { color, lightness };
    }

    const vividScore = saturation * (1 - Math.abs(lightness - 0.5));
    if (!vivid || vividScore > vivid.score) {
      vivid = { color, score: vividScore };
    }
  }

  if (count === 0) {
    return {
      primaryColor: '#f6efe3',
      secondaryColor: '#d7c8ba',
      accentColor: '#cf5b3e',
    };
  }

  const average = {
    r: totalR / count,
    g: totalG / count,
    b: totalB / count,
  };

  const background = mixRgb(average, { r: 250, g: 245, b: 238 }, 0.68);
  const secondary = mixRgb(darkest?.color ?? average, average, 0.45);
  const accent = vivid?.color ?? rotateHue(average, 30);

  return {
    primaryColor: rgbToHex(background),
    secondaryColor: rgbToHex(mixRgb(secondary, { r: 255, g: 255, b: 255 }, 0.12)),
    accentColor: rgbToHex(accent),
  };
}

export function renderPosterPreviewCanvas(
  canvas: HTMLCanvasElement,
  artCanvas: HTMLCanvasElement | null,
  posterState: PosterState,
): void {
  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(PREVIEW_FALLBACK_WIDTH, Math.round((canvas.clientWidth || 340) * pixelRatio));
  const preview = composePosterCanvas(artCanvas, posterState, width);
  canvas.width = preview.width;
  canvas.height = preview.height;
  canvas.style.aspectRatio = `${preview.width} / ${preview.height}`;
  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(preview, 0, 0);
}

export function composePosterCanvas(
  artCanvas: HTMLCanvasElement | null,
  posterState: PosterState,
  widthHint = 1_600,
): HTMLCanvasElement {
  const size = getPosterSize(artCanvas, posterState, widthHint);
  const canvas = document.createElement('canvas');
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  paintBackdrop(context, size.width, size.height, posterState);

  const padding = Math.round(size.width * 0.07);
  const gap = Math.round(size.width * 0.028);
  const inner = {
    x: padding,
    y: padding,
    width: size.width - padding * 2,
    height: size.height - padding * 2,
  };

  const badgeHeight = posterState.badge.trim() ? Math.round(size.height * 0.06) : 0;
  const footerHeight = posterState.footer.trim() ? Math.round(size.height * 0.05) : Math.round(size.height * 0.035);
  const textHeight = posterState.title.trim() || posterState.subtitle.trim() ? Math.round(size.height * 0.2) : Math.round(size.height * 0.1);
  const artTop = inner.y + (badgeHeight > 0 ? badgeHeight + Math.round(gap * 0.6) : 0);
  const artHeight = Math.max(220, inner.height - textHeight - footerHeight - gap * 2 - (badgeHeight > 0 ? badgeHeight + Math.round(gap * 0.6) : 0));
  const artFrame = {
    x: inner.x,
    y: artTop,
    width: inner.width,
    height: artHeight,
  };
  const artInset = getFrameInset(posterState.frameStyle, size.width);
  const imageRect = insetRect(artFrame, artInset);

  drawFrameBase(context, artFrame, posterState);
  drawArtwork(context, artCanvas, imageRect, posterState);
  drawFrameOverlay(context, artFrame, imageRect, posterState);
  drawPosterCopy(context, inner, artFrame, badgeHeight, gap, posterState);
  drawThemeAccents(context, size, posterState);
  applyGrain(context, size.width, size.height, posterState);

  return canvas;
}

function getPosterThemePreset(themeId: PosterThemeId): PosterThemePreset {
  return POSTER_THEME_PRESETS.find(theme => theme.id === themeId) ?? POSTER_THEME_PRESETS[0];
}

function getPosterSize(artCanvas: HTMLCanvasElement | null, posterState: PosterState, widthHint: number): { width: number; height: number } {
  const safeWidth = Math.max(900, Math.round(widthHint));
  if (posterState.ratio === 'free') {
    const artRatio = artCanvas ? artCanvas.height / artCanvas.width : 1.2;
    const padding = Math.round(safeWidth * 0.1);
    const textHeight = Math.round(safeWidth * 0.34);
    return {
      width: safeWidth,
      height: Math.max(Math.round(safeWidth * artRatio) + padding * 2 + textHeight, Math.round(safeWidth * 1.24)),
    };
  }

  const ratio = POSTER_RATIO_MAP[posterState.ratio];
  return {
    width: safeWidth,
    height: Math.round((safeWidth * ratio.height) / ratio.width),
  };
}

function paintBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  posterState: PosterState,
): void {
  context.fillStyle = posterState.primaryColor;
  context.fillRect(0, 0, width, height);

  if (posterState.backdropStyle === 'solid') {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, withAlpha(posterState.secondaryColor, 0.56));
    gradient.addColorStop(1, withAlpha(posterState.primaryColor, 0));
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    return;
  }

  if (posterState.backdropStyle === 'mesh') {
    paintMeshBackdrop(context, width, height, posterState);
    return;
  }

  if (posterState.backdropStyle === 'grid') {
    paintGridBackdrop(context, width, height, posterState);
    return;
  }

  paintBurstBackdrop(context, width, height, posterState);
}

function paintMeshBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  posterState: PosterState,
): void {
  const topLeft = context.createRadialGradient(width * 0.12, height * 0.16, 0, width * 0.12, height * 0.16, width * 0.65);
  topLeft.addColorStop(0, withAlpha(posterState.accentColor, 0.24));
  topLeft.addColorStop(1, withAlpha(posterState.accentColor, 0));
  context.fillStyle = topLeft;
  context.fillRect(0, 0, width, height);

  const bottomRight = context.createRadialGradient(width * 0.82, height * 0.78, 0, width * 0.82, height * 0.78, width * 0.58);
  bottomRight.addColorStop(0, withAlpha(posterState.secondaryColor, 0.4));
  bottomRight.addColorStop(1, withAlpha(posterState.secondaryColor, 0));
  context.fillStyle = bottomRight;
  context.fillRect(0, 0, width, height);

  const diagonal = context.createLinearGradient(0, height * 0.2, width, height);
  diagonal.addColorStop(0, withAlpha('#ffffff', 0.3));
  diagonal.addColorStop(0.45, withAlpha('#ffffff', 0));
  diagonal.addColorStop(1, withAlpha(posterState.secondaryColor, 0.12));
  context.fillStyle = diagonal;
  context.fillRect(0, 0, width, height);
}

function paintGridBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  posterState: PosterState,
): void {
  const stripe = context.createLinearGradient(0, 0, width, height);
  stripe.addColorStop(0, withAlpha(posterState.secondaryColor, 0.26));
  stripe.addColorStop(1, withAlpha(posterState.primaryColor, 0.06));
  context.fillStyle = stripe;
  context.fillRect(0, 0, width, height);

  const cell = Math.max(28, Math.round(width * 0.028));
  context.strokeStyle = withAlpha(posterState.accentColor, 0.1);
  context.lineWidth = 1;
  for (let x = 0; x <= width; x += cell) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, height);
    context.stroke();
  }
  for (let y = 0; y <= height; y += cell) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  context.fillStyle = withAlpha(posterState.accentColor, 0.08);
  context.fillRect(Math.round(width * 0.08), Math.round(height * 0.12), Math.round(width * 0.26), Math.round(height * 0.04));
  context.fillRect(Math.round(width * 0.66), Math.round(height * 0.84), Math.round(width * 0.18), Math.round(height * 0.04));
}

function paintBurstBackdrop(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  posterState: PosterState,
): void {
  const centerX = width * 0.82;
  const centerY = height * 0.16;
  context.save();
  context.translate(centerX, centerY);
  const radius = Math.hypot(width, height);
  for (let index = 0; index < 22; index += 1) {
    const angle = (Math.PI * 2 * index) / 22;
    const spread = Math.PI / 28;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(angle - spread) * radius, Math.sin(angle - spread) * radius);
    context.lineTo(Math.cos(angle + spread) * radius, Math.sin(angle + spread) * radius);
    context.closePath();
    context.fillStyle = index % 2 === 0 ? withAlpha(posterState.accentColor, 0.11) : withAlpha(posterState.secondaryColor, 0.14);
    context.fill();
  }
  context.restore();

  const soft = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, width * 0.5);
  soft.addColorStop(0, withAlpha('#ffffff', 0.18));
  soft.addColorStop(1, withAlpha('#ffffff', 0));
  context.fillStyle = soft;
  context.fillRect(0, 0, width, height);
}

function drawFrameBase(
  context: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  posterState: PosterState,
): void {
  context.save();
  context.shadowColor = withAlpha('#090605', posterState.frameStyle === 'film' ? 0.28 : 0.16);
  context.shadowBlur = Math.round(rect.width * 0.024);
  context.shadowOffsetY = Math.round(rect.height * 0.03);

  if (posterState.frameStyle === 'film') {
    context.fillStyle = '#0d1016';
    fillRoundedRect(context, rect.x, rect.y, rect.width, rect.height, Math.round(rect.width * 0.025));
    context.restore();
    return;
  }

  const baseColor = posterState.frameStyle === 'clean' ? '#ffffff' : mixHex(posterState.primaryColor, '#ffffff', 0.62);
  context.fillStyle = baseColor;
  fillRoundedRect(context, rect.x, rect.y, rect.width, rect.height, Math.round(rect.width * 0.018));
  context.restore();
}

function drawArtwork(
  context: CanvasRenderingContext2D,
  artCanvas: HTMLCanvasElement | null,
  rect: { x: number; y: number; width: number; height: number },
  posterState: PosterState,
): void {
  context.save();
  context.fillStyle = posterState.frameStyle === 'film' ? '#121a23' : withAlpha('#ffffff', 0.78);
  fillRoundedRect(context, rect.x, rect.y, rect.width, rect.height, Math.round(rect.width * 0.012));
  context.beginPath();
  context.roundRect(rect.x, rect.y, rect.width, rect.height, Math.round(rect.width * 0.012));
  context.clip();

  if (!artCanvas) {
    drawPlaceholderArtwork(context, rect, posterState);
    context.restore();
    return;
  }

  const fit = computeContainFit(
    { width: artCanvas.width, height: artCanvas.height },
    { width: rect.width, height: rect.height },
  );
  context.drawImage(artCanvas, rect.x + fit.offsetX, rect.y + fit.offsetY, fit.drawWidth, fit.drawHeight);
  context.restore();
}

function drawFrameOverlay(
  context: CanvasRenderingContext2D,
  outerRect: { x: number; y: number; width: number; height: number },
  imageRect: { x: number; y: number; width: number; height: number },
  posterState: PosterState,
): void {
  context.save();

  if (posterState.frameStyle === 'editorial') {
    context.strokeStyle = withAlpha('#1a1511', 0.9);
    context.lineWidth = Math.max(1, Math.round(outerRect.width * 0.0022));
    strokeRoundedRect(context, outerRect.x, outerRect.y, outerRect.width, outerRect.height, Math.round(outerRect.width * 0.018));
    strokeRoundedRect(
      context,
      outerRect.x + 16,
      outerRect.y + 16,
      outerRect.width - 32,
      outerRect.height - 32,
      Math.round(outerRect.width * 0.014),
    );

    const mark = Math.round(outerRect.width * 0.036);
    drawCornerMark(context, outerRect.x + 18, outerRect.y + 18, mark, posterState.accentColor);
    drawCornerMark(context, outerRect.x + outerRect.width - 18, outerRect.y + outerRect.height - 18, mark, posterState.accentColor, true);
    context.restore();
    return;
  }

  if (posterState.frameStyle === 'stamp') {
    context.strokeStyle = withAlpha(posterState.accentColor, 0.74);
    context.lineWidth = Math.max(2, Math.round(outerRect.width * 0.004));
    context.setLineDash([Math.round(outerRect.width * 0.015), Math.round(outerRect.width * 0.009)]);
    strokeRoundedRect(context, outerRect.x + 10, outerRect.y + 10, outerRect.width - 20, outerRect.height - 20, Math.round(outerRect.width * 0.02));
    context.setLineDash([]);
    context.restore();
    return;
  }

  if (posterState.frameStyle === 'film') {
    context.fillStyle = '#fbfbf7';
    const holeWidth = Math.round(outerRect.width * 0.038);
    const holeHeight = Math.round(outerRect.height * 0.045);
    const sidePadding = Math.round(outerRect.width * 0.024);
    const count = Math.max(6, Math.floor(outerRect.height / (holeHeight * 1.5)));
    for (let index = 0; index < count; index += 1) {
      const offsetY = outerRect.y + sidePadding + index * ((outerRect.height - sidePadding * 2 - holeHeight) / Math.max(1, count - 1));
      fillRoundedRect(context, outerRect.x + sidePadding, offsetY, holeWidth, holeHeight, holeWidth / 3);
      fillRoundedRect(context, outerRect.x + outerRect.width - sidePadding - holeWidth, offsetY, holeWidth, holeHeight, holeWidth / 3);
    }
    context.strokeStyle = withAlpha(posterState.accentColor, 0.38);
    context.lineWidth = Math.max(1, Math.round(imageRect.width * 0.0022));
    strokeRoundedRect(context, imageRect.x, imageRect.y, imageRect.width, imageRect.height, Math.round(imageRect.width * 0.012));
    context.restore();
    return;
  }

  if (posterState.frameStyle === 'ticket') {
    const notchRadius = Math.round(outerRect.width * 0.035);
    context.fillStyle = posterState.primaryColor;
    context.beginPath();
    context.arc(outerRect.x, outerRect.y + outerRect.height * 0.52, notchRadius, 0, Math.PI * 2);
    context.arc(outerRect.x + outerRect.width, outerRect.y + outerRect.height * 0.52, notchRadius, 0, Math.PI * 2);
    context.fill();

    context.strokeStyle = withAlpha(posterState.accentColor, 0.72);
    context.lineWidth = Math.max(2, Math.round(outerRect.width * 0.0032));
    context.setLineDash([Math.round(outerRect.width * 0.012), Math.round(outerRect.width * 0.008)]);
    context.beginPath();
    context.moveTo(outerRect.x + Math.round(outerRect.width * 0.05), outerRect.y + outerRect.height * 0.76);
    context.lineTo(outerRect.x + outerRect.width - Math.round(outerRect.width * 0.05), outerRect.y + outerRect.height * 0.76);
    context.stroke();
    context.setLineDash([]);
    context.restore();
    return;
  }

  context.strokeStyle = withAlpha('#18120f', 0.24);
  context.lineWidth = Math.max(1, Math.round(outerRect.width * 0.002));
  strokeRoundedRect(context, outerRect.x + 8, outerRect.y + 8, outerRect.width - 16, outerRect.height - 16, Math.round(outerRect.width * 0.015));
  context.restore();
}

function drawPosterCopy(
  context: CanvasRenderingContext2D,
  inner: { x: number; y: number; width: number; height: number },
  artFrame: { x: number; y: number; width: number; height: number },
  badgeHeight: number,
  gap: number,
  posterState: PosterState,
): void {
  const title = posterState.title.trim();
  const subtitle = posterState.subtitle.trim();
  const badge = posterState.badge.trim();
  const footer = posterState.footer.trim();

  if (badge) {
    const badgePaddingX = Math.round(inner.width * 0.028);
    const badgeWidth = Math.min(inner.width, Math.round(measurePillWidth(badge, inner.width) + badgePaddingX * 2));
    const badgeY = inner.y;
    context.fillStyle = posterState.accentColor;
    fillRoundedRect(context, inner.x, badgeY, badgeWidth, badgeHeight, Math.round(badgeHeight / 2));
    context.fillStyle = isDarkColor(posterState.accentColor) ? '#fdfaf6' : '#12100f';
    context.font = `${Math.round(badgeHeight * 0.42)}px "Avenir Next", "PingFang SC", sans-serif`;
    context.textBaseline = 'middle';
    context.fillText(badge.toUpperCase(), inner.x + badgePaddingX, badgeY + badgeHeight / 2);
  }

  const copyTop = artFrame.y + artFrame.height + gap;
  const copyWidth = inner.width;
  const titleFontSize = Math.max(40, Math.round(copyWidth * 0.064));
  const subtitleFontSize = Math.max(20, Math.round(copyWidth * 0.026));

  if (title) {
    context.fillStyle = '#181311';
    context.font = `700 ${titleFontSize}px "Georgia", "Times New Roman", "Songti SC", serif`;
    const titleLines = wrapText(context, title, copyWidth, 2);
    titleLines.forEach((line, index) => {
      context.fillText(line, inner.x, copyTop + index * Math.round(titleFontSize * 1.05));
    });

    context.fillStyle = posterState.accentColor;
    context.fillRect(inner.x, copyTop + titleLines.length * Math.round(titleFontSize * 1.05) + 8, Math.min(copyWidth * 0.22, 180), 4);
  }

  if (subtitle) {
    const subtitleTop = copyTop + (title ? Math.round(titleFontSize * 1.8) : 0);
    context.fillStyle = withAlpha('#221b18', 0.72);
    context.font = `${subtitleFontSize}px "Avenir Next", "PingFang SC", sans-serif`;
    const subtitleLines = wrapText(context, subtitle, copyWidth, 3);
    subtitleLines.forEach((line, index) => {
      context.fillText(line, inner.x, subtitleTop + index * Math.round(subtitleFontSize * 1.45));
    });
  }

  context.font = `${Math.max(16, Math.round(inner.width * 0.018))}px "Avenir Next", "PingFang SC", sans-serif`;
  context.fillStyle = withAlpha('#1d1713', 0.56);
  context.textBaseline = 'bottom';
  const footerValue = footer || getPosterThemePreset(posterState.themeId).footer;
  context.fillText(footerValue, inner.x, inner.y + inner.height);
}

function drawThemeAccents(
  context: CanvasRenderingContext2D,
  size: { width: number; height: number },
  posterState: PosterState,
): void {
  context.save();

  if (posterState.themeId === 'atelier') {
    context.fillStyle = withAlpha(posterState.accentColor, 0.12);
    context.fillRect(Math.round(size.width * 0.74), Math.round(size.height * 0.08), Math.round(size.width * 0.15), Math.round(size.height * 0.018));
    context.fillRect(Math.round(size.width * 0.78), Math.round(size.height * 0.11), Math.round(size.width * 0.11), Math.round(size.height * 0.012));
  }

  if (posterState.themeId === 'sorbet') {
    drawSparkle(context, size.width * 0.86, size.height * 0.15, size.width * 0.028, posterState.accentColor);
    drawSparkle(context, size.width * 0.15, size.height * 0.86, size.width * 0.02, posterState.secondaryColor);
  }

  if (posterState.themeId === 'midnight') {
    context.strokeStyle = withAlpha(posterState.accentColor, 0.42);
    context.lineWidth = Math.max(1, Math.round(size.width * 0.002));
    context.beginPath();
    context.arc(size.width * 0.78, size.height * 0.14, size.width * 0.09, Math.PI * 0.1, Math.PI * 1.7);
    context.stroke();
    drawSparkle(context, size.width * 0.84, size.height * 0.18, size.width * 0.024, posterState.accentColor);
  }

  if (posterState.themeId === 'ticket') {
    const barcodeX = Math.round(size.width * 0.79);
    const barcodeY = Math.round(size.height * 0.88);
    const barHeights = [0.05, 0.08, 0.06, 0.09, 0.04, 0.1, 0.07, 0.06];
    context.fillStyle = withAlpha('#101112', 0.8);
    barHeights.forEach((value, index) => {
      context.fillRect(barcodeX + index * 12, barcodeY - size.height * value, 5, size.height * value);
    });
  }

  if (posterState.themeId === 'gallery') {
    context.fillStyle = withAlpha('#0f0b0a', 0.08);
    context.fillRect(Math.round(size.width * 0.08), Math.round(size.height * 0.08), Math.round(size.width * 0.1), Math.round(size.height * 0.012));
    context.fillRect(Math.round(size.width * 0.08), Math.round(size.height * 0.1), Math.round(size.width * 0.16), Math.round(size.height * 0.012));
  }

  context.restore();
}

function applyGrain(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  posterState: PosterState,
): void {
  const points = Math.max(120, Math.round((width * height) / 9_000));
  context.save();
  context.fillStyle = withAlpha(isDarkColor(posterState.primaryColor) ? '#ffffff' : '#16110d', 0.025);
  for (let index = 0; index < points; index += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() > 0.82 ? 2 : 1;
    context.fillRect(x, y, size, size);
  }
  context.restore();
}

function drawPlaceholderArtwork(
  context: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  posterState: PosterState,
): void {
  const gradient = context.createLinearGradient(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height);
  gradient.addColorStop(0, withAlpha(posterState.secondaryColor, 0.9));
  gradient.addColorStop(1, withAlpha(posterState.primaryColor, 0.8));
  context.fillStyle = gradient;
  context.fillRect(rect.x, rect.y, rect.width, rect.height);

  context.fillStyle = withAlpha('#ffffff', 0.55);
  context.fillRect(rect.x + rect.width * 0.12, rect.y + rect.height * 0.14, rect.width * 0.76, rect.height * 0.26);

  context.fillStyle = withAlpha(posterState.accentColor, 0.2);
  context.fillRect(rect.x + rect.width * 0.08, rect.y + rect.height * 0.54, rect.width * 0.84, rect.height * 0.18);

  context.strokeStyle = withAlpha('#181311', 0.18);
  context.lineWidth = Math.max(1, Math.round(rect.width * 0.003));
  const radius = Math.max(12, Math.round(rect.width * 0.045));
  for (let index = 0; index < 6; index += 1) {
    const x = rect.x + rect.width * (0.14 + index * 0.13);
    const y = rect.y + rect.height * (0.65 - (index % 2) * 0.08);
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.stroke();
  }

  context.fillStyle = withAlpha('#181311', 0.68);
  context.font = `${Math.round(rect.width * 0.052)}px "Georgia", "Songti SC", serif`;
  context.fillText('上传图片后', rect.x + rect.width * 0.12, rect.y + rect.height * 0.25);
  context.font = `${Math.round(rect.width * 0.04)}px "Avenir Next", "PingFang SC", sans-serif`;
  context.fillText('这里会生成带标题和边框的海报预览', rect.x + rect.width * 0.12, rect.y + rect.height * 0.34);
}

function getFrameInset(style: PosterFrameStyle, posterWidth: number): { top: number; right: number; bottom: number; left: number } {
  const base = Math.round(posterWidth * 0.028);
  if (style === 'film') {
    return { top: base * 1.4, right: base * 2.2, bottom: base * 1.4, left: base * 2.2 };
  }

  if (style === 'ticket') {
    return { top: base * 1.1, right: base * 1.3, bottom: base * 1.9, left: base * 1.3 };
  }

  if (style === 'stamp') {
    return { top: base * 1.1, right: base * 1.1, bottom: base * 1.1, left: base * 1.1 };
  }

  if (style === 'clean') {
    return { top: base * 0.85, right: base * 0.85, bottom: base * 0.85, left: base * 0.85 };
  }

  return { top: base, right: base, bottom: base, left: base };
}

function insetRect(
  rect: { x: number; y: number; width: number; height: number },
  inset: { top: number; right: number; bottom: number; left: number },
): { x: number; y: number; width: number; height: number } {
  return {
    x: rect.x + inset.left,
    y: rect.y + inset.top,
    width: rect.width - inset.left - inset.right,
    height: rect.height - inset.top - inset.bottom,
  };
}

function computeContainFit(
  source: { width: number; height: number },
  target: { width: number; height: number },
): { drawWidth: number; drawHeight: number; offsetX: number; offsetY: number } {
  const scale = Math.min(target.width / source.width, target.height / source.height);
  const drawWidth = source.width * scale;
  const drawHeight = source.height * scale;
  return {
    drawWidth,
    drawHeight,
    offsetX: (target.width - drawWidth) / 2,
    offsetY: (target.height - drawHeight) / 2,
  };
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
): void {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  context.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
}

function wrapText(
  context: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const chars = Array.from(value);
  const lines: string[] = [];
  let current = '';

  for (const char of chars) {
    const next = current + char;
    if (current && context.measureText(next).width > maxWidth) {
      lines.push(current);
      current = char;
      if (lines.length === maxLines - 1) {
        break;
      }
      continue;
    }
    current = next;
  }

  if (lines.length < maxLines && current) {
    lines.push(current);
  }

  const remaining = chars.slice(lines.join('').length).join('');
  if (remaining && lines.length > 0) {
    lines[lines.length - 1] = `${trimToWidth(context, `${lines[lines.length - 1]}${remaining}`, maxWidth)}…`;
  }

  return lines;
}

function trimToWidth(context: CanvasRenderingContext2D, value: string, maxWidth: number): string {
  let result = value;
  while (result.length > 0 && context.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return result;
}

function measurePillWidth(value: string, basis: number): number {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return basis * 0.28;
  }
  context.font = `${Math.round(basis * 0.028)}px "Avenir Next", "PingFang SC", sans-serif`;
  return context.measureText(value.toUpperCase()).width;
}

function fillRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

function strokeRoundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.stroke();
}

function drawCornerMark(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  reverse = false,
): void {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  if (!reverse) {
    context.moveTo(x, y + size);
    context.lineTo(x, y);
    context.lineTo(x + size, y);
  } else {
    context.moveTo(x - size, y);
    context.lineTo(x, y);
    context.lineTo(x, y - size);
  }
  context.stroke();
  context.restore();
}

function drawSparkle(context: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = withAlpha(color, 0.9);
  context.lineWidth = Math.max(1.5, size * 0.1);
  context.beginPath();
  context.moveTo(-size, 0);
  context.lineTo(size, 0);
  context.moveTo(0, -size);
  context.lineTo(0, size);
  context.moveTo(-size * 0.68, -size * 0.68);
  context.lineTo(size * 0.68, size * 0.68);
  context.moveTo(-size * 0.68, size * 0.68);
  context.lineTo(size * 0.68, -size * 0.68);
  context.stroke();
  context.restore();
}

function rgbToHsl(color: RgbColor): { hue: number; saturation: number; lightness: number } {
  const r = color.r / 255;
  const g = color.g / 255;
  const b = color.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return { hue: 0, saturation: 0, lightness };
  }

  const delta = max - min;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue = 0;

  if (max === r) {
    hue = (g - b) / delta + (g < b ? 6 : 0);
  } else if (max === g) {
    hue = (b - r) / delta + 2;
  } else {
    hue = (r - g) / delta + 4;
  }

  hue /= 6;
  return { hue, saturation, lightness };
}

function rotateHue(color: RgbColor, degrees: number): RgbColor {
  const { hue, saturation, lightness } = rgbToHsl(color);
  return hslToRgb({ hue: (hue + degrees / 360 + 1) % 1, saturation, lightness });
}

function hslToRgb(color: { hue: number; saturation: number; lightness: number }): RgbColor {
  const { hue, saturation, lightness } = color;

  if (saturation === 0) {
    const value = Math.round(lightness * 255);
    return { r: value, g: value, b: value };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    let safeT = t;
    if (safeT < 0) {
      safeT += 1;
    }
    if (safeT > 1) {
      safeT -= 1;
    }
    if (safeT < 1 / 6) {
      return p + (q - p) * 6 * safeT;
    }
    if (safeT < 1 / 2) {
      return q;
    }
    if (safeT < 2 / 3) {
      return p + (q - p) * (2 / 3 - safeT) * 6;
    }
    return p;
  };

  const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
  const p = 2 * lightness - q;

  return {
    r: Math.round(hue2rgb(p, q, hue + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hue) * 255),
    b: Math.round(hue2rgb(p, q, hue - 1 / 3) * 255),
  };
}

function hexToRgb(value: string): RgbColor {
  const normalized = value.replace('#', '');
  const safe =
    normalized.length === 3
      ? normalized
          .split('')
          .map(char => char + char)
          .join('')
      : normalized.padEnd(6, '0').slice(0, 6);

  return {
    r: Number.parseInt(safe.slice(0, 2), 16),
    g: Number.parseInt(safe.slice(2, 4), 16),
    b: Number.parseInt(safe.slice(4, 6), 16),
  };
}

function rgbToHex(color: RgbColor): string {
  return `#${[color.r, color.g, color.b].map(component => Math.round(component).toString(16).padStart(2, '0')).join('')}`;
}

function mixRgb(left: RgbColor, right: RgbColor, amount: number): RgbColor {
  const safe = clamp(amount, 0, 1);
  return {
    r: left.r + (right.r - left.r) * safe,
    g: left.g + (right.g - left.g) * safe,
    b: left.b + (right.b - left.b) * safe,
  };
}

function mixHex(left: string, right: string, amount: number): string {
  return rgbToHex(mixRgb(hexToRgb(left), hexToRgb(right), amount));
}

function withAlpha(color: string, alpha: number): string {
  const rgb = hexToRgb(color);
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${clamp(alpha, 0, 1)})`;
}

function isDarkColor(color: string): boolean {
  const rgb = hexToRgb(color);
  const luminance = (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  return luminance < 0.52;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
