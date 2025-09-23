const { app, BrowserWindow, screen, WebContentsView } = require("electron");
const path = require("path");

// --- Constants and Globals ---
// these constants define the default proportions and sizes for the window and content cards
// you can adjust these values to change the layout

const WINDOW_DEFAULTS = {
  WIDTH_PERCENTAGE: 0.25,
  HORIZONTAL_MARGIN_PERCENTAGE: 0.02,
};

// temporary ( need change later to always dynamic !)
const CONTENT_CARD_DEFAULTS = {
  WIDTH: 400,
  INITIAL_HEIGHT: 600,
};

// --- global references ---
// to prevent garbage collection and allow access across functions
let mainWindow;
let cardViews = [];

/**
 * Create and position the main application window
 * - Window height = full workArea height (from top to taskbar)
 * - Window X = aligned to the right side of the screen with margin
 */
function createMainWindow() {
  // get the primary display's workArea (screen excluding taskbar/dock)
  const primaryDisplay = screen.getPrimaryDisplay();
  const {
    x: workX,
    y: workY,
    width: workWidth,
    height: workHeight,
  } = primaryDisplay.workArea;

  // window width based on screen proportion
  const windowWidth = Math.floor(workWidth * WINDOW_DEFAULTS.WIDTH_PERCENTAGE);

  // window height = full available work area height (top to taskbar)
  const windowHeight = workHeight;

  // position window from the right side of the screen inside the workArea
  const windowX = Math.floor(
    workX +
      workWidth -
      windowWidth -
      workWidth * WINDOW_DEFAULTS.HORIZONTAL_MARGIN_PERCENTAGE
  );

  // position window at the top of the workArea
  const windowY = workY;

  // create the main window
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    frame: false, // no default frame so we can style freely
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // load main HTML file
  mainWindow.loadFile(path.join(__dirname, "index.html"));

  // content sources to display in cards
  const contentSources = [
    "https://www.reddit.com",
    "https://news.ycombinator.com",
  ];

  // create and store content cards
  contentSources.forEach((source) => {
    const newCardView = createContentCardView(source);
    cardViews.push(newCardView);
  });

  // position all cards initially
  repositionAllCardViews();
}

/**
 * Create a WebContentsView for a content card
 * - Loads remote URL or local file
 * - Adjusts height dynamically based on content
 */
function createContentCardView(source) {
  const cardView = new WebContentsView();

  // load the content into the card (remote URL or local file)
  if (source.startsWith("http")) {
    cardView.webContents.loadURL(source);
  } else {
    cardView.webContents.loadFile(path.join(__dirname, source));
  }

  // adjust the card height dynamically once content finishes loading
  cardView.webContents.on("did-finish-load", async () => {
    try {
      const contentHeight = await cardView.webContents.executeJavaScript(
        "document.body.scrollHeight"
      );

      const currentBounds = cardView.getBounds();
      cardView.setBounds({
        x: currentBounds.x,
        y: currentBounds.y,
        width: currentBounds.width || CONTENT_CARD_DEFAULTS.WIDTH,
        height: contentHeight || CONTENT_CARD_DEFAULTS.INITIAL_HEIGHT,
      });

      // after adjusting one card, reposition all cards again
      repositionAllCardViews();
    } catch (error) {
      console.error("Error adjusting content card height:", error);
    }
  });

  // add card as a child of the main window
  mainWindow.contentView.addChildView(cardView);

  return cardView;
}

/**
 * Position all content cards vertically stacked inside the main window
 * - Cards are aligned to the right side of the screen
 */
function repositionAllCardViews() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { x: workX, width: workWidth } = primaryDisplay.workArea;

  // X position aligned to the right side of the workArea
  const cardX = Math.round(
    workX +
      workWidth -
      CONTENT_CARD_DEFAULTS.WIDTH -
      workWidth * WINDOW_DEFAULTS.HORIZONTAL_MARGIN_PERCENTAGE
  );

  let accumulatedHeight = 0; // track vertical placement for stacking

  cardViews.forEach((card) => {
    const cardBounds = card.getBounds();
    card.setBounds({
      x: cardX,
      y: accumulatedHeight,
      width: CONTENT_CARD_DEFAULTS.WIDTH,
      height: cardBounds.height || CONTENT_CARD_DEFAULTS.INITIAL_HEIGHT,
    });

    // increment accumulatedHeight to position the next card below
    accumulatedHeight +=
      cardBounds.height || CONTENT_CARD_DEFAULTS.INITIAL_HEIGHT;
  });
}

// --- Application Lifecycle ---

// create the main window when Electron is ready
app.whenReady().then(createMainWindow);

// quit the app when all windows are closed (except on macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// on macOS, recreate the window if the dock icon is clicked and no window exists
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
