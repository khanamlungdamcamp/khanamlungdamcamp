const e = React.createElement;

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxQwfb8tpHoZg1z4UnjtMH-I96WNDPNga0pZbc9fQkSY0jTow1gDvD4M_ek_G-bl1hx7g/exec"; 
const SHOP_PHONE = "061-592-4262"; 

let ROOM_IDS = ['R1','R2','R3','T1','T2','K1','K2','Z8'];
let ROOM_NAMES = { 'R1': 'โฮมสเตย์หนำโป', 'R2': 'บ้านพักริมน้ำ 1', 'R3': 'บ้านพักริมน้ำ 2', 'T1': 'เต็นท์กระโจม 1', 'T2': 'เต็นท์กระโจม 2', 'K1': 'เช่าเต็นท์สนาม K1', 'K2': 'เช่าเต็นท์สนาม K2', 'Z8': 'ลานกางเต็นท์' };

const safeJsonParse = (str, fallback = []) => {
    if (!str || str === '-') return fallback;
    if (typeof str !== 'string') return Array.isArray(str) ? str : fallback;
    try { const parsed = JSON.parse(str); return Array.isArray(parsed) ? parsed : fallback; } catch (err) { return fallback; }
};

const formatMoney = (val) => { const num = Number(val); return isNaN(num) ? "0" : num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }); };

const fetchWithTimeout = async (resource, options = {}) => {
    const { timeout = 30000 } = options;
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try { const response = await fetch(resource, { ...options, signal: controller.signal }); clearTimeout(id); return response; } 
    catch (error) { clearTimeout(id); throw error; }
};

const CampingAdminLoader = ({ text = "กำลังโหลดข้อมูล..." }) => {
    return e("div", { className: "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] transition-opacity" },
        e("div", { className: "bg-white px-10 py-8 rounded-3xl shadow-2xl flex flex-col items-center animate-modal border-t-4 border-green-600" },
            e("div", { className: "relative w-24 h-24 mb-4 flex items-center justify-center" },
                e("i", { className: "fas fa-tree text-green-600 text-4xl absolute -left-4 animate-pulse" }),
                e("i", { className: "fas fa-campground text-blue-600 text-6xl relative z-10 animate-bounce" }),
                e("i", { className: "fas fa-fire text-orange-500 text-3xl absolute -right-2 bottom-0 animate-pulse", style: { animationDelay: '0.2s' } })
            ),
            e("h3", { className: "text-xl font-bold text-gray-800 mb-2 tracking-wide text-center" }, text),
            e("div", { className: "flex gap-2 mt-2" },
                e("div", { className: "w-3 h-3 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0s' } }),
                e("div", { className: "w-3 h-3 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0.15s' } }),
                e("div", { className: "w-3 h-3 bg-blue-500 rounded-full animate-bounce", style: { animationDelay: '0.3s' } })
            )
        )
    );
};

const AdminApp = () => {
    const [isLoggedIn, setIsLoggedIn] = React.useState(false);
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        const storedPwd = sessionStorage.getItem('admin_pwd');
        if (storedPwd) { setPassword(storedPwd); setIsLoggedIn(true); }
    }, []);

    const handleLogin = (ev) => {
        ev.preventDefault(); setLoading(true);
        fetchWithTimeout(GOOGLE_SCRIPT_URL, { method: 'POST', body: JSON.stringify({ action: 'adminLogin', password: password }) })
        .then(r => r.json()).then(res => {
            setLoading(false);
            if (res.status === 'success') { setIsLoggedIn(true); sessionStorage.setItem('admin_pwd', password); } 
            else alert('รหัสผ่านไม่ถูกต้อง');
        }).catch(err => { setLoading(false); alert('Error: ' + err); });
    };

    if (!isLoggedIn) {
        return e("div", { className: "min-h-screen flex items-center justify-center bg-gray-900 px-4 relative" },
            e("div", { className: "bg-white p-8 rounded-xl shadow-2xl w-full max-w-sm z-10" },
                e("div", { className: "text-center mb-6" }, e("h1", { className: "text-3xl font-bold text-green-800" }, "Admin Panel"), e("p", { className: "text-gray-500" }, "ขนำลุงดำ แคมป์ปิ้ง")),
                e("form", { onSubmit: handleLogin, className: "space-y-4" },
                    e("input", { type: "password", placeholder: "รหัสผ่าน", className: "w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", value: password, onChange: e => setPassword(e.target.value) }),
                    e("button", { disabled: loading, className: "w-full bg-gray-800 text-white p-3 rounded-lg hover:bg-gray-700 transition font-bold shadow-lg" }, "เข้าสู่ระบบ")
                )
            ),
            loading && e(CampingAdminLoader, { text: "กำลังตรวจสอบกุญแจ..." })
        );
    }

    return e("div", { className: "p-6 text-center" },
        e("h1", { className: "text-2xl font-bold text-green-700 mb-4" }, "ยินดีต้อนรับสู่ระบบหลังบ้านขนำลุงดำ!"),
        e("p", { className: "text-gray-600" }, "ระบบพร้อมใช้งานในโหมด Ultra-Fast Smooth Performance ⚡")
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(AdminApp));
