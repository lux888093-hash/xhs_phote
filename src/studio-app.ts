import {
  type AppState,
  type DotDistributionMode,
  type DotPoint,
  type DotShape,
  type LayoutDirection,
  PAPER_THEME,
  adjustBackgroundForExport,
  applySurfaceToCanvas,
  canvasToExportBlob,
  clearCanvas,
  composeExportCanvas,
  computeDots,
  createBackgroundConfig,
  createDetachedCanvas,
  createExportSurface,
  createInitialState,
  getDotActionForSurface,
  getEmptySurface,
  getExportFileName,
  getExportSettings,
  getImageAspect,
  getPreviewSurface,
  isRainbowShuffle,
  reduceState,
  renderEmptyPaper,
  renderPaperCanvas,
  renderPunchCanvas,
} from './paper-dots';
import {
  type PosterBackdropStyle,
  type PosterFrameStyle,
  type PosterRatio,
  type PosterState,
  type PosterThemeId,
  POSTER_BACKDROP_OPTIONS,
  POSTER_FRAME_OPTIONS,
  POSTER_RATIO_OPTIONS,
  POSTER_THEME_PRESETS,
  applyPosterTheme,
  composePosterCanvas,
  createInitialPosterState,
  extractPosterPalette,
  pickRandomPosterTheme,
  renderPosterPreviewCanvas,
} from './poster-studio';

type OutputMode = 'image' | 'poster';

type AppRefs = {
  shell: HTMLElement;
  imageInput: HTMLInputElement;
  backgroundSourceInput: HTMLSelectElement;
  backgroundColorField: HTMLElement;
  backgroundColorInput: HTMLInputElement;
  backgroundColorSecondaryField: HTMLElement;
  backgroundColorSecondaryInput: HTMLInputElement;
  backgroundStripeSizeField: HTMLElement;
  backgroundStripeSizeInput: HTMLInputElement;
  backgroundImageField: HTMLElement;
  backgroundImageInput: HTMLInputElement;
  layoutDirectionInput: HTMLSelectElement;
  distributionModeInput: HTMLSelectElement;
  shapeInput: HTMLSelectElement;
  dotCharField: HTMLElement;
  dotCharInput: HTMLInputElement;
  splitRatioInput: HTMLInputElement;
  splitRatioOutput: HTMLOutputElement;
  sizeInput: HTMLInputElement;
  varianceInput: HTMLInputElement;
  countField: HTMLElement;
  countInput: HTMLInputElement;
  countLabel: HTMLElement;
  sizeOutput: HTMLOutputElement;
  varianceOutput: HTMLOutputElement;
  countOutput: HTMLOutputElement;
  backgroundStripeSizeOutput: HTMLOutputElement;
  shuffleButton: HTMLButtonElement;
  undoDotButton: HTMLButtonElement;
  downloadButton: HTMLButtonElement;
  randomThemeButton: HTMLButtonElement;
  paletteButton: HTMLButtonElement;
  status: HTMLElement;
  resultsViewport: HTMLElement;
  resultsEl: HTMLElement;
  resultsTransform: HTMLElement;
  paperCanvas: HTMLCanvasElement;
  punchCanvas: HTMLCanvasElement;
  paperPanel: HTMLElement;
  punchPanel: HTMLElement;
  posterPreviewCanvas: HTMLCanvasElement;
  previewTitle: HTMLElement;
  posterThemeLabel: HTMLElement;
  posterThemeNote: HTMLElement;
  posterRatioPill: HTMLElement;
  posterFramePill: HTMLElement;
  posterRatioInput: HTMLSelectElement;
  posterFrameInput: HTMLSelectElement;
  posterBackdropInput: HTMLSelectElement;
  posterTitleInput: HTMLInputElement;
  posterSubtitleInput: HTMLInputElement;
  posterBadgeInput: HTMLInputElement;
  posterFooterInput: HTMLInputElement;
  posterPrimaryField: HTMLElement;
  posterPrimaryInput: HTMLInputElement;
  posterSecondaryField: HTMLElement;
  posterSecondaryInput: HTMLInputElement;
  posterAccentField: HTMLElement;
  posterAccentInput: HTMLInputElement;
  outputModeButtons: HTMLButtonElement[];
  posterOnlySections: HTMLElement[];
  themeButtons: HTMLButtonElement[];
};

const FIRST_VISIT_KEY = 'paper-dots-lab-visited-v2';
const POSTER_MIME_TYPE = 'image/jpeg' as const;

const RATIO_LABELS = Object.fromEntries(POSTER_RATIO_OPTIONS.map(option => [option.value, option.label])) as Record<PosterRatio, string>;
const FRAME_LABELS = Object.fromEntries(POSTER_FRAME_OPTIONS.map(option => [option.value, option.label])) as Record<PosterFrameStyle, string>;

const THEME_BACKGROUND_SOURCE: Record<PosterThemeId, AppState['backgroundSource']> = {
  atelier: 'color',
  sorbet: 'duotone',
  midnight: 'color',
  ticket: 'duotone',
  gallery: 'color',
};

export function mountApp(): void {
  const appRoot = document.querySelector<HTMLDivElement>('#app');
  if (!appRoot) {
    throw new Error('应用挂载点不存在');
  }

  maybeRedirectToAbout();
  new StudioApp(appRoot);
}

class StudioApp {
  private readonly refs: AppRefs;
  private state = createInitialState();
  private posterState = createInitialPosterState();
  private outputMode: OutputMode = 'image';
  private imageObjectUrl: string | null = null;
  private backgroundObjectUrl: string | null = null;
  private translateX = 0;
  private translateY = 0;
  private scale = 1;

  constructor(appRoot: HTMLDivElement) {
    document.title = 'Paper Dots Studio';
    appRoot.innerHTML = createMarkup();
    this.refs = getRefs();
    this.bindEvents();
    this.render();
  }

  private setState(next: Parameters<typeof reduceState>[1]): void {
    this.state = reduceState(this.state, next);
    this.render();
  }

  private updatePoster(next: Partial<PosterState>): void {
    this.posterState = { ...this.posterState, ...next };
    this.render();
  }

  private applyPosterThemePreset(themeId: PosterThemeId, preserveCopy = true): void {
    this.posterState = applyPosterTheme(this.posterState, themeId, preserveCopy);
    this.state = reduceState(this.state, {
      type: 'set-background-source',
      value: THEME_BACKGROUND_SOURCE[themeId],
    });
    this.state = reduceState(this.state, {
      type: 'set-background-color',
      value: this.posterState.primaryColor,
    });
    this.state = reduceState(this.state, {
      type: 'set-background-color-secondary',
      value: this.posterState.secondaryColor,
    });
    this.render();
  }

  private render(): void {
    const manualMode = this.state.dotDistributionMode === 'manual-unpaired' || this.state.dotDistributionMode === 'manual-paired';
    const rainbowMode = isRainbowShuffle(this.state.shuffleCount);
    const activeTheme = POSTER_THEME_PRESETS.find(theme => theme.id === this.posterState.themeId) ?? POSTER_THEME_PRESETS[0];
    const posterMode = this.outputMode === 'poster';

    this.refs.shell.className = rainbowMode ? `${getShellClass(this.state.image)} shell--easter-egg` : getShellClass(this.state.image);
    this.refs.shell.dataset.posterTheme = this.posterState.themeId;
    this.refs.shell.dataset.outputMode = this.outputMode;
    this.refs.shell.style.setProperty('--accent', this.posterState.accentColor);
    this.refs.shell.style.setProperty('--poster-primary', this.posterState.primaryColor);
    this.refs.shell.style.setProperty('--poster-secondary', this.posterState.secondaryColor);
    this.refs.shell.style.setProperty('--poster-accent', this.posterState.accentColor);

    this.refs.backgroundSourceInput.value = this.state.backgroundSource;
    this.refs.backgroundColorInput.value = this.state.backgroundColor;
    this.refs.backgroundColorSecondaryInput.value = this.state.backgroundColorSecondary;
    this.refs.backgroundStripeSizeInput.value = String(this.state.backgroundStripeSize);
    this.refs.backgroundColorField.hidden = this.state.backgroundSource === 'image';
    this.refs.backgroundColorSecondaryField.hidden = this.state.backgroundSource !== 'duotone';
    this.refs.backgroundStripeSizeField.hidden = this.state.backgroundSource !== 'duotone';
    this.refs.backgroundImageField.hidden = this.state.backgroundSource !== 'image';
    syncSwatch(this.refs.backgroundColorField, this.state.backgroundColor);
    syncSwatch(this.refs.backgroundColorSecondaryField, this.state.backgroundColorSecondary);

    this.refs.layoutDirectionInput.value = this.state.layoutDirection;
    this.refs.distributionModeInput.value = this.state.dotDistributionMode;
    this.refs.shapeInput.value = this.state.dotShape;
    this.refs.dotCharField.hidden = this.state.dotShape !== 'char';
    this.refs.dotCharInput.value = this.state.dotChar;
    this.refs.splitRatioInput.value = String(this.state.splitRatio);
    this.refs.splitRatioOutput.value = String(this.state.splitRatio);
    this.refs.sizeInput.value = String(this.state.dotSize);
    this.refs.varianceInput.value = String(this.state.dotVariance);
    this.refs.countInput.value = String(this.state.dotCount);
    this.refs.sizeOutput.value = String(this.state.dotSize);
    this.refs.varianceOutput.value = String(this.state.dotVariance);
    this.refs.countOutput.value = String(this.state.dotCount);
    this.refs.backgroundStripeSizeOutput.value = String(this.state.backgroundStripeSize);
    this.refs.countField.hidden = manualMode;
    this.refs.countInput.hidden = manualMode;
    this.refs.countOutput.hidden = manualMode;
    this.refs.countLabel.textContent = '点数量';
    this.refs.shuffleButton.hidden = manualMode;
    this.refs.undoDotButton.hidden = !manualMode;

    const undoCount =
      this.state.dotDistributionMode === 'manual-paired'
        ? this.state.manualPairedDots.length
        : this.state.manualPositiveDots.length + this.state.manualNegativeDots.length;
    this.refs.undoDotButton.disabled = undoCount === 0;

    this.refs.downloadButton.disabled = !this.state.image;
    this.refs.downloadButton.textContent = posterMode ? '下载海报' : '下载图片';
    this.refs.paletteButton.disabled = !this.state.image;
    this.refs.paletteButton.hidden = !posterMode;
    this.refs.resultsEl.className = getResultsClass(this.state.layoutDirection, this.state.image);

    this.refs.previewTitle.textContent = posterMode ? '海报预览' : '图片预览';
    this.refs.posterThemeLabel.textContent = posterMode ? activeTheme.label : '图片输出';
    this.refs.posterThemeNote.textContent = posterMode ? activeTheme.kicker : 'IMAGE';
    this.refs.posterRatioPill.textContent = `画幅 ${RATIO_LABELS[this.posterState.ratio]}`;
    this.refs.posterFramePill.textContent = `边框 ${FRAME_LABELS[this.posterState.frameStyle]}`;
    this.refs.posterRatioPill.hidden = !posterMode;
    this.refs.posterFramePill.hidden = !posterMode;

    this.refs.posterRatioInput.value = this.posterState.ratio;
    this.refs.posterFrameInput.value = this.posterState.frameStyle;
    this.refs.posterBackdropInput.value = this.posterState.backdropStyle;
    this.refs.posterTitleInput.value = this.posterState.title;
    this.refs.posterSubtitleInput.value = this.posterState.subtitle;
    this.refs.posterBadgeInput.value = this.posterState.badge;
    this.refs.posterFooterInput.value = this.posterState.footer;
    this.refs.posterPrimaryInput.value = this.posterState.primaryColor;
    this.refs.posterSecondaryInput.value = this.posterState.secondaryColor;
    this.refs.posterAccentInput.value = this.posterState.accentColor;
    syncSwatch(this.refs.posterPrimaryField, this.posterState.primaryColor);
    syncSwatch(this.refs.posterSecondaryField, this.posterState.secondaryColor);
    syncSwatch(this.refs.posterAccentField, this.posterState.accentColor);

    this.refs.themeButtons.forEach(button => {
      button.classList.toggle('preset-tile--active', button.dataset.posterTheme === this.posterState.themeId);
    });
    this.refs.outputModeButtons.forEach(button => {
      button.classList.toggle('mode-switch__btn--active', button.dataset.outputMode === this.outputMode);
    });
    this.refs.posterOnlySections.forEach(section => {
      section.hidden = !posterMode;
    });

    this.applySplitPreview();
    this.drawPreview();
  }

  private drawPreview(): void {
    const containerWidth = this.refs.paperCanvas.clientWidth || 400;
    const pixelRatio = window.devicePixelRatio || 1;
    const background = createBackgroundConfig(this.state);
    const surface = this.state.image
      ? getPreviewSurface(containerWidth, pixelRatio, getImageAspect(this.state.image))
      : getEmptySurface(containerWidth, pixelRatio);

    applySurfaceToCanvas(this.refs.paperCanvas, surface);
    applySurfaceToCanvas(this.refs.punchCanvas, surface);

    if (!this.state.image) {
      renderEmptyPaper(this.refs.paperCanvas, background);
      clearCanvas(this.refs.punchCanvas);
      if (this.outputMode === 'poster') {
        renderPosterPreviewCanvas(this.refs.posterPreviewCanvas, null, this.posterState);
      } else {
        renderImagePreviewCanvas(this.refs.posterPreviewCanvas, null);
      }
      return;
    }

    const { paperDots, punchDots } = computeDots(this.state, surface);
    const rainbowMode = isRainbowShuffle(this.state.shuffleCount);
    renderPaperCanvas(this.refs.paperCanvas, this.state.image, paperDots, background, this.state.seed, rainbowMode);
    renderPunchCanvas(this.refs.punchCanvas, this.state.image, punchDots, background, this.state.seed, rainbowMode);
    this.drawOutputPreview(background);
  }

  private drawOutputPreview(background: ReturnType<typeof createBackgroundConfig>): void {
    const artCanvas = composeExportCanvas(
      this.refs.paperCanvas,
      this.refs.punchCanvas,
      background,
      this.state.layoutDirection,
      this.state.splitRatio,
    );

    if (this.outputMode === 'poster') {
      renderPosterPreviewCanvas(this.refs.posterPreviewCanvas, artCanvas, this.posterState);
      return;
    }

    renderImagePreviewCanvas(this.refs.posterPreviewCanvas, artCanvas);
  }

  private applySplitPreview(): void {
    const imageCrop = this.state.splitRatio >= 50 ? (this.state.splitRatio - 50) * 2 : 0;
    const paperCrop = this.state.splitRatio <= 50 ? (50 - this.state.splitRatio) * 2 : 0;
    this.refs.paperPanel.style.clipPath = '';
    this.refs.punchPanel.style.clipPath = '';

    if (this.state.layoutDirection === 'image-top') {
      this.refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(${imageCrop}% 0 0 0)` : '';
      this.refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 0 ${paperCrop}% 0)` : '';
      return;
    }

    if (this.state.layoutDirection === 'image-bottom') {
      this.refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 0 ${imageCrop}% 0)` : '';
      this.refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(${paperCrop}% 0 0 0)` : '';
      return;
    }

    if (this.state.layoutDirection === 'image-left') {
      this.refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 0 0 ${imageCrop}%)` : '';
      this.refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 ${paperCrop}% 0 0)` : '';
      return;
    }

    this.refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 ${imageCrop}% 0 0)` : '';
    this.refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 0 0 ${paperCrop}%)` : '';
  }

  private createExportComposition(): { artCanvas: HTMLCanvasElement; background: ReturnType<typeof createBackgroundConfig> } {
    if (!this.state.image) {
      throw new Error('请先上传图片');
    }

    const background = createBackgroundConfig(this.state);
    const exportSurface = createExportSurface(this.state.image, this.refs.paperCanvas);
    const exportBackground = adjustBackgroundForExport(background, this.refs.paperCanvas, exportSurface);
    const { paperDots, punchDots } = computeDots(this.state, exportSurface);
    const rainbowMode = isRainbowShuffle(this.state.shuffleCount);
    const paperCanvas = createDetachedCanvas(exportSurface);
    const punchCanvas = createDetachedCanvas(exportSurface);

    renderPaperCanvas(paperCanvas, this.state.image, paperDots, exportBackground, this.state.seed, rainbowMode);
    renderPunchCanvas(punchCanvas, this.state.image, punchDots, exportBackground, this.state.seed, rainbowMode);

    return {
      artCanvas: composeExportCanvas(paperCanvas, punchCanvas, exportBackground, this.state.layoutDirection, this.state.splitRatio),
      background: exportBackground,
    };
  }

  private async downloadPoster(): Promise<void> {
    if (!this.state.image) {
      return;
    }

    try {
      const { artCanvas } = this.createExportComposition();
      const widthHint = Math.max(1_400, artCanvas.width + 360);
      const posterCanvas = composePosterCanvas(artCanvas, this.posterState, widthHint);
      const blob = await canvasToExportBlob(posterCanvas, POSTER_MIME_TYPE, 0.92);
      if (!blob) {
        this.refs.status.textContent = '海报导出失败，请稍后重试';
        return;
      }

      const fileName = getPosterFileName(this.state.fileName);
      if (await tryShareFile(blob, fileName)) {
        return;
      }

      if (isWeixin()) {
        showSaveOverlay(posterCanvas.toDataURL(POSTER_MIME_TYPE, 0.92));
        return;
      }

      downloadBlob(blob, fileName);
    } catch (error) {
      this.refs.status.textContent = error instanceof Error ? error.message : '海报导出失败';
    }
  }

  private async downloadImage(): Promise<void> {
    if (!this.state.image) {
      return;
    }

    try {
      const { artCanvas, background } = this.createExportComposition();
      const exportOptions = getExportSettings(background);
      const blob = await canvasToExportBlob(artCanvas, exportOptions.mimeType, exportOptions.quality);
      if (!blob) {
        this.refs.status.textContent = '图片导出失败，请稍后重试';
        return;
      }

      const fileName = getExportFileName(this.state.fileName, exportOptions.mimeType);
      if (await tryShareFile(blob, fileName)) {
        return;
      }

      if (isWeixin()) {
        showSaveOverlay(artCanvas.toDataURL('image/jpeg', 0.88));
        return;
      }

      downloadBlob(blob, fileName);
    } catch (error) {
      this.refs.status.textContent = error instanceof Error ? error.message : '图片导出失败';
    }
  }

  private bindEvents(): void {
    this.refs.imageInput.addEventListener('change', async event => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      this.refs.status.textContent = '图片加载中…';
      try {
        const loaded = await loadImageFile(file);
        if (this.imageObjectUrl) {
          URL.revokeObjectURL(this.imageObjectUrl);
        }
        this.imageObjectUrl = loaded.objectUrl;
        this.refs.status.textContent = '';
        this.resetTransform();
        if (loaded.image.naturalHeight > loaded.image.naturalWidth && this.state.layoutDirection === 'image-top') {
          this.state = reduceState(this.state, { type: 'set-layout-direction', value: 'image-left' });
        }
        this.state = reduceState(this.state, { type: 'set-image', image: loaded.image, fileName: file.name });
        this.render();
      } catch (error) {
        this.refs.status.textContent = error instanceof Error ? error.message : '图片加载失败';
      } finally {
        input.value = '';
      }
    });

    this.refs.randomThemeButton.addEventListener('click', () => {
      this.applyPosterThemePreset(pickRandomPosterTheme(this.posterState.themeId));
    });

    this.refs.outputModeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mode = button.dataset.outputMode as OutputMode | undefined;
        if (!mode) {
          return;
        }

        this.outputMode = mode;
        this.render();
      });
    });

    this.refs.paletteButton.addEventListener('click', () => {
      if (!this.state.image) {
        return;
      }

      const palette = extractPosterPalette(this.state.image);
      this.posterState = { ...this.posterState, ...palette };
      this.state = reduceState(this.state, { type: 'set-background-color', value: palette.primaryColor });
      this.state = reduceState(this.state, { type: 'set-background-color-secondary', value: palette.secondaryColor });
      this.refs.status.textContent = '已根据图片更新配色';
      this.render();
    });

    this.refs.themeButtons.forEach(button => {
      button.addEventListener('click', () => {
        const themeId = button.dataset.posterTheme as PosterThemeId | undefined;
        if (themeId) {
          this.applyPosterThemePreset(themeId);
        }
      });
    });

    this.refs.backgroundSourceInput.addEventListener('change', event => {
      this.setState({ type: 'set-background-source', value: (event.currentTarget as HTMLSelectElement).value as AppState['backgroundSource'] });
    });

    this.refs.backgroundColorInput.addEventListener('input', event => {
      const value = (event.currentTarget as HTMLInputElement).value;
      this.setState({ type: 'set-background-color', value });
    });

    this.refs.backgroundColorSecondaryInput.addEventListener('input', event => {
      const value = (event.currentTarget as HTMLInputElement).value;
      this.setState({ type: 'set-background-color-secondary', value });
    });

    this.refs.backgroundStripeSizeInput.addEventListener('input', event => {
      this.setState({ type: 'set-background-stripe-size', value: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this.refs.backgroundImageInput.addEventListener('change', async event => {
      const input = event.currentTarget as HTMLInputElement;
      const file = input.files?.[0];
      if (!file) {
        return;
      }

      this.refs.status.textContent = '底图加载中…';
      try {
        const loaded = await loadImageFile(file);
        if (this.backgroundObjectUrl) {
          URL.revokeObjectURL(this.backgroundObjectUrl);
        }
        this.backgroundObjectUrl = loaded.objectUrl;
        this.refs.status.textContent = '';
        this.setState({ type: 'set-background-image', image: loaded.image });
      } catch {
        this.refs.status.textContent = '底图加载失败';
        this.setState({ type: 'set-background-source', value: 'color' });
      } finally {
        input.value = '';
      }
    });

    this.refs.layoutDirectionInput.addEventListener('change', event => {
      this.setState({ type: 'set-layout-direction', value: (event.currentTarget as HTMLSelectElement).value as LayoutDirection });
    });

    this.refs.distributionModeInput.addEventListener('change', event => {
      this.setState({ type: 'set-distribution-mode', value: (event.currentTarget as HTMLSelectElement).value as DotDistributionMode });
    });

    this.refs.shapeInput.addEventListener('change', event => {
      this.setState({ type: 'set-shape', value: (event.currentTarget as HTMLSelectElement).value as DotShape });
    });

    this.refs.dotCharInput.addEventListener('input', event => {
      const value = (event.currentTarget as HTMLInputElement).value;
      if (value.length > 0) {
        this.setState({ type: 'set-dot-char', value });
      }
    });

    this.refs.splitRatioInput.addEventListener('input', event => {
      this.setState({ type: 'set-split-ratio', value: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this.refs.sizeInput.addEventListener('input', event => {
      this.setState({ type: 'set-size', value: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this.refs.varianceInput.addEventListener('input', event => {
      this.setState({ type: 'set-variance', value: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this.refs.countInput.addEventListener('input', event => {
      this.setState({ type: 'set-count', value: Number((event.currentTarget as HTMLInputElement).value) });
    });

    this.refs.shuffleButton.addEventListener('click', () => {
      this.setState({ type: 'shuffle' });
    });

    this.refs.undoDotButton.addEventListener('click', () => {
      this.setState({ type: 'undo-dot' });
    });

    this.refs.posterRatioInput.addEventListener('change', event => {
      this.updatePoster({ ratio: (event.currentTarget as HTMLSelectElement).value as PosterRatio });
    });

    this.refs.posterFrameInput.addEventListener('change', event => {
      this.updatePoster({ frameStyle: (event.currentTarget as HTMLSelectElement).value as PosterFrameStyle });
    });

    this.refs.posterBackdropInput.addEventListener('change', event => {
      this.updatePoster({ backdropStyle: (event.currentTarget as HTMLSelectElement).value as PosterBackdropStyle });
    });

    this.refs.posterTitleInput.addEventListener('input', event => {
      this.updatePoster({ title: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterSubtitleInput.addEventListener('input', event => {
      this.updatePoster({ subtitle: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterBadgeInput.addEventListener('input', event => {
      this.updatePoster({ badge: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterFooterInput.addEventListener('input', event => {
      this.updatePoster({ footer: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterPrimaryInput.addEventListener('input', event => {
      this.updatePoster({ primaryColor: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterSecondaryInput.addEventListener('input', event => {
      this.updatePoster({ secondaryColor: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.posterAccentInput.addEventListener('input', event => {
      this.updatePoster({ accentColor: (event.currentTarget as HTMLInputElement).value });
    });

    this.refs.paperCanvas.addEventListener('click', event => {
      const actionType = getDotActionForSurface('paper', this.state);
      if (!actionType) {
        return;
      }

      const dot = createDotFromPointer(event, this.refs.paperCanvas);
      if (dot) {
        this.setState({ type: actionType, dot });
      }
    });

    this.refs.punchCanvas.addEventListener('click', event => {
      const actionType = getDotActionForSurface('punch', this.state);
      if (!actionType) {
        return;
      }

      const dot = createDotFromPointer(event, this.refs.punchCanvas);
      if (dot) {
        this.setState({ type: actionType, dot });
      }
    });

    this.refs.downloadButton.addEventListener('click', () => {
      if (this.outputMode === 'poster') {
        void this.downloadPoster();
        return;
      }
      void this.downloadImage();
    });

    this.bindViewportGestures();
    window.addEventListener('resize', () => this.render());
    document.addEventListener(
      'dblclick',
      event => {
        event.preventDefault();
      },
      { passive: false },
    );
  }

  private bindViewportGestures(): void {
    let previousTouches: Touch[] | null = null;

    this.refs.resultsViewport.addEventListener(
      'touchstart',
      event => {
        previousTouches = Array.from(event.touches);
      },
      { passive: true },
    );

    this.refs.resultsViewport.addEventListener(
      'touchmove',
      event => {
        if (!previousTouches) {
          return;
        }

        event.preventDefault();
        const touches = Array.from(event.touches);

        if (touches.length === 1 && previousTouches.length === 1) {
          this.translateX += touches[0].clientX - previousTouches[0].clientX;
          this.translateY += touches[0].clientY - previousTouches[0].clientY;
          this.applyTransform();
        } else if (touches.length === 2 && previousTouches.length >= 2) {
          const previousCenter = getTouchCenter(previousTouches);
          const nextCenter = getTouchCenter(touches);
          const previousDistance = getTouchDistance(previousTouches);
          const nextDistance = getTouchDistance(touches);
          const rect = this.refs.resultsViewport.getBoundingClientRect();
          const pointerX = nextCenter.x - rect.left - rect.width / 2;
          const pointerY = nextCenter.y - rect.top - rect.height / 2;
          const nextScale = clamp(this.scale * (nextDistance / previousDistance), 0.2, 6);
          this.translateX = pointerX + (this.translateX - pointerX) * (nextScale / this.scale) + (nextCenter.x - previousCenter.x);
          this.translateY = pointerY + (this.translateY - pointerY) * (nextScale / this.scale) + (nextCenter.y - previousCenter.y);
          this.scale = nextScale;
          this.applyTransform();
        }

        previousTouches = touches;
      },
      { passive: false },
    );

    this.refs.resultsViewport.addEventListener(
      'touchend',
      event => {
        previousTouches = event.touches.length > 0 ? Array.from(event.touches) : null;
      },
      { passive: true },
    );

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;

    this.refs.resultsViewport.addEventListener('mousedown', event => {
      if (event.button !== 0) {
        return;
      }

      dragging = true;
      startX = event.clientX;
      startY = event.clientY;
      dragOriginX = this.translateX;
      dragOriginY = this.translateY;
      this.refs.resultsViewport.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', event => {
      if (!dragging) {
        return;
      }

      this.translateX = dragOriginX + (event.clientX - startX);
      this.translateY = dragOriginY + (event.clientY - startY);
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      if (!dragging) {
        return;
      }

      dragging = false;
      this.refs.resultsViewport.style.cursor = '';
    });

    this.refs.resultsViewport.addEventListener(
      'wheel',
      event => {
        event.preventDefault();
        const rect = this.refs.resultsViewport.getBoundingClientRect();
        const pointerX = event.clientX - rect.left - rect.width / 2;
        const pointerY = event.clientY - rect.top - rect.height / 2;
        const zoomFactor = -event.deltaY > 0 ? 1.1 : 1 / 1.1;
        const nextScale = clamp(this.scale * zoomFactor, 0.2, 6);
        this.translateX = pointerX + (this.translateX - pointerX) * (nextScale / this.scale);
        this.translateY = pointerY + (this.translateY - pointerY) * (nextScale / this.scale);
        this.scale = nextScale;
        this.applyTransform();
      },
      { passive: false },
    );

    this.refs.resultsViewport.addEventListener('dblclick', event => {
      event.stopPropagation();
      this.resetTransform();
    });

    this.refs.resultsViewport.addEventListener('click', () => {
      if (!this.state.image) {
        this.refs.imageInput.click();
      }
    });
  }

  private applyTransform(): void {
    this.refs.resultsTransform.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
  }

  private resetTransform(): void {
    this.translateX = 0;
    this.translateY = 0;
    this.scale = 1;
    this.applyTransform();
  }
}

function maybeRedirectToAbout(): void {
  if (window.location.pathname.endsWith('/about.html')) {
    return;
  }

  if (window.localStorage.getItem(FIRST_VISIT_KEY)) {
    return;
  }

  window.localStorage.setItem(FIRST_VISIT_KEY, 'true');
  window.location.href = new URL('./about.html', window.location.href).toString();
}

function createMarkup(): string {
  return `
    <main class="shell shell--empty">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <p class="sidebar__eyebrow">PAPER DOTS STUDIO</p>
          <h1 class="sidebar__title">Paper Dots</h1>
        </div>

        <div class="sidebar__controls">
          <details class="dock-section dock-section--preset" data-poster-only open>
            <summary>模板</summary>
            <div class="preset-grid">
              ${POSTER_THEME_PRESETS.map(
                theme => `
                  <button
                    class="preset-tile"
                    type="button"
                    data-poster-theme="${theme.id}"
                    style="--swatch-a:${theme.primaryColor};--swatch-b:${theme.secondaryColor};--swatch-c:${theme.accentColor};"
                  >
                    <span class="preset-tile__kicker">${theme.kicker}</span>
                    <strong class="preset-tile__title">${theme.label}</strong>
                  </button>
                `,
              ).join('')}
            </div>
            <button id="random-theme-button" class="ghost-button" type="button">换一组</button>
          </details>

          <details class="dock-section" data-poster-only open>
            <summary>海报</summary>
            <div class="field-grid">
              <label class="field field--select">
                <span>画幅</span>
                <select id="poster-ratio-input">${renderSelectOptions(POSTER_RATIO_OPTIONS)}</select>
              </label>
              <label class="field field--select">
                <span>边框</span>
                <select id="poster-frame-input">${renderSelectOptions(POSTER_FRAME_OPTIONS)}</select>
              </label>
              <label class="field field--select">
                <span>海报底板</span>
                <select id="poster-backdrop-input">${renderSelectOptions(POSTER_BACKDROP_OPTIONS)}</select>
              </label>
            </div>
          </details>

          <details class="dock-section" data-poster-only open>
            <summary>文字</summary>
            <div class="field-grid">
              <label class="field">
                <span>标题</span>
                <input id="poster-title-input" type="text" maxlength="24" placeholder="标题" />
              </label>
              <label class="field">
                <span>副标题</span>
                <input id="poster-subtitle-input" type="text" maxlength="48" placeholder="副标题" />
              </label>
              <label class="field">
                <span>标签</span>
                <input id="poster-badge-input" type="text" maxlength="24" placeholder="标签" />
              </label>
              <label class="field">
                <span>页脚</span>
                <input id="poster-footer-input" type="text" maxlength="32" placeholder="页脚" />
              </label>
            </div>
            <div class="color-grid">
              <label id="poster-primary-field" class="field field--color">
                <span>主底色</span>
                <input id="poster-primary-input" type="color" value="#f6efe3" />
              </label>
              <label id="poster-secondary-field" class="field field--color">
                <span>辅色</span>
                <input id="poster-secondary-input" type="color" value="#d7c8ba" />
              </label>
              <label id="poster-accent-field" class="field field--color">
                <span>强调色</span>
                <input id="poster-accent-input" type="color" value="#cf5b3e" />
              </label>
            </div>
          </details>

          <details class="dock-section" open>
            <summary>拼接布局</summary>
            <div class="field-grid">
              <label class="field field--select">
                <span>拼接</span>
                <select id="layout-direction-input">
                  <option value="image-left">主图在左</option>
                  <option value="image-right">主图在右</option>
                  <option value="image-top" selected>主图在上</option>
                  <option value="image-bottom">主图在下</option>
                </select>
              </label>
              <label class="field">
                <span>占比</span>
                <input id="split-ratio-input" type="range" min="0" max="100" value="50" />
                <output id="split-ratio-output">50</output>
              </label>
            </div>
          </details>

          <details class="dock-section">
            <summary>底图</summary>
            <div class="field-grid">
              <label class="field field--select">
                <span>底图</span>
                <select id="background-source-input">
                  <option value="color">纯色</option>
                  <option value="duotone">条纹</option>
                  <option value="image">照片</option>
                </select>
              </label>
              <label id="background-color-field" class="field field--color">
                <span>颜色</span>
                <input id="background-color-input" type="color" value="${PAPER_THEME.background}" />
              </label>
              <label id="background-color-secondary-field" class="field field--color" hidden>
                <span>颜色二</span>
                <input id="background-color-secondary-input" type="color" value="${PAPER_THEME.cover}" />
              </label>
              <label id="background-stripe-size-field" class="field" hidden>
                <span>条纹粗细</span>
                <input id="background-stripe-size-input" type="range" min="8" max="96" value="24" />
                <output id="background-stripe-size-output">24</output>
              </label>
              <label id="background-image-field" class="upload" hidden>
                <span>上传底图</span>
                <input id="background-image-input" type="file" accept="image/*" />
              </label>
            </div>
          </details>

          <details class="dock-section">
            <summary>波点</summary>
            <div class="field-grid">
              <label class="field field--select">
                <span>形状</span>
                <select id="shape-input">
                  <option value="circle">圆形</option>
                  <option value="square">方形</option>
                  <option value="star">五角星形</option>
                  <option value="drop">水滴形</option>
                  <option value="snowflake">雪花形</option>
                  <option value="char">字符形</option>
                </select>
              </label>
              <label id="dot-char-field" class="field" hidden>
                <span>字符</span>
                <input id="dot-char-input" type="text" value="喵" />
              </label>
              <label class="field">
                <span>点大小</span>
                <input id="size-input" type="range" min="12" max="72" value="28" />
                <output id="size-output">28</output>
              </label>
              <label class="field">
                <span>大小差异</span>
                <input id="variance-input" type="range" min="0" max="100" value="0" />
                <output id="variance-output">0</output>
              </label>
              <label class="field">
                <span id="count-label">点数量</span>
                <input id="count-input" type="range" min="6" max="80" value="18" />
                <output id="count-output">18</output>
              </label>
              <label class="field field--select">
                <span>波点分布</span>
                <select id="distribution-mode-input">
                  <option value="random">随机</option>
                  <option value="manual-unpaired">点一下图片（左右不对应）</option>
                  <option value="manual-paired">点一下图片（左右对应）</option>
                </select>
              </label>
            </div>
            <div class="button-row">
              <button id="shuffle-button" class="ghost-button" type="button">随机一下</button>
              <button id="undo-dot-button" class="ghost-button" type="button" hidden>撤回</button>
            </div>
          </details>
        </div>
      </aside>

      <section class="stage">
        <div class="stage__topbar">
          <div class="hero-copy">
            <p id="poster-theme-note" class="hero-copy__eyebrow"></p>
            <h2 id="poster-theme-label" class="hero-copy__title"></h2>
          </div>
          <div class="stage__actions">
            <div class="mode-switch" role="tablist" aria-label="输出模式">
              <button class="mode-switch__btn mode-switch__btn--active" type="button" data-output-mode="image">图片</button>
              <button class="mode-switch__btn" type="button" data-output-mode="poster">海报</button>
            </div>
            <p id="status" class="status"></p>
            <button id="palette-button" class="ghost-button" type="button">取色</button>
            <label class="action-button action-button--upload">
              <span>上传图片</span>
              <input id="image-input" type="file" accept="image/*" />
            </label>
            <button id="download-button" class="action-button" type="button" disabled>下载图片</button>
          </div>
        </div>

        <div class="stage__grid">
          <section class="stage-card stage-card--editor">
            <div class="stage-card__head">
              <span>主编辑区</span>
              <div class="stage-pills">
                <span id="poster-ratio-pill" class="stage-pill"></span>
                <span id="poster-frame-pill" class="stage-pill"></span>
              </div>
            </div>

            <div id="results">
              <p class="results__empty-hint">上传图片开始</p>
              <div class="results-transform">
                <section class="results results--image-top results--empty">
                  <section class="panel panel--paper">
                    <canvas id="paper-canvas" aria-label="paper dots result"></canvas>
                  </section>
                  <section class="panel panel--image">
                    <canvas id="punch-canvas" aria-label="punched image result"></canvas>
                  </section>
                </section>
              </div>
            </div>

          </section>

          <aside class="stage-card stage-card--poster">
            <div class="stage-card__head">
              <span id="preview-title">图片预览</span>
              <div class="stage-pills">
                <span id="poster-ratio-pill" class="stage-pill"></span>
                <span id="poster-frame-pill" class="stage-pill"></span>
              </div>
            </div>
            <div class="poster-preview-shell">
              <canvas id="poster-preview-canvas"></canvas>
            </div>
          </aside>
        </div>
      </section>
    </main>
  `;
}

function getRefs(): AppRefs {
  return {
    shell: query<HTMLElement>('.shell'),
    imageInput: query<HTMLInputElement>('#image-input'),
    backgroundSourceInput: query<HTMLSelectElement>('#background-source-input'),
    backgroundColorField: query<HTMLElement>('#background-color-field'),
    backgroundColorInput: query<HTMLInputElement>('#background-color-input'),
    backgroundColorSecondaryField: query<HTMLElement>('#background-color-secondary-field'),
    backgroundColorSecondaryInput: query<HTMLInputElement>('#background-color-secondary-input'),
    backgroundStripeSizeField: query<HTMLElement>('#background-stripe-size-field'),
    backgroundStripeSizeInput: query<HTMLInputElement>('#background-stripe-size-input'),
    backgroundImageField: query<HTMLElement>('#background-image-field'),
    backgroundImageInput: query<HTMLInputElement>('#background-image-input'),
    layoutDirectionInput: query<HTMLSelectElement>('#layout-direction-input'),
    distributionModeInput: query<HTMLSelectElement>('#distribution-mode-input'),
    shapeInput: query<HTMLSelectElement>('#shape-input'),
    dotCharField: query<HTMLElement>('#dot-char-field'),
    dotCharInput: query<HTMLInputElement>('#dot-char-input'),
    splitRatioInput: query<HTMLInputElement>('#split-ratio-input'),
    splitRatioOutput: query<HTMLOutputElement>('#split-ratio-output'),
    sizeInput: query<HTMLInputElement>('#size-input'),
    varianceInput: query<HTMLInputElement>('#variance-input'),
    countField: requireElement(query<HTMLInputElement>('#count-input').closest('label'), '#count-input.closest(label)'),
    countInput: query<HTMLInputElement>('#count-input'),
    countLabel: query<HTMLElement>('#count-label'),
    sizeOutput: query<HTMLOutputElement>('#size-output'),
    varianceOutput: query<HTMLOutputElement>('#variance-output'),
    countOutput: query<HTMLOutputElement>('#count-output'),
    backgroundStripeSizeOutput: query<HTMLOutputElement>('#background-stripe-size-output'),
    shuffleButton: query<HTMLButtonElement>('#shuffle-button'),
    undoDotButton: query<HTMLButtonElement>('#undo-dot-button'),
    downloadButton: query<HTMLButtonElement>('#download-button'),
    randomThemeButton: query<HTMLButtonElement>('#random-theme-button'),
    paletteButton: query<HTMLButtonElement>('#palette-button'),
    status: query<HTMLElement>('#status'),
    resultsViewport: query<HTMLElement>('#results'),
    resultsEl: query<HTMLElement>('.results'),
    resultsTransform: query<HTMLElement>('.results-transform'),
    paperCanvas: query<HTMLCanvasElement>('#paper-canvas'),
    punchCanvas: query<HTMLCanvasElement>('#punch-canvas'),
    paperPanel: query<HTMLElement>('.panel--paper'),
    punchPanel: query<HTMLElement>('.panel--image'),
    posterPreviewCanvas: query<HTMLCanvasElement>('#poster-preview-canvas'),
    previewTitle: query<HTMLElement>('#preview-title'),
    posterThemeLabel: query<HTMLElement>('#poster-theme-label'),
    posterThemeNote: query<HTMLElement>('#poster-theme-note'),
    posterRatioPill: query<HTMLElement>('#poster-ratio-pill'),
    posterFramePill: query<HTMLElement>('#poster-frame-pill'),
    posterRatioInput: query<HTMLSelectElement>('#poster-ratio-input'),
    posterFrameInput: query<HTMLSelectElement>('#poster-frame-input'),
    posterBackdropInput: query<HTMLSelectElement>('#poster-backdrop-input'),
    posterTitleInput: query<HTMLInputElement>('#poster-title-input'),
    posterSubtitleInput: query<HTMLInputElement>('#poster-subtitle-input'),
    posterBadgeInput: query<HTMLInputElement>('#poster-badge-input'),
    posterFooterInput: query<HTMLInputElement>('#poster-footer-input'),
    posterPrimaryField: query<HTMLElement>('#poster-primary-field'),
    posterPrimaryInput: query<HTMLInputElement>('#poster-primary-input'),
    posterSecondaryField: query<HTMLElement>('#poster-secondary-field'),
    posterSecondaryInput: query<HTMLInputElement>('#poster-secondary-input'),
    posterAccentField: query<HTMLElement>('#poster-accent-field'),
    posterAccentInput: query<HTMLInputElement>('#poster-accent-input'),
    outputModeButtons: Array.from(document.querySelectorAll<HTMLButtonElement>('[data-output-mode]')),
    posterOnlySections: Array.from(document.querySelectorAll<HTMLElement>('[data-poster-only]')),
    themeButtons: Array.from(document.querySelectorAll<HTMLButtonElement>('[data-poster-theme]')),
  };
}

function renderSelectOptions(options: Array<{ value: string; label: string }>): string {
  return options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');
}

function query<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`缺少节点: ${selector}`);
  }
  return element;
}

function requireElement<T extends Element>(element: T | null, label: string): T {
  if (!element) {
    throw new Error(`缺少节点: ${label}`);
  }
  return element;
}

function getShellClass(image: HTMLImageElement | null): string {
  return image ? 'shell' : 'shell shell--empty';
}

function getResultsClass(layoutDirection: LayoutDirection, image: HTMLImageElement | null): string {
  return image ? `results results--${layoutDirection}` : `results results--${layoutDirection} results--empty`;
}

function syncSwatch(element: HTMLElement, value: string): void {
  element.style.setProperty('--color-swatch', value);
}

function renderImagePreviewCanvas(canvas: HTMLCanvasElement, sourceCanvas: HTMLCanvasElement | null): void {
  const pixelRatio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const width = Math.max(720, Math.round((canvas.clientWidth || 340) * pixelRatio));
  const aspect = sourceCanvas ? sourceCanvas.height / sourceCanvas.width : 1.18;
  const height = Math.max(1, Math.round(width * aspect));
  canvas.width = width;
  canvas.height = height;
  canvas.style.aspectRatio = `${width} / ${height}`;

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.clearRect(0, 0, width, height);
  context.fillStyle = '#f4ede2';
  context.fillRect(0, 0, width, height);

  if (!sourceCanvas) {
    context.fillStyle = 'rgba(24, 19, 17, 0.12)';
    context.fillRect(width * 0.12, height * 0.2, width * 0.76, height * 0.52);
    return;
  }

  const framePadding = Math.round(width * 0.04);
  const innerWidth = width - framePadding * 2;
  const innerHeight = height - framePadding * 2;
  const scale = Math.min(innerWidth / sourceCanvas.width, innerHeight / sourceCanvas.height);
  const drawWidth = sourceCanvas.width * scale;
  const drawHeight = sourceCanvas.height * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = (height - drawHeight) / 2;

  context.fillStyle = '#fffaf4';
  context.fillRect(framePadding, framePadding, innerWidth, innerHeight);
  context.drawImage(sourceCanvas, offsetX, offsetY, drawWidth, drawHeight);
}

function createDotFromPointer(event: MouseEvent, canvas: HTMLCanvasElement): DotPoint | null {
  const bounds = canvas.getBoundingClientRect();
  if (bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  return {
    xRatio: clamp((event.clientX - bounds.left) / bounds.width, 0, 1),
    yRatio: clamp((event.clientY - bounds.top) / bounds.height, 0, 1),
    varianceSample: Math.random(),
    profileSample: Math.random(),
  };
}

async function loadImageFile(file: File): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const blob = await blobFromFile(file);

  try {
    return await loadBlobImage(blob);
  } catch {
    try {
      const { default: heic2any } = await import('heic2any');
      const output = await heic2any({ blob, toType: 'image/jpeg', quality: 0.92 });
      const converted = Array.isArray(output) ? output[0] : output;
      return await loadBlobImage(converted as Blob);
    } catch {
      if (looksLikeHeic(file)) {
        throw new Error('不支持 HEIC 格式，请先转成 JPG 或 PNG');
      }
      throw new Error('不支持该图片格式，请使用 JPG、PNG、WEBP 或 GIF');
    }
  }
}

async function blobFromFile(file: File): Promise<Blob> {
  const buffer = await file.arrayBuffer();
  const mimeType = file.type || detectMimeType(buffer);
  return new Blob([buffer], { type: mimeType });
}

function loadBlobImage(blob: Blob): Promise<{ image: HTMLImageElement; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = 'async';
  return new Promise((resolve, reject) => {
    image.onload = () => resolve({ image, objectUrl });
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('图片加载失败'));
    };
    image.src = objectUrl;
  });
}

function looksLikeHeic(file: File): boolean {
  if (file.type === 'image/heic' || file.type === 'image/heif') {
    return true;
  }

  const lowerName = file.name.toLowerCase();
  return lowerName.endsWith('.heic') || lowerName.endsWith('.heif');
}

function detectMimeType(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer, 0, Math.min(16, buffer.byteLength));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return 'image/png';
  }

  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
    return 'image/webp';
  }

  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }

  return 'application/octet-stream';
}

async function tryShareFile(blob: Blob, fileName: string): Promise<boolean> {
  const navigatorWithShare = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (typeof File === 'undefined' || typeof navigatorWithShare.share !== 'function' || typeof navigatorWithShare.canShare !== 'function') {
    return false;
  }

  const file = new File([blob], fileName, { type: blob.type || POSTER_MIME_TYPE });
  try {
    if (!navigatorWithShare.canShare({ files: [file] })) {
      return false;
    }
  } catch {
    return false;
  }

  try {
    await navigatorWithShare.share({ files: [file], title: fileName });
    return true;
  } catch (error) {
    return Boolean(typeof error === 'object' && error && 'name' in error && (error as DOMException).name === 'AbortError');
  }
}

function downloadBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

function getPosterFileName(fileName: string | null): string {
  const base = fileName?.trim().replace(/\.[^.]+$/, '') || 'paper-dots-poster';
  return `${base}-poster.jpg`;
}

function isWeixin(): boolean {
  return /MicroMessenger/i.test(navigator.userAgent);
}

function showSaveOverlay(dataUrl: string): void {
  const overlay = document.createElement('div');
  overlay.className = 'weixin-save-overlay';
  overlay.innerHTML = `
    <div class="weixin-save-overlay__backdrop"></div>
    <div class="weixin-save-overlay__content">
      <p class="weixin-save-overlay__hint">长按图片保存到相册</p>
      <img class="weixin-save-overlay__img" src="${dataUrl}" alt="导出预览" />
    </div>
  `;
  overlay.addEventListener('click', event => {
    if ((event.target as HTMLElement).classList.contains('weixin-save-overlay__backdrop')) {
      overlay.remove();
    }
  });
  document.body.append(overlay);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function getTouchCenter(touches: Touch[]): { x: number; y: number } {
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  };
}

function getTouchDistance(touches: Touch[]): number {
  return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
}
