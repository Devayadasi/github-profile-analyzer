const searchForm = document.getElementById("searchForm");
const usernameInput = document.getElementById("username");
const searchButton = document.getElementById("searchBtn");
const message = document.getElementById("message");
const dashboard = document.getElementById("dashboard");
const welcome = document.getElementById("welcome");

let allRepositories = [];

searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    analyzeProfile();
});

document.querySelectorAll(".sample").forEach(function(button) {
    button.addEventListener("click", function() {
        usernameInput.value = button.dataset.username;
        analyzeProfile();
    });
});

document.getElementById("repoSearch").addEventListener("input", showRepositories);
document.getElementById("repoSort").addEventListener("change", showRepositories);

async function analyzeProfile() {
    const username = usernameInput.value.trim();

    if (username === "") {
        showMessage("Please enter a GitHub username.", true);
        dashboard.classList.add("hidden");
        return;
    }

    searchButton.disabled = true;
    searchButton.textContent = "Analyzing...";
    showMessage("Fetching public GitHub data...");
    dashboard.classList.add("hidden");

    try {
        const response = await fetch("/api/analyze/" + encodeURIComponent(username));
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Could not analyze this profile.");
        }

        displayProfile(data);
        welcome.classList.add("hidden");
        dashboard.classList.remove("hidden");
        showMessage("Profile loaded successfully.");
    } catch (error) {
        showMessage(error.message || "Something went wrong. Please try again.", true);
    } finally {
        searchButton.disabled = false;
        searchButton.innerHTML = 'Analyze profile <span>→</span>';
    }
}

function showMessage(text, isError) {
    message.textContent = text;
    message.classList.toggle("error", Boolean(isError));
}

function displayProfile(data) {
    document.getElementById("avatar").src = data.avatar || "";
    document.getElementById("name").textContent = data.name;
    document.getElementById("handle").textContent = "@" + data.username;
    document.getElementById("bio").textContent = data.bio;
    document.getElementById("location").textContent = "⌖ " + data.location;
    document.getElementById("company").textContent = "◈ " + data.company;
    document.getElementById("createdAt").textContent = "Joined " + data.created_at;
    document.getElementById("profileLink").href = data.profile_url;

    document.getElementById("repos").textContent = data.public_repos.toLocaleString();
    document.getElementById("followers").textContent = data.followers.toLocaleString();
    document.getElementById("following").textContent = data.following.toLocaleString();
    document.getElementById("stars").textContent = data.total_stars.toLocaleString();
    document.getElementById("forks").textContent = data.total_forks.toLocaleString();
    document.getElementById("repoCount").textContent = data.repositories.length + " loaded";
    document.getElementById("accountAge").textContent = data.account_age_years + " years";

    document.getElementById("score").textContent = data.profile_score;
    document.getElementById("scoreBar").style.width = data.profile_score + "%";

    const topRepoLink = document.getElementById("topRepo");
    const topRepoStars = document.getElementById("topRepoStars");

    if (data.top_repo) {
        topRepoLink.textContent = data.top_repo.name;
        topRepoLink.href = data.top_repo.url;
        topRepoStars.textContent = "★ " + data.top_repo.stars + " stars";
    } else {
        topRepoLink.textContent = "No repositories found";
        topRepoLink.removeAttribute("href");
        topRepoStars.textContent = "";
    }

    allRepositories = data.repositories;
    showRepositories();
    showLanguages(data.languages);
}

function showRepositories() {
    const list = document.getElementById("repositoryList");
    const searchText = document.getElementById("repoSearch").value.toLowerCase().trim();
    const sortBy = document.getElementById("repoSort").value;

    let filtered = allRepositories.filter(function(repo) {
        return repo.name.toLowerCase().includes(searchText) ||
            repo.description.toLowerCase().includes(searchText) ||
            repo.language.toLowerCase().includes(searchText);
    });

    if (sortBy === "stars") {
        filtered.sort(function(a, b) { return b.stars - a.stars; });
    } else if (sortBy === "forks") {
        filtered.sort(function(a, b) { return b.forks - a.forks; });
    } else if (sortBy === "name") {
        filtered.sort(function(a, b) { return a.name.localeCompare(b.name); });
    } else {
        filtered.sort(function(a, b) {
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
    }

    list.replaceChildren();

    if (filtered.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-repos";
        empty.textContent = "No repositories match your search.";
        list.appendChild(empty);
        return;
    }

    filtered.forEach(function(repo) {
        const card = document.createElement("article");
        card.className = "repo-card";

        const top = document.createElement("div");
        top.className = "repo-top";

        const link = document.createElement("a");
        link.className = "repo-name";
        link.href = repo.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = repo.name;

        const badge = document.createElement("span");
        badge.className = "repo-badge";
        badge.textContent = repo.is_fork ? "FORK" : "PUBLIC";

        top.appendChild(link);
        top.appendChild(badge);

        const description = document.createElement("p");
        description.className = "repo-description";
        description.textContent = repo.description;

        const meta = document.createElement("div");
        meta.className = "repo-meta";

        const language = document.createElement("span");
        language.className = "repo-language";
        language.textContent = "● " + repo.language;

        const stars = document.createElement("span");
        stars.textContent = "★ " + repo.stars;

        const forks = document.createElement("span");
        forks.textContent = "⑂ " + repo.forks;

        meta.appendChild(language);
        meta.appendChild(stars);
        meta.appendChild(forks);

        card.appendChild(top);
        card.appendChild(description);
        card.appendChild(meta);
        list.appendChild(card);
    });
}

function showLanguages(languages) {
    const list = document.getElementById("languageList");
    list.replaceChildren();

    if (!languages || languages.length === 0) {
        const empty = document.createElement("p");
        empty.className = "no-languages";
        empty.textContent = "No language data available for the loaded repositories.";
        list.appendChild(empty);
        return;
    }

    const total = languages.reduce(function(sum, item) {
        return sum + item.count;
    }, 0);

    languages.slice(0, 7).forEach(function(item) {
        const row = document.createElement("div");
        row.className = "language-item";

        const heading = document.createElement("div");
        heading.className = "language-heading";

        const name = document.createElement("span");
        name.textContent = item.name;

        const count = document.createElement("span");
        const percent = Math.round((item.count / total) * 100);
        count.textContent = item.count + " repos · " + percent + "%";

        heading.appendChild(name);
        heading.appendChild(count);

        const track = document.createElement("div");
        track.className = "language-track";

        const fill = document.createElement("div");
        fill.className = "language-fill";
        fill.style.width = percent + "%";

        track.appendChild(fill);
        row.appendChild(heading);
        row.appendChild(track);
        list.appendChild(row);
    });
}
