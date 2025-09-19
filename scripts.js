async function loadPosts() {
  const container = document.getElementById("posts-container");

  // Fetch a list of posts from /posts directory
  const postList = [
    "example-post.md" // In production, you can generate this list dynamically with a static site generator
  ];

  for (const post of postList) {
    const res = await fetch(`posts/${post}`);
    const text = await res.text();

    // Parse frontmatter manually (basic approach)
    const [, fm, body] = text.match(/---([\s\S]*?)---([\s\S]*)/);
    const meta = Object.fromEntries(
      fm.trim().split("\n").map(line => line.split(": ").map(v => v.trim()))
    );

    // Create card
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${meta.image}" alt="News">
      <div class="card-content">
        <h3>${meta.title}</h3>
        <p>${body.substring(0, 100)}...</p>
      </div>
    `;
    card.onclick = () => openModal(meta.title, marked.parse(body));
    container.appendChild(card);
  }
}

function openModal(title, bodyHTML) {
  document.getElementById('modalTitle').innerText = title;
  document.getElementById('modalBody').innerHTML = bodyHTML;
  document.getElementById('newsModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('newsModal').style.display = 'none';
}

window.onclick = function(event) {
  if (event.target === document.getElementById('newsModal')) closeModal();
};

loadPosts();
