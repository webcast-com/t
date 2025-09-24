async function loadPosts() {
  const container = document.getElementById("posts-container");
  container.innerHTML = "";

  // Try JSON first
  try {
    const posts = await loadPostsFromJSON("posts/post.json");
    posts.forEach((p) => container.appendChild(createCard(p.title, p.image, p.bodyMD)));
    return;
  } catch (err) {
    console.warn("posts/post.json not found or invalid. Falling back to markdown.", err);
  }

  // Fallback to markdown files
  await loadPostsFromMarkdownFallback(container);
}

async function loadPostsFromJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("post.json must be an array of posts");

  const out = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const title = String(item.title || "Untitled");
    const image = String(item.image || "");

    let bodyMD = "";
    if (typeof item.content === "string") {
      bodyMD = item.content;
    } else if (typeof item.source === "string") {
      const r = await fetch(`posts/${item.source}`);
      if (!r.ok) throw new Error(`Missing post source: ${item.source}`);
      const t = await r.text();
      bodyMD = extractMarkdownBody(t);
    }

    out.push({ title, image, bodyMD });
  }
  return out;
}

function extractMarkdownBody(text) {
  const m = text.match(/^\s*---[\s\S]*?---\s*([\s\S]*)$/);
  return (m ? m[1] : text).trim();
}

function renderMarkdownToHTML(md) {
  return marked.parse(md || "");
}

function getExcerptFromHTML(html, max = 100) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  const txt = (tmp.textContent || tmp.innerText || "").trim();
  return txt.length > max ? `${txt.slice(0, max).trim()}...` : txt;
}

function createCard(title, image, bodyMD) {
  const html = renderMarkdownToHTML(bodyMD);
  const excerpt = getExcerptFromHTML(html, 100);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
      <img src="${image}" alt="News">
      <div class="card-content">
        <h3>${title}</h3>
        <p>${excerpt}</p>
      </div>
    `;
  card.onclick = () => openModal(title, html);
  return card;
}

async function loadPostsFromMarkdownFallback(container) {
  const postList = ["example-post.md", "news-post.md"]; // minimal, editable fallback
  for (const post of postList) {
    try {
      const res = await fetch(`posts/${post}`);
      if (!res.ok) continue;
      const text = await res.text();

      const fmMatch = text.match(/---([\s\S]*?)---([\s\S]*)/);
      let meta = { title: "Untitled", image: "" };
      let body = text;

      if (fmMatch) {
        const fm = fmMatch[1];
        body = fmMatch[2];
        meta = Object.fromEntries(
          fm
            .trim()
            .split("\n")
            .map((line) => {
              const idx = line.indexOf(":");
              if (idx === -1) return [line.trim(), ""]; 
              const key = line.slice(0, idx).trim();
              const value = line.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
              return [key, value];
            })
        );
      }

      const html = renderMarkdownToHTML(body.trim());
      const excerpt = getExcerptFromHTML(html, 100);

      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <img src="${meta.image || ""}" alt="News">
        <div class="card-content">
          <h3>${meta.title || "Untitled"}</h3>
          <p>${excerpt}</p>
        </div>
      `;
      card.onclick = () => openModal(meta.title || "Untitled", html);
      container.appendChild(card);
    } catch (_) {
      // ignore individual post failures in fallback
    }
  }
}

function openModal(title, bodyHTML) {
  document.getElementById("modalTitle").innerText = title;
  document.getElementById("modalBody").innerHTML = bodyHTML;
  document.getElementById("newsModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("newsModal").style.display = "none";
}

window.onclick = function (event) {
  if (event.target === document.getElementById("newsModal")) closeModal();
};

loadPosts();
