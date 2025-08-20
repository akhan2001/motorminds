(function () {
    const API_BASE_URL = "http://localhost:3000/api/widget";
    const IFRAME_URL = "http://localhost:3000/widget";

    function getShopId() {
        const scriptTag = document.currentScript || document.getElementById("motorminds-widget-script");
        if (!scriptTag) {
            console.error("MotorMinds Widget: Could not find script tag.");
            return null;
        }
        return scriptTag.getAttribute("data-shop-id");
    }

    async function fetchConfig(shopId) {
        try {
            const res = await fetch(`${API_BASE_URL}/config/${shopId}`);
            if (!res.ok) throw new Error("Failed to fetch config");
            return await res.json();
        } catch (error) {
            console.error("MotorMinds Widget:", error);
            return null;
        }
    }

    function createWidgetContainer(config) {
        const container = document.createElement("div");
        container.id = "motorminds-widget-container";
        container.style.position = "fixed";
        container.style.zIndex = "9999";
        
        if (config.position === 'bottom-left') {
            container.style.bottom = "20px";
            container.style.left = "20px";
        } else {
            container.style.bottom = "20px";
            container.style.right = "20px";
        }

        document.body.appendChild(container);
        return container;
    }

    function createIframe(shopId) {
        const iframe = document.createElement("iframe");
        iframe.id = "motorminds-widget-iframe";
        iframe.src = `${IFRAME_URL}?shopId=${shopId}`;
        iframe.style.border = "none";
        iframe.style.width = "400px";
        iframe.style.height = "600px";
        iframe.style.display = "none";
        iframe.style.boxShadow = "0 5px 40px rgba(0,0,0,.16)";
        iframe.style.borderRadius = "8px";
        iframe.style.transition = "transform 0.3s ease-in-out";
        return iframe;
    }

    function createToggleButton(config) {
        const button = document.createElement("button");
        button.id = "motorminds-widget-toggle";
        button.style.width = "60px";
        button.style.height = "60px";
        button.style.borderRadius = "50%";
        button.style.border = "none";
        button.style.backgroundColor = config.primaryColor;
        button.style.color = "white";
        button.style.cursor = "pointer";
        button.style.boxShadow = "0 2px 10px rgba(0,0,0,.2)";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";

        button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>`;
        
        return button;
    }

    async function main() {
        const shopId = getShopId();
        if (!shopId) return;

        const config = await fetchConfig(shopId);
        if (!config) return;
        
        const container = createWidgetContainer(config);
        const iframe = createIframe(shopId);
        const toggleButton = createToggleButton(config);

        container.appendChild(iframe);
        container.appendChild(toggleButton);

        let isOpen = false;
        toggleButton.addEventListener("click", () => {
            isOpen = !isOpen;
            iframe.style.display = isOpen ? "block" : "none";
            iframe.style.transform = isOpen ? 'scale(1)' : 'scale(0)';
            toggleButton.innerHTML = isOpen 
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"></path></svg>`;
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", main);
    } else {
        main();
    }
})();
