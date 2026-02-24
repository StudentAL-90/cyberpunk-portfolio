let cache = { ts: 0, data: null };
const CACHE_TTL = 1000 * 60 * 5;

module.exports = async (req, res) => {
  try {
    if (cache.data && Date.now() - cache.ts < CACHE_TTL) {
      return res.status(200).json(cache.data);
    }

    const githubUser = process.env.GITHUB_USER || 'octocat';
    const githubToken = process.env.GITHUB_TOKEN || null;

    const headers = {
      'User-Agent': 'cyberpunk-portfolio',
      Accept: 'application/vnd.github+json'
    };

    if (githubToken) {
      headers.Authorization = `Bearer ${githubToken}`;
    }

    const url = `https://api.github.com/users/${githubUser}/repos?per_page=100&sort=updated`;
    const response = await fetch(url, { headers });

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text });
    }

    const repos = await response.json();
    const filtered = repos
      .map((r) => ({
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
    return res.status(200).json(filtered);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};