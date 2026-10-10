from flask import Flask, render_template, jsonify
import requests
from datetime import datetime, timezone

app = Flask(__name__)

GITHUB_API = "https://api.github.com"
HEADERS = {"Accept": "application/vnd.github+json"}


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/analyze/<username>")
def analyze(username):
    username = username.strip()

    if not username:
        return jsonify({"error": "Please enter a GitHub username."}), 400

    try:
        profile_response = requests.get(
            f"{GITHUB_API}/users/{username}",
            headers=HEADERS,
            timeout=10
        )

        if profile_response.status_code == 404:
            return jsonify({"error": "That GitHub username was not found."}), 404

        if profile_response.status_code == 403:
            return jsonify({
                "error": "GitHub API rate limit reached. Please wait a little and try again."
            }), 429

        if profile_response.status_code != 200:
            return jsonify({"error": "GitHub could not return this profile right now."}), 502

        profile = profile_response.json()

        repos_response = requests.get(
            f"{GITHUB_API}/users/{username}/repos",
            headers=HEADERS,
            params={"sort": "updated", "per_page": 100, "type": "owner"},
            timeout=10
        )

        if repos_response.status_code == 403:
            return jsonify({
                "error": "GitHub API rate limit reached. Please wait a little and try again."
            }), 429

        if repos_response.status_code != 200:
            return jsonify({"error": "Could not load this user's repositories."}), 502

        repos = repos_response.json()

    except requests.exceptions.Timeout:
        return jsonify({"error": "GitHub took too long to respond. Please try again."}), 504
    except requests.exceptions.RequestException:
        return jsonify({"error": "Network error. Please check your connection."}), 502

    total_stars = sum(repo.get("stargazers_count", 0) for repo in repos)
    total_forks = sum(repo.get("forks_count", 0) for repo in repos)

    language_counts = {}
    for repo in repos:
        language = repo.get("language")
        if language:
            language_counts[language] = language_counts.get(language, 0) + 1

    languages = []
    for language, count in language_counts.items():
        languages.append({"name": language, "count": count})
    languages.sort(key=lambda item: item["count"], reverse=True)

    sorted_repos = sorted(
        repos,
        key=lambda repo: repo.get("stargazers_count", 0),
        reverse=True
    )
    top_repo = None
    if sorted_repos:
        top_repo = {
            "name": sorted_repos[0].get("name", ""),
            "url": sorted_repos[0].get("html_url", ""),
            "stars": sorted_repos[0].get("stargazers_count", 0)
        }

    created_at = profile.get("created_at", "")
    account_age_years = 0
    if created_at:
        created_date = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        today = datetime.now(timezone.utc)
        account_age_years = max(0, today.year - created_date.year -
                                 ((today.month, today.day) < (created_date.month, created_date.day)))

    # This is a simple project estimate, not an official GitHub score.
    score = 0
    score += min(profile.get("public_repos", 0) * 2, 30)
    score += min(profile.get("followers", 0), 30)
    score += min(total_stars, 40)
    score = min(score, 100)

    clean_repos = []
    for repo in repos:
        clean_repos.append({
            "name": repo.get("name", ""),
            "description": repo.get("description") or "No description provided.",
            "url": repo.get("html_url", ""),
            "language": repo.get("language") or "Not specified",
            "stars": repo.get("stargazers_count", 0),
            "forks": repo.get("forks_count", 0),
            "updated_at": repo.get("updated_at", ""),
            "is_fork": repo.get("fork", False)
        })

    result = {
        "name": profile.get("name") or profile.get("login"),
        "username": profile.get("login"),
        "avatar": profile.get("avatar_url"),
        "bio": profile.get("bio") or "No bio added yet.",
        "location": profile.get("location") or "Not specified",
        "company": profile.get("company") or "Not specified",
        "profile_url": profile.get("html_url"),
        "created_at": created_at[:10] if created_at else "Unknown",
        "account_age_years": account_age_years,
        "followers": profile.get("followers", 0),
        "following": profile.get("following", 0),
        "public_repos": profile.get("public_repos", 0),
        "total_stars": total_stars,
        "total_forks": total_forks,
        "repositories_returned": len(repos),
        "repositories": clean_repos,
        "languages": languages,
        "top_repo": top_repo,
        "profile_score": score
    }

    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
