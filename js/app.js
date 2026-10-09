const e = React.createElement;

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQwfb8tpHoZg1z4UnjtMH-I96WNDPNga0pZbc9fQkSY0jTow1gDvD4M_ek_G-bl1hx7g/exec"; 
const LIFF_ID = "2009648742-60i8g5vt"; 
const PROMPTPAY_PHONE = "0615924262";
const PROMPTPAY_NAME = "อลงกต ทวีผ่อง";

function generatePromptPayPayload(phoneNumber, amount) {
    const target = phoneNumber.replace(/^0/, '66');
    const f01 = '00' + target; 
    const tag29Value = '0016A000000677010111' + '01' + String(f01.length).padStart(2,'0') + f01;
    const tag29 = '29' + String(tag29Value.length).padStart(2,'0') + tag29Value;
    const tag53 = '5303764';
    const amtStr = amount.toFixed(2);
    const tag54 = '54' + String(amtStr.length).padStart(2,'0') + amtStr;
    const tag58 = '5802TH';
    const data = '000201' + '010212' + tag29 + tag53 + tag54 + tag58 + '6304';
    let crc = 0xFFFF;
    for (let i = 0; i < data.length; i++) {
        let x = ((crc >> 8) ^ data.charCodeAt(i)) & 0xFF; x ^= x >> 4; crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xFFFF;
    }
    return data + crc.toString(16).toUpperCase().padStart(4, '0');
}

function createQRWithLogo(payload, size, shopLogoUrl) {
    return new Promise((resolve) => {
        const qr = new QRious({ value: payload, size: size, level: 'H' });
        const qrBase64 = qr.toDataURL();
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const qrImg = new Image();
        qrImg.onload = () => {
            ctx.drawImage(qrImg, 0, 0);
            const drawLogo = (imgSrc, isFallback = false) => {
                const logoImg = new Image();
                logoImg.crossOrigin = "Anonymous";
                logoImg.onload = () => {
                    const logoSize = size * 0.22;
                    const x = (size - logoSize) / 2;
                    const y = (size - logoSize) / 2;
                    const pad = 6;
                    ctx.fillStyle = 'white';
                    if (ctx.roundRect) {
                        ctx.beginPath(); ctx.roundRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2, 8); ctx.fill();
                    } else { ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2); }
                    ctx.drawImage(logoImg, x, y, logoSize, logoSize);
                    resolve(canvas.toDataURL('image/png'));
                };
                logoImg.onerror = () => {
                    if (!isFallback) drawLogo("https://upload.wikimedia.org/wikipedia/commons/e/e0/PromptPay-logo.png", true);
                    else resolve(qrBase64);
                };
                logoImg.src = imgSrc;
            };
            if (shopLogoUrl) drawLogo(shopLogoUrl);
            else drawLogo("https://upload.wikimedia.org/wikipedia/commons/e/e0/PromptPay-logo.png", true);
        };
        qrImg.src = qrBase64;
    });
}

const safeJsonParse = (str, fallback = {}) => {
    if (!str || str === '-') return fallback;
    if (typeof str !== 'string') return str;
    try { 
        let cleanStr = str.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");
        return JSON.parse(cleanStr); 
    } catch (e) { return fallback; }
};

const formatMoney = (val) => Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 30000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(resource, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) { clearTimeout(id); throw error; }
};

const compressImage = async (file, quality = 0.9, maxWidth = 1000) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width; let height = img.height;
                if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                let dataUrl = canvas.toDataURL('image/jpeg', quality);
                const head = 'data:image/jpeg;base64,';
                const sizeInBytes = Math.round((dataUrl.length - head.length) * 3 / 4);
                if (sizeInBytes > 500000 && quality > 0.3) resolve(compressImage(file, quality - 0.2, maxWidth * 0.8));
                else resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};

const DEFAULT_CONFIG = {
    headerTitle: 'ขนำลุงดำ - Khanamlungdam',
    headerDesc: '🏡 ขนำลุงดำ ดั้งเดิมมาจากหนำปู่ หรือที่พักตอนปู่มาอยู่ช่วงทำสวนนั้นเอง...',
    bannerUrl: 'https://img5.pic.in.th/file/secure-sv1/LINE_ALBUM__240916_14dd72f9bd7de4facf.jpg',
    logoUrl: 'https://lh3.googleusercontent.com/pw/AP1GczPi_rYAbsNGi4X96mW5koYl0JJ3BN9ipRf6UgsXAOQgkyhrs2ChGcZlbsuQ3OLJOYnYhSTYJhWUuu2hwWtPqlt4MUfdUDSS3s4RdRLeD36gPLiK-8OhYLXWmqxVLh2eOtkLIx7pQxrQA6ZnqBYHOftH=w913-h913-s-no-gm?authuser=0',
    roomImages: {}, foodMenu: [], roomDescriptions: {}
};

const DEFAULT_POSITIONS = { 'R1': {x: 20, y: 30}, 'R2': {x: 40, y: 50}, 'R3': {x: 60, y: 50}, 'T1': {x: 25, y: 70}, 'T2': {x: 35, y: 75}, 'K1': {x: 70, y: 70}, 'K2': {x: 80, y: 70}, 'Z8': {x: 50, y: 20} };

const CampingLoaderOverlay = ({ text = "กำลังเตรียมพื้นที่กางเต็นท์..." }) => {
    return e("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity" },
        e("div", { className: "bg-white dark:bg-gray-800 px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-pop border-t-4 border-green-500" },
            e("div", { className: "relative w-24 h-20 mb-6 flex items-center justify-center" },
                e("i", { className: "fas fa-tree text-green-500 text-5xl absolute -left-6 animate-pulse" }),
                e("i", { className: "fas fa-campground text-green-600 text-6xl relative z-10 animate-bounce" }),
                e("i", { className: "fas fa-tree text-green-600 text-4xl absolute -right-4 animate-pulse", style: { animationDelay: '0.3s' } }),
                e("i", { className: "fas fa-fire text-orange-500 text-3xl absolute bottom-0 right-2 animate-pulse", style: { animationDelay: '0.5s' } })
            ),
            e("h3", { className: "text-xl font-bold text-gray-800 dark:text-white mb-2 tracking-wide text-center" }, text),
            e("div", { className: "flex gap-2 mt-2" },
                e("div", { className: "w-3 h-3 bg-green-500 rounded-full animate-bounce", style: { animationDelay: '0s' } }),
                e("div", { className: "w-3 h-3 bg-green-500 rounded-full animate-bounce", style: { animationDelay: '0.15s' } }),
                e("div", { className: "w-3 h-3 bg-green-500 rounded-full animate-bounce", style: { animationDelay: '0.3s' } })
            )
        )
    );
};

const App = () => {
    const [isDark, setIsDark] = React.useState(true);
    const [step, setStep] = React.useState(1);
    const [mode, setMode] = React.useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('mode') === 'manage' ? 'manage' : 'booking';
    });

    const [isInitializing, setIsInitializing] = React.useState(true);
    const [dates, setDates] = React.useState({ checkIn: '', checkOut: '' });
    const [availability, setAvailability] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [cart, setCart] = React.useState([]);
    const [customer, setCustomer] = React.useState({ name: '', phone: '', userId: '', lineDisplayName: '' });
    const [isLiffReady, setIsLiffReady] = React.useState(false);
    const [pinPos, setPinPos] = React.useState(DEFAULT_POSITIONS);

    const [roomConfig, setRoomConfig] = React.useState({});
    const [systemSettings, setSystemSettings] = React.useState({ closed: [], special: [] });
    const [siteConfig, setSiteConfig] = React.useState(DEFAULT_CONFIG);

    const [discount, setDiscount] = React.useState({ code: '', val: 0, type: '', message: '', status: '' });
    const [slipImg, setSlipImg] = React.useState(null);
    const [bookingResult, setBookingResult] = React.useState(null);
    const [agreed, setAgreed] = React.useState(false);
    const [qrUrl, setQrUrl] = React.useState(null);

    const [selectedRoomId, setSelectedRoomId] = React.useState(null);
    const [guestCount, setGuestCount] = React.useState(1);
    const [selectedFood, setSelectedFood] = React.useState(null);
    const [foodCount, setFoodCount] = React.useState(1);
    const [closedModal, setClosedModal] = React.useState(null);
    const [searchError, setSearchError] = React.useState(null);
    const [currentImgIdx, setCurrentImgIdx] = React.useState(0);
    const [showRoomRequiredModal, setShowRoomRequiredModal] = React.useState(false);

    const [manageData, setManageData] = React.useState(null);
    const [bookingList, setBookingList] = React.useState([]);
    const [rescheduleDates, setRescheduleDates] = React.useState({ checkIn: '', checkOut: '' });
    const [manageTab, setManageTab] = React.useState('info');
    const [addOnCart, setAddOnCart] = React.useState([]);
    const [addOnSlip, setAddOnSlip] = React.useState(null);
    const [addOnQr, setAddOnQr] = React.useState(null);

    const [modalAlert, setModalAlert] = React.useState({ show: false, type: 'info', title: '', text: '' });
    const [modalConfirm, setModalConfirm] = React.useState({ show: false, title: '', text: '', onConfirm: null });

    const getTommorow = () => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; };
    const formatThaiDate = (dateStr) => { if(!dateStr) return "-"; const d = new Date(dateStr); const m = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]; return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear() + 543}`; };
    const getClosedDateOverlap = (inDate, outDate) => {
        let current = new Date(inDate); const end = new Date(outDate);
        while(current < end) { const dStr = current.toISOString().split('T')[0]; const closed = systemSettings.closed.find(c => c.date === dStr); if (closed) return closed; current.setDate(current.getDate() + 1); }
        return null;
    };
    const checkDateOverlapHighSeason = (inDate, outDate) => {
        let current = new Date(inDate); const end = new Date(outDate);
        while(current < end) { const dStr = current.toISOString().split('T')[0]; if (systemSettings.special.some(s => s.date === dStr)) return true; current.setDate(current.getDate() + 1); }
        return false;
    };

    const calculateNights = () => { if(!dates.checkIn || !dates.checkOut) return 0; return Math.round((new Date(dates.checkOut) - new Date(dates.checkIn)) / (1000 * 3600 * 24)); };
    
    const getPricing = () => {
        const nights = calculateNights(); let roomTotal = 0; let foodTotal = 0; let z8Total = 0;
        cart.forEach(item => { 
            if (item.type === 'food') foodTotal += Number(item.price||0) * Number(item.qty||1); 
            else if (item.isPerHead) z8Total += Number(item.pricePerNight||0) * nights * Number(item.guests||1); 
            else roomTotal += Number(item.pricePerNight||0) * nights; 
        });
        let discountAmt = 0; if (discount.type === 'FIXED') discountAmt = Number(discount.val||0); if (discount.type === 'PERCENT') discountAmt = (roomTotal * Number(discount.val||0)) / 100; if (discountAmt > roomTotal) discountAmt = roomTotal; 
        const totalBefore = roomTotal + z8Total + foodTotal; const netTotal = totalBefore - discountAmt;
        let deposit = 0; const isHigh = checkDateOverlapHighSeason(dates.checkIn, dates.checkOut);
        if (isHigh) { deposit = netTotal; } else { const roomDeposit = (roomTotal - discountAmt) * 0.5; deposit = roomDeposit + z8Total + foodTotal; }
        return { total: totalBefore, discount: discountAmt, netTotal: netTotal, deposit: Math.ceil(deposit), isHighSeason: isHigh };
    };

    const isBookingPast = (dateStr) => {
        if(!dateStr) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        const checkOutDate = new Date(dateStr); checkOutDate.setHours(0,0,0,0);
        return checkOutDate < today;
    };

    const pricing = React.useMemo(() => getPricing(), [cart, dates, discount, systemSettings]);
    const canSubmit = customer.name && customer.phone && slipImg && agreed;

    React.useEffect(() => {
        setIsInitializing(true);
        if (LIFF_ID) {
            liff.init({ liffId: LIFF_ID }).then(() => {
                setIsLiffReady(true);
                if (liff.isLoggedIn()) {
                    liff.getProfile().then(profile => setCustomer(prev => ({...prev, userId: profile.userId, lineDisplayName: profile.displayName})));
                } else { liff.login({ redirectUri: window.location.href }); }
            }).catch(err => { console.error('LIFF Error', err); setIsLiffReady(true); });
        } else { setIsLiffReady(true); }
        
        fetchWithTimeout(`${GOOGLE_SCRIPT_URL}?action=getInitialData`).then(r => r.json()).then(res => {
            if (res.status === 'success') {
                const { settings, siteConfig, roomConfig, mapConfig } = res.data;
                setSystemSettings({ closed: settings.closed, special: settings.special });
                setSiteConfig(prev => ({ ...prev, ...siteConfig }));
                setRoomConfig(roomConfig);
                setPinPos(mapConfig);
            }
            setIsInitializing(false);
        }).catch(() => setIsInitializing(false));
    }, []);

    React.useEffect(() => {
        if (step === 3 && pricing.deposit > 0) {
            const payload = generatePromptPayPayload(PROMPTPAY_PHONE, pricing.deposit); 
            createQRWithLogo(payload, 400, siteConfig.logoUrl).then(url => setQrUrl(url));
        }
    }, [step, pricing.deposit, siteConfig.logoUrl]);

    React.useEffect(() => {
        if (mode === 'manage' && manageTab === 'food') {
            const total = addOnCart.reduce((sum,c)=>sum+(c.price*c.qty),0);
            if (total > 0) { 
                const payload = generatePromptPayPayload(PROMPTPAY_PHONE, total); 
                createQRWithLogo(payload, 400, siteConfig.logoUrl).then(url => setAddOnQr(url)); 
            } else { setAddOnQr(null); }
        }
    }, [addOnCart, mode, manageTab, siteConfig.logoUrl]);

    React.useEffect(() => {
        if (mode === 'manage' && isLiffReady && customer.userId && !manageData) {
            setLoading(true);
            fetchWithTimeout(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'findBooking', userId: customer.userId }) })
            .then(r => r.json()).then(res => {
                setLoading(false);
                if(res.status === 'success' && res.bookings && res.bookings.length > 0) { 
                    setBookingList(res.bookings); 
                    const params = new URLSearchParams(window.location.search);
                    const targetId = params.get('id');
                    if (targetId) {
                        const targetBooking = res.bookings.find(b => b.id === targetId);
                        if (targetBooking) selectBookingToManage(targetBooking);
                    }
                } else { setBookingList([]); }
            }).catch(() => setLoading(false));
        }
    }, [mode, isLiffReady, customer.userId, manageData]);

    const handleSearch = () => {
        if (!dates.checkIn || !dates.checkOut) { setSearchError('กรุณาเลือกวันเข้าพักและวันที่ออกให้ครบถ้วนครับ'); return; }
        if (dates.checkIn >= dates.checkOut) { setSearchError('วันเช็คเอาท์ต้องอยู่หลังจากวันเช็คอินครับ'); return; }
        const closedFound = getClosedDateOverlap(dates.checkIn, dates.checkOut); if (closedFound) { setClosedModal(closedFound); return; }
        setLoading(true);
        fetchWithTimeout(`${GOOGLE_SCRIPT_URL}?action=getAvailability&checkIn=${dates.checkIn}&checkOut=${dates.checkOut}`)
        .then(r => r.json()).then(data => { setAvailability(data); setStep(2); setLoading(false); })
        .catch(e => { setLoading(false); alert(e.name === 'AbortError' ? 'เน็ตหมดเวลา' : 'Error: ' + e); });
    };

    const openRoomModal = (roomId) => { const room = roomConfig[roomId]; if (!room) return; if(roomId === 'Z8') setGuestCount(1); else setGuestCount(room.min || 1); setCurrentImgIdx(0); setSelectedRoomId(roomId); };
    const openFoodModal = (food) => { setSelectedFood(food); setFoodCount(1); };
    const confirmFoodSelection = () => {
        const targetCart = mode === 'manage' ? addOnCart : cart; const setTargetCart = mode === 'manage' ? setAddOnCart : setCart;
        const exist = targetCart.find(c => c.id === selectedFood.id);
        if (exist) setTargetCart(targetCart.map(c => c.id === selectedFood.id ? { ...c, qty: c.qty + foodCount } : c)); else setTargetCart([...targetCart, { ...selectedFood, type: 'food', qty: foodCount }]);
        setSelectedFood(null);
    };

    const confirmRoomSelection = () => {
        const roomId = selectedRoomId; const guests = guestCount; const roomInfo = roomConfig[roomId];
        if (!roomInfo) return;
        let maxZone8 = availability?.zone8Available ?? 20;
        if (roomId === 'Z8') { 
            const currentZ8 = cart.filter(c => c.id === 'Z8').reduce((sum, c) => sum + c.guests, 0); 
            if (currentZ8 + guests > maxZone8) { alert(`ลานกางเต็นท์ว่างอีก ${maxZone8 - currentZ8} ท่าน`); return; } 
        }
        let price = 0; 
        const pricingInfo = typeof roomInfo.pricing === 'string' ? safeJsonParse(roomInfo.pricing, {}) : (roomInfo.pricing || {});
        const isPerHead = roomId === 'Z8' || pricingInfo.priceHead !== undefined;
        if (isPerHead) { price = Number(pricingInfo.priceHead || (pricingInfo.tiers?.[0]?.price ?? 150)); } 
        else { 
            const tiers = pricingInfo.tiers || [];
            if (tiers.length > 0) {
                const tier = tiers.find(t => guests <= t.max); 
                price = Number(tier ? tier.price : tiers[tiers.length - 1].price); 
            }
        }
        setCart([...cart, { id: roomId, name: roomInfo.name, type: roomInfo.type, guests, pricePerNight: price, nights: calculateNights(), isPerHead }]); 
        setSelectedRoomId(null);
    };

    const checkDiscountCode = () => { 
        if(!discount.code) return; 
        fetchWithTimeout(`${GOOGLE_SCRIPT_URL}?action=checkDiscount&code=${discount.code}`).then(r=>r.json()).then(d => { if(d.status === 'success') setDiscount({...discount, val: Number(d.value), type: d.type, message: `ใช้โค้ดสำเร็จ ลด ${d.value} ${d.type==='PERCENT'?'%':'บาท'}`, status: 'success'}); else setDiscount({...discount, val: 0, type: '', message: 'ไม่พบโค้ดส่วนลดนี้', status: 'error'}); }); 
    };

    const handleSubmit = () => {
        if (!canSubmit) return; setLoading(true);
        const payload = { action: 'saveBooking', customer, checkIn: dates.checkIn, checkOut: dates.checkOut, totalGuests: cart.filter(c => c.type !== 'food').reduce((s, c) => s + c.guests, 0), cart, pricing, discountCode: discount.code, slipImage: slipImg };
        fetchWithTimeout(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify(payload) }).then(r => r.json()).then(res => { if (res.status === 'success') { setBookingResult(res.bookingId); setStep(5); } else alert('Error: ' + res.message); setLoading(false); }).catch(e => { setLoading(false); alert('Failed: ' + e); });
    };

    const selectBookingToManage = (booking, tab = 'info') => { setManageData(booking); setManageTab(tab); };

    return e("div", { className: isDark ? "dark" : "" },
        e("div", { className: "min-h-screen bg-[#f3f4f6] dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300 relative" },
            e("button", { onClick: () => setIsDark(!isDark), className: "fixed top-4 right-4 z-50 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 w-10 h-10 flex items-center justify-center transition-transform hover:scale-110" }, isDark ? "☀️" : "🌙"),
            e("button", { onClick: () => { setMode(mode === 'booking' ? 'manage' : 'booking'); setStep(1); setManageData(null); }, className: "fixed top-16 right-4 z-50 bg-white dark:bg-gray-700 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-600 w-10 h-10 flex items-center justify-center transition-transform hover:scale-110" }, mode === 'booking' ? e("i", { className: "fas fa-search" }) : e("i", { className: "fas fa-home" })),

            // --- MODE: BOOKING STEP 1 ---
            mode === 'booking' && step === 1 && e("div", { className: "max-w-md mx-auto bg-white dark:bg-gray-800 shadow-xl rounded-xl mt-4 border dark:border-gray-700 overflow-hidden animate-pop" },
                e("div", { className: "h-48 relative" }, e("img", { src: siteConfig.bannerUrl, className: "w-full h-full object-cover" })),
                e("div", { className: "p-6 -mt-24 relative z-10" },
                    e("img", { src: siteConfig.logoUrl, className: "w-48 h-48 mx-auto rounded-full border-4 border-white dark:border-gray-800 object-cover bg-white shadow-lg mb-4" }),
                    e("h1", { className: "text-xl text-center mb-2 text-green-800 dark:text-green-400 font-bold" }, siteConfig.headerTitle),
                    e("p", { className: "block text-center mb-4 text-gray-700 dark:text-gray-300 text-sm whitespace-pre-line" }, siteConfig.headerDesc),
                    e("div", { className: "space-y-4" },
                        e("div", null, e("label", { className: "block text-gray-700 dark:text-green-400 font-bold mb-1" }, "วันที่เข้าพัก"), e("input", { type: "date", min: getTommorow(), className: "w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white", onChange: e => setDates({...dates, checkIn: e.target.value}) })),
                        e("div", null, e("label", { className: "block text-gray-700 dark:text-red-300 font-bold mb-1" }, "วันที่ออก"), e("input", { type: "date", min: dates.checkIn || getTommorow(), className: "w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white", onChange: e => setDates({...dates, checkOut: e.target.value}) })),
                        e("button", { onClick: handleSearch, disabled: loading, className: "w-full bg-green-600 text-white p-3 rounded-lg hover:bg-green-700 transition font-bold shadow-lg mt-2" }, loading ? "กำลังตรวจสอบ..." : "ค้นหาที่พักว่าง")
                    )
                )
            ),

            // Loader Overlay
            (loading || isInitializing) && e(CampingLoaderOverlay, { text: isInitializing ? "กำลังเตรียมพื้นที่กางเต็นท์..." : "กำลังดำเนินการ..." })
        )
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(App));
