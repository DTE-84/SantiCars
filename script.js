async function shareVehicle(name, price) {
  const shareData = {
    title: `Check out this ${name}`,
    text: `Hey! Richard Santiago at Shottenkirk found this ${name} for $${price}/week.`,
    url: window.location.href,
  };
  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      alert("Deal details copied to clipboard!");
    }
  } catch (err) {
  }
}

function subscribePriceDrop(carName) {
  const email = prompt(
    `Enter your email for price drop alerts on the ${carName}:`,
  );
  if (email) alert(`Success! Richard will notify ${email} of price changes.`);
}

document.addEventListener("DOMContentLoaded", () => {
  let carFleet = [];

  const elements = {
    grid: document.getElementById("inventoryGrid"),
    brandInput: document.getElementById("brandSearch"),
    priceSlider: document.getElementById("priceRange"),
    priceVal: document.getElementById("priceValue"),
    sort: document.getElementById("sortOrder"),
    modal: document.getElementById("contactModal"),
    hamburger: document.getElementById("hamburger"),
    navLinks: document.getElementById("navLinks"),
    vinInput: document.getElementById("vinInput"),
    decodeBtn: document.getElementById("decodeBtn"),
    vinResult: document.getElementById("vinResult"),
    contactForm: document.getElementById("contactForm"),
    formContainer: document.getElementById("formContainer"),
    successMessage: document.getElementById("successMessage"),
    userNameDisplay: document.getElementById("userNameDisplay"),
    successCloseBtn: document.getElementById("successCloseBtn"),
  };

  const toggleModal = (show) => {
    if (!elements.modal) return;
    elements.modal.style.display = show ? "flex" : "none";
    if (!show) {
      setTimeout(() => {
        if (elements.formContainer) elements.formContainer.style.display = "block";
        if (elements.successMessage) elements.successMessage.style.display = "none";
      }, 500);
    }
  };

  const closeModal = () => toggleModal(false);

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (
      target.id === "contactBtn" ||
      target.id === "lockRateBtn" ||
      target.id === "workWithRichardBtn" ||
      target.classList.contains("inquire-btn") ||
      target.innerText.includes("Inquire") ||
      target.innerText.includes("Work With Richard") ||
      target.innerText.includes("Lock In This Rate")
    ) {
      toggleModal(true);
    }
    if (target.classList.contains("close-btn") || target.id === "successCloseBtn") {
      closeModal();
    }
    if (target === elements.modal) {
      closeModal();
    }
  });

  if (elements.contactForm) {
    elements.contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const nameInput = document.getElementById("formName");
      const name = nameInput ? nameInput.value : "Partner";
      if (elements.userNameDisplay) {
        elements.userNameDisplay.textContent = name.split(" ")[0];
      }

      if (elements.formContainer) elements.formContainer.style.display = "none";
      if (elements.successMessage) elements.successMessage.style.display = "flex";

      elements.contactForm.reset();

      setTimeout(() => {
        if (elements.modal.style.display === "flex") {
          closeModal();
        }
      }, 5000);
    });
  }

  if (elements.hamburger) {
    elements.hamburger.onclick = (e) => {
      e.stopPropagation();
      elements.navLinks.classList.toggle("active");
      elements.hamburger.classList.toggle("is-active");
    };
  }

  if (elements.decodeBtn) {
    elements.decodeBtn.onclick = async () => {
      const vin = elements.vinInput.value.trim();
      if (vin.length !== 17) return alert("Please enter a valid 17-digit VIN");

      elements.vinResult.innerHTML = "Decoding...";
      try {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`,
        );
        const data = await res.json();
        const results = data.Results;

        const getVal = (id) =>
          results.find((r) => r.VariableId === id)?.Value || "N/A";

        elements.vinResult.innerHTML = `
                    <div class="vin-details">
                        <h4>Vehicle Specifications</h4>
                        <p><strong>Vehicle:</strong> ${getVal(143)} ${getVal(434)} ${getVal(28)}</p>
                        <p><strong>Engine:</strong> ${getVal(9)} ${getVal(11)}L</p>
                        <p><strong>Assembled in:</strong> ${getVal(31)}</p>
                    </div>`;
      } catch (e) {
        elements.vinResult.innerHTML = '<div class="error">Error retrieving data.</div>';
      }
    };
  }

  async function updateFleet() {
    const brand = elements.brandInput.value || "Ford";
    if (elements.grid) elements.grid.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${brand}?format=json`,
      );
      const data = await res.json();

      if (!data.Results || data.Results.length === 0) {
        elements.grid.innerHTML = '<div class="error">No vehicles found for this brand.</div>';
        return;
      }

      carFleet = data.Results.slice(0, 12).map((car) => ({
        name: `${car.Make_Name} ${car.Model_Name}`,
        price: Math.floor(Math.random() * 800) + 200,
        img: `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=60&w=500&car,${car.Model_Name}`,
      }));
      renderUI();
    } catch (e) {
      if (elements.grid) elements.grid.innerHTML = '<div class="error">Could not load inventory. Please try again.</div>';
    }
  }

  function renderUI() {
    if (!elements.grid) return;
    const maxPrice = parseInt(elements.priceSlider.value);
    elements.priceVal.textContent = `$${maxPrice}`;

    let filtered = carFleet.filter((c) => c.price <= maxPrice);
    if (elements.sort.value === "low")
      filtered.sort((a, b) => a.price - b.price);
    if (elements.sort.value === "high")
      filtered.sort((a, b) => b.price - a.price);

    if (filtered.length === 0) {
      elements.grid.innerHTML = '<div class="error">No vehicles match your price filter.</div>';
      return;
    }

    elements.grid.innerHTML = filtered
      .map(
        (car) => `
            <div class="card">
                <div class="card-badge">Available</div>
                <img src="${car.img}" alt="${car.name}">
                <div class="card-content">
                    <span class="price">$${car.price}/wk</span>
                    <h3>${car.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-primary inquire-btn">Inquire</button>
                        <button class="btn btn-share" onclick="shareVehicle('${car.name}', '${car.price}')">📤</button>
                        <button class="btn btn-alert" onclick="subscribePriceDrop('${car.name}')">🔔</button>
                    </div>
                </div>
            </div>
        `,
      )
      .join("");
  }

  function calculateLoan() {
    const price = parseFloat(document.getElementById("calcPrice")?.value) || 0;
    const down = parseFloat(document.getElementById("calcDown")?.value) || 0;
    const rate =
      parseFloat(document.getElementById("calcRate")?.value) / 100 / 12 || 0;
    const term = parseInt(document.getElementById("calcTerm")?.value) || 60;

    const principal = price - down;
    const x = Math.pow(1 + rate, term);
    const monthly = (principal * x * rate) / (x - 1);

    document.getElementById("monthlyPayment").textContent =
      isFinite(monthly) && monthly > 0 ? `$${monthly.toFixed(2)}` : "$0.00";
    document.getElementById("totalInterest").textContent = isFinite(monthly)
      ? `$${(monthly * term - principal).toFixed(2)}`
      : "$0.00";
  }

  ["calcPrice", "calcDown", "calcRate", "calcTerm"].forEach((id) => {
    document.getElementById(id)?.addEventListener("input", calculateLoan);
  });
  elements.brandInput?.addEventListener("change", updateFleet);
  elements.priceSlider?.addEventListener("input", renderUI);
  elements.sort?.addEventListener("change", renderUI);

  updateFleet();
  calculateLoan();
});
