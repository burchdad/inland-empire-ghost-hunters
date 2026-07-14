const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");
const form = document.querySelector("#investigation-form");
const evidenceFilesInput = document.querySelector("#evidence-files");
const uploadList = document.querySelector("#upload-list");
const formStatus = document.querySelector("#form-status");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xnjendbz";

const MAX_EVIDENCE_FILES = 6;
const MAX_EVIDENCE_FILE_SIZE = 100 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(["aac", "avi", "doc", "docx", "gif", "heic", "heif", "jpeg", "jpg", "m4a", "md", "mov", "mp3", "mp4", "ogg", "pdf", "png", "txt", "wav", "webm", "webp"]);

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

function setFormStatus(message, type = "info") {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.dataset.status = type;
}

function formatFileSize(size) {
  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getFileExtension(fileName) {
  return fileName.includes(".") ? fileName.split(".").pop().toLowerCase() : "";
}

function sanitizeFileName(fileName) {
  const extension = getFileExtension(fileName);
  const baseName = fileName.replace(/\.[^/.]+$/, "") || "evidence-file";
  const safeBaseName = baseName
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "evidence-file";

  return extension ? `${safeBaseName}.${extension}` : safeBaseName;
}

function validateEvidenceFiles(files) {
  if (files.length > MAX_EVIDENCE_FILES) {
    return `Please upload no more than ${MAX_EVIDENCE_FILES} files at one time.`;
  }

  for (const file of files) {
    const extension = getFileExtension(file.name);

    if (file.size > MAX_EVIDENCE_FILE_SIZE) {
      return `${file.name} is larger than 100 MB.`;
    }

    if (!ACCEPTED_EXTENSIONS.has(extension)) {
      return `${file.name} is not an accepted evidence file type.`;
    }
  }

  return "";
}

function updateUploadList() {
  if (!uploadList || !evidenceFilesInput) return;

  const files = Array.from(evidenceFilesInput.files || []);
  uploadList.innerHTML = "";

  if (!files.length) {
    return;
  }

  for (const file of files) {
    const item = document.createElement("li");
    item.textContent = `${file.name} (${formatFileSize(file.size)})`;
    uploadList.append(item);
  }

  const validationMessage = validateEvidenceFiles(files);
  if (validationMessage) {
    setFormStatus(validationMessage, "error");
  } else {
    setFormStatus(`${files.length} evidence file${files.length === 1 ? "" : "s"} ready to upload.`, "info");
  }
}

function createCaseId() {
  const randomPart = crypto.randomUUID
    ? crypto.randomUUID().split("-")[0].toUpperCase()
    : Math.random().toString(36).slice(2, 10).toUpperCase();

  return `IEGH-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
}

function buildCasePacket(data, caseId, evidenceTypes, uploadedFiles) {
  return {
    caseId,
    submittedAt: new Date().toISOString(),
    contact: {
      name: data.get("name") || "",
      email: data.get("email") || "",
      phone: data.get("phone") || "",
      bestTime: data.get("best_time") || "",
      contactPermission: Boolean(data.get("contact_permission")),
    },
    location: {
      city: data.get("city") || "",
      type: data.get("location_type") || "",
      areas: data.get("areas") || "",
    },
    activity: {
      description: data.get("activity_description") || "",
      started: data.get("started") || "",
      frequency: data.get("frequency") || "",
      physicalEffects: data.get("physical_effects") || "",
      vulnerableAffected: data.get("vulnerable_affected") || "",
    },
    evidence: {
      types: evidenceTypes,
      files: uploadedFiles,
    },
  };
}

async function uploadEvidenceFile(upload, file, caseId, uploadCount) {
  const safeName = sanitizeFileName(file.name);

  return upload(`evidence/${caseId}/${safeName}`, file, {
    access: "private",
    handleUploadUrl: "/api/evidence-upload",
    clientPayload: JSON.stringify({
      caseId,
      uploadCount,
      website: form?.elements.website?.value || "",
    }),
  });
}

async function uploadCasePacket(upload, packet, caseId, uploadCount) {
  const caseBlob = new Blob([JSON.stringify(packet, null, 2)], {
    type: "application/json",
  });

  return upload(`evidence/${caseId}/case-intake.json`, caseBlob, {
    access: "private",
    handleUploadUrl: "/api/evidence-upload",
    clientPayload: JSON.stringify({
      caseId,
      uploadCount,
      website: form?.elements.website?.value || "",
    }),
  });
}

function buildNotificationLines(data, caseId, evidence, uploadedFiles, casePacketUrl) {
  return [
    `Case ID: ${caseId}`,
    `Private case packet: ${casePacketUrl}`,
    "",
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
    `Uploaded files: ${uploadedFiles.length}`,
    ...uploadedFiles.map((file, index) => `${index + 1}. ${file.fileName} - ${file.url}`),
    "",
    `Best time to contact: ${data.get("best_time") || ""}`,
    `Permission to contact: ${data.get("contact_permission") ? "Yes" : "No"}`,
  ];
}

async function notifyTeam(data, caseId, evidence, uploadedFiles, casePacketUrl) {
  const notification = new FormData();
  const message = buildNotificationLines(data, caseId, evidence, uploadedFiles, casePacketUrl).join("\n");

  notification.append("_subject", `Investigation Request - ${caseId}`);
  notification.append("case_id", caseId);
  notification.append("case_packet_url", casePacketUrl);
  notification.append("name", data.get("name") || "");
  notification.append("email", data.get("email") || "");
  notification.append("phone", data.get("phone") || "");
  notification.append("city", data.get("city") || "");
  notification.append("location_type", data.get("location_type") || "");
  notification.append("best_time", data.get("best_time") || "");
  notification.append("evidence_types", evidence);
  notification.append("uploaded_file_count", String(uploadedFiles.length));
  notification.append("uploaded_files", uploadedFiles.map((file) => `${file.fileName}: ${file.url}`).join("\n"));
  notification.append("message", message);

  const response = await fetch(form?.action || FORMSPREE_ENDPOINT, {
    method: "POST",
    body: notification,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("The case was uploaded, but the notification could not be sent. Please email contact@inlandempireghosthunters.com.");
  }
}

evidenceFilesInput?.addEventListener("change", updateUploadList);

form?.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  submitInvestigationRequest().catch((error) => {
    console.error(error);
    setFormStatus(error.message || "Something went wrong while submitting the request.", "error");
    const submitButton = form.querySelector("button[type='submit']");
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "Submit Private Case Intake";
    }
  });
});

async function submitInvestigationRequest() {
  const data = new FormData(form);
  const files = Array.from(evidenceFilesInput?.files || []);
  const fileValidationMessage = validateEvidenceFiles(files);
  const submitButton = form.querySelector("button[type='submit']");

  if (fileValidationMessage) {
    setFormStatus(fileValidationMessage, "error");
    return;
  }

  if (data.get("website")) {
    setFormStatus("Unable to submit this request.", "error");
    return;
  }

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "Uploading Evidence...";
  }

  const caseId = createCaseId();
  const evidenceTypes = data.getAll("evidence");
  const evidence = evidenceTypes.join(", ") || "No evidence type selected";
  const uploadedFiles = [];

  setFormStatus("Preparing secure upload...", "info");

  const { upload } = await import("https://esm.sh/@vercel/blob@2.5.0/client");

  for (const [index, file] of files.entries()) {
    setFormStatus(`Uploading ${index + 1} of ${files.length}: ${file.name}`, "info");
    const blob = await uploadEvidenceFile(upload, file, caseId, files.length + 1);
    uploadedFiles.push({
      fileName: file.name,
      size: file.size,
      type: file.type || getFileExtension(file.name),
      url: blob.url,
      pathname: blob.pathname,
    });
  }

  const packet = buildCasePacket(data, caseId, evidenceTypes, uploadedFiles);
  setFormStatus("Saving private case packet...", "info");
  const casePacketBlob = await uploadCasePacket(upload, packet, caseId, files.length + 1);

  setFormStatus("Sending private case notification...", "info");
  await notifyTeam(data, caseId, evidence, uploadedFiles, casePacketBlob.url);
  form.reset();
  updateUploadList();
  setFormStatus(`Case ${caseId} submitted. The team has been notified and will review the details privately.`, "success");

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.textContent = "Submit Private Case Intake";
  }
}
