# Your First Morning — Module 2, Segment 1 (Stages 1.1–1.6)

A static build of the learning platform: plain HTML, JavaScript, CSS and fonts. No server and no build step are needed to host it.

Built from `module2-segment1/` with `node scripts/build-site.mjs`. Do not edit these files by hand; change the source and rebuild.

## Deploy on Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Set **Root Directory** to `module2-segment1-site`.
4. Set **Framework Preset** to **Other**. Leave the build command and output directory empty.
5. Choose **Deploy**. Vercel gives you an `https://….vercel.app` link.

The microphone works on the Vercel link because it is HTTPS. `vercel.json` allows this site to use the microphone.

## Try it on your own computer

Open a terminal in this folder and run:

```bash
npx serve .
```

Then open the address it prints. Opening `index.html` by double-clicking does not work, because browsers block scripts on `file://` pages.

## Adding the produced media

Put the delivered files in `media/audio`, `media/video` and `media/images`, named exactly as in `module2-segment1/docs/ASSET_MANIFEST.md`. Then push again. The course uses them straight away; until then, each missing file is marked on screen.
