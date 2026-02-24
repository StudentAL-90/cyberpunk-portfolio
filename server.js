require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GITHUB_USER = process.env.GITHUB_USER || 'octocat';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || null;

let cache = { ts: 0, data: null };
const CACHE_TTL = 1000 * 60 * 5;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/repos', async (req, res) => {
  try {
    if (cache.data && (Date.now() - cache.ts) < CACHE_TTL) {
      return res.json(cache.data);
    }

    const headers = {
      'User-Agent': 'cyberpunk-portfolio'
    };
    if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

    const url = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const repos = await response.json();
    const filtered = repos
      .map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        url: r.html_url,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        updated_at: r.updated_at
      }))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    cache = { ts: Date.now(), data: filtered };
    res.json(filtered);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
