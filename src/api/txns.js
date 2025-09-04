// src/api/txns.js
const rawBase = import.meta.env.VITE_API_BASE || '';
const API_BASE = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

export async function createTxn({ merchant, paymentMethods, paymentMethod, amount }) {
    const res = await fetch(`${API_BASE}/api/txns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merchant,
            // 서버 스펙: paymentMethods(List<PaymentMethod>)
            paymentMethods: Array.isArray(paymentMethods)
                ? paymentMethods
                : (paymentMethod ? [paymentMethod] : []),
            amount: Number(amount), // 정수 Long
        }),
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