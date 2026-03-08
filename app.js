// 1. GLOBAL STATE (Top level so all functions see them)
let isSent = false;
let countdown;
let timeLeft = 3;

// 1. THE FOOLPROOF BUILDER
const smsUrlBuilder = (number, body) => {
    const cleanNumber = number.replace(/\s+/g, '');
    const target = cleanNumber || "+2348000000000";
    // Using '?' for single recipients is 100% stable on Android & iOS
    return `sms:${target}?body=${encodeURIComponent(body)}`;
};
// 2. THE MULTI-BUTTON DISPLAY
const showSmsButton = (body) => {
    const statusMsg = document.getElementById('statusMsg');
    
    // Grab numbers from inputs
    const c1 = document.getElementById('contact1')?.value || "";
    const c2 = document.getElementById('contact2')?.value || "";

    let buttonsHTML = `<div style="margin-top:15px;">`;

    if (c1) {
        buttonsHTML += `
            <a href="${smsUrlBuilder(c1, body)}" class="sos-final-btn" style="background: #d32f2f; display:block; padding: 20px; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; margin-bottom:12px; border: 2px solid #b71c1c;">
               🚨 SEND PRIMARY ALERT
            </a>`;
    }

    if (c2) {
        buttonsHTML += `
            <a href="${smsUrlBuilder(c2, body)}" class="sos-final-btn" style="background: #333; display:block; padding: 20px; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; text-align: center; border: 2px solid #000;">
               🛡️ SEND BACKUP ALERT
            </a>`;
    }

    if (!c1 && !c2) {
        buttonsHTML += `<p style="color:#ff5252; font-weight:bold;">⚠️ No contacts set in Settings!</p>`;
    }

    buttonsHTML += `</div>`;
    statusMsg.innerHTML = buttonsHTML;
    };
// 3. THE RESET LOGIC
window.stopAll = () => {
    if (confirm("Do you want to stop siren and reset App? (Stop & Reset?)")) {
        const siren = document.getElementById('sirenAudio');
        if (siren) {
            siren.pause();
            siren.currentTime = 0;
        }
        if (navigator.vibrate) navigator.vibrate(0);
        isSent = false;
        location.reload(); // Hard reset to clear UI
    }
};

// 4. THE MAIN ENGINE
document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const sosButton = document.getElementById('sos-btn');
    const statusMsg = document.getElementById('statusMsg');
    const timerDisplay = document.getElementById('timer');
    const siren = document.getElementById('sirenAudio');
    const stopBtn = document.getElementById('stop-btn');
    const stealthToggle = document.getElementById('stealthToggle');
    const bloodInput = document.getElementById('bloodGroup');
    const allergiesInput = document.getElementById('allergies');

    // Load Saved Data
    if (stealthToggle) {
        stealthToggle.checked = localStorage.getItem('vgn_stealth_mode') === 'true';
        stealthToggle.addEventListener('change', () => localStorage.setItem('vgn_stealth_mode', stealthToggle.checked));
    }
    if (bloodInput) {
        bloodInput.value = localStorage.getItem('vgn_blood') || '';
        bloodInput.addEventListener('input', () => localStorage.setItem('vgn_blood', bloodInput.value));
    }
    if (allergiesInput) {
        allergiesInput.value = localStorage.getItem('vgn_allergies') || '';
        allergiesInput.addEventListener('input', () => localStorage.setItem('vgn_allergies', allergiesInput.value));
    }

    const contact2Input = document.getElementById('contact2');
if(contact2Input) {
    contact2Input.value = localStorage.getItem('vgn_contact2') || '';
    contact2Input.addEventListener('input', () => {
        localStorage.setItem('vgn_contact2', contact2Input.value);
    });
}

    // Stealth Siren Logic
    window.playSiren = () => {
        const isStealth = localStorage.getItem('vgn_stealth_mode') === 'true';
        if (!isStealth && siren) {
            siren.play().catch(e => console.log("Audio Blocked"));
            if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500]);
        }
    };

    // SOS Functions
    const startSOS = () => {
        if (isSent) return;
        timeLeft = 3;
        timerDisplay.innerText = timeLeft;
        sosButton.classList.add('active');
        statusMsg.innerText = "Hold for 3 Seconds...";
        countdown = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(countdown);
                finishSOS(); 
            }
        }, 1000);
    };

    const cancelSOS = () => {
        if (isSent) return;
        clearInterval(countdown);
        sosButton.classList.remove('active');
        timerDisplay.innerText = "";
        statusMsg.innerText = "VigilantNG Ready";
    };

   const finishSOS = () => {
    isSent = true;
    const sosButton = document.getElementById('sos-btn');
    if (sosButton) sosButton.classList.add('sent');
    
    // Get Intelligence Data
    const blood = localStorage.getItem('vgn_blood') || "Not Provided";
    const allergies = localStorage.getItem('vgn_allergies') || "None";

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;

        const smsBody = `VIGN EMERGENCY ALERT!%0A` +
                        `Location: ${mapUrl}%0A` +
                        `Hostel: ${Name}%0A` +
                        `Room: ${number}`;

        showSmsButton(smsBody); // Trigger the dual buttons
        window.playSiren();
    }, (err) => {
        const smsBody = `VIGN EMERGENCY! (GPS Off)%0A` +
                        `Hostel: ${hostel}%0A` +
                        `Room Number: ${room}`;
        showSmsButton(smsBody);
        window.playSiren();
    }, { enableHighAccuracy: true });
};
    // Listeners
    sosButton.addEventListener('mousedown', startSOS);
    sosButton.addEventListener('mouseup', cancelSOS);
    sosButton.addEventListener('touchstart', (e) => { e.preventDefault(); startSOS(); });
    sosButton.addEventListener('touchend', cancelSOS);
    
    if (stopBtn) stopBtn.addEventListener('click', window.stopAll);
});

const contactInput = document.getElementById('contact1');
if(contactInput) {
    // Load saved number
    contactInput.value = localStorage.getItem('vgn_contact') || '';
    // Save number as they type
    contactInput.addEventListener('input', () => {
        localStorage.setItem('vgn_contact', contactInput.value);
    });
}