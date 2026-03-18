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
    
    // Pull numbers directly from the specific keys you used
    const c1 = localStorage.getItem('vgn_contact') || "";
    const c2 = localStorage.getItem('vgn_contact2') || "";

    let buttonsHTML = `<div style="margin-top:15px;">`;

    if (c1) {
        buttonsHTML += `
            <a href="${smsUrlBuilder(c1, body)}" style="background: #1565C0; display:block; padding: 22px; color: white; border-radius: 15px; text-decoration: none; font-weight: bold; text-align: center; margin-bottom:15px; border-bottom: 5px solid #0D47A1; font-size: 1.1em;">
               🚨 ALERT CAMPUS SECURITY
            </a>`;
    }

    if (c2) {
        buttonsHTML += `
            <a href="${smsUrlBuilder(c2, body)}" style="background: #455A64; display:block; padding: 20px; color: white; border-radius: 15px; text-decoration: none; font-weight: bold; text-align: center; border-bottom: 5px solid #263238;">
               🛡️ ALERT HOSTEL WARDEN
            </a>`;
    }

    if (!c1 && !c2) {
        buttonsHTML += `<p style="color:#ff5252; font-weight:bold; text-align:center;">⚠️ Please set contacts in Settings!</p>`;
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
    const statusMsg = document.getElementById('statusMsg');
    if (sosButton) sosButton.classList.add('sent');
    
    // 1. PULL DATA FROM THE EXACT LOCALSTORAGE KEYS
    // We match 'vgn_blood' and 'vgn_allergies' which your listeners save to
    const hostel = localStorage.getItem('vgn_blood') || "NOT SET";
    const studentId = localStorage.getItem('vgn_allergies') || "Student";

    // 2. SHOW IMMEDIATE FEEDBACK
    statusMsg.innerHTML = `<p style="color: #1565C0; font-weight: bold; text-align: center;">🛰️ Establishing GPS Lock...</p>`;

    navigator.geolocation.getCurrentPosition((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        // Corrected Map URL syntax
        const mapUrl = `https://www.google.com/maps?q=${lat},${lon}`;

        const smsBody = `🎓 CAMPUS SECURITY ALERT!
LOCATION: ${hostel}
ID/LEVEL: ${studentId}
GPS: ${mapUrl}
Status: Distress signal triggered by student.`;

        showSmsButton(smsBody); 
        window.playSiren();
    }, (err) => {
        // This is the part seen in your screenshot!
        const smsBody = `⚠️ CAMPUS EMERGENCY (GPS OFF)
LOCATION: ${hostel}
ID/LEVEL: ${studentId}
Status: Triggered - GPS Unavailable.`;
                    
        showSmsButton(smsBody);
        window.playSiren();
    }, { 
        enableHighAccuracy: true, 
        timeout: 8000,
        maximumAge: 0 
    });
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