// src/api/txns.js
export async function createTxn({ merchant, paymentMethod, amount }) {
    const res = await fetch('/api/txns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            merchant,
            paymentMethod, // 문자열 enum 값 (예: "CARD")
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