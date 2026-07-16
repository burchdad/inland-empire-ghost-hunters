(async () => {
  try {
    const response = await fetch("/api/site-content", {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return;
    }

    const content = await response.json();
    const overrides = Array.isArray(content.overrides) ? content.overrides : [];

    for (const override of overrides) {
      if (!override.selector || !override.property) continue;

      const elements = document.querySelectorAll(override.selector);

      for (const element of elements) {
        const value = override.value ?? "";

        if (override.property === "text") {
          element.textContent = value;
        }

        if (override.property === "html") {
          element.innerHTML = value;
        }

        if (override.property === "src" && "src" in element) {
          element.src = value;
        }

        if (override.property === "href" && "href" in element) {
          element.href = value;
        }

        if (override.property === "backgroundImage") {
          element.style.backgroundImage = `url("${value}")`;
        }
      }
    }
  } catch (error) {
    console.warn("IEGH content overrides unavailable", error);
  }
})();
