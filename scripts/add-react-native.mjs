/**
 * One-off migration: append the "react-native" stack entries to knowledge-base.json.
 *
 * Covers React Native targeting Web (react-native-web), Android, and iOS.
 * Run from repo root:  node scripts/add-react-native.mjs
 *
 * knowledge-base.json remains the single source of truth; re-run export-to-neon.mjs
 * afterwards to rebuild the Neon table with both stacks.
 */
import { readFileSync, writeFileSync } from "fs";

const STACK = "react-native";

// Helper to reduce repetition; fills defaults and forces the stack value.
const e = (o) => ({
  type: o.type,
  symptoms: o.symptoms,
  root_cause: o.root_cause,
  fix: o.fix,
  tags: o.tags,
  severity: o.severity ?? "medium",
  frequency: o.frequency ?? "common",
  related_docs: o.related_docs ?? [],
  version: o.version ?? "react-native@0.74+",
  stack: STACK,
});

const entries = [
  // ---------------------------------------------------------------- setup / env
  e({
    type: "config_issue",
    symptoms: ["Metro can't find watchman", "fs.watch limit reached on Linux", "ENOSPC: System limit for number of file watchers reached"],
    root_cause: "Metro relies on file watching; on Linux the inotify watch limit is too low and Watchman may be missing.",
    fix: [
      "Install Watchman: 'brew install watchman' (macOS) or build from source on Linux",
      "On Linux raise the limit: echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p",
      "Clear Metro cache: npx react-native start --reset-cache",
    ],
    tags: ["metro", "watchman", "setup", "android", "ios", "tooling"],
    severity: "medium",
    related_docs: ["https://facebook.github.io/watchman/docs/install"],
  }),
  e({
    type: "best_practice",
    symptoms: ["choosing between Expo and bare React Native", "unsure which workflow to use"],
    root_cause: "Teams pick the wrong workflow and later fight ejection or missing native modules.",
    fix: [
      "Default to Expo (managed) with config plugins — it supports most native modules via prebuild",
      "Use 'npx expo prebuild' to generate ios/ and android/ when you need custom native code, instead of fully ejecting",
      "Choose bare RN only when you must heavily customize native build pipelines from day one",
    ],
    tags: ["expo", "bare-workflow", "architecture", "setup", "decision"],
    severity: "low",
    frequency: "common",
    related_docs: ["https://docs.expo.dev/workflow/overview/"],
    version: "expo@51+",
  }),
  e({
    type: "error",
    symptoms: ["error: EMFILE: too many open files, watch", "Metro crashes on start (macOS)"],
    root_cause: "macOS default file descriptor limit is exceeded by Metro's watcher without Watchman.",
    fix: [
      "Install and start Watchman: brew install watchman",
      "If it persists: watchman watch-del-all && watchman shutdown-server",
      "Restart Metro with --reset-cache",
    ],
    tags: ["metro", "watchman", "ios", "macos", "emfile"],
    severity: "medium",
  }),

  // ---------------------------------------------------------------- metro bundler
  e({
    type: "config_issue",
    symptoms: ["Unable to resolve module from project", "module works in Node but not Metro", "import alias not resolved"],
    root_cause: "Metro has its own resolver and does not read tsconfig/jsconfig path aliases by default.",
    fix: [
      "Add aliases in metro.config.js via resolver.extraNodeModules or use babel-plugin-module-resolver",
      "Keep tsconfig 'paths' in sync with the babel/metro alias config",
      "Restart with --reset-cache after changing resolver config",
    ],
    tags: ["metro", "module-resolution", "aliases", "babel", "typescript"],
    severity: "medium",
    related_docs: ["https://metrobundler.dev/docs/configuration"],
  }),
  e({
    type: "fix_snippet",
    symptoms: ["need to import SVG/JSON/custom asset types in Metro"],
    root_cause: "Metro only bundles known asset/source extensions unless configured.",
    fix: [
      "For SVG: npm i react-native-svg react-native-svg-transformer, set transformer.babelTransformerPath and resolver.sourceExts/assetExts in metro.config.js",
      "Add custom extensions to resolver.sourceExts",
      "Restart Metro with --reset-cache",
    ],
    tags: ["metro", "svg", "assets", "transformer", "android", "ios"],
    severity: "low",
    related_docs: ["https://github.com/kristerkari/react-native-svg-transformer"],
  }),
  e({
    type: "diagnostic_step",
    symptoms: ["stale bundle after dependency change", "old code still running after edit", "red screen referencing deleted file"],
    root_cause: "Metro and native build caches serve stale artifacts.",
    fix: [
      "Stop Metro, then: npx react-native start --reset-cache",
      "Clear watchman: watchman watch-del-all",
      "Delete node_modules/.cache and reinstall if needed; for iOS clear DerivedData, for Android run ./gradlew clean",
    ],
    tags: ["metro", "cache", "troubleshooting", "android", "ios"],
    severity: "medium",
    frequency: "very-common",
  }),

  // ---------------------------------------------------------------- navigation
  e({
    type: "code_pattern",
    symptoms: ["setting up navigation", "need stack/tab navigation"],
    root_cause: "Navigation requires correct provider setup and native dependencies.",
    fix: [
      "Install @react-navigation/native plus react-native-screens and react-native-safe-area-context",
      "Wrap the app root in <NavigationContainer>",
      "Use @react-navigation/native-stack (native perf) over the JS stack where possible",
    ],
    tags: ["react-navigation", "navigation", "setup", "android", "ios"],
    severity: "low",
    related_docs: ["https://reactnavigation.org/docs/getting-started"],
    version: "@react-navigation/native@6+",
  }),
  e({
    type: "bug_fix",
    symptoms: ["white/blank screen with react-native-screens", "navigation crashes on Android after enableScreens"],
    root_cause: "react-native-screens not linked/configured, or MainActivity missing the fragment fix on Android.",
    fix: [
      "Ensure react-native-screens is installed and pods are reinstalled (iOS)",
      "On Android add the onCreate(null) override in MainActivity per the docs to avoid fragment state crash",
      "Rebuild the native app (not just reload JS)",
    ],
    tags: ["react-native-screens", "navigation", "android", "crash"],
    severity: "high",
    related_docs: ["https://reactnavigation.org/docs/react-native-screens"],
  }),
  e({
    type: "code_pattern",
    symptoms: ["file-based routing in Expo", "want Next.js-like routing in RN"],
    root_cause: "expo-router provides file-based routing across iOS, Android, and web.",
    fix: [
      "Install expo-router and set 'main' to expo-router/entry",
      "Create app/ directory with _layout.tsx and route files",
      "Use the same routes for web export (expo export -p web)",
    ],
    tags: ["expo-router", "navigation", "web", "ios", "android", "routing"],
    severity: "low",
    related_docs: ["https://docs.expo.dev/router/introduction/"],
    version: "expo-router@3+",
  }),

  // ---------------------------------------------------------------- platform code + web
  e({
    type: "code_pattern",
    symptoms: ["need different code per platform", "iOS vs Android vs web behavior differs"],
    root_cause: "Platform differences require branching or platform-specific files.",
    fix: [
      "Use Platform.OS ('ios' | 'android' | 'web') or Platform.select({ ios, android, web, default })",
      "Use platform extensions: Component.ios.tsx, Component.android.tsx, Component.web.tsx (Metro picks automatically)",
      "Keep shared logic in a base file and isolate platform code in the extensions",
    ],
    tags: ["platform", "cross-platform", "web", "ios", "android", "patterns"],
    severity: "low",
    frequency: "very-common",
    related_docs: ["https://reactnative.dev/docs/platform-specific-code"],
  }),
  e({
    type: "config_issue",
    symptoms: ["react-native-web not rendering", "web build fails to resolve react-native", "DOM not produced"],
    root_cause: "react-native imports must be aliased to react-native-web for the web target, and the web entry must register the app.",
    fix: [
      "Install react-native-web and react-dom; with Expo this is preconfigured",
      "For custom webpack/vite, alias 'react-native' -> 'react-native-web' and add appropriate extensions (.web.tsx first)",
      "Register the root with AppRegistry.runApplication on web",
    ],
    tags: ["react-native-web", "web", "webpack", "aliasing", "setup"],
    severity: "high",
    related_docs: ["https://necolas.github.io/react-native-web/docs/setup/"],
    version: "react-native-web@0.19+",
  }),
  e({
    type: "anti_pattern",
    symptoms: ["using onPress handlers but no hover/focus on web", "no keyboard accessibility on web"],
    root_cause: "Mobile-only interaction patterns ignore web pointer, hover, and keyboard semantics.",
    fix: [
      "Use Pressable which exposes hovered/focused states for web",
      "Provide accessibilityRole and accessible props so keyboard/AT works on web",
      "Test tab order and focus rings in the browser",
    ],
    tags: ["react-native-web", "accessibility", "web", "pressable", "ux"],
    severity: "medium",
    related_docs: ["https://reactnative.dev/docs/pressable"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["shadow styles don't show on Android", "shadowColor/shadowOffset ignored on Android"],
    root_cause: "iOS uses shadow* props; Android uses elevation. Web uses boxShadow.",
    fix: [
      "Use elevation on Android, shadow* props on iOS, combine via Platform.select",
      "On react-native-web, boxShadow is supported; map accordingly",
      "Consider a cross-platform wrapper or a library that normalizes shadows",
    ],
    tags: ["styling", "shadow", "elevation", "android", "ios", "web"],
    severity: "low",
    frequency: "common",
  }),

  // ---------------------------------------------------------------- styling / layout
  e({
    type: "code_pattern",
    symptoms: ["content hidden behind notch/status bar", "UI under the home indicator"],
    root_cause: "Safe area insets are not applied on notched devices.",
    fix: [
      "Wrap app in SafeAreaProvider from react-native-safe-area-context",
      "Use SafeAreaView or useSafeAreaInsets() for fine control",
      "Avoid hardcoding status bar heights",
    ],
    tags: ["safe-area", "layout", "ios", "android", "notch"],
    severity: "medium",
    frequency: "very-common",
    related_docs: ["https://github.com/th3rdwave/react-native-safe-area-context"],
  }),
  e({
    type: "root_cause",
    symptoms: ["flex layout behaves differently than CSS", "items not filling as expected"],
    root_cause: "React Native defaults to flexDirection 'column' and position 'relative', unlike the web's 'row'/'static'.",
    fix: [
      "Set flexDirection explicitly when you expect row layout",
      "Remember default alignItems is 'stretch'",
      "Use flex: 1 on containers that must fill available space",
    ],
    tags: ["flexbox", "layout", "styling", "web", "gotcha"],
    severity: "low",
    frequency: "common",
    related_docs: ["https://reactnative.dev/docs/flexbox"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["keyboard covers TextInput", "input hidden when keyboard opens"],
    root_cause: "No keyboard avoidance configured.",
    fix: [
      "Wrap forms in KeyboardAvoidingView with behavior='padding' on iOS and 'height'/undefined on Android",
      "For lists/scroll use a library like react-native-keyboard-aware-scroll-view or react-native-keyboard-controller",
      "Set android:windowSoftInputMode appropriately in AndroidManifest",
    ],
    tags: ["keyboard", "textinput", "ios", "android", "forms"],
    severity: "medium",
    frequency: "very-common",
  }),

  // ---------------------------------------------------------------- android build
  e({
    type: "error",
    symptoms: ["Execution failed for task ':app:processDebugResources'", "Android resource linking failed"],
    root_cause: "Mismatched compileSdk/targetSdk, duplicate resources, or a library requiring a newer SDK.",
    fix: [
      "Align compileSdkVersion/targetSdkVersion in android/build.gradle with library requirements",
      "Run ./gradlew clean and rebuild",
      "Check for duplicate resource names across modules",
    ],
    tags: ["android", "gradle", "build", "resources", "sdk"],
    severity: "high",
    frequency: "common",
  }),
  e({
    type: "error",
    symptoms: ["Could not determine java version", "Unsupported class file major version", "Gradle build fails on JDK"],
    root_cause: "Installed JDK version is incompatible with the Android Gradle Plugin.",
    fix: [
      "Use a supported JDK (commonly JDK 17 for AGP 8.x); set JAVA_HOME accordingly",
      "Pin gradle distributionUrl to a compatible version",
      "Verify with ./gradlew --version inside android/",
    ],
    tags: ["android", "gradle", "jdk", "java", "build"],
    severity: "high",
    related_docs: ["https://developer.android.com/build/releases/gradle-plugin"],
  }),
  e({
    type: "config_issue",
    symptoms: ["release APK crashes immediately", "works in debug, crashes in release"],
    root_cause: "ProGuard/R8 minification strips classes, or release signing/Hermes config differs from debug.",
    fix: [
      "Add ProGuard keep rules for native modules that use reflection",
      "Test with: cd android && ./gradlew assembleRelease, then install the APK",
      "Verify Hermes is enabled consistently and signing config is correct",
    ],
    tags: ["android", "release", "proguard", "r8", "minification", "crash"],
    severity: "high",
  }),
  e({
    type: "fix_snippet",
    symptoms: ["need a release keystore", "how to sign Android app"],
    root_cause: "Release builds require a signing keystore configured in Gradle.",
    fix: [
      "Generate: keytool -genkeypair -v -keystore release.keystore -alias mykey -keyalg RSA -keysize 2048 -validity 10000",
      "Store credentials in ~/.gradle/gradle.properties (never commit them)",
      "Reference signingConfigs.release in android/app/build.gradle; or use EAS managed credentials",
    ],
    tags: ["android", "signing", "keystore", "release", "security"],
    severity: "medium",
    related_docs: ["https://reactnative.dev/docs/signed-apk-android"],
  }),
  e({
    type: "error",
    symptoms: ["Duplicate class found in modules", "Program type already present"],
    root_cause: "Two dependencies pull conflicting versions of the same library (e.g., AndroidX/support).",
    fix: [
      "Run ./gradlew app:dependencies to find the conflict",
      "Force a single version via resolutionStrategy in android/build.gradle",
      "Enable Jetifier if a legacy support-lib dependency remains",
    ],
    tags: ["android", "gradle", "duplicate-class", "dependencies"],
    severity: "high",
  }),

  // ---------------------------------------------------------------- ios build
  e({
    type: "error",
    symptoms: ["pod install fails", "CocoaPods could not find compatible versions", "Specs repo out of date"],
    root_cause: "Stale CocoaPods spec repo or incompatible pod versions.",
    fix: [
      "cd ios && pod repo update && pod install",
      "If using Expo, run 'npx expo prebuild --clean' to regenerate the ios project",
      "Delete ios/Pods and Podfile.lock then reinstall if conflicts persist",
    ],
    tags: ["ios", "cocoapods", "pods", "build"],
    severity: "high",
    frequency: "common",
    related_docs: ["https://guides.cocoapods.org/"],
  }),
  e({
    type: "error",
    symptoms: ["Signing for app requires a development team", "No profiles for bundle identifier found", "Xcode code signing error"],
    root_cause: "Missing Apple development team / provisioning profile in Xcode.",
    fix: [
      "Open ios/*.xcworkspace in Xcode, select the target → Signing & Capabilities, choose a Team",
      "Enable 'Automatically manage signing' for development",
      "For CI/release use EAS credentials or manual provisioning profiles",
    ],
    tags: ["ios", "code-signing", "provisioning", "xcode", "release"],
    severity: "high",
    related_docs: ["https://docs.expo.dev/app-signing/app-credentials/"],
  }),
  e({
    type: "error",
    symptoms: ["Sandbox: rsync.samba ... permission denied", "ios build fails on Xcode 15 with sandbox error"],
    root_cause: "Xcode 15 user script sandboxing blocks RN build scripts.",
    fix: [
      "Set ENABLE_USER_SCRIPT_SANDBOXING = NO in the project build settings",
      "Clean DerivedData and rebuild",
      "Update react-native to a version that patches the build phase",
    ],
    tags: ["ios", "xcode", "sandbox", "build", "rsync"],
    severity: "high",
    version: "xcode@15+",
  }),
  e({
    type: "diagnostic_step",
    symptoms: ["weird iOS build errors after dependency change", "linker errors that make no sense"],
    root_cause: "Stale Xcode DerivedData / Pods cache.",
    fix: [
      "Delete ~/Library/Developer/Xcode/DerivedData",
      "cd ios && rm -rf Pods Podfile.lock && pod install",
      "In Xcode: Product → Clean Build Folder (Shift+Cmd+K), then rebuild",
    ],
    tags: ["ios", "xcode", "deriveddata", "cache", "cocoapods"],
    severity: "medium",
    frequency: "common",
  }),
  e({
    type: "config_issue",
    symptoms: ["app rejected: missing usage description", "crash when accessing camera/location on iOS"],
    root_cause: "iOS requires Info.plist usage description strings for protected resources.",
    fix: [
      "Add NSCameraUsageDescription, NSLocationWhenInUseUsageDescription, etc. to Info.plist",
      "With Expo, set them via the relevant config plugin in app.json",
      "Re-run prebuild/pod install and rebuild",
    ],
    tags: ["ios", "permissions", "info-plist", "privacy"],
    severity: "high",
    related_docs: ["https://developer.apple.com/documentation/bundleresources/information_property_list"],
  }),

  // ---------------------------------------------------------------- hermes / new arch
  e({
    type: "config_issue",
    symptoms: ["want smaller bundle and faster startup", "should I enable Hermes"],
    root_cause: "Hermes is the optimized JS engine for RN and is the default on recent versions.",
    fix: [
      "Keep Hermes enabled (default in RN 0.70+) for faster startup and lower memory",
      "Generate Hermes source maps for production stack traces",
      "If a dependency assumes JSC, verify Hermes compatibility before disabling",
    ],
    tags: ["hermes", "performance", "engine", "android", "ios"],
    severity: "low",
    related_docs: ["https://reactnative.dev/docs/hermes"],
  }),
  e({
    type: "diagnostic_step",
    symptoms: ["enabling the New Architecture", "Fabric/TurboModules migration issues"],
    root_cause: "The New Architecture (Fabric renderer + TurboModules) requires compatible libraries and interop config.",
    fix: [
      "Enable via newArchEnabled=true (Android gradle.properties) and RCT_NEW_ARCH_ENABLED=1 (iOS pod install)",
      "Audit native dependencies for New Architecture support; use the interop layer for legacy modules",
      "Test thoroughly on both platforms; roll out gradually",
    ],
    tags: ["new-architecture", "fabric", "turbomodules", "android", "ios", "migration"],
    severity: "medium",
    frequency: "rare",
    related_docs: ["https://reactnative.dev/docs/the-new-architecture/landing-page"],
    version: "react-native@0.74+",
  }),

  // ---------------------------------------------------------------- performance
  e({
    type: "performance_case",
    symptoms: ["long list janky/slow", "ScrollView with many items freezes", "high memory with large lists"],
    root_cause: "ScrollView renders all children; large lists must be virtualized.",
    fix: [
      "Use FlatList/SectionList (or FlashList) instead of ScrollView for long lists",
      "Provide keyExtractor and a memoized renderItem; set getItemLayout for fixed heights",
      "Tune windowSize/initialNumToRender/maxToRenderPerBatch; consider @shopify/flash-list",
    ],
    tags: ["performance", "flatlist", "flashlist", "lists", "android", "ios"],
    severity: "high",
    frequency: "very-common",
    related_docs: ["https://shopify.github.io/flash-list/"],
  }),
  e({
    type: "anti_pattern",
    symptoms: ["unnecessary re-renders", "UI lags on state change"],
    root_cause: "Inline functions/objects and unmemoized components cause re-render storms.",
    fix: [
      "Memoize components with React.memo and callbacks with useCallback",
      "Avoid creating new style/array/object literals inline in hot paths",
      "Use a profiler (React DevTools, Flipper) to find the offending renders",
    ],
    tags: ["performance", "re-renders", "memoization", "react"],
    severity: "medium",
    frequency: "common",
  }),
  e({
    type: "best_practice",
    symptoms: ["animations drop frames", "JS-driven animation stutters"],
    root_cause: "Animations on the JS thread compete with business logic.",
    fix: [
      "Use react-native-reanimated to run animations on the UI thread (worklets)",
      "For Animated API, set useNativeDriver: true where supported",
      "Avoid animating layout properties that trigger expensive relayout",
    ],
    tags: ["performance", "animation", "reanimated", "native-driver", "ios", "android"],
    severity: "medium",
    related_docs: ["https://docs.swmansion.com/react-native-reanimated/"],
  }),
  e({
    type: "performance_case",
    symptoms: ["images slow or memory heavy", "scrolling images causes jank"],
    root_cause: "Default Image lacks caching/downsampling for large remote images.",
    fix: [
      "Use expo-image (or FastImage) for disk/memory caching and better decoding",
      "Resize images server-side or request appropriately sized variants",
      "Set explicit width/height and use contentFit to avoid layout thrash",
    ],
    tags: ["performance", "images", "expo-image", "caching", "memory"],
    severity: "medium",
    related_docs: ["https://docs.expo.dev/versions/latest/sdk/image/"],
  }),

  // ---------------------------------------------------------------- networking
  e({
    type: "config_issue",
    symptoms: ["network request fails on Android release", "HTTP request blocked", "cleartext traffic not permitted"],
    root_cause: "Android blocks cleartext (HTTP) traffic by default since API 28.",
    fix: [
      "Use HTTPS endpoints",
      "If HTTP is required for dev only, set android:usesCleartextTraffic via a network security config (not in production)",
      "Verify the device/emulator can reach the host (localhost = 10.0.2.2 on Android emulator)",
    ],
    tags: ["android", "networking", "cleartext", "https", "security"],
    severity: "high",
    related_docs: ["https://developer.android.com/training/articles/security-config"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["fetch to localhost fails on device", "API works on simulator not on phone"],
    root_cause: "localhost on a physical device points to the device itself, not your dev machine.",
    fix: [
      "Use your machine's LAN IP (e.g., http://192.168.x.x:3000) for physical devices",
      "Android emulator maps host loopback to 10.0.2.2; iOS simulator can use localhost",
      "Ensure firewall allows the port and device is on the same network",
    ],
    tags: ["networking", "localhost", "android", "ios", "device", "debugging"],
    severity: "medium",
    frequency: "common",
  }),
  e({
    type: "bug_fix",
    symptoms: ["CORS error only on web build", "request blocked by browser in react-native-web"],
    root_cause: "On web, fetch runs in the browser and is subject to CORS; native apps are not.",
    fix: [
      "Enable proper CORS headers on the API for the web origin",
      "Use a dev proxy for local web development",
      "Branch behavior with Platform.OS==='web' where the network model differs",
    ],
    tags: ["web", "cors", "networking", "react-native-web"],
    severity: "medium",
  }),

  // ---------------------------------------------------------------- storage
  e({
    type: "code_pattern",
    symptoms: ["need to persist small key/value data", "AsyncStorage usage"],
    root_cause: "Local persistence requires an async storage layer.",
    fix: [
      "Use @react-native-async-storage/async-storage for simple key/value (string only)",
      "Serialize objects with JSON.stringify/parse",
      "For performance-critical or larger data, prefer react-native-mmkv (synchronous, fast)",
    ],
    tags: ["storage", "async-storage", "mmkv", "persistence", "android", "ios"],
    severity: "low",
    frequency: "very-common",
    related_docs: ["https://react-native-async-storage.github.io/async-storage/"],
  }),
  e({
    type: "best_practice",
    symptoms: ["storing tokens/secrets", "where to keep auth tokens securely"],
    root_cause: "AsyncStorage is not encrypted; secrets need secure storage.",
    fix: [
      "Use expo-secure-store or react-native-keychain (Keychain on iOS, Keystore on Android)",
      "Never store secrets in AsyncStorage or in plaintext",
      "On web, secure storage is limited — prefer httpOnly cookies via your backend",
    ],
    tags: ["security", "secure-store", "keychain", "tokens", "ios", "android", "web"],
    severity: "high",
    related_docs: ["https://docs.expo.dev/versions/latest/sdk/securestore/"],
  }),

  // ---------------------------------------------------------------- native modules / linking
  e({
    type: "error",
    symptoms: ["null is not an object (evaluating 'RNSomething')", "native module X is not available", "undefined is not an object NativeModules"],
    root_cause: "A native module isn't linked or the app wasn't rebuilt after install.",
    fix: [
      "Rebuild the native app (npx expo run:ios/android or via Xcode/Android Studio) — JS reload is not enough",
      "iOS: re-run pod install; autolinking handles most modules in RN 0.60+",
      "Confirm the module supports your platform (some are mobile-only and break on web)",
    ],
    tags: ["native-modules", "autolinking", "android", "ios", "crash"],
    severity: "high",
    frequency: "common",
    related_docs: ["https://github.com/react-native-community/cli/blob/main/docs/autolinking.md"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["library crashes on web", "native-only module imported in web bundle"],
    root_cause: "A native-only dependency has no web implementation and breaks the web build.",
    fix: [
      "Guard usage behind Platform.OS !== 'web' and lazy-import the module",
      "Provide a .web.tsx stub implementation",
      "Check if the library ships a react-native-web compatible build",
    ],
    tags: ["web", "native-modules", "react-native-web", "platform"],
    severity: "medium",
  }),

  // ---------------------------------------------------------------- debugging
  e({
    type: "diagnostic_step",
    symptoms: ["how to debug RN app", "need to inspect network/state"],
    root_cause: "Debugging RN needs the right tooling per concern.",
    fix: [
      "Use the React Native DevTools (built-in, press 'j' in Metro) for console/breakpoints",
      "Use React DevTools for component tree and profiling",
      "Use Reactotron or Flipper for network/state inspection where supported",
    ],
    tags: ["debugging", "devtools", "flipper", "tooling"],
    severity: "low",
    related_docs: ["https://reactnative.dev/docs/debugging"],
  }),
  e({
    type: "log_pattern",
    symptoms: ["Warning: Each child in a list should have a unique key prop", "list keys warning in console"],
    root_cause: "List items rendered without stable unique keys.",
    fix: [
      "Provide a stable keyExtractor for FlatList or unique key when mapping",
      "Do not use array index as key for dynamic/reorderable lists",
      "Ensure ids are unique across the dataset",
    ],
    tags: ["warning", "lists", "keys", "react"],
    severity: "low",
    frequency: "very-common",
  }),

  // ---------------------------------------------------------------- EAS / build / OTA
  e({
    type: "recipe",
    symptoms: ["how to build app binaries in the cloud", "no Mac for iOS builds"],
    root_cause: "Local native builds need platform toolchains; EAS Build runs them in the cloud.",
    fix: [
      "Install eas-cli, run 'eas build:configure'",
      "Build with 'eas build -p ios' / '-p android' (iOS build needs no local Mac)",
      "Submit with 'eas submit' to the App Store/Play Store",
    ],
    tags: ["eas", "expo", "build", "ci", "ios", "android"],
    severity: "low",
    related_docs: ["https://docs.expo.dev/build/introduction/"],
  }),
  e({
    type: "recipe",
    symptoms: ["push JS-only updates without app store review", "OTA updates"],
    root_cause: "JS/asset changes can ship over-the-air without a new binary.",
    fix: [
      "Use expo-updates with EAS Update; configure runtimeVersion policy",
      "Publish with 'eas update --branch production'",
      "Remember native changes still require a new build; only JS/assets go OTA",
    ],
    tags: ["eas-update", "ota", "expo-updates", "deployment", "ios", "android"],
    severity: "medium",
    related_docs: ["https://docs.expo.dev/eas-update/introduction/"],
  }),
  e({
    type: "checklist",
    symptoms: ["preparing first app store / play store release"],
    root_cause: "Store submissions have many easy-to-miss requirements.",
    fix: [
      "Set unique bundle identifier/package name, version, and build number",
      "Provide app icons, splash, privacy policy, and required usage descriptions",
      "Build release binaries, test on real devices, then 'eas submit' or upload manually",
    ],
    tags: ["release", "app-store", "play-store", "checklist", "ios", "android"],
    severity: "medium",
  }),

  // ---------------------------------------------------------------- notifications / deep links
  e({
    type: "config_issue",
    symptoms: ["push notifications not received", "no device token"],
    root_cause: "Push requires platform credentials (APNs key for iOS, FCM for Android) and permission prompts.",
    fix: [
      "Request permission and fetch the token with expo-notifications (or your provider SDK)",
      "Configure APNs auth key (iOS) and FCM server credentials (Android), e.g. via EAS credentials",
      "Test on a physical device — push does not work on iOS simulators",
    ],
    tags: ["push-notifications", "apns", "fcm", "ios", "android", "expo-notifications"],
    severity: "high",
    related_docs: ["https://docs.expo.dev/push-notifications/overview/"],
  }),
  e({
    type: "config_issue",
    symptoms: ["deep link doesn't open app", "universal links / app links not working"],
    root_cause: "Deep linking requires URL scheme/associated-domain config plus navigation linking setup.",
    fix: [
      "Define a scheme (app.json scheme) and configure react-navigation/expo-router linking",
      "iOS Universal Links: add Associated Domains + apple-app-site-association file on your domain",
      "Android App Links: add intent filters + assetlinks.json; verify with adb",
    ],
    tags: ["deep-linking", "universal-links", "app-links", "ios", "android", "navigation"],
    severity: "medium",
    related_docs: ["https://reactnavigation.org/docs/deep-linking"],
  }),

  // ---------------------------------------------------------------- gestures / fonts / svg
  e({
    type: "bug_fix",
    symptoms: ["gestures not working", "swipe/pan handlers do nothing", "navigation gestures broken"],
    root_cause: "react-native-gesture-handler root setup missing.",
    fix: [
      "Wrap the app root in GestureHandlerRootView with flex: 1",
      "Ensure the import is at the very top of index.js for older setups",
      "Rebuild the native app after installing",
    ],
    tags: ["gesture-handler", "gestures", "android", "ios", "setup"],
    severity: "medium",
    related_docs: ["https://docs.swmansion.com/react-native-gesture-handler/"],
  }),
  e({
    type: "code_pattern",
    symptoms: ["custom fonts not loading", "fontFamily has no effect"],
    root_cause: "Fonts must be bundled and loaded before use.",
    fix: [
      "Expo: load with useFonts/expo-font and gate rendering until loaded",
      "Bare: add font files and link via react-native.config.js + npx react-native-asset",
      "Reference the exact PostScript/font family name, which can differ from the filename",
    ],
    tags: ["fonts", "expo-font", "assets", "ios", "android", "web"],
    severity: "low",
    related_docs: ["https://docs.expo.dev/develop/user-interface/fonts/"],
  }),

  // ---------------------------------------------------------------- env / config / ts
  e({
    type: "best_practice",
    symptoms: ["managing env variables", "secrets in the bundle"],
    root_cause: "Anything bundled into the app is readable; env handling differs from server apps.",
    fix: [
      "Use EXPO_PUBLIC_ prefix (Expo) or react-native-config for public config",
      "Never ship real secrets in the app bundle; keep them server-side",
      "Use EAS environment variables/secrets for build-time values",
    ],
    tags: ["env", "configuration", "secrets", "security", "expo"],
    severity: "medium",
    related_docs: ["https://docs.expo.dev/guides/environment-variables/"],
  }),
  e({
    type: "config_issue",
    symptoms: ["TypeScript path aliases not resolving at runtime", "TS ok but Metro errors"],
    root_cause: "TS only checks types; runtime resolution is Metro/Babel's job.",
    fix: [
      "Add babel-plugin-module-resolver with matching aliases in babel.config.js",
      "Keep tsconfig.json 'paths' in sync",
      "Restart Metro with --reset-cache after changes",
    ],
    tags: ["typescript", "aliases", "babel", "metro", "configuration"],
    severity: "medium",
  }),

  // ---------------------------------------------------------------- testing
  e({
    type: "recipe",
    symptoms: ["how to unit test components", "testing RN UI"],
    root_cause: "RN needs a configured Jest preset and a component testing library.",
    fix: [
      "Use the react-native (or jest-expo) Jest preset",
      "Use @testing-library/react-native for behavior-focused component tests",
      "Mock native modules in jest setup to avoid 'native module not found' in tests",
    ],
    tags: ["testing", "jest", "react-native-testing-library", "unit-tests"],
    severity: "low",
    related_docs: ["https://callstack.github.io/react-native-testing-library/"],
  }),
  e({
    type: "recipe",
    symptoms: ["end-to-end testing on device/simulator", "E2E for RN"],
    root_cause: "E2E needs a gray-box runner that drives the real app.",
    fix: [
      "Use Detox for iOS/Android E2E with synchronization",
      "Use Maestro for simpler, YAML-based flows across platforms",
      "Run E2E in CI on simulators/emulators via EAS or your pipeline",
    ],
    tags: ["testing", "e2e", "detox", "maestro", "ios", "android"],
    severity: "low",
    related_docs: ["https://wix.github.io/Detox/"],
  }),

  // ---------------------------------------------------------------- web-specific integration
  e({
    type: "architecture",
    symptoms: ["share code between Next.js web and React Native app", "monorepo for RN + web"],
    root_cause: "Sharing UI/logic across RN and web needs a monorepo and react-native-web aliasing.",
    fix: [
      "Use a monorepo (pnpm/yarn workspaces, Turborepo) with shared packages",
      "Adopt Expo Router or Solito to share navigation between Next.js and RN",
      "Alias react-native to react-native-web in the Next.js build and transpile RN packages",
    ],
    tags: ["web", "monorepo", "nextjs", "solito", "react-native-web", "architecture"],
    severity: "medium",
    related_docs: ["https://solito.dev/"],
  }),
  e({
    type: "config_issue",
    symptoms: ["Next.js fails to compile react-native imports", "SyntaxError: Unexpected token export from react-native package"],
    root_cause: "RN packages ship untranspiled Flow/ESM that Next.js doesn't process by default.",
    fix: [
      "Add transpilePackages: ['react-native', 'react-native-web', ...] in next.config.js",
      "Alias 'react-native' -> 'react-native-web' in webpack config",
      "Ensure extensions resolve .web.js/.web.tsx first",
    ],
    tags: ["web", "nextjs", "react-native-web", "transpile", "build"],
    severity: "high",
    related_docs: ["https://necolas.github.io/react-native-web/docs/multi-platform/"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["hydration mismatch with react-native-web in Next.js SSR", "styles differ between server and client"],
    root_cause: "react-native-web style flushing must be wired into the SSR document.",
    fix: [
      "Use AppRegistry.getApplication to render to string and inject getStyleElement into the HTML head on the server",
      "Ensure the same RNW version on server and client",
      "Keep platform-conditional rendering deterministic between server and client",
    ],
    tags: ["web", "nextjs", "ssr", "hydration", "react-native-web"],
    severity: "medium",
  }),
  e({
    type: "doc",
    symptoms: ["what works differently on react-native-web", "RNW limitations"],
    root_cause: "Not every native API maps to the web.",
    fix: [
      "Layout, View/Text/Pressable, StyleSheet, and Animated/Reanimated work on web",
      "Native-only modules (camera, BLE, etc.) need web fallbacks or guards",
      "Test responsive behavior with Dimensions/useWindowDimensions and media-query-like logic",
    ],
    tags: ["web", "react-native-web", "compatibility", "reference"],
    severity: "low",
    related_docs: ["https://necolas.github.io/react-native-web/docs/"],
  }),

  // ---------------------------------------------------------------- misc common errors
  e({
    type: "error",
    symptoms: ["Invariant Violation: Module AppRegistry is not a registered callable module", "app fails to load after upgrade"],
    root_cause: "Bundle didn't load (Metro not running/connected) or a native/JS version mismatch.",
    fix: [
      "Confirm Metro is running and the app points to the right host/port",
      "Reset cache and rebuild the native app",
      "Verify react-native and react versions match the expected pairing",
    ],
    tags: ["error", "appregistry", "metro", "android", "ios"],
    severity: "high",
  }),
  e({
    type: "error",
    symptoms: ["Text strings must be rendered within a <Text> component"],
    root_cause: "A raw string is placed directly inside a View instead of a Text element.",
    fix: [
      "Wrap all text in <Text>...</Text>",
      "Check for stray strings/whitespace or conditional && that renders a string",
      "On web this is tolerated, so the bug often appears only on native",
    ],
    tags: ["error", "text", "rendering", "android", "ios", "gotcha"],
    severity: "medium",
    frequency: "very-common",
  }),
  e({
    type: "bug_fix",
    symptoms: ["VirtualizedList: You have a large list that is slow to update", "nested FlatList inside ScrollView warning"],
    root_cause: "Nesting a VirtualizedList inside a plain ScrollView of the same orientation breaks virtualization.",
    fix: [
      "Use a single FlatList and put extra content in ListHeaderComponent/ListFooterComponent",
      "For mixed content, use SectionList or a single virtualized list",
      "Avoid same-orientation nesting of scrollables",
    ],
    tags: ["performance", "flatlist", "scrollview", "virtualization", "warning"],
    severity: "medium",
  }),
  e({
    type: "diagnostic_step",
    symptoms: ["upgrading React Native version", "breaking changes after RN upgrade"],
    root_cause: "RN upgrades touch native template files that package managers don't update automatically.",
    fix: [
      "Use the React Native Upgrade Helper to diff template changes between versions",
      "For Expo, run 'npx expo install --fix' and follow the SDK upgrade guide",
      "Reinstall pods, clean Gradle, and rebuild both platforms after upgrading",
    ],
    tags: ["upgrade", "maintenance", "android", "ios", "expo"],
    severity: "medium",
    related_docs: ["https://react-native-community.github.io/upgrade-helper/"],
  }),
  e({
    type: "bug_fix",
    symptoms: ["app crashes on launch only on Android 13+", "POST_NOTIFICATIONS permission"],
    root_cause: "Android 13 (API 33) requires runtime permission for notifications and stricter intent rules.",
    fix: [
      "Request POST_NOTIFICATIONS at runtime before showing notifications",
      "Declare the permission in AndroidManifest",
      "Test on an API 33+ emulator/device",
    ],
    tags: ["android", "permissions", "notifications", "api-33"],
    severity: "medium",
  }),
];

const path = "./knowledge-base.json";
const kb = JSON.parse(readFileSync(path, "utf-8"));
const before = kb.length;
const merged = kb.concat(entries);
writeFileSync(path, JSON.stringify(merged, null, 2) + "\n");
console.log(`Appended ${entries.length} react-native entries: ${before} -> ${merged.length}`);
