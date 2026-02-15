/**
 * RICHARD SANTIAGO - SHOTTENKIRK MASTER ENGINE
 */

// 1. GLOBAL UTILITIES (Buttons in car cards)
async function shareVehicle(name, price) {
    const shareData = {
        title: `Check out this ${name}`,
        text: `Hey! Richard Santiago at Shottenkirk found this ${name} for $${price}/week.`,
        url: window.location.href
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
            alert("Deal details copied to clipboard!");
        }
    } catch (err) { console.error("Error sharing:", err); }
}

function subscribePriceDrop(carName) {
    const email = prompt(`Enter your email for price drop alerts on the ${carName}:`);
    if (email) alert(`Success! Richard will notify ${email} of price changes.`);
}

document.addEventListener('DOMContentLoaded', () => {
    let carFleet = [];

    // FORM SUBMISSION LOGIC
const contactForm = document.getElementById('contactForm');
const formContainer = document.getElementById('formContainer');
const successMessage = document.getElementById('successMessage');
const userNameDisplay = document.getElementById('userNameDisplay');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault(); // Prevent page reload

        // 1. Get the user's name to personalize the message
        const name = document.getElementById('formName').value;
        userNameDisplay.textContent = name.split(' ')[0]; // Just the first name

        // 2. Hide form, show success
        formContainer.style.display = 'none';
        successMessage.style.display = 'flex';

        // 3. Optional: Reset form for next time
        contactForm.reset();
        
        // Auto-close after 5 seconds (optional)
        setTimeout(() => {
            if (elements.modal.style.display === 'flex') {
                closeModal();
            }
        }, 5000);
    });
}

// Helper to reset modal view when closed
function closeModal() {
    elements.modal.style.display = 'none';
    // Reset view so form shows next time it's opened
    setTimeout(() => {
        formContainer.style.display = 'block';
        successMessage.style.display = 'none';
    }, 500);
}

    const elements = {
        grid: document.getElementById('inventoryGrid'),
        brandInput: document.getElementById('brandSearch'),
        priceSlider: document.getElementById('priceRange'),
        priceVal: document.getElementById('priceValue'),
        sort: document.getElementById('sortOrder'),
        modal: document.getElementById('contactModal'),
        hamburger: document.getElementById('hamburger'),
        navLinks: document.getElementById('navLinks'),
        vinInput: document.getElementById('vinInput'),
        decodeBtn: document.getElementById('decodeBtn'),
        vinResult: document.getElementById('vinResult')
    };

    /**
     * FEATURE: VIN DECODER
     */
    if (elements.decodeBtn) {
        elements.decodeBtn.onclick = async () => {
            const vin = elements.vinInput.value.trim();
            if (vin.length !== 17) return alert("Please enter a valid 17-digit VIN");
            
            elements.vinResult.innerHTML = "Decoding...";
            try {
                const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
                const data = await res.json();
                const results = data.Results;
                
                const getVal = (id) => results.find(r => r.VariableId === id)?.Value || "N/A";
                
                elements.vinResult.innerHTML = `
                    <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin-top: 15px;">
                        <strong>Vehicle:</strong> ${getVal(143)} ${getVal(434)} ${getVal(28)}<br>
                        <strong>Engine:</strong> ${getVal(9)} ${getVal(11)}L<br>
                        <strong>Assembled in:</strong> ${getVal(31)}
                    </div>`;
            } catch (e) { elements.vinResult.innerHTML = "Error retrieving data."; }
        };
    }

    /**
     * UI: MODAL & NAV
     */
    const toggleModal = (show) => elements.modal.style.display = show ? 'flex' : 'none';

    document.addEventListener('click', (e) => {
        if (e.target.id === 'contactBtn' || e.target.innerText.includes('Inquire') || e.target.innerText.includes('Lock In')) {
            toggleModal(true);
        }
        if (e.target.classList.contains('close-btn')) toggleModal(false);
    });

    if (elements.hamburger) {
        elements.hamburger.onclick = (e) => {
            e.stopPropagation();
            elements.navLinks.classList.toggle('active');
            elements.hamburger.classList.toggle('is-active');
        };
    }

    /**
     * INVENTORY: API & RENDERING
     */
    async function updateFleet() {
        const brand = elements.brandInput.value || 'Ford';
        try {
            const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/getmodelsformake/${brand}?format=json`);
            const data = await res.json();
            
            carFleet = data.Results.slice(0, 12).map(car => ({
                name: `${car.Make_Name} ${car.Model_Name}`,
                price: Math.floor(Math.random() * 800) + 200,
                img: `https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=60&w=500&car,${car.Model_Name}`
            }));
            renderUI();
        } catch (e) { console.error("API Error"); }
    }

    function renderUI() {
        const maxPrice = parseInt(elements.priceSlider.value);
        elements.priceVal.textContent = `$${maxPrice}`;

        let filtered = carFleet.filter(c => c.price <= maxPrice);
        if (elements.sort.value === 'low') filtered.sort((a,b) => a.price - b.price);
        if (elements.sort.value === 'high') filtered.sort((a,b) => b.price - a.price);

        elements.grid.innerHTML = filtered.map(car => `
            <div class="card">
                <div class="card-badge">Available</div>
                <img src="${car.img}" alt="${car.name}">
                <div class="card-content">
                    <span class="price">$${car.price}/wk</span>
                    <h3>${car.name}</h3>
                    <div class="card-actions">
                        <button class="btn btn-primary">Inquire</button>
                        <button class="btn btn-share" onclick="shareVehicle('${car.name}', '${car.price}')">📤</button>
                        <button class="btn btn-alert" onclick="subscribePriceDrop('${car.name}')">🔔</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * FINANCE: LOAN CALCULATOR
     */
    function calculateLoan() {
        const price = parseFloat(document.getElementById('calcPrice')?.value) || 0;
        const down = parseFloat(document.getElementById('calcDown')?.value) || 0;
        const rate = (parseFloat(document.getElementById('calcRate')?.value) / 100 / 12) || 0;
        const term = parseInt(document.getElementById('calcTerm')?.value) || 60;
        
        const principal = price - down;
        const x = Math.pow(1 + rate, term);
        const monthly = (principal * x * rate) / (x - 1);

        document.getElementById('monthlyPayment').textContent = isFinite(monthly) && monthly > 0 ? `$${monthly.toFixed(2)}` : "$0.00";
        document.getElementById('totalInterest').textContent = isFinite(monthly) ? `$${((monthly * term) - principal).toFixed(2)}` : "$0.00";
    }

    // Event Listeners
    ['calcPrice', 'calcDown', 'calcRate', 'calcTerm'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateLoan);
    });
    elements.brandInput?.addEventListener('change', updateFleet);
    elements.priceSlider?.addEventListener('input', renderUI);
    elements.sort?.addEventListener('change', renderUI);

    updateFleet();
    calculateLoan();
});