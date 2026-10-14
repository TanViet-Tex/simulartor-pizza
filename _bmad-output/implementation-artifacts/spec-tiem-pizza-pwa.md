---
title: Install Tiệm Pizza as a standalone PWA
type: feature
created: 2026-10-14
status: done
route: oneshot
review_loop_iteration: 0
baseline_commit: 2a949c967a1ad9fab8589eb2338148623f384b3a
---

<frozen-after-approval reason="user explicitly requests manifest, supplied pizza icon and exact app name">

## Intent

Configure this game for launching from a home-screen icon without a browser address bar using display:standalone. App name and short_name, apple-mobile-web-app-title and document title are exactly Tiệm Pizza. Use the supplied square pizza image unchanged as the artwork for Android192/512 icons and iPhone180px apple-touch-icon. Retain all internal game headings, layout, gameplay, IndexedDB/checkpoint data and leaderboard behavior.

</frozen-after-approval>

## Implementation Notes

Small reversible packaging-only change: index.html metadata, public/manifest.webmanifest and PNG icon exports. Existing Vite base is relative; use relative manifest id/start_url/scope/icon URLs so root and same-origin directory hosting remain consistent. Browser startup remains the existing root menu without mode parameters. Include iOS capable=yes and default status bar (avoid changing safe-area layout). Keep theme color382019. No service worker/offline caching or new dependencies needed for the requested standalone installation; no runtime/save files will change.

Authoritative references: MDN display and installability docs confirm standalone excludes URL bar and current installability does not require a service worker; Apple Safari Web Content Guide specifies apple-touch-icon, app title and capable=yes. User request supersedes historical baseline's no-PWA restriction only for this packaging feature. No unresolved intent, migrations or external irreversible action; existing unrelated dirty artifacts remain excluded as previously authorized.

Verify production build, Chromium manifest parsing/assets and game boot; browser tests validate PNG dimensions, all four exact app-name fields, relative launch within scope and no registration/cache/storage mutation. Physical Android/iPhone home-screen installation requires device verification and will not be claimed as tested here. Record installation instructions and results in this file. Only configured blind review layer runs for this oneshot.

Icon provenance: source1254×1254 RGB, SHA256895db707ce613fbc2fdbc27894aa459acfdd85237fcc7d893b9a2345b0ca2716. PNG exports use full-frame Lanczos resizing only, with no crop, redraw, overlay or background change. The512px Android and180px Apple icons were visually inspected against the supplied attachment; artwork and composition match. Source is the user-provided attachment, not a generated image.

## Review Triage Log

- Medium / patched: CDP manifest inspection was unconditional and would fail WebKit. Guard that portion on browserName=chromium; all common metadata/icon/storage assertions remain cross-browser.
- Low / patched: dimension tests cannot prove the chosen artwork. Document exact source hash/export method and visual comparison of Android512 and Apple180 icons against the attachment.
- Maybe-false (medium, unverified) / deferred: installed Android/iPhone launches were not exercised. No incorrect configuration demonstrated; browser manifest and metadata are verified. Physical-device installation/launch checks are recorded for follow-up because no mobile device is available in this workspace; this does not block the requested configuration work.

Build and initial2/2 Chromium360×640 cases passed. Game JS bundle remains index-DcmLHS3T.js, byte-identical to the preceding audio build: no runtime/save code changed. Final browser checks rerun after the CDP portability patch.

## Installation and device check

On the HTTPS Vercel game link, Android Chrome: menu → Install app/Add to Home screen; iPhone Safari: Share → Add to Home Screen (enable Open as Web App if offered). Launch the new Tiệm Pizza icon and confirm chosen pizza artwork, application name, no address bar, playable menu and Continue/load behavior. Existing browser shortcuts may need removal and re-adding for updated name/icon. Do not delete browser data or uninstall an existing saved game to test this. Physical-device results are not claimed here. Opening the regular browser link remains a normal browser tab; standalone applies to installed launch.

Sources: [MDN standalone](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/display), [MDN installability](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [Apple web-app icon/title/standalone configuration](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

Final verification: production build passed;4/4 focused PWA cases passed on Chromium and WebKit360×640 after the portability patch. Chromium parsed the served manifest without errors. All PNG files returned correct MIME/signature/dimensions. Both browsers booted the existing menu and preserved an authentic CozySaveRepository checkpoint and localStorage sentinel across reload. Internal container title remained unchanged and no service worker was registered. No full viewport matrix was run. Review's two direct corrections are completed; only physical Android/iPhone home-screen launch remains unverified as recorded above. No remote publication performed.
