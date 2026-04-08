# Android APK bauen

Die Web-App liegt jetzt zusätzlich als natives Android-Projekt unter [`android/`](/Users/user/Documents/WebApps/Würfelspiel (wfs)/android) vor.

## Was bereits umgesetzt ist

- Lokale Auslieferung der App-Dateien aus `app/src/main/assets/public`
- Native Android-Hülle mit `WebViewAssetLoader`
- Tablet-optimiertes Layout in der Web-App
- Datei-Import aus dem Android-Dateipicker
- JSON-Export direkt in den Download-Ordner

## APK bauen

1. Installiere Android Studio mit Android SDK und JDK 17.
2. Öffne den Ordner [`android/`](/Users/user/Documents/WebApps/Würfelspiel (wfs)/android) in Android Studio.
3. Warte, bis Gradle synchronisiert ist.
4. Wähle `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
5. Die Debug-APK liegt danach typischerweise unter `android/app/build/outputs/apk/debug/`.

## Hinweise

- In dieser Umgebung konnte ich die APK nicht selbst bauen, weil weder Java noch Android/Gradle lokal verfügbar sind.
- Wenn du die Web-App weiter änderst, sollten die Dateien in `android/app/src/main/assets/public/` mit der Root-Version synchron bleiben.
