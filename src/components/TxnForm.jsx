// src/components/TxnForm.jsx
import { useState } from 'react';
import { createTxn } from '../api/txns';

const DEFAULT_METHODS = [
    // TODO: 실제 서버 enum(PaymentMethod) 값으로 교체하세요.
    'CARD',
    'CASH',
    'TRANSFER',
    'POINT',
];

export default function TxnForm({ methods = DEFAULT_METHODS, onCreated }) {
    const [merchant, setMerchant] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const validate = () => {
        if (!merchant.trim()) return '사용처(merchant)를 입력하세요.';
        if (merchant.trim().length > 120) return '사용처는 최대 120자입니다.';
        if (!paymentMethod) return '결제수단을 선택하세요.';
        if (amount === '' || Number.isNaN(Number(amount))) return '금액은 숫자여야 합니다.';
        const n = Number(amount);
        if (!Number.isInteger(n) || n <= 0) return '금액은 1 이상의 정수여야 합니다.';
        return '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setResult(null);
        const v = validate();
        if (v) {
            setError(v);
            return;
        }
        setLoading(true);
        try {
            const created = await createTxn({
                merchant: merchant.trim(),
                paymentMethod,
                amount: Number(amount),
            });
            setResult(created);
            if (typeof onCreated === 'function') onCreated(created);
            // 초기화
            setMerchant('');
            setPaymentMethod('');
            setAmount('');
        } catch (err) {
            setError(err.message || '요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 480 }}>
            <h2>거래 생성</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>
                        사용처(merchant)
                        <input
                            type="text"
                            value={merchant}
                            onChange={(e) => setMerchant(e.target.value)}
                            maxLength={120}
                            placeholder="예: 스타벅스 강남점"
                            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                            required
                        />
                    </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>
                        결제수단(paymentMethod)
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                            required
                        >
                            <option value="" disabled>선택하세요</option>
                            {methods.map((m) => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label>
                        금액(amount)
                        <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            step={1}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="예: 12000"
                            style={{ width: '100%', padding: 8, boxSizing: 'border-box' }}
                            required
                        />
                    </label>
                </div>

                <button type="submit" disabled={loading} style={{ padding: '8px 12px' }}>
                    {loading ? '생성 중...' : '거래 생성'}
                </button>
            </form>

            {error && (
                <div style={{ marginTop: 12, color: 'crimson' }}>
                    오류: {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: 12, color: 'green' }}>
                    생성됨: id={result.id} createdAt={result.createdAt}
                </div>
            )}
        </div>
    );
}