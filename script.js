const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const form = document.querySelector("#investigation-form");

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    siteNav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const data = new FormData(form);
  const evidence = data.getAll("evidence").join(", ") || "No evidence type selected";
  const subject = encodeURIComponent("Investigation Request - Inland Empire Ghost Hunters");
  const body = encodeURIComponent(
    [
      "Basic Info",
      `Name: ${data.get("name") || ""}`,
      `Phone: ${data.get("phone") || ""}`,
      `Email: ${data.get("email") || ""}`,
      `City/location: ${data.get("city") || ""}`,
      `Type of location: ${data.get("location_type") || ""}`,
      "",
      "What Happened?",
      `Description: ${data.get("activity_description") || ""}`,
      `Started: ${data.get("started") || ""}`,
      `Frequency: ${data.get("frequency") || ""}`,
      `Areas: ${data.get("areas") || ""}`,
      `Physical effects: ${data.get("physical_effects") || ""}`,
      `Children/elderly/pets affected: ${data.get("vulnerable_affected") || ""}`,
      "",
      "Evidence",
      `Evidence types: ${evidence}`,
      "Please send evidence files separately to evidence@inlandempireghosthunters.com.",
      "",
      `Best time to contact: ${data.get("best_time") || ""}`,
      `Permission to contact: ${data.get("contact_permission") ? "Yes" : "No"}`,
    ].join("\n")
  );

  window.location.href = `mailto:contact@inlandempireghosthunters.com?subject=${subject}&body=${body}`;
});
