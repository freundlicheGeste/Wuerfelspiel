# Kniffel

Kniffel ist eine moderne digitale Variante des klassischen Würfelspiels. Die App ist für Smartphone und Tablet optimiert, funktioniert aber auch direkt als Browser-Spiel auf dem Desktop.

Das Spiel kombiniert klassisches Kniffel mit erweiterten Komfortfunktionen, anpassbaren Regeln, mehreren Anzeigeoptionen, Soundeffekten, Statistiken und verschiedenen Themes.

## Plattformen

Kniffel kann auf mehreren Wegen gespielt werden:

- Als Browser-Spiel im Desktop-Browser
- Auf Smartphones im Browser
- Auf Tablets im Browser
- Als Android-App über die WebView-basierte App-Version

Die Oberfläche reagiert auf Bildschirmgröße und Ausrichtung:

- Auf Smartphones wird die Anzeige für kleine Portrait-Bildschirme kompakt umgebaut.
- Auf Tablets bleibt mehr Platz für die Punktefelder und die Würfelansicht.
- Im Landscape-Modus wird die Oberfläche breiter und nutzt den zusätzlichen Platz gezielt aus.

## Spielziel

Ziel ist es, über 13 Kategorien möglichst viele Punkte zu sammeln.

Die Kategorien sind in zwei Bereiche unterteilt:

- Obere Sektion: Einser, Zweier, Dreier, Vierer, Fünfer, Sechser
- Untere Sektion: Dreierpasch, Viererpasch, Full House, Kleine Straße, Große Straße, Kniffel, Chance

Am Ende werden alle eingetragenen Punkte zusammengezählt. Je nach Einstellungen kommen zusätzliche Boni hinzu.

## Grundlegender Spielablauf

1. Ein Spiel starten
2. Würfeln
3. Beliebige Würfel behalten oder markieren
4. Erneut würfeln, solange noch Würfe verfügbar sind
5. Eine freie Kategorie wählen und Punkte eintragen
6. Diesen Ablauf wiederholen, bis alle 13 Kategorien gefüllt sind

Je nach Einstellungen kann sich dieser Ablauf verändern, zum Beispiel durch feste Feldreihenfolge, Pflicht zum Ablegen von Würfeln oder angesparte Würfe.

## Punktewertung

### Obere Sektion

- Einser: Summe aller gewürfelten Einsen
- Zweier: Summe aller gewürfelten Zweien
- Dreier: Summe aller gewürfelten Dreien
- Vierer: Summe aller gewürfelten Vieren
- Fünfer: Summe aller gewürfelten Fünfern
- Sechser: Summe aller gewürfelten Sechsern

Wenn der obere Bereich zusammen mindestens 63 Punkte erreicht und die Funktion aktiviert ist, gibt es den oberen Bonus.

### Untere Sektion

- Dreierpasch: Summe aller Würfel, wenn mindestens drei gleiche Werte vorhanden sind
- Viererpasch: Summe aller Würfel, wenn mindestens vier gleiche Werte vorhanden sind
- Full House (25): genau Drilling + Paar
- Kleine Straße (30): vier aufeinanderfolgende Werte
- Große Straße (40): fünf aufeinanderfolgende Werte
- KNIFFEL (50): fünf gleiche Werte
- Chance: Summe aller fünf Würfel

## Boni

Je nach Einstellungen können mehrere Boni aktiv sein.

### Oberer Bonus

Wenn aktiviert:

- Bei mindestens 63 Punkten in der oberen Sektion gibt es +35 Punkte.

Wenn deaktiviert:

- Es gibt keinen +35 Bonus, auch wenn 63 oder mehr erreicht werden.

### Kniffel-Bonus

Wenn aktiviert:

- Der erste Kniffel wird normal mit 50 Punkten im Kniffel-Feld gewertet.
- Jeder weitere Kniffel gibt zusätzlich +50 Punkte, sofern das Kniffel-Feld bereits mit 50 gefüllt wurde.

Wenn das Kniffel-Feld gestrichen oder mit 0 belegt wurde:

- Es gibt keinen zusätzlichen Kniffel-Bonus.

### Zeit-Bonus

Dieser Bonus ist ein zusätzlicher Endbonus basierend auf der Spielzeit.

Wenn aktiviert:

- Ein schnelleres Spiel erhält am Ende zusätzliche Bonuspunkte.

Wenn deaktiviert:

- Die Gesamtwertung entspricht nur den tatsächlich erspielten Kniffel-Punkten.
- Das ist die klassischere Variante, ähnlich wie beim Spielen mit einem normalen Kniffelblock.

## Würfel halten und markieren

Die App unterstützt zwei Arten, Würfel auszuwählen:

### Würfel ablegen: An

Das ist das klassische Verhalten der App:

- Ausgewählte Würfel werden in einen separaten Bereich „Zur Seite gelegt“ verschoben.
- Nur die nicht abgelegten Würfel werden beim nächsten Wurf neu gewürfelt.

### Würfel ablegen: Aus

- Ausgewählte Würfel bleiben in der aktiven Würfelreihe.
- Sie werden nur mit der Akzentfarbe hervorgehoben.
- Beim nächsten Wurf werden trotzdem nur die nicht markierten Würfel neu gewürfelt.

## Sound

Wenn Ton aktiviert ist:

- Ein Sound wird beim Würfeln abgespielt
- Ein eigener Sound wird bei einem Kniffel abgespielt
- Ein eigener Sound wird beim Spielende abgespielt

Wenn Ton deaktiviert ist:

- Alle Soundeffekte sind aus

## Toasts

Toasts sind kurze Einblendungen für wichtige Ereignisse.

Wenn Toasts aktiviert sind:

- Es erscheint eine Meldung, sobald der obere Bonus sicher erreicht ist
- Es erscheint eine Meldung, wenn ein zusätzlicher Kniffel-Bonus von +50 gutgeschrieben wurde

Wenn Toasts deaktiviert sind:

- Diese Hinweise erscheinen nicht

Hinweis:

- Manche Systemhinweise wie erfolgreicher Import oder Export können weiterhin bewusst angezeigt werden.

## Header-Info in der Statusleiste

Im Spiel-Header kann mittig optional eine Zusatzinfo angezeigt werden.

Verfügbare Modi:

- Aus: keine Zusatzinfo
- Name: zeigt den Spielernamen
- Bestleistung: zeigt den bisherigen Highscore

## Zeitfunktionen

### Spielzeit startet

Bestimmt, wann die Gesamtspielzeit beginnt:

- Beim Wurf: erst mit dem ersten Würfeln
- Sofort: direkt nach Spielstart

### Zeitlimit

Wenn aktiviert:

- Jeder Zug hat ein Zeitlimit
- Die verbleibende Zeit wird im Header angezeigt

Wenn deaktiviert:

- Es gibt kein Zeitlimit
- Stattdessen zeigt die Anzeige die laufende Spielzeit

### Timer startet

Nur relevant, wenn das Zeitlimit aktiv ist:

- Beim Wurf: Zugtimer startet erst mit dem ersten Wurf des Zuges
- Sofort: Zugtimer startet direkt beim neuen Zug

### Zugzeit

Die Dauer pro Zug ist einstellbar:

- Minimum: 10 Sekunden
- Maximum: 60 Sekunden

## Punkte eintragen

Es gibt zwei Bedienmodi für das Eintragen von Punkten.

### Direkt

- Ein Tipp auf eine verfügbare Kategorie trägt den Wert sofort ein

### 2 Tipps

- Ein erster Tipp markiert das Feld
- Ein zweiter Tipp bestätigt die Auswahl

Wichtig:

- Wenn eine feste Feldreihenfolge aktiv ist, wird diese Einstellung automatisch irrelevant und daher ausgegraut
- In diesem Fall trägt die App nach dem letzten möglichen Wurf automatisch in das verpflichtende Feld ein

## Wurf-Schema

Die App bietet zusätzliche Regelvarianten, die unabhängig voneinander aktiviert werden können.

### Felder-Reihenfolge

Verfügbare Modi:

- Aus: freie Auswahl unter allen noch offenen Feldern
- Oben: die Kategorien müssen streng von oben nach unten gefüllt werden
- Unten: die Kategorien müssen streng von unten nach oben gefüllt werden

Auswirkungen:

- Nur das aktuell erlaubte Feld kann gewertet werden
- Die Anzeige zeigt nur für dieses Feld einen verfügbaren Wert
- Nach dem letzten möglichen Wurf trägt die App den Wert automatisch in das verpflichtende Feld ein
- Die Option `Punkte eintragen` wird in diesem Modus ausgegraut

### Mindestens einen Würfel ablegen

Wenn aktiviert:

- Nach jedem Wurf muss mindestens ein weiterer Würfel fixiert werden
- Erst danach darf erneut gewürfelt werden
- Sobald alle fünf Würfel fixiert sind, ist kein weiterer Wurf in diesem Zug möglich

Wenn deaktiviert:

- Würfel dürfen frei markiert und wieder freigegeben werden
- Es gibt keine Pflicht, pro Wurf mindestens einen weiteren Würfel festzulegen

### Nicht verbrauchte Würfe ansparen

Wenn aktiviert:

- Nicht genutzte Würfe werden in die nächste Runde übernommen
- Der Startwert basiert auf `Würfe pro Zug`
- Beispiel: Bei `3 Würfe pro Zug` und nur einem verwendeten Wurf bleiben `2` übrig und werden auf den nächsten Zug addiert

Wenn deaktiviert:

- Jeder Zug startet normal mit dem in `Würfe pro Zug` festgelegten Wert

Wichtige Regel:

- Wenn `Würfe pro Zug` auf `1` steht, wird diese Option ausgegraut, weil dann keine Würfe übrig bleiben können

## Würfe pro Zug

Die Anzahl der Würfe pro Zug ist anpassbar:

- Minimum: 1
- Maximum: 5

Besonderheiten:

- Bei aktivem Ansparen werden übrige Würfe zusätzlich übernommen
- Dadurch kann die verfügbare Wurfanzahl in späteren Zügen höher werden als der Grundwert

## Statistiken

Die App speichert mehrere Statistiken pro Spieler:

- Bestleistung
- Anzahl gespielter Partien
- Durchschnittliche Punktzahl
- Durchschnittliche Spielzeit
- Bestenlisten
- Filter nach Würfen pro Spiel

Zusätzlich werden gespeichert:

- Spielername
- Avatar
- Level
- XP

## XP und Level

Nach Spielende erhält der Spieler Erfahrungspunkte.

Aktuell gilt:

- XP werden aus der erreichten Gesamtpunktzahl abgeleitet
- Mit genug XP steigt der Spieler im Level auf

Die Fortschrittsanzeige ist auf dem Startbildschirm sichtbar.

## Profil

Der Spieler kann sein Profil anpassen:

- Spielername
- Avatar

Diese Daten werden gespeichert und an mehreren Stellen in der App verwendet.

## Themes

Die App enthält mehrere Themes zur optischen Anpassung.

Vorhandene Themes:

- Dunkel
- Slate
- Kohle
- Wald
- Hell
- Stone
- Sand
- Nacht
- Sunset
- Lagoon
- Berry
- Citrus

Manche Themes sind bewusst farbenfroher, aber weiterhin gut lesbar und stimmig gestaltet.

## Import und Export

Die App unterstützt das Sichern und Wiederherstellen der gespeicherten Daten.

### Export

Beim Export werden gespeichert:

- Einstellungen
- Profil
- Fortschritt
- Statistiken

Je nach Plattform:

- Im Browser wird eine JSON-Datei heruntergeladen
- In der Android-App wird die Datei im Download-Ordner gespeichert

### Import

Beim Import wird eine zuvor exportierte JSON-Datei wieder eingelesen.

Danach werden übernommen:

- Alle Spielerdaten
- Alle Statistiken
- Alle Einstellungen
- Das aktive Theme

## Mobile Optimierung

Die App ist ausdrücklich für verschiedene Gerätearten optimiert.

### Smartphone

- Kompakte Portrait-Ansicht
- Angepasste Punktefelder
- Für kleine Breiten optimierte Würfel- und Button-Größen
- Touch-freundliche Steuerung

### Tablet

- Größere, übersichtlichere Punkteansicht
- Breiteres Layout
- Optimierte Nutzung im Portrait- und Landscape-Modus

### Desktop / Browser

- Volle Bedienbarkeit im Browser
- Gute Nutzbarkeit mit Maus oder Touch
- Direkte Nutzung ohne Installation möglich

## Hinweise zur Bedienung

- Ein Spiel kann jederzeit pausiert werden
- Einstellungen, Profil und Statistiken lassen sich über Overlays öffnen
- Während eines laufenden Spiels werden bestimmte Einstellungen gesperrt, um Regelwechsel mitten im Spiel zu vermeiden
- Einige Optionen beeinflussen andere Optionen absichtlich, etwa bei fester Feldreihenfolge oder bei `1 Wurf pro Zug`

## Für wen ist diese Version gedacht?

Diese Kniffel-Version eignet sich für:

- Spieler, die klassisches Kniffel wollen
- Spieler, die moderne Komfortfunktionen schätzen
- Spieler, die Varianten und Spezialregeln ausprobieren möchten
- Mobile Nutzung auf Smartphone und Tablet
- Desktop-Spiel im Browser

## Kurzfassung

Wenn du einfach klassisch spielen willst:

- Oberer Bonus: An
- Punkte-Bonus: Aus
- Kniffel-Bonus: An oder Aus nach Geschmack
- Feldreihenfolge: Aus
- Mindestens einen Würfel ablegen: Aus
- Nicht verbrauchte Würfe ansparen: Aus
- Punkte eintragen: Direkt oder 2 Tipps nach Vorliebe

Wenn du mehr Strategie und Varianten willst:

- Feldreihenfolge aktivieren
- Pflicht zum Ablegen aktivieren
- Ansparen von Würfen aktivieren
- Header-Info und Toasts einschalten

## Dateiübersicht

Wichtige Projektdateien:

- `index.html`: Hauptspiel mit Layout, Logik und Styles
- `manifest.json`: Web-App-Metadaten
- `sw.js`: Service Worker
- `android/`: Android-Projekt

## Viel Spaß beim Spielen

Die App soll klassisches Kniffel respektieren, aber gleichzeitig moderne Bedienung, Statistik, Themes und flexible Regelvarianten bieten.

Wenn du das Spiel mit anderen teilst, ist die `README.md` ein guter Startpunkt für neue Spieler.
