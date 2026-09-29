# welcome-site

Static site for GitHub Pages.

## Deploy via GitHub Pages

1. Create a new public GitHub repository (e.g. `welcome-site`) and push this folder's contents to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: welcome static site"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USER>/welcome-site.git
   git push -U origin main
   ```
2. In the repo, go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Select branch **`main`** and folder **`/ (root)`**, then **Save**.
5. Wait ~1 minute. The site will be live at:
   ```
   https://<YOUR_USER>.github.io/welcome-site/
   ```

## Local preview

Just open `index.html` in a browser, or:
```bash
python3 -m http.server 8000
# visit http://localhost:8000
```
