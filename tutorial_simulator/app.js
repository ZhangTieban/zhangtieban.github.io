const devices = [
  { mac: "1c:db:d4:7a:f1:94", rssi: -41, max: 7420, shots: 18 },
  { mac: "d8:bc:38:11:2a:70", rssi: -57, max: 6380, shots: 7 },
  { mac: "48:e7:29:8a:03:c2", rssi: -68, max: 5120, shots: 3 },
  { mac: "a4:cf:12:90:5e:44", rssi: -73, max: 0, shots: 0 }
];

const dayColors = [
  "#722ed1",
  "#ff4d4f",
  "#ff9f1c",
  "#ffd60a",
  "#52c41a",
  "#13c2c2",
  "#2f54eb"
];

const pageOrder = ["scan", "live", "hist", "profile"];
const pageEls = {
  scan: "scanPage",
  live: "livePage",
  hist: "histPage",
  profile: "profilePage"
};
const screenEls = {
  off: "offScreen",
  boot: "bootScreen",
  watch: "watchScreen",
  menu: "menuScreen",
  settings: "settingsScreen",
  settingsDetail: "settingsDetailScreen",
  bbp: "bbpScreen"
};

const SCREEN_W = 410;
const SCREEN_H = 502;
const WATCH_STAGE_W = 462;
const MOBILE_TUTORIAL_PANEL_H = 214;
const MOBILE_TUTORIAL_CONTROL_RESERVE_H = 64;
const MOBILE_TUTORIAL_RAIL_GAP = 8;
const HOME_SWIPE_MIN_DY = 38;
const HOME_SWIPE_EARLY_DY = 28;
const HOME_SWIPE_MAX_DX_BASE = 12;
const HOME_SWIPE_MAX_DX_GAIN = 0.5;
const BBP_SWIPE_MIN_DX = 92;
const BBP_SWIPE_DY_BIAS = 24;
const BBP_TOUCH_SWIPE_COOLDOWN_MS = 260;
const BBP_WHEEL_SWIPE_COOLDOWN_MS = 620;
const BBP_IDLE_DISCONNECT_MS = 5 * 60 * 1000;
const POWER_ON_HOLD_MS = 2000;
const POWER_OFF_HOLD_MS = 6000;
const OFFTIME_SECONDS = [10, 30, 60, 0];
const BATTERY_CHARGE_MS_PER_PERCENT = 1200;
const BATTERY_DRAIN_MS_PER_PERCENT = 4200;
const BATTERY_LOW_PCT = 20;
const BATTERY_CRITICAL_PCT = 8;
const BATTERY_REBOOT_PCT = 2;
const RING_PATH_LENGTH = 1474.36;
const RUNTIME_STORAGE_KEY = "bsw_sim_total_runtime_ms";
const RUNTIME_SAVE_INTERVAL_MS = 5000;
const TUTORIAL_STORAGE_KEY = "bsw_sim_tutorial_done";
const initialTutorialDone = loadTutorialDone();

const phaseNames = ["加速", "快速", "最高", "降速"];
const PROFILE_POINT_COUNT = 32;
const PROFILE_ACTIVE_POINT_COUNT = 15;
const profileShape = Array.from({ length: PROFILE_POINT_COUNT }, (_, idx) => {
  if (idx >= PROFILE_ACTIVE_POINT_COUNT) return 0;
  const t = (idx + 1) / (PROFILE_ACTIVE_POINT_COUNT + 1);
  return Math.max(0, 4 * t * (1 - t));
});
const defaultProfile = profileShape.map((ratio) => Math.max(0, Math.round(7600 * ratio)));
const tutorialProfileExample = [
  0, 900, 2600, 5200, 8200, 10800, 12400, 11800,
  10400, 8800, 7000, 5200, 3400, 1900, 900, 300,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
];
const tutorialProfilePeak = Math.max(...tutorialProfileExample);

const settingsPageDefs = {
  datetime: { title: "日期與時間", parent: "settings" },
  time: { title: "設定時間", parent: "datetime" },
  date: { title: "設定日期", parent: "datetime" },
  brightness: { title: "畫面亮度", parent: "settings" },
  offtime: { title: "自動休眠", parent: "settings" },
  volume: { title: "音量", parent: "settings" },
  level: { title: "陀螺平衡測試", parent: "settings" },
  sdDetail: { title: "SD卡資訊", parent: "settings" },
  about: { title: "關於設備", parent: "settings" },
  aboutDevice: { title: "設備資訊", parent: "about" },
  battery: { title: "電源資訊", parent: "about" },
  licenseInfo: { title: "授權資訊", parent: "about" },
  openSource: { title: "Library資訊", parent: "about" },
  devicePower: { title: "系統控制", parent: "settings" },
  factoryReset: { title: "重設設定", parent: "devicePower" }
};
const disabledSettingsPages = new Set(["level", "sdDetail"]);

const settingsOpenSourceBody = [
  "- Arduino-ESP32 Core : LGPL-2.1-or-later",
  "- LVGL : MIT",
  "- SensorLib : MIT (+ Bosch BSD-3-Clause)",
  "- XPowersLib : MIT",
  "- Arduino_GFX : BSD",
  "- es8311 files : Apache-2.0",
  "- shark-minister atlas_bey core : MIT",
  "",
  "ZhangTieban / 2026"
].join("\n");

const state = {
  screen: "off",
  page: "scan",
  settingsPage: "",
  mode: "idle",
  bbpMode: "solo",
  blePhase: "idle",
  bootPct: 0,
  rows: [],
  selected: "",
  bound: "",
  connected: "",
  isAttached: false,
  isCalculating: false,
  disconnecting: false,
  lastDone: false,
  detail: false,
  analyzerMode: true,
  histShowAna: true,
  profileDetail: false,
  profileExample: false,
  timeCardTimerMode: false,
  timeFormat12h: false,
  brightnessPct: 72,
  offTimeIndex: 0,
  volumePct: 60,
  motorEnabled: true,
  motorTesting: false,
  settingsSavedText: "",
  factoryResetConfirm: false,
  settingsTimeHour24: null,
  settingsTimeMinute: null,
  settingsDateYear: null,
  settingsDateMonth: null,
  settingsDateDay: null,
  isCharging: false,
  batteryPct: 72,
  batteryLastAt: 0,
  liveRpm: 0,
  liveMax: 0,
  liveAvg: 0,
  liveMin: 0,
  liveShots: 0,
  shotPeak: 7200,
  statMode: 0,
  timerStart: 0,
  timerElapsedMs: 0,
  history: [],
  profilePoints: defaultProfile.slice(),
  phaseRows: [],
  simEnabled: true,
  simShots: 0,
  simPhase: "advertising",
  simTxCount: 0,
  simLastWriteCmd: "--",
  simPairPressCount: 0,
  simPairConfirmed: false,
  simBatchActive: false,
  simBatchDone: 0,
  simBatchTarget: 200,
  simBatchTimer: 0,
  scanTimer: 0,
  connectTimer: 0,
  attachTimer: 0,
  disconnectTimer: 0,
  bbpIdleTimer: 0,
  shotTimer: 0,
  bootTimer: 0,
  rpmTimer: 0,
  clockTimer: 0,
  bootStartedAt: 0,
  totalRuntimeBaseMs: loadStoredRuntimeTotal(),
  runtimeLastSaveAt: 0,
  swipeStartX: 0,
  swipeStartY: 0,
  swipeStartLocalY: 0,
  swipeActive: false,
  swipePointerId: null,
  swipeCaptured: false,
  homeTracking: false,
  lastSwipeAt: 0,
  lastHomeSwipeAt: 0,
  wheelLockUntil: 0,
  suppressClickUntil: 0,
  lastActivityAt: 0,
  screenDimmed: false,
  tutorialOpen: !initialTutorialDone,
  tutorialActive: !initialTutorialDone,
  tutorialDone: initialTutorialDone,
  tutorialStep: 0,
  tutorialReviewMode: initialTutorialDone,
  tutorialCompletedChapters: []
};

const $ = (id) => document.getElementById(id);
let timeCardTextCache = "";
let timeCardModeCache = null;
let dayThemeCache = -1;
let watchTimeCache = "";
let watchDateCache = "";
let sideButtonPulseTimer = 0;
let powerButtonHoldTimer = 0;
let powerButtonLongHandled = false;
let powerButtonPressScreen = "";
let settingsSaveResetTimer = 0;
let settingsBatteryPctCache = -1;
let settingsBatteryChargingCache = null;
let tutorialHighlightFrame = 0;
let tutorialManualReview = false;
let tutorialStepEntryId = "";
let tutorialStepEntryPage = "";
let tutorialWaitWasMet = false;
let tutorialRevealStepId = "";
let tutorialBlockedHintTimer = 0;
let tutorialBlockedHintText = "";
let chargeHintTimer = 0;

const tutorialChapters = [
  { id: "powerBasics", title: "第一章 手錶外觀與電源", shortTitle: "手錶外觀與電源" },
  { id: "mode", title: "第二章 進入模式選擇", shortTitle: "進入模式選擇" },
  { id: "settings", title: "第三章 進入設定", shortTitle: "進入設定" }
];

const tutorialSteps = [
  {
    id: "chapterSelect",
    title: "章節導航",
    target: "",
    chapterMenu: true,
    lines: [
      "第一章完成後，可以自由選擇第二章或第三章先練習。"
    ],
    nextLabel: "開始第一章"
  },
  {
    id: "powerButtonIntro",
    chapter: "powerBasics",
    title: "認識按鈕：右下鍵",
    target: "#settingsSideButton",
    pad: 14,
    lockControls: true,
    lines: [
      "右下鍵是電源開關機與設定鍵。",
      "長按2秒開機，長按6秒關機，短按進入設定。",
      "第一次安裝接上電池後若短暫亮起，韌體會自動關機，不需要手動關機。"
    ]
  },
  {
    id: "timerButtonIntro",
    chapter: "powerBasics",
    title: "認識按鈕：右上鍵",
    target: "#timerSideButton",
    pad: 14,
    lockControls: true,
    lines: [
      "右上鍵用來停止碼表。",
      "這個功能只有在積分器連線測速時啟用。"
    ]
  },
  {
    id: "chargePortIntro",
    chapter: "powerBasics",
    title: "認識孔位：Type-C",
    target: "#chargePortButton",
    pad: 10,
    lockControls: true,
    lines: [
      "右側中間位置是 Type-C 5V 充電孔。請使用合規5V 充電器；使用錯誤電壓造成損壞，不在保固範圍內。"
    ]
  },
  {
    id: "sdSlotIntro",
    chapter: "powerBasics",
    title: "認識孔位：SD 卡槽",
    target: "#sdSlot",
    pad: 10,
    lockControls: true,
    lines: [
      "左側中間是 SD 卡槽。",
      "目前此功能暫停使用。"
    ]
  },
  {
    id: "powerOn",
    chapter: "powerBasics",
    title: "開機",
    target: "#settingsSideButton",
    pad: 14,
    lines: [
      "電池安裝完成後，請長按右下側邊鍵 2 秒。",
      "看到開機動畫並進入錶面後，教學會自動前進。"
    ],
    waitText: "等待你完成開機操作",
    waitFor: "watchOn"
  },
  {
    id: "powerOff",
    chapter: "powerBasics",
    title: "關機",
    target: "#settingsSideButton",
    pad: 14,
    lines: [
      "日常使用時，長按右下側邊鍵 6 秒可以關機。",
      "請長按右下鍵，直到畫面回到黑畫面。"
    ],
    waitText: "等待你完成關機操作",
    waitFor: "watchOff"
  },
  {
    id: "chargePortUse",
    chapter: "powerBasics",
    title: "模擬充電",
    target: "#chargePortButton",
    pad: 10,
    lines: [
      "Type-C 插頭可切換模擬充電狀態。",
      "請點右側插頭，看到插頭靠近手錶並進入充電狀態。"
    ],
    waitText: "等待你開啟模擬充電",
    waitFor: "charging"
  },
  {
    id: "powerOnAgain",
    chapter: "powerBasics",
    title: "再次開機",
    target: "#settingsSideButton",
    pad: 14,
    lines: [
      "現在再次長按右下側邊鍵 2 秒開機。",
      "進入錶面後，會介紹錶面上的資訊。"
    ],
    waitText: "等待你完成開機操作",
    waitFor: "watchOn"
  },
  {
    id: "batteryRing",
    chapter: "powerBasics",
    title: "電量環",
    target: "#watchScreen",
    pad: 0,
    lockControls: true,
    lines: [
      "外圈亮起的環代表目前電量。",
      "電量高時是綠色；電量低時顏色會變黃或紅。",
      "20% 以下變黃，8% 以下變紅；充電中會以橘色顯示。"
    ]
  },
  {
    id: "timeDateIntro",
    chapter: "powerBasics",
    title: "時間與日期",
    target: "#watchDate, #watchTime",
    pad: 8,
    lockControls: true,
    lines: [
      "時間由 RTC 晶片保存。",
      "電池完全沒電時，計時可能會重置。",
      "若時間不準，請到設定手動調整日期與時間。"
    ]
  },
  {
    id: "goIntro",
    chapter: "powerBasics",
    title: "GO 入口",
    target: "#watchBbpHotspot",
    pad: 10,
    lockControls: true,
    lines: [
      "錶面中央的 GO 是進入模式選擇的入口。"
    ]
  },
  {
    id: "powerBasicsComplete",
    chapterComplete: "powerBasics",
    title: "第一章完成",
    target: "",
    lines: [
      "你已認識手錶外觀，並完成開機、日常關機、模擬充電與錶面基礎說明。",
      "可以選擇其他章節繼續。"
    ]
  },
  {
    id: "watchFace",
    chapter: "mode",
    title: "進入模式選擇",
    target: "#watchBbpHotspot",
    pad: 10,
    lines: [
      "錶面中央的 GO 是模式入口。",
      "請點 GO 進入模式選擇。"
    ],
    waitText: "等待你點擊 GO",
    waitFor: "menu"
  },
  {
    id: "modeMenu",
    chapter: "mode",
    title: "模式選擇返回",
    target: "#homeHitbox",
    pad: 12,
    lockControls: true,
    lines: [
      "模式選擇頁底部白線可以返回上一層。",
      "需要回錶面時，從白線向上滑。"
    ]
  },
  {
    id: "modeMenuSelect",
    chapter: "mode",
    title: "選擇測速模式",
    target: "[data-mode='bbp']",
    pad: 8,
    lines: [
      "目前可用的是「積分器連線測速」。",
      "雙人對戰與模擬連線依目前程式包設定停用。",
      "請點這個模式進入掃描頁。"
    ],
    waitText: "等待你進入測速模式",
    waitFor: "bbp"
  },
  {
    id: "scan",
    chapter: "mode",
    title: "掃描積分器",
    target: "#primaryBtn",
    pad: 8,
    lines: [
      "掃描頁會尋找可連線的積分器。",
      "請按「掃描」，等待 MAC 清單出現。"
    ],
    waitText: "等待掃描結果",
    waitFor: "scanResult"
  },
  {
    id: "scanResultsIntro",
    chapter: "mode",
    title: "MAC 清單",
    target: "#macList",
    pad: 8,
    lockControls: true,
    lines: [
      "掃描完成後，這裡會列出附近可連線的積分器 MAC。",
      "右側數值是訊號強度，數值越接近 0 代表訊號越強。"
    ]
  },
  {
    id: "selectDevice",
    chapter: "mode",
    title: "選擇裝置",
    target: "#macList .mac-row:not(.empty)",
    pad: 8,
    lines: [
      "清單中的每一列都是一台積分器。",
      "請點一列 MAC，將它設為目前要連線的裝置。"
    ],
    waitText: "等待你選擇裝置",
    waitFor: "selected",
    acceptInitialWait: true
  },
  {
    id: "deviceDetailIntro",
    chapter: "mode",
    title: "裝置細節",
    target: "#detailPanel",
    pad: 8,
    lockControls: true,
    lines: [
      "選到 MAC 後，可查看該裝置的 MAC、最大速度與發射次數。",
      "這裡用來確認目前準備連線的是哪一台積分器。"
    ]
  },
  {
    id: "bindDeviceIntro",
    chapter: "mode",
    title: "設為選定",
    target: "#bindBtn",
    pad: 8,
    lockControls: true,
    lines: [
      "設為選定可把常用積分器做標記。",
      "之後重新掃描時，可更快辨識常用裝置。"
    ]
  },
  {
    id: "connect",
    chapter: "mode",
    title: "連線",
    target: "#primaryBtn",
    pad: 8,
    lines: [
      "選定裝置後，主按鈕會變成「連接」。",
      "請按「連接」，進入 Live 測速頁。"
    ],
    waitText: "等待連線完成",
    waitFor: "connected",
    acceptInitialWait: true
  },
  {
    id: "attach",
    chapter: "mode",
    title: "模擬裝上陀螺",
    target: "#mountBtn",
    pad: 8,
    lines: [
      "下方控制列用來模擬硬體事件。",
      "請按「裝上陀螺」，Live 頁會切換到準備。"
    ],
    waitText: "等待你按下裝上陀螺",
    waitFor: "attached",
    showControls: true
  },
  {
    id: "shot",
    chapter: "mode",
    title: "模擬發射",
    target: "#shotBtn",
    pad: 8,
    lines: [
      "裝上後，發射按鈕會啟用。",
      "發射陀螺後，會接收 BLE 封包並顯示計算。",
      "完成後會更新 Live RPM 與歷史資料。"
    ],
    waitText: "等待你完成一次發射",
    waitFor: "shotDone",
    showControls: true
  },
  {
    id: "timerCardToggle",
    chapter: "mode",
    title: "時間與碼表卡片",
    target: "#livePage .time-banner",
    pad: 8,
    lines: [
      "Live 頁上方卡片可在目前時間與碼表之間切換。",
      "卡片外框顏色依星期變化：日紫、一紅、二橘、三黃、四綠、五青、六藍。",
      "碼表計時用來測陀螺轉停，或是對戰時間等。",
      "請點擊上方時間卡，切換成碼表顯示。"
    ],
    waitText: "等待切換成碼表",
    waitFor: "timerMode"
  },
  {
    id: "timerPause",
    chapter: "mode",
    title: "暫停碼表",
    target: "#timerSideButton",
    pad: 14,
    lines: [
      "右上側邊鍵可停止碼表。",
      "碼表停止後，會保留本次轉停或對戰計時結果。"
    ],
    waitText: "等待按下右上側邊鍵",
    waitFor: "timerStopped"
  },
  {
    id: "liveRpmIntro",
    chapter: "mode",
    title: "Live 即時轉速",
    target: "#liveRpm",
    pad: 10,
    lockControls: true,
    lines: [
      "Live 頁中央的大數字是即時 RPM 轉速。",
      "發射或計算時，這裡會顯示目前偵測到的速度。"
    ]
  },
  {
    id: "liveStatusIntro",
    chapter: "mode",
    title: "Live 狀態",
    target: "#livePage .chip-row, #diagLabel",
    pad: 8,
    lockControls: true,
    lines: [
      "上方狀態標籤顯示連線、裝上陀螺與計算狀態。",
      "下方判定列只顯示發射結果，尚無結果時顯示 --。"
    ]
  },
  {
    id: "liveModeTabsIntro",
    chapter: "mode",
    title: "官方認定與實際計算",
    target: "#modeBbp, #modeAna",
    pad: 8,
    lockControls: true,
    lines: [
      "Live 卡片上方可切換官方認定與實際計算。",
      "官方認定偏向判定結果；實際計算偏向即時測速數據。"
    ]
  },
  {
    id: "liveStatsSwitchIntro",
    chapter: "mode",
    title: "統計卡切換",
    target: ".stats-card",
    pad: 8,
    lockControls: true,
    lines: [
      "下方統計卡可切換不同統計項目。",
      "接下來會依序介紹最大速度、平均速度、最低速度與發射次數。"
    ]
  },
  {
    id: "liveMaxIntro",
    chapter: "mode",
    title: "本機最大速度",
    target: ".stats-card",
    pad: 8,
    lockControls: true,
    lines: [
      "統計卡會顯示本機記錄的最大速度。",
      "最大速度代表目前這台模擬裝置測到的最高 RPM。"
    ]
  },
  {
    id: "liveAvgIntro",
    chapter: "mode",
    title: "本機平均速度",
    target: ".stats-card",
    pad: 8,
    lockControls: true,
    lines: [
      "統計卡也可切換到平均速度。",
      "平均速度用來快速判斷多次發射的整體表現。"
    ]
  },
  {
    id: "liveMinIntro",
    chapter: "mode",
    title: "本機最低速度",
    target: ".stats-card",
    pad: 8,
    lockControls: true,
    lines: [
      "最低速度可用來觀察表現較弱的一次或低速區間。",
      "與最大速度一起看，可以比較發射穩定度。"
    ]
  },
  {
    id: "liveShotsIntro",
    chapter: "mode",
    title: "本機發射次數",
    target: ".stats-card",
    pad: 8,
    lockControls: true,
    lines: [
      "發射次數代表目前本機累積的發射紀錄數。",
      "每完成一次有效發射，次數會增加。"
    ]
  },
  {
    id: "historyPageIntro",
    chapter: "mode",
    title: "歷史紀錄頁",
    target: "#histListCard",
    pad: 8,
    lockControls: true,
    lines: [
      "歷史頁會保留最近幾次發射結果。",
      "每一列代表一次發射紀錄，方便回看不同次數的速度。"
    ]
  },
  {
    id: "historyModeToggleIntro",
    chapter: "mode",
    title: "歷史速度類型",
    target: "#histHead",
    pad: 8,
    lockControls: true,
    lines: [
      "點擊表頭可切換歷史紀錄的速度類型。",
      "可在實際計算速度與官方認定速度之間查看。"
    ]
  },
  {
    id: "profilePurposeIntro",
    chapter: "mode",
    title: "發射分析用途",
    target: "#profileCard",
    pad: 8,
    lockControls: true,
    lines: [
      "發射完成後，系統會把速度資料整理成 RPM 曲線。",
      "這頁用來回看發射力道、最高速度與速度衰減。"
    ]
  },
  {
    id: "profileChartIntro",
    chapter: "mode",
    title: "範例折線圖",
    target: "#profileCard",
    pad: 8,
    lockControls: true,
    lines: [
      "範例曲線會先快速上升到峰值。",
      "峰值後若能逐步下降，代表這次發射資料較穩定。"
    ]
  },
  {
    id: "profileDiagnosisIntro",
    chapter: "mode",
    title: "判定結果",
    target: "#profileCard",
    pad: 8,
    lockControls: true,
    lines: [
      "正常發射代表峰值夠高，峰值後也有明顯下降。",
      "低速、高速、突然掉速會顯示對應的發射狀態。"
    ]
  },
  {
    id: "profileDetailIntro",
    chapter: "mode",
    title: "發射分段資料",
    target: "#profileCard",
    pad: 8,
    lockControls: true,
    lines: [
      "點擊發射分析卡可切換成分段資料。",
      "分段資料會列出加速、最高與降速階段的時間和 RPM。"
    ]
  },
  {
    id: "pageDotsIntro",
    chapter: "mode",
    title: "頁面圓點",
    target: ".page.active .page-nav",
    pad: 10,
    lockControls: true,
    lines: [
      "底部圓點代表目前所在頁面。",
      "共有掃描、Live、歷史與發射分析四個頁面。"
    ]
  },
  {
    id: "swipePages",
    chapter: "mode",
    title: "查看歷史與分析",
    target: ".page.active .page-nav",
    allowTargets: "#bbpScreen",
    pad: 10,
    lines: [
      "在測速模式內可以左右滑動切換頁面。",
      "四個點代表掃描、Live、歷史、發射分析。"
    ],
    waitText: "等待你左右滑動切換頁面",
    waitFor: "pageChanged"
  },
  {
    id: "modeComplete",
    chapterComplete: "mode",
    title: "第二章完成",
    target: "",
    lines: [
      "你已完成進入模式選擇與測速流程。",
      "可以進入下一章，或選其他章節繼續。"
    ]
  },
  {
    id: "settingsEntry",
    chapter: "settings",
    title: "進入設定",
    target: "#watchSettingsHotspot",
    extraTargets: ["#settingsSideButton"],
    allowTargets: "#settingsSideButton, #chargePortButton",
    pad: 10,
    textLines: [
      "從錶面短按右下側邊鍵，可進入設定主畫面。",
      "也可以點錶面下方的日期與時間區域進入設定。"
    ],
    lines: [
      "請短按右下側邊鍵，或點錶面下方日期時間區域。",
      "畫面會進入設定主頁面。"
    ],
    waitText: "等待你進入設定",
    waitFor: "settings"
  },
  {
    id: "settingsHomeGesture",
    chapter: "settings",
    title: "設定頁返回",
    target: "#homeHitbox",
    pad: 12,
    lockControls: true,
    lines: [
      "設定頁底部白線可以返回上一層。",
      "從白線向上滑，可回到錶面。"
    ]
  },
  {
    id: "settingsDatetimeOpen",
    chapter: "settings",
    title: "日期與時間",
    target: "#settingsScreen [data-settings-page='datetime']",
    pad: 6,
    lines: [
      "日期與時間可以調整手錶顯示的時間、日期與 12/24 小時格式。",
      "請點「日期與時間」進入子頁。"
    ],
    waitText: "等待你進入日期與時間",
    waitFor: "settingsPage:datetime"
  },
  {
    id: "settingsDatetimeMenu",
    chapter: "settings",
    title: "日期與時間內容",
    target: "#settingsDetailBody .settings-sub-list",
    settingsPage: "datetime",
    pad: 6,
    lockControls: true,
    lines: [
      "這裡分成設定時間、設定日期與 12/24 小時制。",
      "時間由 RTC 晶片保存；如果電池完全沒電，時間可能需要重新調整。"
    ]
  },
  {
    id: "settingsTimeOpen",
    chapter: "settings",
    title: "設定時間",
    target: "#settingsDetailScreen [data-settings-page='time']",
    settingsPage: "datetime",
    pad: 6,
    lines: [
      "設定時間可調整小時與分鐘。",
      "請點「設定時間」進入時間調整頁。"
    ],
    waitText: "等待你進入設定時間",
    waitFor: "settingsPage:time"
  },
  {
    id: "settingsTimeDetail",
    chapter: "settings",
    title: "時間調整頁",
    target: "#settingsDetailBody .settings-time-stage",
    settingsPage: "time",
    pad: 6,
    lockControls: true,
    lines: [
      "左右兩個滾輪分別是小時與分鐘。",
      "調整完成後按保存，手錶會套用新的時間。"
    ]
  },
  {
    id: "settingsTimeBack",
    chapter: "settings",
    title: "返回日期與時間",
    target: "#homeHitbox",
    settingsPage: "time",
    pad: 12,
    lines: [
      "子頁底部白線可以回上一層。",
      "請從白線向上滑，回到日期與時間選單。"
    ],
    waitText: "等待你返回日期與時間",
    waitFor: "settingsPage:datetime"
  },
  {
    id: "settingsDateOpen",
    chapter: "settings",
    title: "設定日期",
    target: "#settingsDetailScreen [data-settings-page='date']",
    settingsPage: "datetime",
    pad: 6,
    lines: [
      "設定日期可調整年份、月份與日期。",
      "請點「設定日期」進入日期調整頁。"
    ],
    waitText: "等待你進入設定日期",
    waitFor: "settingsPage:date"
  },
  {
    id: "settingsDateDetail",
    chapter: "settings",
    title: "日期調整頁",
    target: "#settingsDetailBody .settings-date-stage",
    settingsPage: "date",
    pad: 6,
    lockControls: true,
    lines: [
      "三個滾輪分別是年、月、日。",
      "月份改變時，日期範圍會跟著調整。"
    ]
  },
  {
    id: "settingsDateBack",
    chapter: "settings",
    title: "返回日期與時間",
    target: "#homeHitbox",
    settingsPage: "date",
    pad: 12,
    lines: [
      "請再從底部白線向上滑。",
      "這會回到日期與時間選單。"
    ],
    waitText: "等待你返回日期與時間",
    waitFor: "settingsPage:datetime"
  },
  {
    id: "settingsBrightnessOpen",
    chapter: "settings",
    title: "畫面亮度",
    target: "#settingsScreen [data-settings-page='brightness']",
    pad: 6,
    lines: [
      "畫面亮度用來調整螢幕顯示亮暗。",
      "請點「畫面亮度」進入亮度調整頁。"
    ],
    waitText: "等待你進入畫面亮度",
    waitFor: "settingsPage:brightness"
  },
  {
    id: "settingsBrightnessDetail",
    chapter: "settings",
    title: "亮度調整",
    target: "#settingsDetailBody .settings-slider-stage",
    settingsPage: "brightness",
    pad: 6,
    lockControls: true,
    lines: [
      "滑桿越上方，畫面越亮。",
      "戶外或亮處可提高亮度；想省電時可以降低亮度。"
    ]
  },
  {
    id: "settingsBrightnessBack",
    chapter: "settings",
    title: "返回設定主頁",
    target: "#homeHitbox",
    settingsPage: "brightness",
    pad: 12,
    lines: [
      "亮度調整完成後，從底部白線向上滑回設定主頁。"
    ],
    waitText: "等待你返回設定主頁",
    waitFor: "settingsMain"
  },
  {
    id: "settingsSleepOpen",
    chapter: "settings",
    title: "自動休眠",
    target: "#settingsScreen [data-settings-page='offtime']",
    pad: 6,
    lines: [
      "自動休眠可設定螢幕多久沒有操作後變暗。",
      "請點「自動休眠」進入時間選擇頁。"
    ],
    waitText: "等待你進入自動休眠",
    waitFor: "settingsPage:offtime"
  },
  {
    id: "settingsSleepDetail",
    chapter: "settings",
    title: "休眠時間",
    target: "#settingsDetailBody .settings-offtime-stage",
    settingsPage: "offtime",
    pad: 6,
    lockControls: true,
    lines: [
      "滾輪可選 10 秒、30 秒、1 分或常開。",
      "選好後按保存，之後無操作就會依時間變暗。"
    ]
  },
  {
    id: "settingsSleepBack",
    chapter: "settings",
    title: "返回設定主頁",
    target: "#homeHitbox",
    settingsPage: "offtime",
    pad: 12,
    lines: [
      "請從底部白線向上滑，回到設定主頁。"
    ],
    waitText: "等待你返回設定主頁",
    waitFor: "settingsMain"
  },
  {
    id: "settingsVolumeOpen",
    chapter: "settings",
    title: "音量",
    target: "#settingsScreen [data-settings-page='volume']",
    pad: 6,
    lines: [
      "音量用來調整提示音或操作音大小。",
      "請點「音量」進入音量調整頁。"
    ],
    waitText: "等待你進入音量",
    waitFor: "settingsPage:volume"
  },
  {
    id: "settingsVolumeDetail",
    chapter: "settings",
    title: "音量調整",
    target: "#settingsDetailBody .settings-slider-stage",
    settingsPage: "volume",
    pad: 6,
    lockControls: true,
    lines: [
      "滑桿越上方，音量越大。",
      "需要安靜使用時，可以把音量調低。"
    ]
  },
  {
    id: "settingsVolumeBack",
    chapter: "settings",
    title: "返回設定主頁",
    target: "#homeHitbox",
    settingsPage: "volume",
    pad: 12,
    lines: [
      "請從底部白線向上滑，回到設定主頁。"
    ],
    waitText: "等待你返回設定主頁",
    waitFor: "settingsMain"
  },
  {
    id: "settingsLevelIntro",
    chapter: "settings",
    title: "陀螺平衡測試",
    target: "#settingsScreen [data-settings-page='level']",
    pad: 6,
    lockControls: true,
    lines: [
      "陀螺平衡測試依目前程式包設定停用。",
      "此列會以灰階顯示，且不能進入陀螺平衡測試頁面。"
    ]
  },
  {
    id: "settingsSdIntro",
    chapter: "settings",
    title: "SD卡資訊",
    target: "#settingsScreen [data-settings-page='sdDetail']",
    pad: 6,
    lockControls: true,
    lines: [
      "SD卡資訊依目前程式包設定不啟動。",
      "此列會以灰階顯示，且不能進入 SD卡資訊頁面。"
    ]
  },
  {
    id: "settingsAboutOpen",
    chapter: "settings",
    title: "關於設備",
    target: "#settingsScreen [data-settings-page='about']",
    pad: 6,
    lines: [
      "關於設備可以查看設備資訊、電源資訊與授權內容。",
      "請點「關於設備」進入關於頁。"
    ],
    waitText: "等待你進入關於設備",
    waitFor: "settingsPage:about"
  },
  {
    id: "settingsAboutMenu",
    chapter: "settings",
    title: "關於頁內容",
    target: "#settingsDetailBody .settings-sub-list",
    settingsPage: "about",
    pad: 6,
    lockControls: true,
    lines: [
      "關於頁包含設備資訊、電源資訊、授權資訊與 Library 資訊。",
      "接下來先查看設備資訊。"
    ]
  },
  {
    id: "settingsAboutDeviceOpen",
    chapter: "settings",
    title: "設備資訊",
    target: "#settingsDetailScreen [data-settings-page='aboutDevice']",
    settingsPage: "about",
    pad: 6,
    lines: [
      "設備資訊會顯示廠商型號、韌體版本與硬體狀態。",
      "請點「設備資訊」。"
    ],
    waitText: "等待你進入設備資訊",
    waitFor: "settingsPage:aboutDevice"
  },
  {
    id: "settingsAboutDeviceDetail",
    chapter: "settings",
    title: "查看設備資訊",
    target: "#settingsDetailBody .settings-info-card",
    settingsPage: "aboutDevice",
    pad: 6,
    lockControls: true,
    lines: [
      "這裡可以確認廠商型號與韌體版本。",
      "BLE 下方會顯示 IMU 狀態；目前 IMU 顯示停用。"
    ]
  },
  {
    id: "settingsAboutDeviceBack",
    chapter: "settings",
    title: "返回關於頁",
    target: "#homeHitbox",
    settingsPage: "aboutDevice",
    pad: 12,
    lines: [
      "請從底部白線向上滑，回到關於頁。"
    ],
    waitText: "等待你返回關於頁",
    waitFor: "settingsPage:about"
  },
  {
    id: "settingsBatteryOpen",
    chapter: "settings",
    title: "電源資訊",
    target: "#settingsDetailScreen [data-settings-page='battery']",
    settingsPage: "about",
    pad: 6,
    lines: [
      "電源資訊會顯示電量、USB/VBUS 與電源狀態。",
      "請點「電源資訊」。"
    ],
    waitText: "等待你進入電源資訊",
    waitFor: "settingsPage:battery"
  },
  {
    id: "settingsBatteryDetail",
    chapter: "settings",
    title: "查看電源資訊",
    target: "#settingsDetailBody .settings-info-card",
    settingsPage: "battery",
    pad: 6,
    lockControls: true,
    lines: [
      "這裡可以確認目前電量、是否充電與電壓資訊。",
      "充電時 VBUS 相關欄位會顯示接入狀態。"
    ]
  },
  {
    id: "settingsBatteryBack",
    chapter: "settings",
    title: "返回關於頁",
    target: "#homeHitbox",
    settingsPage: "battery",
    pad: 12,
    lines: [
      "請從底部白線向上滑，回到關於頁。"
    ],
    waitText: "等待你返回關於頁",
    waitFor: "settingsPage:about"
  },
  {
    id: "settingsDevicePowerOpen",
    chapter: "settings",
    title: "系統控制",
    target: "#settingsScreen [data-settings-page='devicePower']",
    pad: 6,
    lines: [
      "系統控制包含重新開機、重設設定與關機。",
      "請點「系統控制」進入頁面。"
    ],
    waitText: "等待你進入系統控制",
    waitFor: "settingsPage:devicePower"
  },
  {
    id: "settingsDevicePowerMenu",
    chapter: "settings",
    title: "系統控制項目",
    target: "#settingsDetailBody .settings-sub-list",
    settingsPage: "devicePower",
    pad: 6,
    lockControls: true,
    lines: [
      "重新開機會重新啟動手錶。",
      "關機會直接關閉裝置；重設設定會進入確認流程。"
    ]
  },
  {
    id: "settingsFactoryResetOpen",
    chapter: "settings",
    title: "重設設定",
    target: "#settingsDetailScreen [data-settings-page='factoryReset']",
    settingsPage: "devicePower",
    pad: 6,
    lines: [
      "重設設定會清除設定與 BBP 相關資料，時間保留。",
      "請點「重設設定」查看確認頁。"
    ],
    waitText: "等待你進入重設設定",
    waitFor: "settingsPage:factoryReset"
  },
  {
    id: "settingsFactoryResetDetail",
    chapter: "settings",
    title: "重設確認",
    target: "#factoryResetBtn",
    settingsPage: "factoryReset",
    pad: 6,
    lockControls: true,
    lines: [
      "正式重設前會再跳出確認視窗。",
      "教學只介紹位置，不會要求你真的執行重設。"
    ]
  },
  {
    id: "settingsFactoryResetBack",
    chapter: "settings",
    title: "返回系統控制",
    target: "#homeHitbox",
    settingsPage: "factoryReset",
    pad: 12,
    lines: [
      "請從底部白線向上滑，回到系統控制頁。"
    ],
    waitText: "等待你返回系統控制",
    waitFor: "settingsPage:devicePower"
  },
  {
    id: "settingsMainReturn",
    chapter: "settings",
    title: "回到設定主頁",
    target: "#homeHitbox",
    settingsPage: "devicePower",
    pad: 12,
    lines: [
      "最後再從底部白線向上滑，回到設定主頁。",
      "熟悉這個返回手勢後，就能在各設定頁之間自由操作。"
    ],
    waitText: "等待你返回設定主頁",
    waitFor: "settingsMain"
  },
  {
    id: "settingsComplete",
    chapterComplete: "settings",
    title: "第三章完成",
    target: "",
    lines: [
      "你已完成設定頁的深入教學。",
      "全部章節完成後，就可以結束教學。"
    ]
  }
];

function updateViewportScale() {
  const shell = $("watchShell");
  if (!shell) return;
  const viewport = window.visualViewport || window;
  const vw = viewport.width || window.innerWidth || WATCH_STAGE_W;
  const vh = viewport.height || window.innerHeight || SCREEN_H;
  const mobileLayout = window.matchMedia("(max-width: 760px)").matches;

  if (!mobileLayout) {
    const desktopMaxScale = vw >= 1240 && vh >= 700 ? 1.18 : (vw >= 1040 && vh >= 600 ? 1.12 : 1);
    const desktopMinScale = vh < 620 || vw < 900 ? 0.78 : 0.86;
    const layout = document.querySelector(".layout");
    const bodyStyle = window.getComputedStyle(document.body);
    const layoutStyle = layout ? window.getComputedStyle(layout) : null;
    const stageStyle = window.getComputedStyle(shell.parentElement || shell);
    const title = document.querySelector(".sim-title");
    const bodyReserve =
      (parseFloat(bodyStyle.paddingTop) || 0) +
      (parseFloat(bodyStyle.paddingBottom) || 0);
    const bodyHorizontalReserve =
      (parseFloat(bodyStyle.paddingLeft) || 0) +
      (parseFloat(bodyStyle.paddingRight) || 0);
    const layoutGap = layoutStyle ? (parseFloat(layoutStyle.columnGap || layoutStyle.gap) || 30) : 30;
    const titleReserve = title ? title.getBoundingClientRect().height : 24;
    const stageGap = parseFloat(stageStyle.rowGap || stageStyle.gap) || 22;
    const frameShadowReserve = 56;
    const verticalReserve = bodyReserve + titleReserve + stageGap + frameShadowReserve;
    const panelMinWidth = 340;
    const widthAllowance = Math.max(desktopMinScale, (vw - bodyHorizontalReserve - layoutGap - panelMinWidth) / WATCH_STAGE_W);
    const heightAllowance = Math.max(desktopMinScale, (vh - verticalReserve) / SCREEN_H);
    let scale = Math.min(desktopMaxScale, widthAllowance, heightAllowance);
    scale = Math.max(desktopMinScale, Math.min(desktopMaxScale, scale));
    const stageWidth = Math.ceil(WATCH_STAGE_W * scale);
    const screenWidth = Math.ceil(SCREEN_W * scale);
    const panelWidth = Math.min(560, Math.max(panelMinWidth, Math.floor(vw - bodyHorizontalReserve - layoutGap - stageWidth)));
    const screenCenterShift = Math.max(0, Math.round((stageWidth - screenWidth) / 2));
    document.documentElement.style.setProperty("--watch-scale", scale.toFixed(4));
    document.documentElement.style.setProperty("--watch-stage-layout-w", stageWidth + "px");
    document.documentElement.style.setProperty("--watch-panel-layout-w", screenWidth + "px");
    document.documentElement.style.setProperty("--watch-screen-layout-w", screenWidth + "px");
    document.documentElement.style.setProperty("--watch-screen-center-shift", screenCenterShift + "px");
    shell.style.width = stageWidth + "px";
    shell.style.height = Math.ceil(SCREEN_H * scale) + "px";
    document.documentElement.style.setProperty("--tutorial-panel-layout-w", panelWidth + "px");
    return;
  }

  const availableW = Math.max(260, vw - 20);
  const tutorialFocus = !!(state.tutorialActive && state.tutorialOpen && !state.tutorialDone);
  const tutorialPanelReserve = MOBILE_TUTORIAL_PANEL_H;
  const tutorialRailReserve = MOBILE_TUTORIAL_PANEL_H + MOBILE_TUTORIAL_CONTROL_RESERVE_H + MOBILE_TUTORIAL_RAIL_GAP;
  document.documentElement.style.setProperty("--tutorial-mobile-panel-h", tutorialPanelReserve + "px");
  document.documentElement.style.setProperty("--tutorial-mobile-control-reserve-h", MOBILE_TUTORIAL_CONTROL_RESERVE_H + "px");
  document.documentElement.style.setProperty("--tutorial-mobile-rail-gap", MOBILE_TUTORIAL_RAIL_GAP + "px");
  document.documentElement.style.setProperty("--tutorial-mobile-rail-h", tutorialRailReserve + "px");
  document.body?.style.setProperty("--tutorial-mobile-panel-h", tutorialPanelReserve + "px");
  document.body?.style.setProperty("--tutorial-mobile-control-reserve-h", MOBILE_TUTORIAL_CONTROL_RESERVE_H + "px");
  document.body?.style.setProperty("--tutorial-mobile-rail-gap", MOBILE_TUTORIAL_RAIL_GAP + "px");
  document.body?.style.setProperty("--tutorial-mobile-rail-h", tutorialRailReserve + "px");
  const compactMaxScale = tutorialFocus ? 0.66 : 0.88;
  const widthScale = Math.min(compactMaxScale, availableW / WATCH_STAGE_W);
  const titleReserve = tutorialFocus ? 34 : 44;
  const railReserve = tutorialFocus ? tutorialRailReserve : 118;
  const verticalReserve = 18 + titleReserve + railReserve;
  const heightScale = Math.min(compactMaxScale, Math.max(0.42, (vh - verticalReserve) / SCREEN_H));
  const shouldFitHeight = tutorialFocus || vw > vh || vh < 620;
  let scale = shouldFitHeight ? Math.min(widthScale, heightScale) : widthScale;
  const minScale = tutorialFocus ? 0.42 : 0.5;
  scale = widthScale < minScale ? widthScale : Math.max(minScale, Math.min(compactMaxScale, scale));
  const stageWidth = Math.ceil(WATCH_STAGE_W * scale);
  const screenWidth = Math.ceil(SCREEN_W * scale);
  const screenCenterShift = Math.max(0, Math.round((stageWidth - screenWidth) / 2));
  const panelWidth = tutorialFocus ? availableW : Math.min(availableW, Math.max(screenWidth, Math.min(320, availableW)));
  document.documentElement.style.setProperty("--watch-scale", scale.toFixed(4));
  document.documentElement.style.setProperty("--watch-stage-layout-w", stageWidth + "px");
  document.documentElement.style.setProperty("--watch-panel-layout-w", Math.ceil(panelWidth) + "px");
  document.documentElement.style.setProperty("--watch-screen-layout-w", screenWidth + "px");
  document.documentElement.style.setProperty("--watch-screen-center-shift", screenCenterShift + "px");
  shell.style.width = stageWidth + "px";
  shell.style.height = Math.ceil(SCREEN_H * scale) + "px";
}

function autoSleepSeconds() {
  return OFFTIME_SECONDS[state.offTimeIndex] ?? OFFTIME_SECONDS[0];
}

function setScreenDimmed(dimmed) {
  state.screenDimmed = dimmed;
  $("sleepOverlay")?.classList.toggle("active", dimmed);
}

function shouldHoldAwakeForBbp() {
  return state.screen === "bbp";
}

function shouldHoldAwakeForTutorial() {
  if (!state.tutorialActive || !state.tutorialOpen || state.tutorialDone) return false;
  const sleepStepIndex = tutorialSteps.findIndex((step) => step.id === "settingsSleepDetail");
  return sleepStepIndex < 0 || state.tutorialStep <= sleepStepIndex;
}

function shouldFreezeBatteryDrainForTutorial() {
  if (!state.tutorialActive || state.tutorialDone) return false;
  const step = currentTutorialStep();
  if (step?.chapter !== "powerBasics") return false;
  const chargeStepIndex = tutorialSteps.findIndex((item) => item.id === "chargePortUse");
  return chargeStepIndex >= 0 && state.tutorialStep < chargeStepIndex;
}

function noteUserActivity() {
  state.lastActivityAt = performance.now();
  if (state.screenDimmed) setScreenDimmed(false);
}

function updateAutoSleep() {
  if (state.screen === "off" || state.screen === "boot") {
    if (state.screenDimmed) setScreenDimmed(false);
    return;
  }
  if (shouldHoldAwakeForTutorial()) {
    noteUserActivity();
    if (state.screenDimmed) setScreenDimmed(false);
    return;
  }
  if (shouldHoldAwakeForBbp()) {
    noteUserActivity();
    return;
  }
  const seconds = autoSleepSeconds();
  if (seconds <= 0) {
    if (state.screenDimmed) setScreenDimmed(false);
    return;
  }
  if (!state.lastActivityAt) state.lastActivityAt = performance.now();
  if (!state.screenDimmed && performance.now() - state.lastActivityAt >= seconds * 1000) {
    setScreenDimmed(true);
  }
}

function setPage(page) {
  state.page = page;
  const activeIdx = pageOrder.indexOf(page);
  for (const key of pageOrder) {
    const el = $(pageEls[key]);
    const idx = pageOrder.indexOf(key);
    el.classList.toggle("active", key === page);
    el.classList.toggle("before", idx < activeIdx);
    el.classList.toggle("after", idx > activeIdx);
  }
  renderClock();
  renderDebug();
}

function showScreen(screenName) {
  state.screen = screenName;
  noteUserActivity();
  document.querySelector(".screen")?.classList.toggle("watch-face-active", screenName === "watch");
  Object.entries(screenEls).forEach(([key, id]) => {
    const el = $(id);
    if (!el) return;
    const active = key === screenName;
    el.classList.toggle("active", active);
    el.classList.remove("from-top", "from-bottom");
    if (!active) el.classList.add(key === "bbp" ? "from-bottom" : "from-top");
  });
  $("homeHitbox").classList.toggle("hidden", screenName === "boot" || screenName === "off");
  renderDebug();
}

function hasDisplayPower() {
  return state.batteryPct > 0 || state.isCharging;
}

function enterWatch() {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  showScreen("watch");
  render();
}

function enterMenu() {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  showScreen("menu");
  render();
}

function enterSettings() {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  if (state.screen === "boot" || state.screen === "off") return;
  state.settingsPage = "";
  state.settingsSavedText = "";
  state.factoryResetConfirm = false;
  pulseSideButton("bottom");
  showScreen("settings");
  render();
}

function openSettingsPage(page) {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  if (!settingsPageDefs[page]) return;
  if (disabledSettingsPages.has(page)) return;
  if (page === "time") seedSettingsTimeDraft();
  if (page === "date") seedSettingsDateDraft();
  state.settingsPage = page;
  state.settingsSavedText = "";
  state.factoryResetConfirm = false;
  showScreen("settingsDetail");
  render();
}

function backFromSettingsDetail() {
  const page = state.settingsPage;
  const parent = settingsPageDefs[page]?.parent || "settings";
  state.settingsSavedText = "";
  state.factoryResetConfirm = false;
  if (parent === "settings") {
    state.settingsPage = "";
    showScreen("settings");
  } else {
    state.settingsPage = parent;
    showScreen("settingsDetail");
  }
  render();
}

function enterBbp(mode = "solo") {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  state.bbpMode = mode === "sim" ? "sim" : "solo";
  resetBbpRuntimeState();
  if (state.bbpMode === "sim") resetSimRuntimeState(true);
  showScreen("bbp");
  setPage("scan");
  render();
}

function exitToMenu() {
  if (state.screen === "bbp" || state.connected || state.mode === "connect_pending" || state.disconnecting) {
    resetBbpRuntimeState();
    state.bbpMode = "solo";
    setPage("scan");
  }
  showScreen("menu");
  render();
}

function setMode(mode) {
  state.mode = mode;
  render();
}

function clearScanTimers() {
  clearTimeout(state.scanTimer);
  clearTimeout(state.connectTimer);
  state.scanTimer = 0;
  state.connectTimer = 0;
}

function clearAllTimers() {
  clearScanTimers();
  clearTimeout(state.attachTimer);
  clearTimeout(state.disconnectTimer);
  clearTimeout(state.bbpIdleTimer);
  clearTimeout(state.shotTimer);
  clearTimeout(state.simBatchTimer);
  clearTimeout(state.bootTimer);
  state.attachTimer = 0;
  state.disconnectTimer = 0;
  state.bbpIdleTimer = 0;
  state.shotTimer = 0;
  state.simBatchTimer = 0;
  state.bootTimer = 0;
  clearInterval(state.rpmTimer);
  state.rpmTimer = 0;
}

function clearPowerButtonHold() {
  clearTimeout(powerButtonHoldTimer);
  powerButtonHoldTimer = 0;
}

function clearBbpRuntimeTimers() {
  clearScanTimers();
  clearTimeout(state.attachTimer);
  clearTimeout(state.disconnectTimer);
  clearTimeout(state.bbpIdleTimer);
  clearTimeout(state.shotTimer);
  clearTimeout(state.simBatchTimer);
  state.attachTimer = 0;
  state.disconnectTimer = 0;
  state.bbpIdleTimer = 0;
  state.shotTimer = 0;
  state.simBatchTimer = 0;
  clearInterval(state.rpmTimer);
  state.rpmTimer = 0;
}

function clearBbpFlags() {
  state.isAttached = false;
  state.isCalculating = false;
  state.disconnecting = false;
  state.lastDone = false;
}

function resetSimRuntimeState(enabled = true) {
  state.simEnabled = enabled;
  state.simShots = 0;
  state.simPhase = enabled ? "pair_wait" : "disabled";
  state.simTxCount = 0;
  state.simLastWriteCmd = "--";
  state.simPairPressCount = 0;
  state.simPairConfirmed = false;
  state.simBatchActive = false;
  state.simBatchDone = 0;
  state.simBatchTarget = 200;
  clearTimeout(state.simBatchTimer);
  state.simBatchTimer = 0;
}

function resetBbpRuntimeState() {
  clearBbpRuntimeTimers();
  clearBbpFlags();
  resetFirmwareTimer();
  state.mode = "idle";
  state.bbpMode = "solo";
  state.blePhase = "idle";
  state.rows = [];
  state.selected = "";
  state.connected = "";
  state.detail = false;
  state.liveRpm = 0;
}

function isBbpSubscribedLive() {
  return !!state.connected &&
    state.blePhase === "subscribed_live" &&
    !state.disconnecting;
}

function clearBbpIdleDisconnect() {
  clearTimeout(state.bbpIdleTimer);
  state.bbpIdleTimer = 0;
}

function scheduleBbpIdleDisconnect() {
  clearBbpIdleDisconnect();
  if (!isBbpSubscribedLive()) return;
  state.bbpIdleTimer = setTimeout(() => {
    state.bbpIdleTimer = 0;
    if (!isBbpSubscribedLive() || state.isCalculating) {
      scheduleBbpIdleDisconnect();
      return;
    }
    unsubscribeConnected();
  }, BBP_IDLE_DISCONNECT_MS);
}

function noteBbpActivity() {
  if (isBbpSubscribedLive()) scheduleBbpIdleDisconnect();
}

function bleStatusText(mac = activeMac()) {
  const suffix = mac ? ` ${mac}` : "";
  switch (state.blePhase) {
    case "scanning":
      return "掃描中...";
    case "scan_result":
      return `找到 ${state.rows.length} 個積分器`;
    case "selected":
      return `已選擇${suffix}`;
    case "connect_pending":
    case "gatt_connecting":
    case "service_discovery":
    case "subscribing_notify":
      return `連接中${suffix}`;
    case "subscribed_live":
      return "已連接";
    case "unsubscribe_pending":
    case "disconnecting":
      return "斷線中";
    case "disconnected":
      return "";
    default:
      return "";
  }
}

function connectButtonText() {
  return "連接中";
}

function bleStageKey() {
  switch (state.blePhase) {
    case "scanning":
    case "scan_result":
      return "scan";
    case "selected":
      return "select";
    case "connect_pending":
    case "gatt_connecting":
      return "gatt";
    case "service_discovery":
      return "service";
    case "subscribing_notify":
      return "notify";
    case "subscribed_live":
      return "live";
    case "unsubscribe_pending":
    case "disconnecting":
    case "disconnected":
      return "close";
    default:
      return "";
  }
}

function blePhaseLabel() {
  switch (state.blePhase) {
    case "idle":
      return "待機";
    case "scanning":
      return "掃描中";
    case "scan_result":
      return "掃描完成";
    case "selected":
      return "已選取 MAC";
    case "connect_pending":
    case "gatt_connecting":
    case "service_discovery":
    case "subscribing_notify":
      return "連接中";
    case "subscribed_live":
      return "已連接";
    case "unsubscribe_pending":
    case "disconnecting":
      return "斷線中";
    case "disconnected":
      return "已斷線";
    default:
      return state.blePhase || "待機";
  }
}

function bbpStateName() {
  if (state.disconnecting) return state.blePhase || "disconnecting";
  if (state.connected) {
    if (state.isCalculating) return "calculating";
    if (state.isAttached) return "attached";
    const phase = state.blePhase || "subscribed_live";
    return state.lastDone ? `${phase}(done_ui)` : phase;
  }
  if (state.mode === "connect_pending") return state.blePhase || "connect_pending";
  if (state.selected) return state.blePhase || "selected";
  if (state.mode === "scanning") return state.blePhase || "scanning";
  if (state.mode === "found") return "scan_result";
  if (state.blePhase === "disconnected") return "disconnected";
  return "idle";
}

function buildProfilePoints(peak) {
  return profileShape.map((ratio) => Math.max(0, Math.round(peak * ratio)));
}

function buildPhaseRows(peak) {
  return [
    { name: phaseNames[0], time: "0-180", rpm: Math.round(peak * 0.48) },
    { name: phaseNames[1], time: "180-520", rpm: Math.round(peak * 0.84) },
    { name: phaseNames[2], time: "520-760", rpm: peak },
    { name: phaseNames[3], time: "760-1800", rpm: Math.round(peak * 0.46) }
  ];
}

function seedHistory(target) {
  const peak = target.max || 6800;
  state.history = [
    { ana: peak, bbp: Math.round(peak * 0.95) },
    { ana: Math.round(peak * 0.91), bbp: Math.round(peak * 0.88) },
    { ana: Math.round(peak * 0.84), bbp: Math.round(peak * 0.82) },
    { ana: Math.round(peak * 0.78), bbp: Math.round(peak * 0.75) },
    { ana: Math.round(peak * 0.69), bbp: Math.round(peak * 0.66) }
  ];
  state.profilePoints = buildProfilePoints(peak);
  state.phaseRows = buildPhaseRows(peak);
}

function startScan() {
  clearAllTimers();
  showScreen("bbp");
  state.blePhase = "scanning";
  state.rows = [];
  state.selected = "";
  state.connected = "";
  clearBbpFlags();
  state.detail = false;
  state.liveRpm = 0;
  resetFirmwareTimer();
  setPage("scan");
  setMode("scanning");
  state.scanTimer = setTimeout(() => {
    state.rows = devices.slice().sort((a, b) => b.rssi - a.rssi);
    const suppressBoundSelect = state.tutorialActive &&
      !state.tutorialDone &&
      currentTutorialStep()?.chapter === "mode";
    if (!suppressBoundSelect && state.bound && state.rows.some((item) => item.mac === state.bound)) {
      state.selected = state.bound;
    }
    state.detail = false;
    state.blePhase = state.selected ? "selected" : "scan_result";
    setMode(state.selected ? "selected" : "found");
  }, 900);
}

function selectMac(mac) {
  if (!mac) return;
  if (state.disconnecting || state.mode === "connect_pending") return;
  if (state.connected === mac || state.selected === mac) {
    state.detail = !state.detail;
    render();
    return;
  }
  state.selected = mac;
  state.blePhase = "selected";
  state.detail = false;
  if (state.mode === "scanning") clearTimeout(state.scanTimer);
  setMode("selected");
}

function connectSelected() {
  if (state.disconnecting) return;
  if (!state.selected) {
    startScan();
    return;
  }
  clearAllTimers();
  resetFirmwareTimer();
  showScreen("bbp");
  state.detail = false;
  clearBbpFlags();
  state.blePhase = "connect_pending";
  setMode("connect_pending");
  const targetMac = state.selected;
  const stages = [
    { phase: "gatt_connecting", delay: 260 },
    { phase: "service_discovery", delay: 320 },
    { phase: "subscribing_notify", delay: 320 }
  ];
  const runStage = (idx) => {
    if (state.disconnecting || state.selected !== targetMac || state.mode !== "connect_pending") return;
    if (idx >= stages.length) {
      const target = devices.find((item) => item.mac === targetMac) || devices[0];
      state.connected = target.mac;
      state.selected = target.mac;
      state.liveMax = target.max;
      state.liveAvg = Math.round(target.max * 0.72);
      state.liveMin = Math.round(target.max * 0.38);
      state.liveShots = target.shots;
      state.shotPeak = target.max || 7200;
      resetFirmwareTimer();
      state.blePhase = "subscribed_live";
      seedHistory(target);
      setPage("live");
      setMode("connected");
      scheduleBbpIdleDisconnect();
      return;
    }
    state.blePhase = stages[idx].phase;
    render();
    state.connectTimer = setTimeout(() => runStage(idx + 1), stages[idx].delay);
  };
  state.connectTimer = setTimeout(() => runStage(0), 220);
}

function startRpm() {
  clearInterval(state.rpmTimer);
  stopFirmwareTimer();
  state.isAttached = false;
  state.isCalculating = true;
  state.lastDone = false;
  state.mode = "calculating";
  state.liveRpm = 0;
  const rpmStart = performance.now();
  state.rpmTimer = setInterval(() => {
    const elapsed = (performance.now() - rpmStart) / 1000;
    const peak = state.shotPeak || 7200;
    const decay = Math.max(0, peak - elapsed * Math.max(420, peak / 9));
    const ripple = Math.sin(elapsed * 4.2) * Math.max(180, peak * 0.055);
    state.liveRpm = Math.max(0, Math.round(decay + ripple));
    if (state.liveRpm > state.liveMax) state.liveMax = state.liveRpm;
    if (state.liveRpm > 0) {
      state.liveAvg = Math.round((state.liveAvg * 0.9) + (state.liveRpm * 0.1));
      state.liveMin = state.liveMin ? Math.min(state.liveMin, state.liveRpm) : state.liveRpm;
    }
    if (elapsed > 10 || state.liveRpm <= 0) {
      state.liveRpm = 0;
      state.isCalculating = false;
      state.lastDone = true;
      state.mode = "connected";
      clearInterval(state.rpmTimer);
      state.rpmTimer = 0;
      startFirmwareTimer();
    }
    render();
  }, 120);
}

function recordShotMetrics(forcedPeak = 0) {
  const swing = ((state.liveShots % 5) - 2) * 260;
  const base = state.liveMax || state.shotPeak || 7200;
  const peak = Math.max(2800, Math.round(forcedPeak || (base + swing + 220)));
  state.liveShots += 1;
  state.shotPeak = peak;
  state.liveMax = Math.max(state.liveMax, peak);
  state.liveAvg = Math.round((state.liveAvg * 0.65) + (peak * 0.35));
  state.liveMin = state.liveMin ? Math.min(state.liveMin, Math.round(peak * 0.35)) : Math.round(peak * 0.35);
  state.history.unshift({ ana: peak, bbp: Math.round(peak * 0.94) });
  state.history = state.history.slice(0, 5);
  state.profilePoints = buildProfilePoints(peak);
  state.phaseRows = buildPhaseRows(peak);
  return peak;
}

function toggleBeybladeAttached() {
  if (state.disconnecting || state.mode === "connect_pending" || state.isCalculating) return;
  if (!state.connected || state.blePhase !== "subscribed_live") return;
  noteBbpActivity();
  showScreen("bbp");
  clearTimeout(state.shotTimer);
  state.shotTimer = 0;
  state.lastDone = false;
  state.liveRpm = 0;
  stopFirmwareTimer();
  if (state.isAttached) {
    state.isAttached = false;
    state.mode = "connected";
  } else {
    state.isAttached = true;
    state.mode = "attached";
  }
  render();
}

function fireBeyblade() {
  if (state.disconnecting || state.mode === "connect_pending" || state.isCalculating) return;
  if (!state.connected || state.blePhase !== "subscribed_live") return;
  noteBbpActivity();
  showScreen("bbp");
  if (!state.isAttached) {
    render();
    return;
  }
  clearTimeout(state.shotTimer);
  const peak = randomLaunchPeak();
  stopFirmwareTimer();
  state.isAttached = false;
  state.isCalculating = true;
  state.lastDone = false;
  state.mode = "calculating";
  state.liveRpm = peak;
  state.shotPeak = peak;
  state.profilePoints = buildProfilePoints(peak);
  state.phaseRows = buildPhaseRows(peak);
  render();
  state.shotTimer = setTimeout(() => {
    recordShotMetrics(peak);
    state.isCalculating = false;
    state.lastDone = true;
    state.mode = "connected";
    state.liveRpm = peak;
    startFirmwareTimer();
    scheduleBbpIdleDisconnect();
    state.shotTimer = 0;
    render();
  }, 900);
}

function simulateShot() {
  fireBeyblade();
}

function unsubscribeConnected() {
  const shouldAnimate = !!state.connected || state.mode === "connect_pending";
  if (!shouldAnimate) return false;
  const wasSubscribed = !!state.connected;
  clearAllTimers();
  state.isAttached = false;
  state.isCalculating = false;
  state.lastDone = false;
  state.liveRpm = 0;
  resetFirmwareTimer();
  state.disconnecting = true;
  state.detail = false;
  state.blePhase = wasSubscribed ? "unsubscribe_pending" : "disconnecting";
  showScreen("bbp");
  setPage("scan");
  setMode("disconnecting");
  state.disconnectTimer = setTimeout(() => {
    state.blePhase = "disconnecting";
    render();
    state.disconnectTimer = setTimeout(() => {
      state.disconnecting = false;
      state.connected = "";
      state.selected = "";
      state.rows = [];
      state.detail = false;
      state.blePhase = "disconnected";
      setPage("scan");
      setMode("idle");
    }, 360);
  }, wasSubscribed ? 360 : 120);
  return true;
}

function disconnect() {
  if (unsubscribeConnected()) return;
  clearAllTimers();
  state.isAttached = false;
  state.isCalculating = false;
  state.lastDone = false;
  state.liveRpm = 0;
  resetFirmwareTimer();
  state.connected = "";
  state.selected = "";
  state.rows = [];
  state.detail = false;
  state.disconnecting = false;
  state.blePhase = "disconnected";
  setPage("scan");
  setMode("idle");
}

function enterPowerOff() {
  pauseRuntimeSession();
  clearAllTimers();
  clearPowerButtonHold();
  clearTimeout(sideButtonPulseTimer);
  sideButtonPulseTimer = 0;
  clearBbpFlags();
  resetFirmwareTimer();
  state.mode = "idle";
  state.bbpMode = "solo";
  state.blePhase = "idle";
  state.rows = [];
  state.selected = "";
  state.connected = "";
  state.detail = false;
  state.liveRpm = 0;
  state.bootPct = 0;
  state.swipeActive = false;
  state.homeTracking = false;
  $("settingsSideButton")?.classList.remove("pressed");
  showScreen("off");
  setPage("scan");
  renderBatteryState();
  renderSimControls();
  renderDebug();
  renderTutorial();
}

function startBootSequence() {
  if (!hasDisplayPower()) {
    powerOffByBattery();
    return;
  }
  clearAllTimers();
  startRuntimeSession();
  resetFirmwareTimer();
  state.bootPct = 0;
  showScreen("boot");
  render();
  const step = () => {
    state.bootPct = Math.min(100, state.bootPct + 10);
    renderBoot();
    if (state.bootPct < 100) {
      state.bootTimer = setTimeout(step, 120);
      return;
    }
    state.bootTimer = setTimeout(() => {
      state.bootTimer = 0;
      enterWatch();
    }, 140);
  };
  state.bootTimer = setTimeout(step, 120);
}

function resetAll() {
  clearAllTimers();
  pauseRuntimeSession();
  clearStoredRuntimeTotal();
  state.screen = "off";
  state.page = "scan";
  state.settingsPage = "";
  state.mode = "idle";
  state.bbpMode = "solo";
  state.blePhase = "idle";
  state.bootPct = 0;
  state.rows = [];
  state.selected = "";
  state.bound = "";
  state.connected = "";
  clearBbpFlags();
  state.detail = false;
  state.analyzerMode = true;
  state.histShowAna = true;
  state.profileDetail = false;
  state.timeCardTimerMode = false;
  state.timeFormat12h = false;
  state.brightnessPct = 72;
  state.offTimeIndex = 0;
  state.volumePct = 60;
  state.motorEnabled = true;
  state.motorTesting = false;
  state.settingsSavedText = "";
  state.settingsTimeHour24 = null;
  state.settingsTimeMinute = null;
  state.settingsDateYear = null;
  state.settingsDateMonth = null;
  state.settingsDateDay = null;
  state.isCharging = false;
  state.batteryPct = 72;
  state.batteryLastAt = performance.now();
  state.liveRpm = 0;
  state.liveMax = 0;
  state.liveAvg = 0;
  state.liveMin = 0;
  state.liveShots = 0;
  state.shotPeak = 7200;
  state.statMode = 0;
  state.bootStartedAt = 0;
  state.totalRuntimeBaseMs = 0;
  state.runtimeLastSaveAt = performance.now();
  resetFirmwareTimer();
  state.history = [];
  state.profilePoints = defaultProfile.slice();
  state.phaseRows = [];
  resetSimRuntimeState(true);
  enterPowerOff();
  render();
}

function formatClock(date, useConfiguredFormat = true) {
  const hour = date.getHours();
  const minute = pad2(date.getMinutes());
  if (useConfiguredFormat && state.timeFormat12h) {
    const suffix = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${pad2(hour12)}:${minute} ${suffix}`;
  }
  return `${pad2(hour)}:${minute}`;
}

function currentElapsedMs() {
  if (!state.timerStart) return state.timerElapsedMs;
  return Math.max(0, state.timerElapsedMs + Math.round(performance.now() - state.timerStart));
}

function loadStoredRuntimeTotal() {
  try {
    const value = Number(localStorage.getItem(RUNTIME_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
  } catch (_) {
    return 0;
  }
}

function persistRuntimeTotal(totalMs) {
  try {
    localStorage.setItem(RUNTIME_STORAGE_KEY, String(Math.max(0, Math.round(totalMs))));
  } catch (_) {
    // localStorage can be unavailable in strict browser privacy modes.
  }
}

function clearStoredRuntimeTotal() {
  try {
    localStorage.removeItem(RUNTIME_STORAGE_KEY);
  } catch (_) {
    // Keep the simulator usable even if storage is blocked.
  }
}

function loadTutorialDone() {
  try {
    return localStorage.getItem(TUTORIAL_STORAGE_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function persistTutorialDone(done) {
  try {
    if (done) {
      localStorage.setItem(TUTORIAL_STORAGE_KEY, "1");
    } else {
      localStorage.removeItem(TUTORIAL_STORAGE_KEY);
    }
  } catch (_) {
    // The tutorial still works for this session if storage is blocked.
  }
}

function currentUptimeMs(now = performance.now()) {
  if (!state.bootStartedAt) return 0;
  return Math.max(0, Math.round(now - state.bootStartedAt));
}

function currentTotalRuntimeMs(now = performance.now()) {
  return Math.max(0, Math.round(state.totalRuntimeBaseMs + currentUptimeMs(now)));
}

function formatUptimeMs(ms) {
  let sec = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(sec / 86400);
  sec %= 86400;
  const hours = Math.floor(sec / 3600);
  sec %= 3600;
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  const text = `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
  return days > 0 ? `${days}d ${text}` : text;
}

function formatHistoricalRuntimeMs(ms) {
  return `${Math.floor(Math.max(0, ms) / 3600000)}小時`;
}

function startRuntimeSession() {
  const now = performance.now();
  if (state.bootStartedAt) {
    state.totalRuntimeBaseMs = currentTotalRuntimeMs(now);
    persistRuntimeTotal(state.totalRuntimeBaseMs);
  }
  state.bootStartedAt = now;
  state.runtimeLastSaveAt = now;
}

function pauseRuntimeSession() {
  if (!state.bootStartedAt) return;
  state.totalRuntimeBaseMs = currentTotalRuntimeMs();
  state.bootStartedAt = 0;
  state.runtimeLastSaveAt = performance.now();
  persistRuntimeTotal(state.totalRuntimeBaseMs);
}

function maybePersistRuntimeTotal() {
  if (!state.bootStartedAt) return;
  const now = performance.now();
  if ((now - state.runtimeLastSaveAt) < RUNTIME_SAVE_INTERVAL_MS) return;
  state.runtimeLastSaveAt = now;
  persistRuntimeTotal(currentTotalRuntimeMs(now));
}

function updateRuntimeInfoRows() {
  const uptimeEl = $("runtimeUptimeValue");
  const totalEl = $("runtimeTotalValue");
  if (uptimeEl) uptimeEl.textContent = formatUptimeMs(currentUptimeMs());
  if (totalEl) totalEl.textContent = formatHistoricalRuntimeMs(currentTotalRuntimeMs());
}

function resetFirmwareTimer() {
  state.timerStart = 0;
  state.timerElapsedMs = 0;
}

function startFirmwareTimer() {
  state.timerElapsedMs = 0;
  state.timerStart = performance.now();
}

function stopFirmwareTimer() {
  if (state.timerStart) {
    state.timerElapsedMs = currentElapsedMs();
  }
  state.timerStart = 0;
}

function canStopTimerFromGpio() {
  return state.screen === "bbp" &&
    !!state.connected &&
    state.blePhase === "subscribed_live" &&
    !!state.timerStart &&
    !state.isCalculating &&
    !state.disconnecting;
}

function stopTimerFromGpio() {
  if (!canStopTimerFromGpio()) return;
  stopFirmwareTimer();
  render();
}

function formatElapsed(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const centi = Math.floor((ms % 1000) / 10);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(centi).padStart(2, "0")}`;
}

function applyDayTheme() {
  const day = new Date().getDay();
  if (dayThemeCache === day) return;
  document.documentElement.style.setProperty("--day-border", dayColors[day]);
  dayThemeCache = day;
}

function renderBoot() {
  $("bootPct").textContent = `${state.bootPct}%`;
  $("bootBarFill").style.width = `${state.bootPct}%`;
}

function formatWatchDate(date) {
  const dayNames = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
  return `${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, "0")} / ${String(date.getDate()).padStart(2, "0")} / ${dayNames[date.getDay()]}`;
}

function renderWatch() {
  const now = new Date();
  const timeText = formatClock(now);
  const dateText = formatWatchDate(now);
  if (watchTimeCache !== timeText) {
    $("watchTime").textContent = timeText;
    watchTimeCache = timeText;
  }
  $("watchTime").classList.toggle("time-12h", state.timeFormat12h);
  if (watchDateCache !== dateText) {
    $("watchDate").textContent = dateText;
    watchDateCache = dateText;
  }
}

function renderClock() {
  applyDayTheme();
  const text = state.timeCardTimerMode ? formatElapsed(currentElapsedMs()) : formatClock(new Date());
  const textChanged = timeCardTextCache !== text;
  const modeChanged = timeCardModeCache !== state.timeCardTimerMode;
  if (textChanged) {
    $("scanBanner").textContent = text;
    $("liveBanner").textContent = text;
    $("histBanner").textContent = text;
    $("profileBanner").textContent = text;
    timeCardTextCache = text;
  }
  document.querySelectorAll(".time-text").forEach((el) => {
    el.classList.toggle("time-12h", state.timeFormat12h && !state.timeCardTimerMode);
  });
  if (modeChanged) {
    document.querySelectorAll(".time-banner").forEach((banner) => {
      banner.classList.toggle("timer-mode", state.timeCardTimerMode);
    });
    timeCardModeCache = state.timeCardTimerMode;
  }
  renderSettingsStatusbar();
}

function renderSettingsStatusbar() {
  const timeText = formatClock(new Date());
  const pct = Math.max(0, Math.min(100, Math.round(state.batteryPct)));
  const battColor = state.isCharging ? "#ff8a00" : pct < 30 ? "#ff3b30" : "#ffffff";
  const battLevelClass = state.isCharging
    ? "charge"
    : pct > 75
      ? "batt-full"
      : pct > 50
        ? "batt-3"
        : pct > 25
          ? "batt-2"
          : pct > 10
            ? "batt-1"
            : "batt-empty";
  const battIconClass = `settings-batt-icon ${battLevelClass}`;
  document.querySelectorAll(".settings-status-time").forEach((el) => {
    el.textContent = timeText;
    el.classList.toggle("time-12h", state.timeFormat12h);
  });
  document.querySelectorAll(".settings-status-batt").forEach((el) => {
    el.style.color = battColor;
    el.innerHTML = `<span class="${battIconClass}" aria-hidden="true"></span><span>${pct}%</span>`;
  });
}

function tickTimeSurfaces() {
  renderWatch();
  renderClock();
  updateBatteryByElapsed();
  updateAutoSleep();
  maybePersistRuntimeTotal();
  updateRuntimeInfoRows();
  const debugTimer = $("debugTimer");
  if (debugTimer) debugTimer.textContent = String(currentElapsedMs());
}

function renderBleRail() {}

function renderMacRows() {
  const list = $("macList");
  if (isBbpSimMode()) {
    list.classList.add("hidden");
    list.innerHTML = "";
    return;
  }
  list.classList.toggle("hidden", state.detail && !!(state.selected || state.connected));
  list.innerHTML = "";
  for (let i = 0; i < 4; i += 1) {
    const item = state.rows[i];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "mac-row";
    if (!item) {
      row.classList.add("empty");
      row.textContent = " ";
    } else {
      const isActive = item.mac === state.selected || item.mac === state.connected;
      row.classList.toggle("selected", isActive);
      const rightText = item.mac === state.connected ? (state.disconnecting ? "斷線中" : "") : `${item.rssi} dBm`;
      row.innerHTML = `<span class="${item.mac.length > 16 ? "long" : ""}">${item.mac}</span><span>${rightText}</span>`;
      row.addEventListener("click", () => selectMac(item.mac));
    }
    list.appendChild(row);
  }
}

function activeMac() {
  return state.connected || state.selected;
}

function activeDevice() {
  const mac = activeMac();
  return devices.find((item) => item.mac === mac) || {};
}

function isBbpSimMode() {
  return state.screen === "bbp" && state.bbpMode === "sim";
}

function randomLaunchPeak() {
  return Math.round((4600 + Math.random() * 5600) / 10) * 10;
}

function launchDiagResultText(peak) {
  if (!peak || peak <= 0) return "--";
  if (peak < 2000) return "低速發射";
  if (peak >= 19000) return "高速發射";
  return "正常發射";
}

function ensureDemoConnected() {
  if (state.connected) return;
  const target = devices.find((item) => item.mac === state.selected) || devices[0];
  state.rows = devices.slice().sort((a, b) => b.rssi - a.rssi);
  state.selected = target.mac;
  state.connected = target.mac;
  state.disconnecting = false;
  state.detail = false;
  state.blePhase = "subscribed_live";
  state.mode = "connected";
  state.liveMax = target.max || 0;
  state.liveAvg = target.max ? Math.round(target.max * 0.72) : 0;
  state.liveMin = target.max ? Math.round(target.max * 0.38) : 0;
  state.liveShots = target.shots || 0;
  state.shotPeak = target.max || 7200;
  resetFirmwareTimer();
  seedHistory(target);
  scheduleBbpIdleDisconnect();
}

function setFittedText(el, text, compactAt, tinyAt = 999) {
  const value = String(text || "");
  el.textContent = value;
  el.classList.toggle("compact", value.length >= compactAt);
  el.classList.toggle("tiny", value.length >= tinyAt);
}

function renderDetail() {
  if (isBbpSimMode()) {
    $("detailPanel").classList.remove("visible");
    return;
  }
  const mac = activeMac();
  const target = activeDevice();
  const visible = state.detail && !!mac;
  $("detailPanel").classList.toggle("visible", visible);
  $("detailMac").textContent = mac || "--";
  $("detailMax").textContent = Math.max(target.max || 0, state.liveMax || 0);
  $("detailShots").textContent = state.connected === mac ? state.liveShots : (target.shots || state.liveShots || 0);
  $("bindBtn").textContent = state.bound === mac ? "移除選定" : "設為選定";
  $("bindBtn").classList.toggle("bound", state.bound === mac);
  $("bindBtn").disabled = !mac;
}

function renderPrimary() {
  const btn = $("primaryBtn");
  btn.disabled = false;
  btn.className = "primary-btn";
  if (isBbpSimMode()) {
    btn.textContent = "模擬模式";
    btn.disabled = true;
    btn.classList.add("disabled-state");
    return;
  }
  if (state.disconnecting) {
    btn.textContent = "斷線中";
    btn.disabled = true;
    btn.classList.add("disabled-state");
  } else if (state.mode === "scanning") {
    btn.textContent = "掃描中";
    btn.disabled = true;
    btn.classList.add("disabled-state");
  } else if (state.mode === "connect_pending") {
    btn.textContent = connectButtonText();
    btn.disabled = true;
    btn.classList.add("disabled-state");
  } else if (state.connected) {
    btn.textContent = "已連接";
    btn.classList.add("linked");
  } else if (state.selected) {
    btn.textContent = "連接";
  } else {
    btn.textContent = "掃描";
  }
}

function renderStatus() {
  setFittedText($("statusLine"), "", 13, 21);
  setFittedText($("hintLine"), "", 16);
}

function rpmColor(rpm) {
  if (rpm < 5000) return "#5f97d1";
  if (rpm < 10000) return "#ffffff";
  if (rpm < 15000) return "#ffd60a";
  return "#ff4d4f";
}

function statValue() {
  switch (state.statMode) {
    case 1:
      return { title: "本機平均速度", value: state.liveAvg };
    case 2:
      return { title: "本機最低速度", value: state.liveMin };
    case 3:
      return { title: "本機發射次", value: state.liveShots };
    default:
      return { title: "本機最大速度", value: state.liveMax };
  }
}

function renderChips() {
  const ready = state.blePhase === "subscribed_live" && !!state.connected && !state.disconnecting && !state.isAttached && !state.isCalculating;
  document.querySelectorAll(".chip.ready").forEach((chip) => chip.classList.toggle("on", ready));
  document.querySelectorAll(".chip.att").forEach((chip) => chip.classList.toggle("on", state.isAttached));
  document.querySelectorAll(".chip.calc").forEach((chip) => chip.classList.toggle("on", state.isCalculating));
}

function liveDiagText() {
  const result = state.lastDone ? launchDiagResultText(state.shotPeak || state.liveMax || state.liveRpm) : "--";
  return `判定: ${result}`;
}

function renderLive() {
  $("modeBbp").classList.toggle("active", !state.analyzerMode);
  $("modeAna").classList.toggle("active", state.analyzerMode);
  const liveBleBtn = $("liveBleBtn");
  liveBleBtn.classList.add("hidden");
  liveBleBtn.classList.remove("closing");
  liveBleBtn.disabled = true;
  liveBleBtn.textContent = "";
  const rpmText = String(state.liveRpm);
  const rpmEl = $("liveRpm");
  rpmEl.textContent = rpmText;
  rpmEl.classList.toggle("long", rpmText.length >= 5);
  rpmEl.classList.toggle("extra-long", rpmText.length >= 6);
  rpmEl.style.color = rpmColor(state.liveRpm);
  const diag = liveDiagText();
  $("diagLabel").textContent = diag;
  $("diagLabel").classList.toggle("compact", diag.length >= 8);
  renderChips();
  const current = statValue();
  $("liveStatTitle").textContent = current.title;
  const statText = String(current.value || 0);
  $("liveStatValue").textContent = statText;
  $("liveStatValue").classList.toggle("long", statText.length >= 5);
}

function renderHistory() {
  $("histHeadValue").textContent = state.histShowAna ? "實際計算速度" : "官方認定速度";
  const rows = $("histRows");
  rows.innerHTML = "";
  for (let i = 0; i < 5; i += 1) {
    const item = state.history[i];
    const row = document.createElement("button");
    row.type = "button";
    row.className = "hist-row";
    const value = item ? (state.histShowAna ? item.ana : item.bbp) : "--";
    const valueText = String(value);
    row.innerHTML = `<span class="hist-no">${String(i + 1).padStart(2, "0")}</span><span class="hist-value${valueText.length >= 5 ? " long" : ""}">${valueText}</span>`;
    row.addEventListener("click", () => {
      state.histShowAna = !state.histShowAna;
      render();
    });
    rows.appendChild(row);
  }
}

function renderProfileChart() {
  const svg = $("profileChartSvg");
  const width = Math.round(svg.clientWidth || 239);
  const height = Math.round(svg.clientHeight || 218);
  const plotLeft = 6;
  const plotRight = 0;
  const plotTop = 8;
  const plotBottom = 12;
  const plotWidth = width - plotLeft - plotRight;
  const plotHeight = height - plotTop - plotBottom;
  const points = state.profilePoints.length ? state.profilePoints : defaultProfile;
  const maxY = 30000;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  const countLabel = $("profileCountLabel");
  if (countLabel) countLabel.textContent = "";
  const stepX = plotWidth / Math.max(1, points.length - 1);
  const mapped = points.map((rpm, idx) => {
    const x = plotLeft + idx * stepX;
    const y = plotTop + (1 - Math.min(maxY, Math.max(0, rpm)) / maxY) * plotHeight;
    return { x, y, rpm };
  });
  const grid = [0, 1, 2, 3, 4, 5, 6].map((idx) => {
    const y = plotTop + idx * (plotHeight / 6);
    return `<line class="grid" x1="${plotLeft}" y1="${y.toFixed(1)}" x2="${width - plotRight}" y2="${y.toFixed(1)}"></line>`;
  }).join("");
  const polyline = mapped.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
  const pointNodes = mapped
    .map((pt) => `<circle class="point" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="2"></circle>`)
    .join("");
  let annotations = "";
  if (state.profileExample && mapped.length) {
    const peak = mapped.reduce((best, pt) => (pt.rpm > best.rpm ? pt : best), mapped[0]);
    const labelX = Math.min(width - 86, peak.x + 8);
    const labelY = Math.max(18, peak.y - 10);
    annotations = [
      `<line class="peak-line" x1="${peak.x.toFixed(1)}" y1="${peak.y.toFixed(1)}" x2="${peak.x.toFixed(1)}" y2="${height - plotBottom}"></line>`,
      `<circle class="peak-dot" cx="${peak.x.toFixed(1)}" cy="${peak.y.toFixed(1)}" r="4"></circle>`,
      `<text class="chart-label" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}">峰值 ${peak.rpm} RPM</text>`,
      `<text class="diagnosis-label" x="${(plotLeft + 8).toFixed(1)}" y="${(height - 2).toFixed(1)}">範例：正常發射</text>`
    ].join("");
  }
  svg.innerHTML = `${grid}<polyline class="line" points="${polyline}"></polyline>${pointNodes}${annotations}`;
}

function renderProfileDetail() {
  const rows = $("phaseRows");
  const peak = state.liveMax || state.shotPeak || 7200;
  const data = state.phaseRows.length ? state.phaseRows : buildPhaseRows(peak);
  rows.innerHTML = "";
  data.forEach((item, idx) => {
    const row = document.createElement("div");
    row.className = `phase-row${idx === 2 ? " peak" : ""}`;
    row.innerHTML = `<span>${item.name}</span><span>${item.time}</span><span>${item.rpm}</span>`;
    rows.appendChild(row);
  });
}

function renderProfile() {
  $("profileCard").classList.toggle("detail", state.profileDetail);
  renderProfileChart();
  renderProfileDetail();
}

function simPhaseText() {
  switch (state.simPhase) {
    case "advertising":
      return "廣播";
    case "connected":
      return "連線";
    case "subscribed":
      return "訂閱";
    case "pair_wait":
      return "待按";
    case "pair_confirmed":
      return "配對";
    case "attached":
      return "已裝";
    case "calculating":
      return "計算";
    case "done":
      return "完成";
    case "disabled":
    default:
      return "關閉";
  }
}

function setSimButtonState(id, text, enabled, active = false, waiting = false) {
  const btn = $(id);
  if (!btn) return;
  btn.textContent = text;
  btn.disabled = !enabled;
  btn.classList.toggle("active", active);
  btn.classList.toggle("waiting", waiting);
}

function renderSimPanel() {
  const simMode = isBbpSimMode();
  const panel = $("simPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !simMode);
  if (!simMode) return;

  $("simStatus").textContent = `次數 ${state.simShots}｜${simPhaseText()}`;
  let detail = `送出 ${state.simTxCount}｜收到 ${state.simLastWriteCmd}`;
  if (state.simPairConfirmed) {
    detail += "｜配對完成";
  } else if (state.simPhase === "pair_wait") {
    detail += `｜待按 ${state.simPairPressCount}/2`;
  }
  $("simDetail").textContent = detail;

  $("simLedAdv").classList.toggle("on", state.simEnabled && state.simPhase !== "disabled");
  $("simLedSub").classList.toggle("on", ["subscribed", "pair_wait", "pair_confirmed", "attached", "calculating", "done"].includes(state.simPhase));
  $("simLedPair").classList.toggle("on", state.simPairConfirmed);
  $("simLedTop").classList.toggle("on", state.isAttached || state.isCalculating);

  setSimButtonState("simToggleBtn", state.simEnabled ? "廣播開" : "廣播關", true, state.simEnabled);
  const pairWaiting = state.simEnabled && state.simPhase === "pair_wait" && !state.simPairConfirmed;
  const pairText = state.simPairConfirmed
    ? "配對完成"
    : pairWaiting
      ? (state.simPairPressCount === 0 ? "確認 1/2" : "確認 2/2")
      : "等待App";
  setSimButtonState("simReadyBtn", pairText, pairWaiting, state.simPairConfirmed, pairWaiting);
  setSimButtonState("simAttachBtn", state.isAttached ? "陀螺已裝上" : "陀螺未裝上", state.simEnabled && !state.isCalculating, state.isAttached);
  setSimButtonState("simFireBtn", "發射", state.simEnabled && state.isAttached && !state.isCalculating, state.isCalculating);
  const batchText = state.simBatchActive ? `連發 ${state.simBatchDone}/${state.simBatchTarget}` : "連發200";
  setSimButtonState("simBatchBtn", batchText, state.simEnabled && !state.isCalculating && !state.simBatchActive, state.simBatchActive);
}

function renderBbpModeChrome() {
  $("bbpScreen")?.classList.toggle("sim-mode", isBbpSimMode());
  renderSimPanel();
}

function simToggleBroadcast() {
  if (!isBbpSimMode()) return;
  updateBatteryByElapsed();
  state.simEnabled = !state.simEnabled;
  if (!state.simEnabled) {
    clearBbpFlags();
    state.simPhase = "disabled";
    state.simPairPressCount = 0;
    state.simPairConfirmed = false;
  } else {
    state.simPhase = "pair_wait";
  }
  render();
}

function simReadyPress() {
  if (!isBbpSimMode() || !state.simEnabled || state.simPairConfirmed) return;
  if (state.simPhase !== "pair_wait") state.simPhase = "pair_wait";
  state.simPairPressCount = Math.min(2, state.simPairPressCount + 1);
  state.simLastWriteCmd = "A0";
  state.simTxCount += 1;
  if (state.simPairPressCount >= 2) {
    state.simPairConfirmed = true;
    state.simPhase = "pair_confirmed";
  }
  render();
}

function simToggleAttach() {
  if (!isBbpSimMode() || !state.simEnabled || state.isCalculating) return;
  state.isAttached = !state.isAttached;
  state.simPhase = state.isAttached ? "attached" : (state.simPairConfirmed ? "pair_confirmed" : "pair_wait");
  state.simLastWriteCmd = state.isAttached ? "B0" : "B1";
  state.simTxCount += 1;
  render();
}

function simFireOnce() {
  if (!isBbpSimMode() || !state.simEnabled || !state.isAttached || state.isCalculating) return;
  clearTimeout(state.shotTimer);
  const peak = randomLaunchPeak();
  state.isAttached = false;
  state.isCalculating = true;
  state.lastDone = false;
  state.simPhase = "calculating";
  state.liveRpm = peak;
  state.shotPeak = peak;
  state.profilePoints = buildProfilePoints(peak);
  state.phaseRows = buildPhaseRows(peak);
  render();
  state.shotTimer = setTimeout(() => {
    recordShotMetrics(peak);
    state.simShots += 1;
    state.simTxCount += 5;
    state.simLastWriteCmd = "C0";
    state.isCalculating = false;
    state.lastDone = true;
    state.simPhase = "done";
    state.liveRpm = peak;
    state.shotTimer = 0;
    render();
  }, 700);
}

function simBatchFire() {
  if (!isBbpSimMode() || !state.simEnabled || state.isCalculating || state.simBatchActive) return;
  clearTimeout(state.simBatchTimer);
  state.simBatchActive = true;
  state.simBatchDone = 0;
  state.simBatchTarget = 200;
  state.simPhase = "calculating";
  state.lastDone = false;
  render();
  state.simBatchTimer = setTimeout(() => {
    const peak = randomLaunchPeak();
    state.simBatchDone = state.simBatchTarget;
    state.simShots += state.simBatchTarget;
    state.simTxCount += state.simBatchTarget * 5;
    state.simLastWriteCmd = "C0";
    state.simBatchActive = false;
    state.simPhase = "done";
    recordShotMetrics(peak);
    state.lastDone = true;
    render();
  }, 700);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function settingsOptions(min, max, selected, pad = 0) {
  let html = "";
  for (let value = min; value <= max; value += 1) {
    const text = pad ? String(value).padStart(pad, "0") : String(value);
    html += `<option value="${value}"${value === selected ? " selected" : ""}>${text}</option>`;
  }
  return html;
}

function centerSelectedRoller(id) {
  const select = $(id);
  if (!select) return;
  const center = () => {
    const style = window.getComputedStyle(select);
    const optionHeight = parseFloat(style.lineHeight) || 44;
    const target = select.selectedIndex * optionHeight - ((select.clientHeight - optionHeight) / 2);
    select.scrollTop = Math.max(0, target);
  };
  if (typeof requestAnimationFrame === "function") requestAnimationFrame(center);
  else setTimeout(center, 0);
}

function wrapValue(value, min, max) {
  const span = max - min + 1;
  if (span <= 0) return min;
  return ((value - min) % span + span) % span + min;
}

function seedSettingsTimeDraft() {
  const parts = currentDateTimeParts();
  state.settingsTimeHour24 = parts.hour;
  state.settingsTimeMinute = parts.minute;
}

function settingsTimeDraft() {
  if (state.settingsTimeHour24 === null || state.settingsTimeMinute === null) {
    seedSettingsTimeDraft();
  }
  return {
    hour: Math.max(0, Math.min(23, Number(state.settingsTimeHour24) || 0)),
    minute: Math.max(0, Math.min(59, Number(state.settingsTimeMinute) || 0))
  };
}

function isLeapYear(year) {
  return ((year % 4) === 0 && (year % 100) !== 0) || ((year % 400) === 0);
}

function daysInMonth(year, month) {
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[Math.max(1, Math.min(12, month)) - 1];
}

function seedSettingsDateDraft() {
  const parts = currentDateTimeParts();
  state.settingsDateYear = parts.year;
  state.settingsDateMonth = parts.month;
  state.settingsDateDay = parts.day;
}

function settingsDateDraft() {
  if (state.settingsDateYear === null || state.settingsDateMonth === null || state.settingsDateDay === null) {
    seedSettingsDateDraft();
  }
  const year = Math.max(2024, Math.min(2050, Number(state.settingsDateYear) || 2024));
  const month = Math.max(1, Math.min(12, Number(state.settingsDateMonth) || 1));
  const maxDay = daysInMonth(year, month);
  const day = Math.max(1, Math.min(maxDay, Number(state.settingsDateDay) || 1));
  state.settingsDateYear = year;
  state.settingsDateMonth = month;
  state.settingsDateDay = day;
  return { year, month, day, maxDay };
}

function syncDateDayRoller() {
  const draft = settingsDateDraft();
  const dayRoller = $("dateDayRoller");
  if (!dayRoller) return;
  dayRoller.dataset.max = String(draft.maxDay);
  updateLvglRoller(dayRoller, draft.day);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function lvglRollerText(value, pad = 0, labels = null) {
  if (labels) return labels[value] ?? "";
  return pad ? pad2(value) : String(value);
}

function lvglRollerRows(value, min, max, pad = 0, labels = null, rowHeight = 44) {
  let html = "";
  for (let offset = -2; offset <= 2; offset += 1) {
    const itemValue = wrapValue(value + offset, min, max);
    const text = escapeHtml(lvglRollerText(itemValue, pad, labels));
    html += `<span class="lvgl-roller-row${offset === 0 ? " selected" : ""}" style="height:${rowHeight}px;transform:translateY(calc(-50% + ${offset * rowHeight}px))">${text}</span>`;
  }
  return html;
}

function lvglRollerHtml(id, className, min, max, value, pad = 0, labels = null, rowHeight = 44) {
  const text = lvglRollerText(value, pad, labels);
  const labelsAttr = labels ? ` data-labels="${escapeHtml(labels.join("|"))}"` : "";
  return `
    <div id="${id}" class="settings-lvgl-roller ${className}" role="spinbutton" tabindex="0"
         aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${escapeHtml(text)}"
         data-min="${min}" data-max="${max}" data-value="${value}" data-pad="${pad}" data-row-height="${rowHeight}"${labelsAttr}>
      <div class="lvgl-roller-selected-band" aria-hidden="true"></div>
      <div class="lvgl-roller-window">${lvglRollerRows(value, min, max, pad, labels, rowHeight)}</div>
    </div>
  `;
}

function updateLvglRoller(el, nextValue) {
  const min = Number(el.dataset.min);
  const max = Number(el.dataset.max);
  const pad = Number(el.dataset.pad);
  const labels = el.dataset.labels ? el.dataset.labels.split("|") : null;
  const rowHeight = Number(el.dataset.rowHeight) || 44;
  const value = wrapValue(nextValue, min, max);
  const text = lvglRollerText(value, pad, labels);
  el.dataset.value = String(value);
  el.setAttribute("aria-valuenow", String(value));
  el.setAttribute("aria-valuetext", text);
  const windowEl = el.querySelector(".lvgl-roller-window");
  if (windowEl) windowEl.innerHTML = lvglRollerRows(value, min, max, pad, labels, rowHeight);
  return value;
}

function bindLvglRoller(id, onChange) {
  const el = $(id);
  if (!el) return;
  const step = (delta) => {
    const value = updateLvglRoller(el, Number(el.dataset.value) + delta);
    if (onChange) onChange(value);
  };
  let dragging = false;
  let lastY = 0;
  let moved = false;
  let clickSuppressed = false;

  el.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    el.focus();
    dragging = true;
    lastY = event.clientY;
    moved = false;
    if (el.setPointerCapture) el.setPointerCapture(event.pointerId);
  });
  el.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    event.preventDefault();
    event.stopPropagation();
    const dy = event.clientY - lastY;
    if (Math.abs(dy) < 26) return;
    moved = true;
    lastY = event.clientY;
    step(dy < 0 ? 1 : -1);
  });
  el.addEventListener("pointerup", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    dragging = false;
    clickSuppressed = moved;
  });
  el.addEventListener("pointercancel", () => {
    dragging = false;
  });
  el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (clickSuppressed) {
      clickSuppressed = false;
      return;
    }
    const rect = el.getBoundingClientRect();
    step(event.clientY < rect.top + rect.height / 2 ? -1 : 1);
  });
  el.addEventListener("wheel", (event) => {
    event.preventDefault();
    event.stopPropagation();
    step(event.deltaY > 0 ? 1 : -1);
  }, { passive: false });
  el.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      step(-1);
    }
  });
}

function refreshTimeFormatSurfaces() {
  watchTimeCache = "";
  timeCardTextCache = "";
  renderWatch();
  renderClock();
}

function settingsRowHtml(page, icon, title, iconClass = "", value = "") {
  const valueHtml = value ? `<span class="settings-row-value">${value}</span>` : `<span class="settings-arrow">›</span>`;
  return `
    <button class="settings-row" type="button" data-settings-page="${page}">
      <span class="settings-icon ${iconClass}">${icon}</span>
      <span class="settings-main">${title}</span>
      ${valueHtml}
    </button>
  `;
}

function settingsInfoRow(label, value, valueId = "") {
  const valueIdAttr = valueId ? ` id="${valueId}"` : "";
  return `<div class="settings-info-row"><span>${label}</span><span${valueIdAttr}>${value}</span></div>`;
}

function currentDateTimeParts() {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes()
  };
}

function markSettingsSaved(text = "已保存") {
  clearTimeout(settingsSaveResetTimer);
  state.settingsSavedText = text;
  renderSettingsDetail();
  settingsSaveResetTimer = setTimeout(() => {
    settingsSaveResetTimer = 0;
    if (state.settingsSavedText !== text) return;
    state.settingsSavedText = "";
    if (state.screen === "settingsDetail") renderSettingsDetail();
  }, 900);
}

function renderSettingsDatetime(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      ${settingsRowHtml("time", "", "設定時間", "settings-img-icon settings-img-clock settings-icon-datetime-time")}
      ${settingsRowHtml("date", "", "設定日期", "settings-img-icon settings-img-calendar settings-icon-datetime-date")}
      <button id="timeFormatBtn" class="settings-row" type="button">
        <span class="settings-icon settings-symbol settings-symbol-refresh settings-icon-datetime-format" aria-hidden="true"></span>
        <span class="settings-main">12/24 小時制</span>
        <span class="settings-row-value">${state.timeFormat12h ? "12H" : "24H"}</span>
      </button>
    </div>
  `;
  $("timeFormatBtn")?.addEventListener("click", () => {
    state.timeFormat12h = !state.timeFormat12h;
    refreshTimeFormatSurfaces();
    markSettingsSaved(state.timeFormat12h ? "12 小時制" : "24 小時制");
  });
}

function renderSettingsTime(body) {
  const parts = settingsTimeDraft();
  const hour = state.timeFormat12h ? ((parts.hour + 11) % 12) + 1 : parts.hour;
  body.innerHTML = `
    <div class="settings-time-stage">
      ${lvglRollerHtml("timeHourRoller", "time-hour", state.timeFormat12h ? 1 : 0, state.timeFormat12h ? 12 : 23, hour, 2)}
      <span class="settings-separator">:</span>
      ${lvglRollerHtml("timeMinuteRoller", "time-minute", 0, 59, parts.minute, 2)}
      ${state.timeFormat12h ? `<button id="ampmBtn" class="settings-action-btn settings-ampm-btn" type="button">${parts.hour >= 12 ? "PM" : "AM"}</button>` : ""}
      <button id="timeSaveBtn" class="settings-save-btn" type="button">${state.settingsSavedText || "保存"}</button>
    </div>
  `;
  $("ampmBtn")?.addEventListener("click", (event) => {
    const draft = settingsTimeDraft();
    const h12 = draft.hour % 12 || 12;
    const nextPm = event.currentTarget.textContent === "AM";
    state.settingsTimeHour24 = h12 === 12 ? (nextPm ? 12 : 0) : (nextPm ? h12 + 12 : h12);
    event.currentTarget.textContent = nextPm ? "PM" : "AM";
  });
  $("timeSaveBtn")?.addEventListener("click", () => markSettingsSaved());
  bindLvglRoller("timeHourRoller", (value) => {
    const draft = settingsTimeDraft();
    if (state.timeFormat12h) {
      const isPm = draft.hour >= 12;
      state.settingsTimeHour24 = value === 12 ? (isPm ? 12 : 0) : (isPm ? value + 12 : value);
    } else {
      state.settingsTimeHour24 = value;
    }
  });
  bindLvglRoller("timeMinuteRoller", (value) => {
    state.settingsTimeMinute = value;
  });
}

function renderSettingsDate(body) {
  const parts = settingsDateDraft();
  body.innerHTML = `
    <div class="settings-date-stage">
      ${lvglRollerHtml("dateYearRoller", "date-year", 2024, 2050, parts.year)}
      <span class="settings-separator slash-one">/</span>
      ${lvglRollerHtml("dateMonthRoller", "date-month", 1, 12, parts.month, 2)}
      <span class="settings-separator slash-two">/</span>
      ${lvglRollerHtml("dateDayRoller", "date-day", 1, parts.maxDay, parts.day, 2)}
      <button id="dateSaveBtn" class="settings-save-btn" type="button">${state.settingsSavedText || "保存"}</button>
    </div>
  `;
  $("dateSaveBtn")?.addEventListener("click", () => markSettingsSaved());
  bindLvglRoller("dateYearRoller", (value) => {
    state.settingsDateYear = value;
    syncDateDayRoller();
  });
  bindLvglRoller("dateMonthRoller", (value) => {
    state.settingsDateMonth = value;
    syncDateDayRoller();
  });
  bindLvglRoller("dateDayRoller", (value) => {
    state.settingsDateDay = value;
  });
}

function renderSettingsSlider(body, kind) {
  const isBrightness = kind === "brightness";
  const pct = isBrightness ? state.brightnessPct : state.volumePct;
  const iconClass = isBrightness ? "settings-symbol-eye-open" : "settings-symbol-volume-max";
  const inputId = isBrightness ? "brightnessRange" : "volumeRange";
  body.innerHTML = `
    <div class="settings-slider-stage">
      <div class="settings-vertical-slider" style="--slider-pct:${pct / 100}">
        <input id="${inputId}" type="range" min="0" max="100" value="${pct}" orient="vertical">
        <span class="settings-slider-icon settings-symbol ${iconClass}" aria-hidden="true"></span>
      </div>
    </div>
  `;
  $(inputId)?.addEventListener("input", (event) => {
    const next = Number(event.target.value);
    if (isBrightness) state.brightnessPct = next;
    else state.volumePct = next;
    event.target.closest(".settings-vertical-slider")?.style.setProperty("--slider-pct", String(next / 100));
  });
}

function renderSettingsOfftime(body) {
  const options = ["10s", "30s", "1分", "常開"];
  body.innerHTML = `
    <div class="settings-offtime-stage">
      ${lvglRollerHtml("offtimeRoller", "offtime-roller", 0, options.length - 1, state.offTimeIndex, 0, options, 41)}
      <button id="offtimeSaveBtn" class="settings-save-btn" type="button">${state.settingsSavedText || "保存"}</button>
    </div>
  `;
  bindLvglRoller("offtimeRoller", (value) => {
    state.offTimeIndex = value;
  });
  $("offtimeSaveBtn")?.addEventListener("click", () => markSettingsSaved());
}

function renderSettingsMotor(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card settings-info-card">
        <div class="settings-toggle-card">
          <div class="settings-toggle-title">震動電機</div>
          <button id="motorSwitch" class="settings-switch${state.motorEnabled ? " on" : ""}" type="button" aria-label="震動開關"></button>
        </div>
        <div id="motorStateLabel" class="settings-status${state.motorEnabled ? " on" : ""}">狀態:${state.motorEnabled ? "使用" : "已停用"}</div>
      </div>
    </div>
  `;
  $("motorSwitch")?.addEventListener("click", () => {
    state.motorEnabled = !state.motorEnabled;
    state.motorTesting = false;
    renderSettingsDetail();
  });
}

function renderSettingsLevel(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card level-card">
        <div>
          <div class="level-dial" aria-hidden="true">
            <span class="level-bubble"></span>
          </div>
          <div class="level-vib">震動 : 0.0000g</div>
        </div>
        <div class="level-grid">
          <div class="level-value">橫滾 +0.0</div>
          <div class="level-value">俯仰 +0.0</div>
          <div class="level-value head">加速度</div>
          <div class="level-value head">角速度</div>
          <div class="level-value">X +0.0000g</div>
          <div class="level-value">X +0.0</div>
          <div class="level-value">Y +0.0000g</div>
          <div class="level-value">Y +0.0</div>
          <div class="level-value">Z +0.0000g</div>
          <div class="level-value">Z +0.0</div>
        </div>
      </div>
    </div>
  `;
}

function renderSettingsBattery(body) {
  const pct = Math.round(state.batteryPct);
  settingsBatteryPctCache = pct;
  settingsBatteryChargingCache = state.isCharging;
  const vbus = state.isCharging ? "是" : "否";
  const stage = state.isCharging ? "CHG" : "--";
  const battMv = Math.round(3300 + Math.max(0, Math.min(100, state.batteryPct)) * 8.4);
  body.innerHTML = `
    <div class="settings-sub-list">
      <h2 class="settings-list-title">電源資訊</h2>
      <div class="settings-card settings-info-card">
        <div class="settings-section-title">總表</div>
        ${settingsInfoRow("電量", `${pct} %`)}
        ${settingsInfoRow("電池資訊", "鋰聚合物電池")}
      </div>
      <div class="settings-card settings-info-card">
        <div class="settings-section-title">USB / VBUS</div>
        ${settingsInfoRow("VBUS 接入", vbus)}
        ${settingsInfoRow("VBUS 正常", vbus)}
        ${settingsInfoRow("VBUS 電壓", state.isCharging ? "5012 mV" : "--")}
      </div>
      <div class="settings-card settings-info-card">
        <div class="settings-section-title">電源狀態</div>
        ${settingsInfoRow("待機", "否")}
        ${settingsInfoRow("充電中", state.isCharging ? "是" : "否")}
        ${settingsInfoRow("放電中", state.isCharging ? "否" : "是")}
        ${settingsInfoRow("充電階段", stage)}
      </div>
      <div class="settings-card settings-info-card">
        <div class="settings-section-title">電壓</div>
        ${settingsInfoRow("電池電壓", `${battMv} mV`)}
        ${settingsInfoRow("系統電壓", "3300 mV")}
      </div>
    </div>
  `;
}

function renderSettingsAbout(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      ${settingsRowHtml("aboutDevice", "", "設備資訊", "settings-symbol settings-symbol-home settings-icon-about")}
      ${settingsRowHtml("battery", "", "電源資訊", "settings-img-icon settings-img-chip settings-icon-pmu")}
      ${settingsRowHtml("licenseInfo", "", "授權資訊", "settings-symbol settings-symbol-file settings-icon-license")}
      ${settingsRowHtml("openSource", "", "Library資訊", "settings-symbol settings-symbol-list settings-icon-pmu")}
    </div>
  `;
}

function renderSettingsAboutDevice(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card settings-info-card">
        ${settingsInfoRow("廠商型號", "Waveshare ESP32-S3-Touch-AMOLED-2.06")}
        ${settingsInfoRow("韌體", "BS_260530")}
      </div>
      <div class="settings-card settings-info-card">
        ${settingsInfoRow("主控", "ESP32-S3R8")}
        ${settingsInfoRow("介面", "LVGL 9.3")}
        ${settingsInfoRow("電源", "AXP2101")}
        ${settingsInfoRow("畫面", "2.06-inch touch AMOLED")}
        ${settingsInfoRow("BLE", "1C:DB:D4:7A:F1:94")}
        ${settingsInfoRow("IMU", "停用")}
        ${settingsInfoRow("Wi-Fi", "停用")}
        ${settingsInfoRow("Speaker", "使用")}
        ${settingsInfoRow("Mic", "停用")}
      </div>
      <div class="settings-card settings-info-card">
        ${settingsInfoRow("MCU温度", "36.2 C")}
        ${settingsInfoRow("PMU温度", "34.8 C")}
      </div>
      <div class="settings-card settings-info-card">
        ${settingsInfoRow("總計運行", formatHistoricalRuntimeMs(currentTotalRuntimeMs()), "runtimeTotalValue")}
        ${settingsInfoRow("開機時間", formatUptimeMs(currentUptimeMs()), "runtimeUptimeValue")}
        ${settingsInfoRow("上次重啟", "--")}
        ${settingsInfoRow("重啟線索", "--")}
      </div>
    </div>
  `;
}

function renderSettingsSdDetail(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card settings-info-card">
        ${settingsInfoRow("狀態", "啟用")}
        ${settingsInfoRow("檔案", "launch_profile_32.csv / launch_profile_32.prev.csv")}
        ${settingsInfoRow("容量", "未知")}
        ${settingsInfoRow("目前", "--")}
        ${settingsInfoRow("備份", "--")}
        ${settingsInfoRow("佇列", "0/0")}
        ${settingsInfoRow("暫存", "0")}
        ${settingsInfoRow("遺失", "0")}
        ${settingsInfoRow("寫入錯誤", "0")}
      </div>
    </div>
  `;
}

function renderSettingsLicense(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card settings-info-card">
        <div class="settings-section-title">設備授權</div>
        ${settingsInfoRow("授權", "已授權")}
        ${settingsInfoRow("設備 MAC", "1C:DB:D4:7A:F1:94")}
        ${settingsInfoRow("授權日期", "2026-05-17")}
      </div>
    </div>
  `;
}

function renderSettingsOpenSource(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <div class="settings-card settings-info-card settings-license-card">
        <pre class="settings-license-body">${settingsOpenSourceBody}</pre>
      </div>
    </div>
  `;
}

function renderSettingsDevicePower(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <button id="softRestartBtn" class="settings-row" type="button">
        <span class="settings-icon settings-symbol settings-symbol-refresh settings-icon-restart" aria-hidden="true"></span>
        <span class="settings-main">重新開機</span>
        <span class="settings-arrow">›</span>
      </button>
      ${settingsRowHtml("factoryReset", "", "重設設定", "settings-symbol settings-symbol-refresh settings-icon-reset")}
      <button id="powerOffBtn" class="settings-row" type="button">
        <span class="settings-icon settings-symbol settings-symbol-power settings-icon-power" aria-hidden="true"></span>
        <span class="settings-main">關機</span>
        <span class="settings-arrow">›</span>
      </button>
    </div>
  `;
  $("softRestartBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (blockTutorialInteraction(event)) return;
    state.bootPct = 0;
    startBootSequence();
  });
  $("powerOffBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (blockTutorialInteraction(event)) return;
    enterPowerOff();
  });
}

function renderSettingsFactoryReset(body) {
  body.innerHTML = `
    <div class="settings-sub-list">
      <button id="factoryResetBtn" class="settings-action-card" type="button">
        <div class="settings-action-card-title">${state.settingsSavedText || "重設設定"}</div>
        <div class="settings-action-card-note">重設設定與 BBP</div>
      </button>
    </div>
    ${state.factoryResetConfirm ? `
      <div class="settings-confirm-mask">
        <div class="settings-confirm-dialog">
          <div class="settings-confirm-title">重設設定</div>
          <div class="settings-confirm-note">會重設設定與 BBP，時間保留。是否繼續?</div>
          <div class="settings-confirm-actions">
            <button id="factoryAgreeBtn" class="settings-confirm-btn agree" type="button">同意</button>
            <button id="factoryCancelBtn" class="settings-confirm-btn cancel" type="button">取消</button>
          </div>
        </div>
      </div>
    ` : ""}
  `;
  $("factoryResetBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (blockTutorialInteraction(event)) return;
    state.factoryResetConfirm = true;
    renderSettingsDetail();
  });
  $("factoryAgreeBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (blockTutorialInteraction(event)) return;
    state.factoryResetConfirm = false;
    markSettingsSaved("已重設");
  });
  $("factoryCancelBtn")?.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (blockTutorialInteraction(event)) return;
    state.factoryResetConfirm = false;
    renderSettingsDetail();
  });
}

function bindSettingsDetailTutorialGuard(body) {
  if (!body || body.dataset.tutorialGuardBound === "true") return;
  body.dataset.tutorialGuardBound = "true";
  ["pointerdown", "click", "input", "wheel", "keydown"].forEach((type) => {
    body.addEventListener(type, (event) => {
      blockTutorialInteraction(event);
    }, true);
  });
}

function renderSettingsDetail() {
  const title = $("settingsDetailTitle");
  const body = $("settingsDetailBody");
  if (!title || !body) return;
  bindSettingsDetailTutorialGuard(body);
  const page = state.settingsPage || "datetime";
  body.className = `settings-detail-body settings-detail-body-${page}`;
  title.classList.toggle("hidden", page === "battery");
  title.textContent = settingsPageDefs[page]?.title || "設定";
  switch (page) {
    case "datetime":
      renderSettingsDatetime(body);
      break;
    case "time":
      renderSettingsTime(body);
      break;
    case "date":
      renderSettingsDate(body);
      break;
    case "brightness":
      renderSettingsSlider(body, "brightness");
      break;
    case "offtime":
      renderSettingsOfftime(body);
      break;
    case "volume":
      renderSettingsSlider(body, "volume");
      break;
    case "motor":
      renderSettingsMotor(body);
      break;
    case "level":
      renderSettingsLevel(body);
      break;
    case "battery":
      renderSettingsBattery(body);
      break;
    case "about":
      renderSettingsAbout(body);
      break;
    case "aboutDevice":
      renderSettingsAboutDevice(body);
      break;
    case "sdDetail":
      renderSettingsSdDetail(body);
      break;
    case "licenseInfo":
      renderSettingsLicense(body);
      break;
    case "openSource":
      renderSettingsOpenSource(body);
      break;
    case "devicePower":
      renderSettingsDevicePower(body);
      break;
    case "factoryReset":
      renderSettingsFactoryReset(body);
      break;
    default:
      body.innerHTML = "";
      break;
  }
  body.querySelectorAll("[data-settings-page]").forEach((row) => {
    row.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (blockTutorialInteraction(event)) return;
      openSettingsPage(row.dataset.settingsPage);
    });
  });
}

function renderBatteryState() {
  const screenEl = document.querySelector(".screen");
  const pct = Math.max(0, Math.min(100, state.batteryPct));
  const dash = pct <= 0 ? 0 : (pct >= 100 ? RING_PATH_LENGTH : RING_PATH_LENGTH * pct / 100);
  const batteryColor = state.isCharging
    ? "#ff8a00"
    : pct <= BATTERY_CRITICAL_PCT
      ? "#ff4d4f"
      : pct <= BATTERY_LOW_PCT
        ? "#ffd60a"
        : "#4cf28a";
  if (screenEl) {
    screenEl.classList.toggle("charging", state.isCharging);
    screenEl.classList.toggle("battery-low", !state.isCharging && pct > BATTERY_CRITICAL_PCT && pct <= BATTERY_LOW_PCT);
    screenEl.classList.toggle("battery-critical", !state.isCharging && pct <= BATTERY_CRITICAL_PCT);
    screenEl.style.setProperty("--battery-dash", `${dash.toFixed(2)}`);
    screenEl.style.setProperty("--battery-color", batteryColor);
  }
  if ($("chargePortButton")) {
    $("chargePortButton").setAttribute("aria-label", state.isCharging ? "切換為未充電" : "切換為充電");
  }
  renderOffBatteryHint();
  renderSettingsStatusbar();
  if (state.screen === "settingsDetail" &&
      state.settingsPage === "battery" &&
      (settingsBatteryPctCache !== Math.round(pct) || settingsBatteryChargingCache !== state.isCharging)) {
    renderSettingsDetail();
  }
}

function renderOffBatteryHint() {
  const hint = $("offBatteryHint");
  const pctEl = $("offBatteryPct");
  const titleEl = $("offBatteryTitle");
  const textEl = $("offBatteryText");
  const chargeBtn = $("chargePortButton");
  if (!hint || !pctEl || !titleEl || !textEl) return;
  const pct = Math.max(0, Math.min(100, Math.round(state.batteryPct)));
  const show = state.screen === "off" && (pct <= 0 || (state.isCharging && pct < BATTERY_REBOOT_PCT));
  hint.classList.toggle("hidden", !show);
  if (chargeBtn) chargeBtn.classList.toggle("needs-charge", show && pct <= 0 && !state.isCharging);
  if (!show) {
    hint.classList.remove("attention");
    return;
  }
  pctEl.textContent = `${pct}%`;
  if (state.isCharging) {
    titleEl.textContent = "充電中";
    textEl.textContent = `達 ${BATTERY_REBOOT_PCT}% 後會自動開機`;
  } else {
    titleEl.textContent = "電量不足";
    textEl.textContent = "請點右側 Type-C 插頭模擬充電";
  }
}

function showNoBatteryPowerHint() {
  renderOffBatteryHint();
  const hint = $("offBatteryHint");
  if (!hint) return;
  hint.classList.remove("attention");
  void hint.offsetWidth;
  hint.classList.add("attention");
  clearTimeout(chargeHintTimer);
  chargeHintTimer = setTimeout(() => {
    chargeHintTimer = 0;
    hint.classList.remove("attention");
  }, 1200);
}

function toggleChargingState() {
  noteBbpActivity();
  updateBatteryByElapsed();
  state.isCharging = !state.isCharging;
  state.batteryLastAt = performance.now();
  renderBatteryState();
  renderSimControls();
  renderTutorial();
}

function powerOffByBattery() {
  if (state.batteryPct > 0 || state.isCharging) return;
  enterPowerOff();
  showNoBatteryPowerHint();
}

function pulseSideButton(which = "top") {
  const btn = document.querySelector(`.side-button-${which}`);
  if (!btn) return;
  btn.classList.remove("pressed");
  void btn.offsetWidth;
  btn.classList.add("pressed");
  clearTimeout(sideButtonPulseTimer);
  sideButtonPulseTimer = setTimeout(() => {
    btn.classList.remove("pressed");
  }, 160);
}

function updateBatteryByElapsed() {
  const now = performance.now();
  if (!state.batteryLastAt) {
    state.batteryLastAt = now;
    renderBatteryState();
    return;
  }
  const elapsed = Math.max(0, now - state.batteryLastAt);
  if (elapsed < 120) return;
  if (!state.isCharging && shouldFreezeBatteryDrainForTutorial()) {
    state.batteryLastAt = now;
    renderBatteryState();
    return;
  }

  const msPerPct = state.isCharging ? BATTERY_CHARGE_MS_PER_PERCENT : BATTERY_DRAIN_MS_PER_PERCENT;
  const delta = elapsed / msPerPct;
  const prevPct = state.batteryPct;
  const nextPct = Math.max(0, Math.min(100, state.batteryPct + (state.isCharging ? delta : -delta)));
  state.batteryLastAt = now;

  if (Math.abs(nextPct - state.batteryPct) < 0.02) return;
  state.batteryPct = nextPct;
  if (!state.isCharging && state.batteryPct <= 0) {
    renderBatteryState();
    powerOffByBattery();
    return;
  }
  renderBatteryState();
  if (state.isCharging && state.screen === "off" && prevPct < BATTERY_REBOOT_PCT && state.batteryPct >= BATTERY_REBOOT_PCT) {
    startBootSequence();
  }
}

function renderSimControls() {
  const mountBtn = $("mountBtn");
  const shotBtn = $("shotBtn");
  const subscribed = !!state.connected && state.blePhase === "subscribed_live" && !state.disconnecting;
  const inBbp = state.screen === "bbp";
  if (mountBtn) {
    mountBtn.textContent = state.isAttached ? "移除陀螺" : "裝上陀螺";
    mountBtn.disabled = !inBbp || !subscribed || state.mode === "connect_pending" || state.isCalculating;
    mountBtn.classList.toggle("active", inBbp && state.isAttached);
  }
  if (shotBtn) {
    shotBtn.textContent = state.isCalculating ? "計算中" : "發射陀螺";
    shotBtn.disabled = !inBbp || !subscribed || state.mode === "connect_pending" || state.isCalculating || !state.isAttached;
    shotBtn.classList.toggle("active", inBbp && state.isCalculating);
  }
}

function renderDebug() {
  if (!$("debugPage")) return;
  $("debugPage").textContent = `${state.screen}:${state.page}`;
  $("debugTimeCard").textContent = state.timeCardTimerMode ? "timer" : "clock";
  $("debugState").textContent = bbpStateName();
  $("debugBlePhase").textContent = state.blePhase;
  $("debugSelected").textContent = state.selected || "<none>";
  $("debugBound").textContent = state.bound || "<none>";
  $("debugConnected").textContent = state.connected || "<none>";
  $("debugAttached").textContent = String(state.isAttached);
  $("debugCalculating").textContent = String(state.isCalculating);
  $("debugTimer").textContent = String(currentElapsedMs());
  $("debugCount").textContent = state.rows.length;
}

function tutorialConditionMet(condition) {
  if (typeof condition === "string" && condition.startsWith("settingsPage:")) {
    const page = condition.slice("settingsPage:".length);
    return state.screen === "settingsDetail" && state.settingsPage === page;
  }
  switch (condition) {
    case "watchOn":
      return state.screen !== "off" && state.screen !== "boot";
    case "watchOff":
      return state.screen === "off";
    case "charging":
      return state.isCharging;
    case "menu":
      return state.screen === "menu" || state.screen === "bbp";
    case "bbp":
      return state.screen === "bbp";
    case "scanResult":
      return state.rows.length > 0 || !!state.selected || !!state.connected;
    case "selected":
      return !!state.selected || !!state.connected;
    case "connected":
      return !!state.connected && state.blePhase === "subscribed_live";
    case "attached":
      return state.isAttached || state.isCalculating || state.lastDone;
    case "shotDone":
      return state.lastDone && !state.isCalculating;
    case "timerMode":
      return state.timeCardTimerMode;
    case "timerStopped":
      return state.screen === "bbp" &&
        !!state.connected &&
        state.blePhase === "subscribed_live" &&
        !state.timerStart &&
        state.timerElapsedMs > 0;
    case "pageChanged":
      return state.screen === "bbp" && !!tutorialStepEntryPage && state.page !== tutorialStepEntryPage;
    case "settings":
      return state.screen === "settings" || state.screen === "settingsDetail";
    case "settingsMain":
      return state.screen === "settings" && !state.settingsPage;
    default:
      return false;
  }
}

function currentTutorialStep() {
  return tutorialSteps[Math.max(0, Math.min(state.tutorialStep, tutorialSteps.length - 1))];
}

function resetTutorialStepEntry() {
  tutorialStepEntryId = "";
  tutorialStepEntryPage = "";
  tutorialWaitWasMet = false;
  tutorialRevealStepId = "";
  clearTutorialBlockedHint();
}

function syncTutorialStepEntry(step = currentTutorialStep()) {
  const id = step?.id || "";
  if (tutorialStepEntryId === id) return;
  tutorialStepEntryId = id;
  tutorialStepEntryPage = state.page || "";
  tutorialWaitWasMet = !!(step?.waitFor && tutorialConditionMet(step.waitFor));
  tutorialRevealStepId = "";
}

function isTutorialWaitComplete(step = currentTutorialStep()) {
  if (!step?.waitFor) return false;
  syncTutorialStepEntry(step);
  const met = tutorialConditionMet(step.waitFor);
  if (!met) {
    tutorialWaitWasMet = false;
    return false;
  }
  if (tutorialManualReview || step.acceptInitialWait) return true;
  return !tutorialWaitWasMet;
}

function isTutorialPowerOffStep() {
  const step = currentTutorialStep();
  return state.tutorialActive && state.tutorialOpen && !state.tutorialDone && step?.id === "powerOff";
}

function tutorialTargetMatches(target, selector) {
  return !!selector && target instanceof Element && !!target.closest(selector);
}

function clearTutorialBlockedHint() {
  tutorialBlockedHintText = "";
  clearTimeout(tutorialBlockedHintTimer);
  tutorialBlockedHintTimer = 0;
  const hint = $("tutorialBlockHint");
  if (!hint) return;
  hint.textContent = "";
  hint.classList.remove("active");
}

function showTutorialBlockedHint() {
  tutorialBlockedHintText = "請依照亮框操作。";
  const hint = $("tutorialBlockHint");
  if (hint) {
    hint.textContent = tutorialBlockedHintText;
    hint.classList.add("active");
  }
  clearTimeout(tutorialBlockedHintTimer);
  tutorialBlockedHintTimer = setTimeout(() => {
    clearTutorialBlockedHint();
  }, 1400);
}

function isTutorialInteractionBlocked(target) {
  if (!state.tutorialActive || !state.tutorialOpen || state.tutorialDone) return false;
  const step = currentTutorialStep();
  if (!step) return false;
  if (target instanceof Element && target.closest("#tutorialPanel, #tutorialOpenBtn")) return false;
  if ((step.chapter === "mode" || step.chapter === "settings") &&
      tutorialTargetMatches(target, "#chargePortButton")) {
    return false;
  }
  if (step.lockControls) return true;
  if (!step.waitFor) return false;
  if (!(target instanceof Element)) return true;
  if (tutorialTargetMatches(target, step.target)) return false;
  if (tutorialTargetMatches(target, step.allowTargets)) return false;
  return true;
}

function blockTutorialInteraction(event) {
  if (!isTutorialInteractionBlocked(event?.target)) return false;
  showTutorialBlockedHint();
  event?.preventDefault?.();
  event?.stopImmediatePropagation?.();
  event?.stopPropagation?.();
  return true;
}

function tutorialChapter(id) {
  return tutorialChapters.find((chapter) => chapter.id === id) || null;
}

function tutorialChapterSteps(chapterId) {
  return tutorialSteps.filter((step) => step.chapter === chapterId);
}

function tutorialChapterStartIndex(chapterId) {
  const index = tutorialSteps.findIndex((step) => step.chapter === chapterId);
  return index >= 0 ? index : 0;
}

function tutorialChapterMenuIndex() {
  const index = tutorialSteps.findIndex((step) => step.chapterMenu);
  return index >= 0 ? index : 0;
}

function isTutorialChapterComplete(chapterId) {
  return state.tutorialCompletedChapters.includes(chapterId);
}

function markTutorialChapterComplete(chapterId) {
  if (!chapterId || isTutorialChapterComplete(chapterId)) return;
  state.tutorialCompletedChapters.push(chapterId);
}

function allTutorialChaptersComplete() {
  return tutorialChapters.every((chapter) => isTutorialChapterComplete(chapter.id));
}

function firstIncompleteTutorialChapter() {
  return tutorialChapters.find((chapter) => !isTutorialChapterComplete(chapter.id)) || tutorialChapters[0];
}

function canStartTutorialChapter(chapterId) {
  return state.tutorialReviewMode ||
    chapterId === "powerBasics" ||
    isTutorialChapterComplete("powerBasics");
}

function nextTutorialChapterAfter(chapterId) {
  const currentIndex = tutorialChapters.findIndex((chapter) => chapter.id === chapterId);
  for (let i = currentIndex + 1; i < tutorialChapters.length; i += 1) {
    if (!isTutorialChapterComplete(tutorialChapters[i].id)) return tutorialChapters[i];
  }
  return firstIncompleteTutorialChapter();
}

function ensureTutorialPower() {
  if (state.batteryPct > 0 || state.isCharging) return;
  state.batteryPct = 72;
  state.batteryLastAt = performance.now();
}

function clearTutorialTransientState() {
  clearAllTimers();
  clearPowerButtonHold();
  clearTimeout(sideButtonPulseTimer);
  sideButtonPulseTimer = 0;
  $("settingsSideButton")?.classList.remove("pressed");
  $("timerSideButton")?.classList.remove("pressed");
  state.bootPct = 0;
  state.swipeActive = false;
  state.swipePointerId = null;
  state.swipeCaptured = false;
  state.homeTracking = false;
  state.suppressClickUntil = 0;
  state.screenDimmed = false;
  state.isCharging = false;
  state.settingsPage = "";
  state.settingsSavedText = "";
  state.factoryResetConfirm = false;
  state.timeCardTimerMode = false;
  state.settingsTimeHour24 = null;
  state.settingsTimeMinute = null;
  state.settingsDateYear = null;
  state.settingsDateMonth = null;
  state.settingsDateDay = null;
  clearBbpFlags();
  resetFirmwareTimer();
  state.mode = "idle";
  state.blePhase = "idle";
  state.rows = [];
  state.selected = "";
  state.connected = "";
  state.detail = false;
  state.profileDetail = false;
  state.liveRpm = 0;
  resetSimRuntimeState(true);
  setPage("scan");
  setScreenDimmed(false);
  renderBatteryState();
}

function prepareTutorialChapter(chapterId) {
  ensureTutorialPower();
  clearTutorialTransientState();
  if (chapterId === "powerBasics") {
    showScreen("off");
    return;
  }
  if (chapterId === "mode") {
    showScreen("watch");
    return;
  }
  if (chapterId === "settings") {
    showScreen("watch");
    return;
  }
  showScreen("off");
}

function startTutorialChapter(chapterId) {
  const chapter = tutorialChapter(chapterId) || firstIncompleteTutorialChapter();
  if (!canStartTutorialChapter(chapter.id)) {
    startTutorialChapter("powerBasics");
    return;
  }
  tutorialManualReview = false;
  state.tutorialActive = true;
  state.tutorialDone = false;
  state.tutorialOpen = true;
  state.tutorialStep = tutorialChapterStartIndex(chapter.id);
  resetTutorialStepEntry();
  if (!state.tutorialReviewMode) persistTutorialDone(false);
  prepareTutorialChapter(chapter.id);
  render();
}

function openTutorialReviewMenu() {
  tutorialManualReview = false;
  state.tutorialActive = true;
  state.tutorialDone = false;
  state.tutorialOpen = true;
  state.tutorialReviewMode = true;
  state.tutorialCompletedChapters = tutorialChapters.map((chapter) => chapter.id);
  state.tutorialStep = tutorialChapterMenuIndex();
  resetTutorialStepEntry();
  renderTutorial();
}

function showTutorialChapterMenu() {
  if (!isTutorialChapterComplete("powerBasics")) {
    startTutorialChapter("powerBasics");
    return;
  }
  tutorialManualReview = false;
  state.tutorialActive = true;
  state.tutorialDone = false;
  state.tutorialOpen = true;
  state.tutorialStep = tutorialChapterMenuIndex();
  resetTutorialStepEntry();
  if (!state.tutorialReviewMode) persistTutorialDone(false);
  renderTutorial();
}

function currentTutorialStepLabel(step) {
  if (step?.chapterMenu) {
    const done = state.tutorialCompletedChapters.length;
    return `章節 ${done} / ${tutorialChapters.length} 完成`;
  }
  if (step?.chapterComplete) {
    return `${tutorialChapter(step.chapterComplete)?.title || "章節"} 完成`;
  }
  const chapter = tutorialChapter(step?.chapter);
  if (!chapter) return `第 ${state.tutorialStep + 1} / ${tutorialSteps.length} 步`;
  const steps = tutorialChapterSteps(chapter.id);
  const index = Math.max(0, steps.findIndex((item) => item.id === step.id)) + 1;
  return `${chapter.title} ｜ 第 ${index} / ${steps.length} 步`;
}

function tutorialBackStepIndex() {
  const step = currentTutorialStep();
  if (!step || step.chapterMenu) return state.tutorialStep;
  if (step.chapter) {
    const chapterSteps = tutorialChapterSteps(step.chapter);
    const chapterStepIndex = chapterSteps.findIndex((item) => item.id === step.id);
    if (chapterStepIndex <= 0) {
      return step.chapter === "powerBasics" ? state.tutorialStep : tutorialChapterMenuIndex();
    }
  }
  if (step.chapterComplete) {
    const chapterSteps = tutorialChapterSteps(step.chapterComplete);
    const lastChapterStep = chapterSteps[chapterSteps.length - 1];
    const lastIndex = tutorialSteps.findIndex((item) => item.id === lastChapterStep?.id);
    return lastIndex >= 0 ? lastIndex : Math.max(0, state.tutorialStep - 1);
  }
  return Math.max(0, state.tutorialStep - 1);
}

function canMoveTutorialBack() {
  return tutorialBackStepIndex() !== state.tutorialStep;
}

function revealTutorialTarget(step) {
  if (!step?.target) return;
  if (tutorialRevealStepId === step.id) return;
  const target = document.querySelector(step.target);
  const list = target?.closest(".settings-list");
  if (!target || !list) return;
  const listRect = list.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const targetCenter = targetRect.top - listRect.top + list.scrollTop + targetRect.height / 2;
  list.scrollTop = Math.max(0, Math.round(targetCenter - list.clientHeight / 2));
  tutorialRevealStepId = step.id;
}

function tutorialLiveStatMode(stepId) {
  switch (stepId) {
    case "liveAvgIntro":
      return 1;
    case "liveMinIntro":
      return 2;
    case "liveShotsIntro":
      return 3;
    case "liveMaxIntro":
      return 0;
    default:
      return null;
  }
}

function setTutorialScreen(screenName) {
  if (state.screen !== screenName) showScreen(screenName);
}

function setTutorialBbpPage(page) {
  setTutorialScreen("bbp");
  if (state.page !== page) setPage(page);
}

function refreshTutorialScanSurface() {
  renderMacRows();
  renderDetail();
  renderPrimary();
}

function syncTutorialStepSurface(step = currentTutorialStep()) {
  if (!state.tutorialActive || state.tutorialDone || !step) return;
  if (!["profilePurposeIntro", "profileChartIntro", "profileDiagnosisIntro", "pageDotsIntro"].includes(step.id)) {
    state.profileExample = false;
  }

  const offSurfaceSteps = ["powerButtonIntro", "timerButtonIntro", "chargePortIntro", "sdSlotIntro", "chargePortUse"];
  if (offSurfaceSteps.includes(step.id)) {
    setTutorialScreen("off");
    return;
  }

  const bootFromOffSteps = ["powerOn", "powerOnAgain"];
  if (bootFromOffSteps.includes(step.id)) {
    if (!["off", "boot", "watch"].includes(state.screen)) setTutorialScreen("off");
    return;
  }

  if (step.id === "powerOff") {
    if (state.screen !== "watch" && state.screen !== "boot") setTutorialScreen("watch");
    return;
  }

  const watchSurfaceSteps = ["batteryRing", "timeDateIntro", "goIntro", "watchFace", "settingsEntry"];
  if (watchSurfaceSteps.includes(step.id)) {
    if (state.screen !== "settings" && state.screen !== "settingsDetail") setTutorialScreen("watch");
    return;
  }

  if (step.id === "modeMenu" || step.id === "modeMenuSelect") {
    setTutorialScreen("menu");
    return;
  }

  const scanStepIds = ["scan", "scanResultsIntro", "selectDevice", "deviceDetailIntro", "bindDeviceIntro", "connect"];
  if (scanStepIds.includes(step.id)) {
    setTutorialBbpPage("scan");
    if (step.id === "scan" || step.id === "scanResultsIntro" || step.id === "selectDevice" || step.id === "connect") {
      state.detail = false;
    }
    if ((step.id === "deviceDetailIntro" || step.id === "bindDeviceIntro") && activeMac()) state.detail = true;
    refreshTutorialScanSurface();
    return;
  }

  if (step.id === "attach" || step.id === "shot") {
    setTutorialBbpPage("live");
    renderLive();
    renderSimControls();
    return;
  }

  const liveStepIds = [
    "timerCardToggle",
    "timerPause",
    "liveRpmIntro",
    "liveStatusIntro",
    "liveModeTabsIntro",
    "liveStatsSwitchIntro",
    "liveMaxIntro",
    "liveAvgIntro",
    "liveMinIntro",
    "liveShotsIntro"
  ];
  if (liveStepIds.includes(step.id)) {
    setTutorialBbpPage("live");
    const mode = tutorialLiveStatMode(step.id);
    if (mode !== null && state.statMode !== mode) {
      state.statMode = mode;
    }
    renderLive();
    return;
  }

  const historyStepIds = ["historyPageIntro", "historyModeToggleIntro"];
  if (historyStepIds.includes(step.id)) {
    setTutorialBbpPage("hist");
    state.histShowAna = true;
    renderHistory();
    return;
  }

  const profileStepIds = ["profilePurposeIntro", "profileChartIntro", "profileDiagnosisIntro", "profileDetailIntro", "pageDotsIntro"];
  if (profileStepIds.includes(step.id)) {
    setTutorialBbpPage("profile");
    state.profileDetail = step.id === "profileDetailIntro";
    state.profileExample = step.id !== "profileDetailIntro";
    state.profilePoints = tutorialProfileExample.slice();
    state.phaseRows = buildPhaseRows(tutorialProfilePeak);
    state.shotPeak = tutorialProfilePeak;
    state.liveMax = tutorialProfilePeak;
    state.lastDone = true;
    renderProfile();
    return;
  }

  if (step.id === "swipePages") {
    setTutorialScreen("bbp");
    if (tutorialStepEntryId !== step.id && state.page !== "profile") setPage("profile");
    return;
  }

  if (step.settingsPage) {
    if (state.screen !== "settingsDetail" || state.settingsPage !== step.settingsPage) {
      state.settingsPage = step.settingsPage;
      state.settingsSavedText = "";
      state.factoryResetConfirm = false;
      setTutorialScreen("settingsDetail");
      renderSettingsDetail();
    }
    return;
  }

  const isSettingsSurfaceStep = step.id === "settingsHomeGesture" ||
    (typeof step.target === "string" && step.target.includes("#settingsScreen"));
  if (isSettingsSurfaceStep) {
    if (state.screen !== "settings" || state.settingsPage) {
      state.settingsPage = "";
      setTutorialScreen("settings");
    }
    revealTutorialTarget(step);
  }
}

function maybeAdvanceTutorial() {
  if (!state.tutorialActive || state.tutorialDone) return;
  if (tutorialManualReview) return;
  let guard = 0;
  while (guard < tutorialSteps.length) {
    const step = currentTutorialStep();
    syncTutorialStepEntry(step);
    if (!step?.waitFor || !isTutorialWaitComplete(step)) return;
    if (state.tutorialStep >= tutorialSteps.length - 1) {
      completeTutorial();
      return;
    }
    state.tutorialStep += 1;
    resetTutorialStepEntry();
    if (state.tutorialOpen) syncTutorialStepSurface();
    guard += 1;
  }
}

function startTutorial() {
  tutorialManualReview = false;
  state.tutorialDone = false;
  state.tutorialActive = true;
  state.tutorialOpen = true;
  state.tutorialReviewMode = false;
  state.tutorialCompletedChapters = [];
  state.tutorialStep = tutorialChapterStartIndex("powerBasics");
  resetTutorialStepEntry();
  persistTutorialDone(false);
  prepareTutorialChapter("powerBasics");
  render();
}

function completeTutorial() {
  tutorialManualReview = false;
  state.tutorialDone = true;
  state.tutorialActive = false;
  state.tutorialOpen = false;
  state.tutorialReviewMode = false;
  state.profileExample = false;
  resetTutorialStepEntry();
  persistTutorialDone(true);
  setScreenDimmed(false);
  removeTutorialExtraHighlights();
  renderTutorial();
}

function closeTutorialPanel() {
  state.tutorialOpen = false;
  state.profileExample = false;
  setScreenDimmed(false);
  clearTutorialBlockedHint();
  removeTutorialExtraHighlights();
  updateTutorialHighlight();
  renderTutorial();
}

function moveTutorialStep(delta) {
  if (!state.tutorialActive) startTutorial();
  if (delta < 0) {
    const backIndex = tutorialBackStepIndex();
    if (backIndex === state.tutorialStep) return;
    tutorialManualReview = true;
    state.tutorialStep = backIndex;
    state.tutorialOpen = true;
    resetTutorialStepEntry();
    syncTutorialStepSurface();
    renderTutorial();
    return;
  }
  tutorialManualReview = delta < 0;
  state.tutorialStep = Math.max(0, Math.min(tutorialSteps.length - 1, state.tutorialStep + delta));
  state.tutorialOpen = true;
  resetTutorialStepEntry();
  syncTutorialStepSurface();
  renderTutorial();
}

function nextTutorialStep() {
  if (!state.tutorialActive) {
    startTutorial();
    return;
  }
  const current = currentTutorialStep();
  if (current?.chapterMenu) {
    if (allTutorialChaptersComplete()) {
      completeTutorial();
      return;
    }
    startTutorialChapter(firstIncompleteTutorialChapter().id);
    return;
  }
  if (current?.chapterComplete) {
    markTutorialChapterComplete(current.chapterComplete);
    if (state.tutorialReviewMode) {
      showTutorialChapterMenu();
      return;
    }
    if (allTutorialChaptersComplete()) {
      completeTutorial();
      return;
    }
    showTutorialChapterMenu();
    return;
  }
  if (state.tutorialStep >= tutorialSteps.length - 1) {
    completeTutorial();
    return;
  }
  state.tutorialStep += 1;
  if (tutorialManualReview) {
    const step = currentTutorialStep();
    tutorialManualReview = !!(step?.waitFor && !isTutorialWaitComplete(step));
  }
  state.tutorialOpen = true;
  resetTutorialStepEntry();
  syncTutorialStepSurface();
  renderTutorial();
}

function skipTutorialStep() {
  const step = currentTutorialStep();
  if (state.tutorialReviewMode) {
    showTutorialChapterMenu();
    return;
  }
  if (step?.chapter) {
    markTutorialChapterComplete(step.chapter);
    if (allTutorialChaptersComplete()) {
      completeTutorial();
      return;
    }
    showTutorialChapterMenu();
    return;
  }
  if (step?.chapterComplete) {
    markTutorialChapterComplete(step.chapterComplete);
    if (allTutorialChaptersComplete()) {
      completeTutorial();
      return;
    }
    showTutorialChapterMenu();
    return;
  }
  if (step?.chapterMenu) {
    completeTutorial();
    return;
  }
  completeTutorial();
}

function tutorialOverflowMargin(target) {
  if (!(target instanceof Element)) return 0;
  return target.closest(".screen-side-button, .charger-plug-btn, .sd-slot") ? 96 : 0;
}

function localRectInScreen(target, screen) {
  const overflowMargin = tutorialOverflowMargin(target);
  if (!(target instanceof HTMLElement) || target.offsetParent === null) {
    const rect = target.getBoundingClientRect();
    const screenRect = screen.getBoundingClientRect();
    const scaleX = screenRect.width / (screen.offsetWidth || SCREEN_W) || 1;
    const scaleY = screenRect.height / (screen.offsetHeight || SCREEN_H) || 1;
    return {
      left: Math.max(-overflowMargin, (rect.left - screenRect.left) / scaleX),
      top: Math.max(-overflowMargin, (rect.top - screenRect.top) / scaleY),
      right: Math.min(SCREEN_W + overflowMargin, (rect.right - screenRect.left) / scaleX),
      bottom: Math.min(SCREEN_H + overflowMargin, (rect.bottom - screenRect.top) / scaleY),
      width: Math.max(0, rect.width / scaleX),
      height: Math.max(0, rect.height / scaleY)
    };
  }
  let left = 0;
  let top = 0;
  let node = target;
  while (node && node !== screen) {
    left += node.offsetLeft || 0;
    top += node.offsetTop || 0;
    const next = node.offsetParent && screen.contains(node.offsetParent)
      ? node.offsetParent
      : node.parentElement;
    if (next === node) break;
    node = next;
  }

  for (let parent = target.parentElement; parent && parent !== screen; parent = parent.parentElement) {
    left -= parent.scrollLeft || 0;
    top -= parent.scrollTop || 0;
  }

  let width = target.offsetWidth || target.getBoundingClientRect().width;
  let height = target.offsetHeight || target.getBoundingClientRect().height;
  let rect = { left, top, right: left + width, bottom: top + height };

  for (let parent = target.parentElement; parent && parent !== screen; parent = parent.parentElement) {
    const style = window.getComputedStyle(parent);
    const clips = /(auto|scroll|hidden|clip)/.test(`${style.overflow}${style.overflowX}${style.overflowY}`);
    if (!clips) continue;
    const clip = localRectInScreen(parent, screen);
    rect = {
      left: Math.max(rect.left, clip.left),
      top: Math.max(rect.top, clip.top),
      right: Math.min(rect.right, clip.right),
      bottom: Math.min(rect.bottom, clip.bottom)
    };
  }

  rect.left = Math.max(-overflowMargin, rect.left);
  rect.top = Math.max(-overflowMargin, rect.top);
  rect.right = Math.min(SCREEN_W + overflowMargin, rect.right);
  rect.bottom = Math.min(SCREEN_H + overflowMargin, rect.bottom);
  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: Math.max(0, rect.right - rect.left),
    height: Math.max(0, rect.bottom - rect.top)
  };
}

function tutorialTargetRect(step) {
  if (!step?.target) return null;
  let targets = Array.from(document.querySelectorAll(step.target));
  if (!targets.length && step.id === "selectDevice") targets = [$("macList")].filter(Boolean);
  const visibleTargets = targets
    .map((target) => {
      const rect = target.getBoundingClientRect();
      return { target, rect };
    })
    .filter(({ target, rect }) => {
      const style = window.getComputedStyle(target);
      return rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== "hidden" &&
        style.display !== "none";
    })
  if (!visibleTargets.length) return null;

  const screen = visibleTargets[0].target.closest(".screen");
  const screenBound = screen && visibleTargets.every(({ target }) => target.closest(".screen") === screen);
  const rects = screenBound
    ? visibleTargets
      .map(({ target }) => localRectInScreen(target, screen))
      .filter((rect) => rect.width > 0 && rect.height > 0)
    : visibleTargets.map(({ rect }) => rect);
  if (!rects.length) return null;
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.right));
  const bottom = Math.max(...rects.map((rect) => rect.bottom));
  return { left, top, width: right - left, height: bottom - top, container: screenBound ? screen : null };
}

function applyTutorialHighlightRect(highlight, rect, pad = 8) {
  if (!rect) {
    highlight.classList.remove("visible");
    return;
  }
  if (rect.container) {
    if (highlight.parentElement !== rect.container) rect.container.appendChild(highlight);
    highlight.classList.add("screen-bound");
  } else {
    if (highlight.parentElement !== document.body) document.body.appendChild(highlight);
    highlight.classList.remove("screen-bound");
  }
  highlight.style.left = `${Math.round(rect.left - pad)}px`;
  highlight.style.top = `${Math.round(rect.top - pad)}px`;
  highlight.style.width = `${Math.round(rect.width + pad * 2)}px`;
  highlight.style.height = `${Math.round(rect.height + pad * 2)}px`;
  highlight.classList.add("visible");
}

function ensureTutorialExtraHighlight(index) {
  const key = String(index);
  let highlight = document.querySelector(`.tutorial-extra-highlight[data-index="${key}"]`);
  if (!highlight) {
    highlight = document.createElement("div");
    highlight.className = "tutorial-highlight tutorial-extra-highlight";
    highlight.dataset.index = key;
    document.body.appendChild(highlight);
  }
  return highlight;
}

function hideTutorialExtraHighlights(startIndex = 0) {
  document.querySelectorAll(".tutorial-extra-highlight").forEach((highlight) => {
    if (Number(highlight.dataset.index || 0) >= startIndex) highlight.classList.remove("visible");
  });
}

function removeTutorialExtraHighlights() {
  document.querySelectorAll(".tutorial-extra-highlight").forEach((highlight) => highlight.remove());
}

function updateTutorialHighlight(step = currentTutorialStep()) {
  const highlight = $("tutorialHighlight");
  if (!highlight) return;
  if (!state.tutorialActive || !state.tutorialOpen || state.tutorialDone) {
    highlight.classList.remove("visible");
    hideTutorialExtraHighlights();
    return;
  }
  const rect = tutorialTargetRect(step);
  if (!rect) {
    highlight.classList.remove("visible");
    hideTutorialExtraHighlights();
    return;
  }
  const pad = step.pad ?? 8;
  applyTutorialHighlightRect(highlight, rect, pad);
  const extraTargets = Array.isArray(step.extraTargets) ? step.extraTargets : (step.extraTargets ? [step.extraTargets] : []);
  extraTargets.forEach((target, index) => {
    const extraHighlight = ensureTutorialExtraHighlight(index);
    applyTutorialHighlightRect(extraHighlight, tutorialTargetRect({ ...step, target }), step.extraPad ?? pad);
  });
  hideTutorialExtraHighlights(extraTargets.length);
}

function queueTutorialHighlightUpdate(step = currentTutorialStep()) {
  if (tutorialHighlightFrame) cancelAnimationFrame(tutorialHighlightFrame);
  tutorialHighlightFrame = requestAnimationFrame(() => {
    tutorialHighlightFrame = requestAnimationFrame(() => {
      tutorialHighlightFrame = 0;
      updateTutorialHighlight(step);
    });
  });
}

function renderTutorial() {
  maybeAdvanceTutorial();
  const panel = $("tutorialPanel");
  const openBtn = $("tutorialOpenBtn");
  const title = $("tutorialTitle");
  const label = $("tutorialStepLabel");
  const body = $("tutorialBody");
  const chapterGrid = $("tutorialChapterGrid");
  const waitHint = $("tutorialWaitHint");
  const blockHint = $("tutorialBlockHint");
  const backBtn = $("tutorialBackBtn");
  const nextBtn = $("tutorialNextBtn");
  const skipBtn = $("tutorialSkipBtn");
  if (!panel || !openBtn || !title || !label || !body || !chapterGrid || !waitHint || !blockHint || !backBtn || !nextBtn || !skipBtn) return;

  const active = state.tutorialActive && !state.tutorialDone;
  const shouldFocusTutorial = state.tutorialOpen && active;
  const step = active ? currentTutorialStep() : null;
  if (shouldFocusTutorial) syncTutorialStepSurface(step);
  if (step?.chapterComplete) markTutorialChapterComplete(step.chapterComplete);
  const shouldShowControls = shouldFocusTutorial && !!step?.showControls;
  const focusChanged = document.body && document.body.classList.contains("tutorial-focus") !== shouldFocusTutorial;
  const controlsChanged = document.body && document.body.classList.contains("tutorial-controls-needed") !== shouldShowControls;
  document.body?.classList.toggle("tutorial-focus", shouldFocusTutorial);
  document.body?.classList.toggle("tutorial-controls-needed", shouldShowControls);
  if (shouldFocusTutorial && focusChanged) window.scrollTo(0, 0);
  if (focusChanged || controlsChanged) updateViewportScale();
  panel.classList.toggle("hidden", !state.tutorialOpen || !active);
  panel.classList.toggle("chapter-menu", !!step?.chapterMenu);
  openBtn.classList.toggle("active", state.tutorialOpen && active);
  openBtn.classList.toggle("panel-open", state.tutorialOpen && active);
  openBtn.textContent = active ? (state.tutorialOpen ? "收合教學" : "繼續教學") : "章節教學";
  openBtn.setAttribute("aria-expanded", state.tutorialOpen && active ? "true" : "false");

  if (!active) {
    queueTutorialHighlightUpdate();
    return;
  }

  syncTutorialStepEntry(step);
  const complete = !!step.waitFor && isTutorialWaitComplete(step);
  title.textContent = step.title;
  label.textContent = currentTutorialStepLabel(step);
  body.innerHTML = "";
  (step.textLines || step.lines).forEach((line) => {
    const p = document.createElement("p");
    p.textContent = line;
    body.appendChild(p);
  });
  chapterGrid.innerHTML = "";
  chapterGrid.classList.toggle("hidden", !step.chapterMenu);
  if (step.chapterMenu) {
    tutorialChapters.forEach((chapter) => {
      const locked = !canStartTutorialChapter(chapter.id);
      const done = isTutorialChapterComplete(chapter.id);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "tutorial-chapter-btn";
      button.dataset.chapterId = chapter.id;
      button.disabled = locked;
      button.classList.toggle("done", done);
      button.classList.toggle("locked", locked);
      button.innerHTML = `
        <span class="tutorial-chapter-title">${chapter.title}</span>
        <span class="tutorial-chapter-status">${locked ? "第一章完成後開放" : (done ? "已完成，可重跑" : "可開始")}</span>
      `;
      button.addEventListener("click", () => startTutorialChapter(chapter.id));
      chapterGrid.appendChild(button);
    });
  }
  waitHint.textContent = step.waitFor && !complete ? (step.waitText || "等待你完成此步驟") : "";
  waitHint.classList.toggle("active", !!waitHint.textContent);
  blockHint.textContent = tutorialBlockedHintText;
  blockHint.classList.toggle("active", !!tutorialBlockedHintText);
  backBtn.disabled = !canMoveTutorialBack();
  nextBtn.disabled = !!step.waitFor && !complete;
  if (step.chapterComplete) {
    nextBtn.textContent = state.tutorialReviewMode
      ? "選章節"
      : (allTutorialChaptersComplete() ? "完成教學" : "選章節");
    skipBtn.textContent = state.tutorialReviewMode
      ? "選章節"
      : (allTutorialChaptersComplete() ? "完成" : "選章節");
  } else if (step.chapterMenu) {
    const firstIncomplete = firstIncompleteTutorialChapter();
    nextBtn.textContent = allTutorialChaptersComplete() ? "完成教學" : `開始${firstIncomplete.shortTitle}`;
    skipBtn.textContent = "結束教學";
  } else {
    nextBtn.textContent = step.nextLabel || "下一步";
    skipBtn.textContent = state.tutorialReviewMode ? "選章節" : "跳過本章";
  }
  queueTutorialHighlightUpdate(step);
}

function render() {
  renderBoot();
  renderWatch();
  renderClock();
  renderBatteryState();
  renderBleRail();
  renderMacRows();
  renderDetail();
  renderPrimary();
  renderStatus();
  renderLive();
  renderHistory();
  renderProfile();
  renderBbpModeChrome();
  renderSettingsDetail();
  renderSimControls();
  renderDebug();
  renderTutorial();
}

function canLeaveScanPage() {
  if (isBbpSimMode()) return false;
  return !!state.connected ||
    state.mode === "connect_pending" ||
    state.isAttached ||
    state.isCalculating ||
    !!state.selected;
}

function swipePage(dx) {
  const current = pageOrder.indexOf(state.page);
  if (current < 0) {
    setPage("scan");
    return;
  }
  if (dx < 0) {
    if (current === 0 && !canLeaveScanPage()) return;
    if (current + 1 < pageOrder.length) setPage(pageOrder[current + 1]);
  } else if (dx > 0 && current > 0) {
    setPage(pageOrder[current - 1]);
  }
  render();
}

$("primaryBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  if (isBbpSimMode()) return;
  if (state.connected) {
    unsubscribeConnected();
  } else if (state.selected) {
    connectSelected();
  } else {
    startScan();
  }
});

$("bindBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  const mac = activeMac();
  if (!mac) return;
  state.bound = state.bound === mac ? "" : mac;
  render();
});

$("detailPanel").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.detail = false;
  render();
});

$("modeBbp").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.analyzerMode = false;
  render();
});

$("modeAna").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.analyzerMode = true;
  render();
});

$("liveBleBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  if (state.connected) unsubscribeConnected();
});

document.querySelector(".stats-card").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.statMode = (state.statMode + 1) % 4;
  render();
});

$("histHead").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.histShowAna = !state.histShowAna;
  render();
});

$("profileCard").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  state.profileDetail = !state.profileDetail;
  render();
});

$("simToggleBtn")?.addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  simToggleBroadcast();
});

$("simReadyBtn")?.addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  simReadyPress();
});

$("simAttachBtn")?.addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  simToggleAttach();
});

$("simFireBtn")?.addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  simFireOnce();
});

$("simBatchBtn")?.addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  event.stopPropagation();
  simBatchFire();
});

document.querySelectorAll(".time-banner").forEach((banner) => {
  banner.addEventListener("click", (event) => {
    if (blockTutorialInteraction(event)) return;
    event.stopPropagation();
    state.timeCardTimerMode = !state.timeCardTimerMode;
    render();
  });
});

function bindTapOnlyControl(el, action) {
  if (!el) return;
  el.addEventListener("pointerdown", (event) => {
    if (isTutorialInteractionBlocked(event.target)) {
      event.preventDefault();
    }
    event.stopPropagation();
  });
  el.addEventListener("pointerup", (event) => {
    if (isTutorialInteractionBlocked(event.target)) {
      event.preventDefault();
    }
    event.stopPropagation();
  });
  el.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (isTutorialInteractionBlocked(event.target)) return;
    noteUserActivity();
    noteBbpActivity();
    action();
  });
}

function bindPowerSettingsButton() {
  const btn = $("settingsSideButton");
  if (!btn) return;
  const finishPress = (event, cancelled = false) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.pointerId !== undefined && btn.hasPointerCapture?.(event.pointerId)) {
        btn.releasePointerCapture(event.pointerId);
      }
    }
    clearPowerButtonHold();
    btn.classList.remove("pressed");
    const shouldShortPress = !cancelled &&
      !!powerButtonPressScreen &&
      !powerButtonLongHandled &&
      !isTutorialPowerOffStep() &&
      powerButtonPressScreen !== "off" &&
      state.screen !== "off" &&
      state.screen !== "boot";
    powerButtonPressScreen = "";
    powerButtonLongHandled = false;
    if (shouldShortPress) enterSettings();
  };

  btn.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    event.stopPropagation();
    noteUserActivity();
    noteBbpActivity();
    clearPowerButtonHold();
    powerButtonLongHandled = false;
    powerButtonPressScreen = state.screen;
    if (isTutorialInteractionBlocked(event.target)) {
      powerButtonPressScreen = "";
      return;
    }
    if (powerButtonPressScreen === "off" && !hasDisplayPower()) {
      showNoBatteryPowerHint();
      powerButtonPressScreen = "";
      return;
    }
    btn.classList.add("pressed");
    btn.setPointerCapture?.(event.pointerId);
    const holdMs = powerButtonPressScreen === "off" ? POWER_ON_HOLD_MS : POWER_OFF_HOLD_MS;
    powerButtonHoldTimer = setTimeout(() => {
      powerButtonHoldTimer = 0;
      powerButtonLongHandled = true;
      btn.classList.remove("pressed");
      if (powerButtonPressScreen === "off") {
        if (state.screen === "off") startBootSequence();
        return;
      }
      if (state.screen !== "off" && state.screen !== "boot") {
        enterPowerOff();
      }
    }, holdMs);
  });
  btn.addEventListener("pointerup", (event) => finishPress(event));
  btn.addEventListener("pointercancel", (event) => finishPress(event, true));
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });
}

bindTapOnlyControl(document.querySelector("[data-mode='bbp']"), () => enterBbp("solo"));
bindTapOnlyControl(document.querySelector("[data-mode='sim']"), () => enterBbp("sim"));
bindTapOnlyControl($("watchBbpHotspot"), enterMenu);
bindTapOnlyControl($("watchSettingsHotspot"), enterSettings);
bindTapOnlyControl($("timerSideButton"), () => {
  pulseSideButton("top");
  stopTimerFromGpio();
});
bindPowerSettingsButton();
bindTapOnlyControl($("chargePortButton"), toggleChargingState);
document.querySelectorAll("#settingsScreen [data-settings-page]").forEach((row) => {
  bindTapOnlyControl(row, () => openSettingsPage(row.dataset.settingsPage));
});

function isHomeGestureStartTarget(target) {
  return target instanceof Element && !!target.closest("#homeHitbox, .home-hitbox");
}

function isNativeScrollTarget(target) {
  return target instanceof Element && !!target.closest(".settings-list, .settings-detail-body, .settings-license-card");
}

function startSwipeTrack(x, y, target) {
  const rect = screen.getBoundingClientRect();
  state.swipeStartX = x;
  state.swipeStartY = y;
  state.swipeStartLocalY = y - rect.top;
  state.swipeActive = true;
  state.homeTracking = isHomeGestureStartTarget(target);
  $("homeHitbox").classList.toggle("pressed", state.homeTracking);
}

function finishSwipeTrack(x, y, event) {
  if (!state.swipeActive) return false;
  state.swipeActive = false;
  $("homeHitbox").classList.remove("pressed");
  const dx = x - state.swipeStartX;
  const dy = y - state.swipeStartY;
  const handled = handleSwipeDelta(dx, dy, event);
  state.homeTracking = false;
  return handled;
}

function homeSwipeMatches(dx, dy, minDy) {
  if (!state.homeTracking) return false;
  const upwardDy = -dy;
  if (upwardDy < minDy) return false;
  const maxDx = HOME_SWIPE_MAX_DX_BASE + upwardDy * HOME_SWIPE_MAX_DX_GAIN;
  return Math.abs(dx) <= maxDx;
}

function handleHomeSwipe(event) {
  const now = performance.now();
  if (now - state.lastHomeSwipeAt < 180) return true;
  state.lastHomeSwipeAt = now;
  state.suppressClickUntil = now + 350;
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  if (state.screen === "bbp") {
    if (state.connected || state.mode === "connect_pending") {
      unsubscribeConnected();
      return true;
    }
    exitToMenu();
  } else if (state.screen === "settingsDetail") {
    backFromSettingsDetail();
  } else if (state.screen === "menu" || state.screen === "settings") {
    enterWatch();
  } else {
    enterWatch();
  }
  return true;
}

function handleSwipeDelta(dx, dy, event) {
  if (homeSwipeMatches(dx, dy, HOME_SWIPE_MIN_DY)) {
    return handleHomeSwipe(event);
  }
  if (state.screen !== "bbp") return false;
  if (Math.abs(dx) < BBP_SWIPE_MIN_DX || Math.abs(dx) <= Math.abs(dy) + BBP_SWIPE_DY_BIAS) return false;
  const now = performance.now();
  if (now - state.lastSwipeAt < BBP_TOUCH_SWIPE_COOLDOWN_MS) return true;
  state.lastSwipeAt = now;
  state.suppressClickUntil = now + 350;
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  swipePage(dx);
  return true;
}

const screen = document.querySelector(".screen");

function isInteractiveScreenTarget(target) {
  if (!(target instanceof Element)) return false;
  const interactive = target.closest("button, input, select, .settings-lvgl-roller, .time-banner, .stats-card, #profileCard, #detailPanel");
  return !!interactive && screen.contains(interactive);
}

screen.addEventListener("click", (event) => {
  if (performance.now() < state.suppressClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
screen.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
screen.addEventListener("pointerdown", (event) => {
  if (blockTutorialInteraction(event)) return;
  if (state.screenDimmed) {
    noteUserActivity();
    event.preventDefault();
    event.stopPropagation();
    return;
  }
  if (state.swipeActive) return;
  noteUserActivity();
  noteBbpActivity();
  if (!isHomeGestureStartTarget(event.target) && isNativeScrollTarget(event.target)) return;
  state.swipePointerId = event.pointerId;
  state.swipeCaptured = false;
  if (!isInteractiveScreenTarget(event.target) && screen.setPointerCapture) {
    screen.setPointerCapture(event.pointerId);
    state.swipeCaptured = true;
  }
  startSwipeTrack(event.clientX, event.clientY, event.target);
});
screen.addEventListener("pointermove", (event) => {
  if (!state.swipeActive || !state.homeTracking) return;
  const dx = event.clientX - state.swipeStartX;
  const dy = event.clientY - state.swipeStartY;
  if (homeSwipeMatches(dx, dy, HOME_SWIPE_EARLY_DY)) {
    $("homeHitbox").classList.remove("pressed");
  }
});
screen.addEventListener("pointerup", (event) => {
  if (state.swipePointerId !== null && event.pointerId !== state.swipePointerId) return;
  finishSwipeTrack(event.clientX, event.clientY, event);
  if (state.swipeCaptured && screen.hasPointerCapture?.(event.pointerId)) screen.releasePointerCapture(event.pointerId);
  state.swipePointerId = null;
  state.swipeCaptured = false;
});
screen.addEventListener("pointercancel", (event) => {
  state.swipeActive = false;
  state.swipePointerId = null;
  state.swipeCaptured = false;
  state.homeTracking = false;
  $("homeHitbox").classList.remove("pressed");
  if (event && screen.hasPointerCapture?.(event.pointerId)) screen.releasePointerCapture(event.pointerId);
});
screen.addEventListener("wheel", (event) => {
  if (blockTutorialInteraction(event)) return;
  noteUserActivity();
  const now = performance.now();
  if (now < state.wheelLockUntil) {
    event.preventDefault();
    return;
  }
  if (state.screen !== "bbp") return;
  if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) + 10 || Math.abs(event.deltaX) < 28) return;
  if (handleSwipeDelta(event.deltaX > 0 ? -120 : 120, 0, event)) {
    state.wheelLockUntil = now + BBP_WHEEL_SWIPE_COOLDOWN_MS;
  }
}, { passive: false });

$("sleepOverlay")?.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  event.stopPropagation();
  noteUserActivity();
});

$("sleepOverlay")?.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
});

$("resetBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  noteUserActivity();
  resetAll();
});
$("mountBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  noteUserActivity();
  toggleBeybladeAttached();
});
$("shotBtn").addEventListener("click", (event) => {
  if (blockTutorialInteraction(event)) return;
  noteUserActivity();
  simulateShot();
});
$("tutorialOpenBtn")?.addEventListener("click", () => {
  noteUserActivity();
  if (state.tutorialActive && !state.tutorialDone) {
    state.tutorialOpen = !state.tutorialOpen;
    renderTutorial();
    return;
  }
  if (state.tutorialDone || loadTutorialDone()) {
    openTutorialReviewMenu();
    return;
  }
  startTutorial();
});
$("tutorialCloseBtn")?.addEventListener("click", () => {
  noteUserActivity();
  closeTutorialPanel();
});
$("tutorialBackBtn")?.addEventListener("click", () => {
  noteUserActivity();
  moveTutorialStep(-1);
});
$("tutorialNextBtn")?.addEventListener("click", () => {
  noteUserActivity();
  nextTutorialStep();
});
$("tutorialSkipBtn")?.addEventListener("click", () => {
  noteUserActivity();
  skipTutorialStep();
});

window.addEventListener("pagehide", () => {
  if (state.bootStartedAt) persistRuntimeTotal(currentTotalRuntimeMs());
});

window.addEventListener("resize", updateViewportScale);
window.addEventListener("resize", () => renderTutorial());
window.addEventListener("scroll", () => updateTutorialHighlight(), { passive: true });
window.visualViewport?.addEventListener("resize", updateViewportScale);
window.visualViewport?.addEventListener("resize", () => renderTutorial());
window.visualViewport?.addEventListener("scroll", updateViewportScale);
window.visualViewport?.addEventListener("scroll", () => updateTutorialHighlight());
document.addEventListener("selectstart", (event) => {
  if (event.target instanceof Element &&
      event.target.closest(".layout, .screen, .control-panel, .tutorial-panel, .tutorial-highlight")) {
    event.preventDefault();
  }
});
document.addEventListener("dragstart", (event) => {
  if (event.target instanceof Element &&
      event.target.closest(".layout, .screen, .control-panel, .tutorial-panel, .tutorial-highlight")) {
    event.preventDefault();
  }
});
document.addEventListener("contextmenu", (event) => {
  if (event.target instanceof Element &&
      event.target.closest(".layout, .screen, .control-panel, .tutorial-panel, .tutorial-highlight")) {
    event.preventDefault();
  }
});
document.addEventListener("copy", (event) => {
  if (event.target instanceof Element && event.target.closest(".layout")) {
    event.preventDefault();
  }
});
document.addEventListener("cut", (event) => {
  if (event.target instanceof Element && event.target.closest(".layout")) {
    event.preventDefault();
  }
});
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection?.();
  if (!selection || selection.isCollapsed) return;
  const anchor = selection.anchorNode?.parentElement;
  const focus = selection.focusNode?.parentElement;
  if (anchor?.closest(".layout") || focus?.closest(".layout")) selection.removeAllRanges();
});

if (state.tutorialActive && !state.tutorialDone) {
  state.tutorialStep = tutorialChapterStartIndex("powerBasics");
}

updateViewportScale();
state.clockTimer = setInterval(tickTimeSurfaces, 50);
showScreen("off");
setPage("scan");
render();
