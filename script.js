// Initialize Mermaid with a clean theme
mermaid.initialize({ 
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose'
});

async function loadDoc() {
    const contentArea = document.getElementById('main-content');
    
    // Parse page and anchor from double-hash (e.g., #deploy#environment-variables)
    const fullHash = window.location.hash.replace('#', '');
    const hashParts = fullHash.split('#');
    
    const page = hashParts[0] || 'enums_flags';
    const anchorId = hashParts[1]; 

    try {
        const response = await fetch(`docs/${page}.md`);
        if (!response.ok) throw new Error('File not found');
        
        let text = await response.text();

        // 1a. Process Custom Callouts
        text = parseCallouts(text);

        // 1b. Process Custom Tabbing (Stores content for later safe rendering)
        text = parseTabs(text);

        // 2. Render Main Markdown to HTML
        contentArea.innerHTML = (typeof marked.parse === 'function') 
            ? marked.parse(text) 
            : marked.marked(text);

        // 2b. Inject and render the tab contents safely to prevent mangling
        window.tabContents.forEach(tab => {
            const el = document.getElementById(tab.id);
            if (el) {
                el.innerHTML = marked.parse(tab.content);
            }
        });

        // 3. Fix Mermaid Diagrams
        const mermaidBlocks = contentArea.querySelectorAll('pre code.language-mermaid');
        mermaidBlocks.forEach((codeBlock, index) => {
            const rawCode = codeBlock.textContent;
            const diagramDiv = document.createElement('div');
            diagramDiv.className = 'mermaid';
            diagramDiv.id = `mermaid-${index}`;
            diagramDiv.textContent = rawCode;
            
            const preElement = codeBlock.parentElement;
            preElement.parentNode.replaceChild(diagramDiv, preElement);
        });

        // 4. Trigger Rendering Libraries
        if (window.mermaid) {
            mermaid.run();
        }
        
        if (window.Prism) {
            Prism.highlightAllUnder(contentArea);
        }

        // 5. Update UI Components
        initializeTabs(contentArea);
        generateToC(contentArea);
        updateSidebarLinks(page);

        // 6. Scroll to element if an anchor exists in the URL
        if (anchorId) {
            scrollToAnchor(anchorId);
        }

    } catch (err) {
        console.error(err);
        contentArea.innerHTML = "<h1>404</h1><p>Documentation page not found.</p>";
    }
}

function parseTabs(text) {
    const tabsRegex = /:::tabs\s*([\s\S]*?):::/g;
    window.tabContents = []; 

    return text.replace(tabsRegex, (_, body) => {
        const parts = body.split(/^@tab\s+/gm).filter(Boolean);

        let buttons = "";
        let contents = "";

        parts.forEach((part, index) => {
            const lines = part.split("\n");
            const title = lines.shift().trim();
            const content = lines.join("\n");
            
            const tabId = `tab-${Math.random().toString(36).substr(2, 9)}`;
            window.tabContents.push({ id: tabId, content: content });

            buttons += `
<button class="tab-button ${index === 0 ? "active" : ""}" data-tab="${index}">
    ${title}
</button>`;

            contents += `<div class="tab-content ${index === 0 ? "active" : ""}" id="${tabId}"></div>`;
        });

        return `
<div class="tabs">
    <div class="tab-buttons">
        ${buttons}
    </div>
    ${contents}
</div>`;
    });
}

function parseCallouts(text) {
    const calloutRegex = /\[!(INFO|WARNING|DANGER|SUCCESS|NOTE|TIP)\]([\s\S]*?)(?=\n\n|$)/gi;

    return text.replace(calloutRegex, (match, type, content) => {
        const lowerType = type.toLowerCase();
        const cleanContent = content.trim().replace(/\n/g, '<br>');
        return `<div class="callout ${lowerType}">${cleanContent}</div>`;
    });
}

function initializeTabs(container) {
    container.querySelectorAll(".tabs").forEach(tabSet => {
        const buttons = tabSet.querySelectorAll(".tab-button");
        const contents = tabSet.querySelectorAll(".tab-content");

        buttons.forEach((button, index) => {
            button.addEventListener("click", () => {
                buttons.forEach(b => b.classList.remove("active"));
                contents.forEach(c => c.classList.remove("active"));

                button.classList.add("active");
                contents[index].classList.add("active");

                if (window.Prism) {
                    Prism.highlightAllUnder(contents[index]);
                }
            });
        });
    });
}

function generateToC(container) {
    const tocList = document.getElementById('toc-list');
    if (!tocList) return;
    tocList.innerHTML = '';

    const headers = Array.from(container.querySelectorAll('h1, h2'));
    const subHeaders = headers.slice(1); 

    subHeaders.forEach((header) => {
        const id = header.innerText.toLowerCase().replace(/\s+/g, '-');
        header.id = id;

        const li = document.createElement('li');
        const a = document.createElement('a');
        
        const pagePart = window.location.hash.replace('#', '').split('#')[0] || 'enums_flags';
        a.href = `#${pagePart}#${id}`;
        a.innerText = header.innerText;
        
        if (header.tagName === 'H2') a.style.paddingLeft = "15px";

        a.onclick = (e) => {
            e.preventDefault();
            scrollToAnchor(id);
            history.pushState(null, null, `#${pagePart}#${id}`);
        };

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

function updateSidebarLinks(currentPage) {
    document.querySelectorAll('.sidebar a').forEach(link => {
        const href = link.getAttribute('href').replace('#', '');
        link.classList.toggle('active', href === currentPage);
    });
}

function scrollToAnchor(id) {
    const element = document.getElementById(id);
    if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
        }, 150);
    }
}

window.addEventListener('hashchange', () => {
    const fullHash = window.location.hash.replace('#', '');
    const hashParts = fullHash.split('#');
    const newPage = hashParts[0] || 'enums_flags';
    const anchorId = hashParts[1];

    if (window.lastLoadedPage !== newPage) {
        window.lastLoadedPage = newPage;
        loadDoc();
    } else if (anchorId) {
        scrollToAnchor(anchorId);
    }
});

document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('#')) {
        const fullHash = link.getAttribute('href').replace('#', '');
        const hashParts = fullHash.split('#');
        const anchorId = hashParts.length > 1 ? hashParts[1] : hashParts[0];

        if (window.location.hash === link.getAttribute('href')) {
            scrollToAnchor(anchorId);
        }
    }
}, true);

window.addEventListener('DOMContentLoaded', () => {
    const fullHash = window.location.hash.replace('#', '');
    window.lastLoadedPage = fullHash.split('#')[0] || 'enums_flags';
    loadDoc();
});
