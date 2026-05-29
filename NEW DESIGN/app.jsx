/* app.jsx — root shell, routing, tweaks */
const { useEffect } = React;

const SCREENS = {
  dashboard: { title: "Dashboard", sub: "Your bullet bank at a glance", stepper: false },
  upload:    { title: "Resume Upload", sub: "Step 1 — bring in your existing resume", stepper: true },
  extract:   { title: "Verify Bullets", sub: "Step 2 — confirm what we extracted", stepper: true },
  tailor:    { title: "My Bullet Bank", sub: "Step 3 — tailor your bullets to a specific role", stepper: true },
  generate:  { title: "Resume Builder", sub: "Step 4 — review, score, and export", stepper: true },
};

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "dark",
  "accent": "champagne",
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useState("tailor");
  const go = (s) => setScreen(s);

  useEffect(() => {
    document.documentElement.dataset.theme = t.theme;
    document.documentElement.dataset.accent = t.accent === "platinum" ? "platinum" : "gold";
  }, [t.theme, t.accent]);

  const cfg = SCREENS[screen];
  const Body = {
    dashboard: Dashboard, upload: UploadScreen, extract: ExtractScreen,
    tailor: TailorScreen, generate: GenerateScreen,
  }[screen];

  const tailor = screen === "tailor";

  return (
    <div className={"app density-" + t.density}>
      <Sidebar screen={screen} go={go} />
      <div className="main">
        <TopBar title={cfg.title} sub={cfg.sub} screen={screen} go={go} showStepper={cfg.stepper} />
        <div className="canvas" style={tailor ? { overflow: "hidden", display: "flex", flexDirection: "column" } : null}>
          <Body go={go} />
        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Theme" />
        <TweakRadio label="Mode" value={t.theme} options={["dark", "light"]}
                    onChange={(v) => setTweak("theme", v)} />
        <TweakRadio label="Accent" value={t.accent} options={["champagne", "platinum"]}
                    onChange={(v) => setTweak("accent", v)} />
        <TweakSection label="Layout" />
        <TweakRadio label="Density" value={t.density} options={["comfortable", "roomy"]}
                    onChange={(v) => setTweak("density", v)} />
        <TweakSection label="Jump to step" />
        <TweakSelect label="Screen" value={screen}
                     options={["dashboard", "upload", "extract", "tailor", "generate"]}
                     onChange={(v) => setScreen(v)} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
