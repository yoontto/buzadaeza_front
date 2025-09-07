// src/api/txns.js
const rawBase = import.meta.env.VITE_API_BASE || '';
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

// payload를 그대로 전달하여 서버 스펙 변화에 유연하게 대응
export async function createTxn(payload) {
    const res = await fetch(`${API_BASE}/api/txns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        let message = `Request failed: ${res.status}`;
        try {
            const data = JSON.parse(text);
            if (data?.message) message += ` - ${data.message}`;
        } catch {
            if (text) message += ` - ${text}`;
        }
        throw new Error(message);
    }

    // 성공 시 생성된 엔티티(JSON) 반환 (id, createdAt 포함 예상)
    return res.json();
}