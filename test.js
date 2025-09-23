import { app, BrowserWindow, WebContentsView, screen, globalShortcut } from "electron";

app.whenReady().then(() => {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  const win = new BrowserWindow({
    width,
    height,
  });

  // Função para criar uma view com a URL e posição inicial
  function createView(url, index) {
    const view = new WebContentsView();

    const viewWidth = Math.round(width * 0.25);
    const viewHeight = Math.round(height * 0.9);
    const x = Math.round(width - width * 0.26);
    const y = Math.round(height * 0.05) + index * viewHeight;

    view.setBounds({ x, y, width: viewWidth, height: viewHeight });
    view.webContents.loadURL(url);

    win.contentView.addChildView(view);
    return view;
  }

  const urls = [
    "https://example.com",
    "https://wikipedia.org",
    "https://electronjs.org",
    "https://github.com",
  ];

  const views = urls.map((url, i) => createView(url, i));

  let offset = 0;
  let targetOffset = 0;
  const viewHeight = Math.round(height * 0.9);
  let scrolling = false;

  function reposition() {
    views.forEach((view, i) => {
      const x = Math.round(width - width * 0.26);
      const y = Math.round(height * 0.05) + i * viewHeight + offset;
      view.setBounds({
        x,
        y,
        width: Math.round(width * 0.25),
        height: viewHeight,
      });
    });
  }

  function animateScroll() {
    if (scrolling) return;
    scrolling = true;

    const step = () => {
      const diff = targetOffset - offset;
      if (Math.abs(diff) < 2) {
        offset = targetOffset;
        reposition();
        scrolling = false;
        return;
      }
      offset += diff * 0.2; // fator de suavidade (quanto menor, mais lento)
      reposition();
      setTimeout(step, 16); // ~60fps
    };

    step();
  }

  function scrollDown() {
    targetOffset -= viewHeight;
    animateScroll();
  }

  function scrollUp() {
    targetOffset += viewHeight;
    animateScroll();
  }

  // Atalhos globais de teste
  globalShortcut.register("Down", scrollDown);
  globalShortcut.register("Up", scrollUp);
});
