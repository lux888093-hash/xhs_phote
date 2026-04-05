import './style.css';
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
  status: HTMLElement;
  resultsViewport: HTMLElement;
  resultsEl: HTMLElement;
  resultsTransform: HTMLElement;
  paperCanvas: HTMLCanvasElement;
  punchCanvas: HTMLCanvasElement;
  paperPanel: HTMLElement;
  punchPanel: HTMLElement;
};

const FIRST_VISIT_KEY = 'paper-dots-lab-visited-v1';
const appRoot = document.querySelector<HTMLDivElement>('#app');

if (!appRoot) {
  throw new Error('应用挂载点不存在');
}

maybeRedirectToAbout();

document.title = 'Paper Dots Lab';
appRoot.innerHTML = createMarkup();

const refs = getRefs();
bindTabs();

let state = createInitialState();
let imageObjectUrl: string | null = null;
let backgroundObjectUrl: string | null = null;
let translateX = 0;
let translateY = 0;
let scale = 1;

bindEvents();
render();

function setState(next: Parameters<typeof reduceState>[1]): void {
  state = reduceState(state, next);
  render();
}

function render(): void {
  const manualMode = state.dotDistributionMode === 'manual-unpaired' || state.dotDistributionMode === 'manual-paired';
  const rainbowMode = isRainbowShuffle(state.shuffleCount);
  refs.shell.className = rainbowMode ? `${getShellClass(state.image)} shell--easter-egg` : getShellClass(state.image);
  refs.backgroundSourceInput.value = state.backgroundSource;
  refs.backgroundColorInput.value = state.backgroundColor;
  refs.backgroundColorSecondaryInput.value = state.backgroundColorSecondary;
  refs.backgroundStripeSizeInput.value = String(state.backgroundStripeSize);
  refs.backgroundColorField.hidden = state.backgroundSource === 'image';
  refs.backgroundColorField.style.setProperty('--color-swatch', state.backgroundColor);
  refs.backgroundColorSecondaryField.hidden = state.backgroundSource !== 'duotone';
  refs.backgroundColorSecondaryField.style.setProperty('--color-swatch', state.backgroundColorSecondary);
  refs.backgroundStripeSizeField.hidden = state.backgroundSource !== 'duotone';
  refs.backgroundImageField.hidden = state.backgroundSource !== 'image';
  refs.layoutDirectionInput.value = state.layoutDirection;
  refs.distributionModeInput.value = state.dotDistributionMode;
  refs.shapeInput.value = state.dotShape;
  refs.dotCharField.hidden = state.dotShape !== 'char';
  refs.dotCharInput.value = state.dotChar;
  refs.splitRatioInput.value = String(state.splitRatio);
  refs.splitRatioOutput.value = String(state.splitRatio);
  refs.sizeInput.value = String(state.dotSize);
  refs.varianceInput.value = String(state.dotVariance);
  refs.countInput.value = String(state.dotCount);
  refs.sizeOutput.value = String(state.dotSize);
  refs.varianceOutput.value = String(state.dotVariance);
  refs.countOutput.value = String(state.dotCount);
  refs.backgroundStripeSizeOutput.value = String(state.backgroundStripeSize);
  refs.countField.hidden = manualMode;
  refs.countInput.hidden = manualMode;
  refs.countOutput.hidden = manualMode;
  refs.countLabel.textContent = '点数量';
  refs.shuffleButton.hidden = manualMode;
  refs.undoDotButton.hidden = !manualMode;

  const undoCount =
    state.dotDistributionMode === 'manual-paired'
      ? state.manualPairedDots.length
      : state.manualPositiveDots.length + state.manualNegativeDots.length;
  refs.undoDotButton.disabled = undoCount === 0;
  refs.downloadButton.disabled = !state.image;
  refs.resultsEl.className = getResultsClass(state.layoutDirection, state.image);
  applySplitPreview();
  drawPreview();
}

function drawPreview(): void {
  const containerWidth = refs.paperCanvas.clientWidth || 400;
  const pixelRatio = window.devicePixelRatio || 1;
  const background = createBackgroundConfig(state);
  const surface = state.image
    ? getPreviewSurface(containerWidth, pixelRatio, getImageAspect(state.image))
    : getEmptySurface(containerWidth, pixelRatio);

  applySurfaceToCanvas(refs.paperCanvas, surface);
  applySurfaceToCanvas(refs.punchCanvas, surface);

  if (!state.image) {
    renderEmptyPaper(refs.paperCanvas, background);
    clearCanvas(refs.punchCanvas);
    return;
  }

  const { paperDots, punchDots } = computeDots(state, surface);
  const rainbowMode = isRainbowShuffle(state.shuffleCount);
  renderPaperCanvas(refs.paperCanvas, state.image, paperDots, background, state.seed, rainbowMode);
  renderPunchCanvas(refs.punchCanvas, state.image, punchDots, background, state.seed, rainbowMode);
}

function applySplitPreview(): void {
  const imageCrop = state.splitRatio >= 50 ? (state.splitRatio - 50) * 2 : 0;
  const paperCrop = state.splitRatio <= 50 ? (50 - state.splitRatio) * 2 : 0;
  refs.paperPanel.style.clipPath = '';
  refs.punchPanel.style.clipPath = '';

  if (state.layoutDirection === 'image-top') {
    refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(${imageCrop}% 0 0 0)` : '';
    refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 0 ${paperCrop}% 0)` : '';
    return;
  }

  if (state.layoutDirection === 'image-bottom') {
    refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 0 ${imageCrop}% 0)` : '';
    refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(${paperCrop}% 0 0 0)` : '';
    return;
  }

  if (state.layoutDirection === 'image-left') {
    refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 0 0 ${imageCrop}%)` : '';
    refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 ${paperCrop}% 0 0)` : '';
    return;
  }

  refs.punchPanel.style.clipPath = imageCrop > 0 ? `inset(0 ${imageCrop}% 0 0)` : '';
  refs.paperPanel.style.clipPath = paperCrop > 0 ? `inset(0 0 0 ${paperCrop}%)` : '';
}

function bindTabs(): void {
  document.querySelectorAll<HTMLButtonElement>('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(item => item.classList.remove('tab--active'));
      document.querySelectorAll('.tab-panel').forEach(item => item.classList.remove('tab-panel--active'));
      tab.classList.add('tab--active');
      document.querySelector<HTMLElement>(`[data-panel="${tab.dataset.tab}"]`)?.classList.add('tab-panel--active');
    });
  });
}

function bindEvents(): void {
  refs.imageInput.addEventListener('change', async event => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    refs.status.textContent = '加载中…';
    try {
      const loaded = await loadImageFile(file);
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
      }
      imageObjectUrl = loaded.objectUrl;
      refs.status.textContent = '';
      resetTransform();
      if (loaded.image.naturalHeight > loaded.image.naturalWidth && state.layoutDirection === 'image-top') {
        state = reduceState(state, { type: 'set-layout-direction', value: 'image-left' });
      }
      state = reduceState(state, { type: 'set-image', image: loaded.image, fileName: file.name });
      render();
    } catch (error) {
      refs.status.textContent = error instanceof Error ? error.message : '图片加载失败';
    } finally {
      input.value = '';
    }
  });

  refs.backgroundSourceInput.addEventListener('change', event => {
    setState({ type: 'set-background-source', value: (event.currentTarget as HTMLSelectElement).value as AppState['backgroundSource'] });
  });

  refs.backgroundColorInput.addEventListener('input', event => {
    const value = (event.currentTarget as HTMLInputElement).value;
    refs.backgroundColorField.style.setProperty('--color-swatch', value);
    setState({ type: 'set-background-color', value });
  });

  refs.backgroundColorSecondaryInput.addEventListener('input', event => {
    const value = (event.currentTarget as HTMLInputElement).value;
    refs.backgroundColorSecondaryField.style.setProperty('--color-swatch', value);
    setState({ type: 'set-background-color-secondary', value });
  });

  refs.backgroundStripeSizeInput.addEventListener('input', event => {
    setState({ type: 'set-background-stripe-size', value: Number((event.currentTarget as HTMLInputElement).value) });
  });

  refs.backgroundImageInput.addEventListener('change', async event => {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    refs.status.textContent = '底图加载中…';
    try {
      const loaded = await loadImageFile(file);
      if (backgroundObjectUrl) {
        URL.revokeObjectURL(backgroundObjectUrl);
      }
      backgroundObjectUrl = loaded.objectUrl;
      refs.status.textContent = '';
      setState({ type: 'set-background-image', image: loaded.image });
    } catch {
      refs.status.textContent = '底图加载失败';
      setState({ type: 'set-background-source', value: 'color' });
    } finally {
      input.value = '';
    }
  });

  refs.layoutDirectionInput.addEventListener('change', event => {
    setState({ type: 'set-layout-direction', value: (event.currentTarget as HTMLSelectElement).value as LayoutDirection });
  });

  refs.distributionModeInput.addEventListener('change', event => {
    setState({ type: 'set-distribution-mode', value: (event.currentTarget as HTMLSelectElement).value as DotDistributionMode });
  });

  refs.shapeInput.addEventListener('change', event => {
    setState({ type: 'set-shape', value: (event.currentTarget as HTMLSelectElement).value as DotShape });
  });

  refs.dotCharInput.addEventListener('input', event => {
    const value = (event.currentTarget as HTMLInputElement).value;
    if (value.length > 0) {
      setState({ type: 'set-dot-char', value });
    }
  });

  refs.splitRatioInput.addEventListener('input', event => {
    setState({ type: 'set-split-ratio', value: Number((event.currentTarget as HTMLInputElement).value) });
  });

  refs.sizeInput.addEventListener('input', event => {
    setState({ type: 'set-size', value: Number((event.currentTarget as HTMLInputElement).value) });
  });

  refs.varianceInput.addEventListener('input', event => {
    setState({ type: 'set-variance', value: Number((event.currentTarget as HTMLInputElement).value) });
  });

  refs.countInput.addEventListener('input', event => {
    setState({ type: 'set-count', value: Number((event.currentTarget as HTMLInputElement).value) });
  });

  refs.shuffleButton.addEventListener('click', () => {
    setState({ type: 'shuffle' });
  });

  refs.undoDotButton.addEventListener('click', () => {
    setState({ type: 'undo-dot' });
  });

  refs.paperCanvas.addEventListener('click', event => {
    const actionType = getDotActionForSurface('paper', state);
    if (!actionType) {
      return;
    }

    const dot = createDotFromPointer(event, refs.paperCanvas);
    if (dot) {
      setState({ type: actionType, dot });
    }
  });

  refs.punchCanvas.addEventListener('click', event => {
    const actionType = getDotActionForSurface('punch', state);
    if (!actionType) {
      return;
    }

    const dot = createDotFromPointer(event, refs.punchCanvas);
    if (dot) {
      setState({ type: actionType, dot });
    }
  });

  refs.downloadButton.addEventListener('click', async () => {
    if (!state.image) {
      return;
    }

    const background = createBackgroundConfig(state);
    const exportSurface = createExportSurface(state.image, refs.paperCanvas);
    const exportBackground = adjustBackgroundForExport(background, refs.paperCanvas, exportSurface);
    const { paperDots, punchDots } = computeDots(state, exportSurface);
    const rainbowMode = isRainbowShuffle(state.shuffleCount);
    const paperCanvas = createDetachedCanvas(exportSurface);
    const punchCanvas = createDetachedCanvas(exportSurface);

    renderPaperCanvas(paperCanvas, state.image, paperDots, exportBackground, state.seed, rainbowMode);
    renderPunchCanvas(punchCanvas, state.image, punchDots, exportBackground, state.seed, rainbowMode);

    const composedCanvas = composeExportCanvas(paperCanvas, punchCanvas, exportBackground, state.layoutDirection, state.splitRatio);
    const exportOptions = getExportSettings(exportBackground);
    const blob = await canvasToExportBlob(composedCanvas, exportOptions.mimeType, exportOptions.quality);
    if (!blob) {
      refs.status.textContent = '导出失败，请稍后重试';
      return;
    }

    const fileName = getExportFileName(state.fileName, exportOptions.mimeType);
    if (await tryShareFile(blob, fileName)) {
      return;
    }

    if (isWeixin()) {
      showSaveOverlay(composedCanvas.toDataURL('image/jpeg', 0.88));
      return;
    }

    downloadBlob(blob, fileName);
  });

  bindViewportGestures();
  window.addEventListener('resize', () => render());
  document.addEventListener(
    'dblclick',
    event => {
      event.preventDefault();
    },
    { passive: false },
  );
}

function bindViewportGestures(): void {
  let previousTouches: Touch[] | null = null;

  refs.resultsViewport.addEventListener(
    'touchstart',
    event => {
      previousTouches = Array.from(event.touches);
    },
    { passive: true },
  );

  refs.resultsViewport.addEventListener(
    'touchmove',
    event => {
      if (!previousTouches) {
        return;
      }

      event.preventDefault();
      const touches = Array.from(event.touches);

      if (touches.length === 1 && previousTouches.length === 1) {
        translateX += touches[0].clientX - previousTouches[0].clientX;
        translateY += touches[0].clientY - previousTouches[0].clientY;
        applyTransform();
      } else if (touches.length === 2 && previousTouches.length >= 2) {
        const previousCenter = getTouchCenter(previousTouches);
        const nextCenter = getTouchCenter(touches);
        const previousDistance = getTouchDistance(previousTouches);
        const nextDistance = getTouchDistance(touches);
        const rect = refs.resultsViewport.getBoundingClientRect();
        const pointerX = nextCenter.x - rect.left - rect.width / 2;
        const pointerY = nextCenter.y - rect.top - rect.height / 2;
        const nextScale = clamp(scale * (nextDistance / previousDistance), 0.2, 6);
        translateX = pointerX + (translateX - pointerX) * (nextScale / scale) + (nextCenter.x - previousCenter.x);
        translateY = pointerY + (translateY - pointerY) * (nextScale / scale) + (nextCenter.y - previousCenter.y);
        scale = nextScale;
        applyTransform();
      }

      previousTouches = touches;
    },
    { passive: false },
  );

  refs.resultsViewport.addEventListener(
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

  refs.resultsViewport.addEventListener('mousedown', event => {
    if (event.button !== 0) {
      return;
    }

    dragging = true;
    startX = event.clientX;
    startY = event.clientY;
    dragOriginX = translateX;
    dragOriginY = translateY;
    refs.resultsViewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', event => {
    if (!dragging) {
      return;
    }

    translateX = dragOriginX + (event.clientX - startX);
    translateY = dragOriginY + (event.clientY - startY);
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    if (!dragging) {
      return;
    }

    dragging = false;
    refs.resultsViewport.style.cursor = '';
  });

  refs.resultsViewport.addEventListener(
    'wheel',
    event => {
      event.preventDefault();
      const rect = refs.resultsViewport.getBoundingClientRect();
      const pointerX = event.clientX - rect.left - rect.width / 2;
      const pointerY = event.clientY - rect.top - rect.height / 2;
      const zoomFactor = -event.deltaY > 0 ? 1.1 : 1 / 1.1;
      const nextScale = clamp(scale * zoomFactor, 0.2, 6);
      translateX = pointerX + (translateX - pointerX) * (nextScale / scale);
      translateY = pointerY + (translateY - pointerY) * (nextScale / scale);
      scale = nextScale;
      applyTransform();
    },
    { passive: false },
  );

  refs.resultsViewport.addEventListener('dblclick', event => {
    event.stopPropagation();
    resetTransform();
  });

  refs.resultsViewport.addEventListener('click', () => {
    if (!state.image) {
      refs.imageInput.click();
    }
  });
}

function applyTransform(): void {
  refs.resultsTransform.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

function resetTransform(): void {
  translateX = 0;
  translateY = 0;
  scale = 1;
  applyTransform();
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

function createMarkup(): string {
  return `
    <main class="shell shell--empty">
      <div class="top-dock">
        <h1 class="shell__title">
          <a class="shell__title-link" href="./about.html">${renderTitleLetters()}</a>？
        </h1>
        <p id="status" class="status"></p>
        <label class="top-dock__btn top-dock__btn--upload">
          <span>上传</span>
          <input id="image-input" type="file" accept="image/*" />
        </label>
        <button id="download-button" class="top-dock__btn" type="button" disabled>下载</button>
      </div>

      <div id="results">
        <p class="results__empty-hint">请上传图片 :D</p>
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

      <div class="controls-bar">
        <nav class="tabs">
          <button class="tab tab--active" data-tab="image" type="button">布局</button>
          <button class="tab" data-tab="background" type="button">底图</button>
          <button class="tab" data-tab="dots" type="button">波点</button>
        </nav>

        <section class="tab-panel tab-panel--active" data-panel="image">
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
        </section>

        <section class="tab-panel" data-panel="background">
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
        </section>

        <section class="tab-panel" data-panel="dots">
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
          <div class="distribution-row">
            <label class="field field--select">
              <span>波点分布</span>
              <select id="distribution-mode-input">
                <option value="random">随机</option>
                <option value="manual-unpaired">点一下图片（左右不对应）</option>
                <option value="manual-paired">点一下图片（左右对应）</option>
              </select>
            </label>
            <button id="shuffle-button" type="button">随机一下</button>
            <button id="undo-dot-button" type="button" hidden>撤回</button>
          </div>
        </section>
      </div>
    </main>
  `;
}

function renderTitleLetters(): string {
  return ['p', 'a', 'p', 'e', 'r', 'd', 'o', 't', 's']
    .map((letter, index) => `<span class="shell__title-letter" data-title-index="${index}">${letter}</span>`)
    .join('');
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
    status: query<HTMLElement>('#status'),
    resultsViewport: query<HTMLElement>('#results'),
    resultsEl: query<HTMLElement>('.results'),
    resultsTransform: query<HTMLElement>('.results-transform'),
    paperCanvas: query<HTMLCanvasElement>('#paper-canvas'),
    punchCanvas: query<HTMLCanvasElement>('#punch-canvas'),
    paperPanel: query<HTMLElement>('.panel--paper'),
    punchPanel: query<HTMLElement>('.panel--image'),
  };
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

  const file = new File([blob], fileName, { type: blob.type || 'image/jpeg' });
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
