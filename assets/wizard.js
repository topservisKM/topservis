/* ==========================================================================
   ТОП СЕРВІС — інтерактивний підбір ремонту (wizard)
   Крок 1: пристрій → Крок 2: модель (iPhone: покоління+варіант; Android: бренд+вільний ввід)
   → Крок 3: несправність → Результат: ціна "від" + CTA
   ========================================================================== */

const WIZARD_IPHONE_GENERATIONS = [
  { id: "x",  label: "X / XS / XR",  years: "2017–2018", variants: ["X", "XS", "XS Max", "XR"], slug: null },
  { id: "11", label: "iPhone 11",    years: "2019",       variants: ["11", "11 Pro", "11 Pro Max"], slug: "iphone-11" },
  { id: "12", label: "iPhone 12",    years: "2020",       variants: ["12 mini", "12", "12 Pro", "12 Pro Max"], slug: "iphone-12" },
  { id: "13", label: "iPhone 13",    years: "2021",       variants: ["13 mini", "13", "13 Pro", "13 Pro Max"], slug: "iphone-13" },
  { id: "14", label: "iPhone 14",    years: "2022",       variants: ["14", "14 Plus", "14 Pro", "14 Pro Max"], slug: "iphone-14" },
  { id: "15", label: "iPhone 15",    years: "2023",       variants: ["15", "15 Plus", "15 Pro", "15 Pro Max"], slug: "iphone-15" },
  { id: "16", label: "iPhone 16",    years: "2024",       variants: ["16e", "16", "16 Plus", "16 Pro", "16 Pro Max"], slug: "iphone-16" },
  { id: "17", label: "iPhone 17",    years: "2025",       variants: ["17", "17 Air", "17 Pro", "17 Pro Max"], slug: null },
];

const WIZARD_IPHONE_PRICES = {
  x:  { glass: 650, battery: 750, port: 500 },
  11: { glass: 700, battery: 800, port: 550 },
  12: { glass: 750, battery: 850, port: 550 },
  13: { glass: 800, battery: 900, port: 600 },
  14: { glass: 850, battery: 950, port: 650 },
  15: { glass: 950, battery: 1000, port: 700 },
  16: { glass: 1100, battery: 1100, port: 750 },
  17: { glass: 1200, battery: 1150, port: 800 },
};

const WIZARD_BRANDS = [
  { id: "iphone", label: "iPhone", icon: "📱" },
  { id: "samsung", label: "Samsung", icon: "📱", url: "/samsung/" },
  { id: "xiaomi", label: "Xiaomi / Redmi", icon: "📱", url: "/xiaomi/" },
  { id: "poco", label: "POCO", icon: "📱", url: "/poco/" },
  { id: "huawei", label: "Huawei", icon: "📱", url: "/huawei/" },
  { id: "realme", label: "Realme", icon: "📱", url: "/realme/" },
  { id: "nubia", label: "Nubia / Red Magic", icon: "📱", url: "/nubia/" },
  { id: "laptop", label: "Ноутбук", icon: "💻", url: "/services/laptop-repair/" },
  { id: "other", label: "Інший бренд", icon: "📟" },
];

const WIZARD_ISSUES = [
  { id: "screen", label: "Розбитий екран / скло", icon: "💥", formOption: "Розбитий екран / скло" },
  { id: "battery", label: "Швидко сідає батарея", icon: "🔋", formOption: "Швидко розряджається" },
  { id: "charging", label: "Не заряджається", icon: "🔌", formOption: "Не заряджається" },
  { id: "power", label: "Не вмикається", icon: "⚡", formOption: "Не вмикається" },
  { id: "water", label: "Потрапила вода", icon: "💧", formOption: "Потрапила вода" },
  { id: "camera", label: "Не працює камера", icon: "📷", formOption: "Не працює камера" },
  { id: "faceid", label: "Face ID / розпізнавання", icon: "👤", formOption: "Інша несправність" },
  { id: "other", label: "Інша несправність", icon: "❓", formOption: "Інша несправність" },
];

// Generic (non-iPhone) price ranges — consistent with brand hub pages
const WIZARD_ANDROID_PRICES = {
  screen: [700, 950], battery: [650, 850], charging: [450, 550],
  power: [0, 0], water: [0, 0], camera: [500, 700], faceid: [500, 700], other: [0, 0],
};

let wizardState = { brand: null, generation: null, variant: null, modelText: "", issue: null };

function wizardDots(current, total) {
  let dots = "";
  for (let i = 1; i <= total; i++) {
    const cls = i < current ? "done" : (i === current ? "active" : "");
    dots += `<div class="wizard-progress-dot ${cls}"></div>`;
  }
  return `<div class="wizard-progress">${dots}</div>`;
}

function wizardInit(rootId) {
  wizardState = { brand: null, generation: null, variant: null, modelText: "", issue: null, iphoneOnly: false };
  wizardRenderStep1(rootId);
}

function wizardInitIphoneOnly(rootId) {
  wizardState = { brand: "iphone", generation: null, variant: null, modelText: "", issue: null, iphoneOnly: true };
  wizardRenderIphoneGenerations(rootId, { totalSteps: 2, noBack: true });
}

function wizardStepHeader(title, stepNum) {
  return `<div class="wizard-step-header"><span class="wizard-step-num">Крок ${stepNum} з 3</span><h3>${title}</h3></div>`;
}

function wizardRenderStep1(rootId) {
  const root = document.getElementById(rootId);
  const buttons = WIZARD_BRANDS.map(b =>
    `<button class="wizard-choice" onclick="wizardPickBrand('${rootId}','${b.id}')">
       <span class="wizard-choice-icon">${b.icon}</span><span><span>${b.label}</span></span>
     </button>`
  ).join("");
  root.innerHTML = `
    ${wizardDots(1, 3)}
    ${wizardStepHeader("Який у вас пристрій?", 1)}
    <div class="wizard-grid">${buttons}</div>
  `;
}

function wizardPickBrand(rootId, brandId) {
  wizardState.brand = brandId;
  const brand = WIZARD_BRANDS.find(b => b.id === brandId);
  if (brandId === "laptop") {
    window.location.href = brand.url;
    return;
  }
  if (brandId === "iphone") {
    wizardRenderIphoneGenerations(rootId);
  } else {
    wizardRenderAndroidModel(rootId, brand);
  }
}

function wizardRenderIphoneGenerations(rootId, opts) {
  opts = opts || {};
  const root = document.getElementById(rootId);
  const buttons = WIZARD_IPHONE_GENERATIONS.map(g =>
    `<button class="wizard-choice wizard-choice-plain" onclick="wizardPickGeneration('${rootId}','${g.id}')">
       <span><span>${g.label}</span><span class="wizard-choice-sub">${g.years}</span></span>
     </button>`
  ).join("");
  const stepLabel = opts.totalSteps ? `Крок 1 з ${opts.totalSteps}` : "Крок 2 з 3";
  const dotsTotal = opts.totalSteps || 3;
  const dotsCurrent = opts.totalSteps ? 1 : 2;
  root.innerHTML = `
    ${wizardDots(dotsCurrent, dotsTotal)}
    <div class="wizard-step-header"><span class="wizard-step-num">${stepLabel}</span><h3>Яке покоління iPhone?</h3></div>
    <div class="wizard-grid">${buttons}</div>
    ${opts.noBack ? "" : `<button class="wizard-back" onclick="wizardRenderStep1('${rootId}')">← Назад</button>`}
  `;
}

function wizardPickGeneration(rootId, genId) {
  wizardState.generation = genId;
  const gen = WIZARD_IPHONE_GENERATIONS.find(g => g.id === genId);
  const root = document.getElementById(rootId);
  const buttons = gen.variants.map(v =>
    `<button class="wizard-choice wizard-choice-plain" onclick="wizardPickVariant('${rootId}', ${JSON.stringify(v).replace(/"/g, '&quot;')})">
       <span>${v}</span>
     </button>`
  ).join("");
  const stepLabel = wizardState.iphoneOnly ? "Крок 2 з 2" : "Крок 2 з 3";
  const dotsTotal2 = wizardState.iphoneOnly ? 2 : 3;
  root.innerHTML = `
    ${wizardDots(2, dotsTotal2)}
    <div class="wizard-step-header"><span class="wizard-step-num">${stepLabel}</span><h3>${gen.label} — який саме варіант?</h3></div>
    <div class="wizard-grid">${buttons}</div>
    <button class="wizard-back" onclick="${wizardState.iphoneOnly ? `wizardInitIphoneOnly('${rootId}')` : `wizardRenderIphoneGenerations('${rootId}')`}">← Назад</button>
  `;
}

function wizardPickVariant(rootId, variant) {
  wizardState.variant = variant;
  wizardRenderIssues(rootId);
}

function wizardRenderAndroidModel(rootId, brand) {
  const root = document.getElementById(rootId);
  root.innerHTML = `
    ${wizardDots(2, 3)}
    ${wizardStepHeader(`${brand.label} — яка модель?`, 2)}
    <div class="wizard-model-input">
      <input type="text" id="${rootId}-modeltext" class="form-control" placeholder="Наприклад: Galaxy S23, Redmi Note 12...">
      <button class="btn-primary" onclick="wizardSubmitModelText('${rootId}')">Далі →</button>
    </div>
    <button class="wizard-skip" onclick="wizardSubmitModelText('${rootId}', true)">Не знаю точну модель — вкажу майстру на місці</button>
    <button class="wizard-back" onclick="wizardRenderStep1('${rootId}')">← Назад</button>
  `;
}

function wizardSubmitModelText(rootId, skip) {
  if (!skip) {
    const input = document.getElementById(`${rootId}-modeltext`);
    wizardState.modelText = input ? input.value.trim() : "";
  } else {
    wizardState.modelText = "";
  }
  wizardRenderIssues(rootId);
}

function wizardRenderIssues(rootId) {
  const root = document.getElementById(rootId);
  const buttons = WIZARD_ISSUES.map(i =>
    `<button class="wizard-choice" onclick="wizardPickIssue('${rootId}','${i.id}')">
       <span class="wizard-choice-icon">${i.icon}</span><span><span>${i.label}</span></span>
     </button>`
  ).join("");
  const totalSteps = wizardState.iphoneOnly ? 2 : 3;
  root.innerHTML = `
    ${wizardDots(totalSteps, totalSteps)}
    <div class="wizard-step-header"><span class="wizard-step-num">Крок ${totalSteps} з ${totalSteps}</span><h3>Що трапилось?</h3></div>
    <div class="wizard-grid">${buttons}</div>
    <button class="wizard-back" onclick="wizardGoBackFromIssues('${rootId}')">← Назад</button>
  `;
}

function wizardGoBackFromIssues(rootId) {
  if (wizardState.brand === "iphone") {
    wizardRenderIphoneGenerations(rootId, wizardState.iphoneOnly ? { totalSteps: 2, noBack: true } : {});
  } else {
    const brand = WIZARD_BRANDS.find(b => b.id === wizardState.brand);
    wizardRenderAndroidModel(rootId, brand);
  }
}

function wizardPickIssue(rootId, issueId) {
  wizardState.issue = issueId;
  wizardRenderResult(rootId);
}

function wizardRenderResult(rootId) {
  const root = document.getElementById(rootId);
  const issue = WIZARD_ISSUES.find(i => i.id === wizardState.issue);
  let deviceLabel, priceText, detailUrl = null;

  if (wizardState.brand === "iphone") {
    const gen = WIZARD_IPHONE_GENERATIONS.find(g => g.id === wizardState.generation);
    deviceLabel = `iPhone ${wizardState.variant}`;
    const prices = WIZARD_IPHONE_PRICES[wizardState.generation];
    if (wizardState.issue === "screen") priceText = `від ${prices.glass} грн`;
    else if (wizardState.issue === "battery") priceText = `від ${prices.battery} грн`;
    else if (wizardState.issue === "charging") priceText = `від ${prices.port} грн`;
    else if (wizardState.issue === "camera" || wizardState.issue === "faceid") priceText = "від 500 грн";
    else priceText = "діагностика безкоштовно";
    if (gen.slug) detailUrl = `/iphone/${gen.slug}/`;
  } else {
    const brand = WIZARD_BRANDS.find(b => b.id === wizardState.brand);
    deviceLabel = wizardState.modelText ? `${brand.label} ${wizardState.modelText}` : brand.label;
    const range = WIZARD_ANDROID_PRICES[wizardState.issue];
    priceText = range[0] === 0 ? "діагностика безкоштовно" : `від ${range[0]}–${range[1]} грн`;
    if (brand.url) detailUrl = brand.url;
  }

  const formDevice = wizardState.brand === "iphone" ? "iPhone" :
    (WIZARD_BRANDS.find(b => b.id === wizardState.brand)?.label || "Інший смартфон");
  const commentText = `${deviceLabel} — ${issue.label}`.replace(/'/g, "\\'");

  root.innerHTML = `
    <div class="wizard-step-header"><span class="wizard-step-num">Готово</span><h3>Орієнтовна ціна</h3></div>
    <div class="wizard-result">
      <div class="wizard-result-device">${deviceLabel}</div>
      <div class="wizard-result-issue">${issue.icon} ${issue.label}</div>
      <div class="wizard-result-price">${priceText}</div>
      <div class="wizard-result-note">Оригінальні або перевірені аналогові запчастини — уточнюємо разом з вами. Точна ціна — після безкоштовної діагностики.</div>
      <div class="wizard-result-cta">
        <a href="tel:0660052325" class="btn-primary">📞 Зателефонувати</a>
        <button class="btn-telegram" onclick="openTelegram()">Telegram</button>
        <button class="btn-secondary" onclick="wizardFillOrderForm('${formDevice.replace(/'/g, "\\'")}', '${issue.formOption.replace(/'/g, "\\'")}', '${commentText}')">Залишити заявку</button>
      </div>
      ${detailUrl ? `<a href="${detailUrl}" class="wizard-detail-link">Детальніше про цю модель / бренд →</a>` : ""}
    </div>
    <button class="wizard-back" onclick="wizardRenderIssues('${rootId}')">← Обрати іншу несправність</button>
    <button class="wizard-restart" onclick="${wizardState.iphoneOnly ? `wizardInitIphoneOnly('${rootId}')` : `wizardInit('${rootId}')`}">Почати заново</button>
  `;
}

function wizardFillOrderForm(deviceLabel, problemOption, commentText) {
  const deviceSelect = document.getElementById('fdevice');
  const problemSelect = document.getElementById('fproblem');
  const commentField = document.getElementById('fcomment');
  if (deviceSelect) {
    const match = Array.from(deviceSelect.options).find(o => o.text === deviceLabel);
    if (match) deviceSelect.value = match.value;
  }
  if (problemSelect) {
    const match = Array.from(problemSelect.options).find(o => o.text === problemOption);
    if (match) problemSelect.value = match.value;
  }
  if (commentField && !commentField.value) commentField.value = commentText;
  const orderSection = document.getElementById('order');
  if (orderSection) {
    orderSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { const nameField = document.getElementById('fname'); if (nameField) nameField.focus(); }, 500);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('repairWizard')) wizardInit('repairWizard');
  if (document.getElementById('repairWizardIphone')) wizardInitIphoneOnly('repairWizardIphone');
});
