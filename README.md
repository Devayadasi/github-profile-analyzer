# GitScope — GitHub Profile Analyzer

A beginner-friendly web application built with HTML, CSS, JavaScript, Python, Flask, and the GitHub REST API.

## Features

- Search public GitHub profiles by username
- Display profile details, followers, following, and public repository count
- Show stars and forks across the repositories loaded by the app
- Search repositories and sort by recent update, stars, forks, or name
- Show repository primary-language counts
- Highlight the most-starred repository in the loaded set
- Show account age and a simple explainable profile score
- Responsive layout and helpful error/loading messages

## Tech stack

- HTML
- CSS
- JavaScript (Fetch API)
- Python
- Flask
- Requests
- GitHub REST API

## Run locally

1. Install Python 3.10 or later.
2. Open a terminal in this folder.
3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Start the app:

   ```bash
   python app.py
   ```

5. Open http://127.0.0.1:5000 in your browser.

## Deploy on Render

1. Push this project to a GitHub repository.
2. Sign in to Render and create a new **Web Service** connected to that repository.
3. Use these settings:
   - **Runtime:** Python
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `gunicorn app:app`
4. Create the web service and wait for the deployment to finish.
5. Open the public `onrender.com` URL provided by Render and test a profile.

## Notes and limitations

- The app uses public GitHub API endpoints and does not need a GitHub token for basic use.
- GitHub applies unauthenticated API rate limits. If the limit is reached, wait before retrying.
- The repository endpoint loads up to 100 recently updated repositories. Star/fork totals, language counts, and the top repository are based on this loaded set, not necessarily every repository on a large account.
- Language counts are based on each repository's primary language, not lines of code.
- The profile score is a simple score created for this project, not an official GitHub score.
- This app only analyzes public profile data.
