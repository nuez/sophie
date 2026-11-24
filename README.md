# Mates con mi mascota

A Spanish maths game for practising column addition and subtraction with carrying/borrowing (*sumas y restas con llevadas*), from 1 up to 4 digits. A finger-counting helper shows her how to count up on her hands, and fades away as she gets better. Correct answers earn time with a little pet she looks after.

Live at **https://sophie.nuezweb.com**.

## Run it on your computer

```bash
npm install
npm run dev        # opens on http://localhost:5173 (also on your local network, for the tablet)
npm test           # maths, progression and saving tests
npm run build      # production build in dist/
```

To try it on the tablet before deploying: run `npm run dev`, then open the "Network" address it prints (for example `http://192.168.1.20:5173`) in Chrome on the tablet. The tablet and the Mac need to be on the same wifi.

## Publish a new version

```bash
npm run deploy     # builds and pushes dist/ to the gh-pages branch → https://sophie.nuezweb.com
```

GitHub Pages serves the `gh-pages` branch. The custom domain comes from `public/CNAME` plus a DNS record at OVH: `sophie CNAME nuez.github.io.`

## Install it on the Android tablet

1. Open https://sophie.nuezweb.com in **Chrome** on the tablet. Then tap ⋮ → **Añadir a pantalla de inicio / Instalar aplicación**.
3. Open it once with internet. After that it works offline: the voice, the font and everything else are stored on the tablet.

Progress is saved only on that tablet, in that browser.

## The voice

All speech is pre-recorded with the Mac's Spanish (Spain) voice "Mónica". The phrases live in `src/audio/phrases.json`. After you change or add a phrase, regenerate the clips (this needs macOS and `ffmpeg`):

```bash
npm run audio      # only regenerates phrases whose text changed
```

The pet's name is spoken from a clip if it's one of the suggested names (Luna, Coco, Nube, Kiwi, Chispa, Pipo). Other names use the tablet's own Spanish voice if it has one.

## Parents' corner

**Hold the bottom-left corner of the home screen for 3 seconds.** From there you can:
- see progress per level
- set the level she plays
- see or adjust each help stage (1 = the app does it, the highest stage = she does it alone)
- turn the voice off, or change its speed
- choose whether addition counts on from the bigger number or from the top number
- try out a care break
- start over

## Tuning

All the thresholds are in `src/config.ts`: when help fades, when it comes back, how often care breaks happen, and when a new level unlocks.
