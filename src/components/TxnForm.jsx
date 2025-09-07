// src/components/TxnForm.jsx
import { useState } from 'react';
import { createTxn } from '../api/txns';

const DEFAULT_METHODS = [
    { code: 'CARD', displayName: '카드' },
    { code: 'DEBIT', displayName: '체크카드' },
    { code: 'CASH', displayName: '현금' },
    { code: 'ACCOUNT', displayName: '계좌이체' },
    { code: 'POINT', displayName: '포인트' },
];

const PLATFORMS = [
    { code: 'NAVERPAY', displayName: '네이버페이' },
    { code: 'KAKAOPAY', displayName: '카카오페이' },
    { code: 'PAYCO', displayName: '페이코' },
    { code: 'TOSS', displayName: '토스페이' },
  ];

export default function TxnForm({ methods = DEFAULT_METHODS, onCreated }) {
    const [merchant, setMerchant] = useState('');
    const [usedAt, setUsedAt] = useState('');
    // 총 지출액: raw 숫자 문자열과 표시용 포맷 문자열을 분리 관리
    const [amount, setAmount] = useState('');
    const [amountDisplay, setAmountDisplay] = useState('');
    const [multiPay, setMultiPay] = useState(true);
    const [selectedMethods, setSelectedMethods] = useState([]); // array of method codes
    const [methodAmounts, setMethodAmounts] = useState({}); // code -> amount(string)
    const [platform, setPlatform] = useState('NAVERPAY');
    const [platformEnabled, setPlatformEnabled] = useState(false);
    const [memo, setMemo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const formatWithCommas = (v) => {
        if (v === '') return '';
        const digits = v.replace(/\D/g, '');
        return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    };

    const validate = () => {
        if (!merchant.trim()) return '사용처를 입력하세요.';
        if (multiPay) {
            if (!selectedMethods.length) return '결제수단을 1개 이상 선택하세요.';
            if (selectedMethods.length > 3) return '결제수단은 최대 3개까지 선택할 수 있습니다.';
            // 합산이 총 지출액 초과 불가
            const total = Number(amount || '0');
            const sum = selectedMethods.reduce((acc, code) => acc + Number((methodAmounts[code] || '0')), 0);
            if (sum > total) return '결제수단별 지출액 합계가 총 지출액을 초과할 수 없습니다.';
        }
        if (amount === '' || Number.isNaN(Number(amount))) return '총 지출액은 숫자여야 합니다.';
        const n = Number(amount);
        if (!Number.isInteger(n) || n <= 0) return '총 지출액은 1 이상의 정수여야 합니다.';
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
            // payments 생성: 선택된 순서대로 seqNo 부여, 표시명 사용
            const totalAmount = Number(amount);
            let payments = [];
            if (multiPay) {
                const amountsByCode = { ...methodAmounts };
                // 누락된 마지막 금액 보정 (2개/3개 구성 시)
                if (selectedMethods.length === 2) {
                    const [a, b] = selectedMethods;
                    const aVal = Number(amountsByCode[a] || '0');
                    const bVal = Math.max(0, totalAmount - aVal);
                    amountsByCode[b] = String(bVal);
                } else if (selectedMethods.length === 3) {
                    const [a, b, c] = selectedMethods;
                    const aVal = Number(amountsByCode[a] || '0');
                    const bVal = Number(amountsByCode[b] || '0');
                    const cVal = Math.max(0, totalAmount - aVal - bVal);
                    amountsByCode[c] = String(cVal);
                }
                payments = selectedMethods.map((code, idx) => {
                    const meta = methods.find((m) => m.code === code);
                    return {
                        method: code,
                        amount: Number(amountsByCode[code] || '0'),
                        seqNo: idx + 1,
                    };
                });
            } else if (selectedMethods[0]) {
                const code = selectedMethods[0];
                const meta = methods.find((m) => m.code === code);
                payments = [{ method: code, amount: totalAmount, seqNo: 1 }];
            }

            const created = await createTxn({
                merchant: merchant.trim(),
                memo: memo.trim(),
                usedAt,
                amount: totalAmount,
                platformCode: platformEnabled ? platform : undefined,
                payments,
            });
            setResult(created);
            if (typeof onCreated === 'function') onCreated(created);
            setMerchant('');
            setUsedAt('');
            setAmount('');
            setAmountDisplay('');
            setSelectedMethods([]);
            setMethodAmounts({});
            setPlatform('NAVERPAY');
            setPlatformEnabled(false);
            setMemo('');
        } catch (err) {
            setError(err.message || '요청 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 360 }}>
            <h2 style={{ textAlign: 'left', marginBottom: 16 }}>거래 입력</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', textAlign: 'left' }}>
                        사용처
                        <input
                            type="text"
                            value={merchant}
                            onChange={(e) => setMerchant(e.target.value)}
                            maxLength={120}
                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                            required
                        />
                    </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', textAlign: 'left' }}>
                        사용일시
                        <input
                            type="datetime-local"
                            value={usedAt}
                            onChange={(e) => setUsedAt(e.target.value)}
                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                        />
                    </label>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <label style={{ display: 'block', textAlign: 'left' }}>
                        총 지출액
                        <input
                            type="text"
                            inputMode="numeric"
                            value={amountDisplay}
                            onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '');
                                setAmount(digits);
                                setAmountDisplay(formatWithCommas(digits));
                            }}
                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                            required
                        />
                    </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '12px 0' }}>
                    <input
                        type="checkbox"
                        checked={multiPay}
                        onChange={(e) => {
                            const checked = e.target.checked;
                            setMultiPay(checked);
                            if (!checked) {
                                // 다중결제 해제 시 체크박스/금액 입력 초기화
                                setSelectedMethods([]);
                                setMethodAmounts({});
                            }
                        }}
                    />
                    <span>다중결제수단</span>
                </div>

                <div style={{ marginBottom: 12 }}>
                    <fieldset style={{ border: '1px solid #444', padding: 12, borderRadius: 8 }}>
                        <legend>결제수단</legend>
                        {multiPay ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {methods.map(({ code, displayName }) => {
                                    const checked = selectedMethods.includes(code);
                                return (
                                        <label key={code} style={{ display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left' }}>
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => {
                                                const isChecked = e.target.checked;
                                                if (isChecked) {
                                                        if (selectedMethods.length >= 3) return;
                                                        setSelectedMethods((prev) => Array.from(new Set([...prev, code])));
                                                } else {
                                                        setSelectedMethods((prev) => prev.filter((x) => x !== code));
                                                        setMethodAmounts((prev) => {
                                                            const next = { ...prev };
                                                            delete next[code];
                                                            return next;
                                                        });
                                                    }
                                                }}
                                            />
                                            {displayName}
                                        </label>
                                    );
                                })}
                            </div>
                        ) : (
                            <select
                                value={selectedMethods[0] ?? ''}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setSelectedMethods(v ? [v] : []);
                                    setMethodAmounts({});
                                }}
                                style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                            >
                                <option value="">선택</option>
                                {methods.map(({ code, displayName }) => (
                                    <option key={code} value={code}>{displayName}</option>
                                ))}
                            </select>
                        )}
                    </fieldset>
                </div>
                {multiPay && selectedMethods.length > 0 && (
                    <div style={{ marginBottom: 4 }}>
                        {selectedMethods.map((code) => {
                            const meta = methods.find((m) => m.code === code);
                            const label = meta ? `${meta.displayName} 지출액` : `${code} 지출액`;
                            return (
                                <div key={code} style={{ marginBottom: 12 }}>
                                    <label style={{ display: 'block', textAlign: 'left' }}>
                                        {label}
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formatWithCommas(methodAmounts[code] ?? '')}
                                            onChange={(e) => {
                                                const digits = e.target.value.replace(/\D/g, '');
                                                const total = Number(amount || '0');
                                                const index = selectedMethods.indexOf(code);
                                                const next = { ...methodAmounts, [code]: digits };

                                                // 자동 계산 로직
                                                if (selectedMethods.length === 2) {
                                                    const [first, second] = selectedMethods;
                                                    if (index === 0) {
                                                        const firstVal = Number(digits || '0');
                                                        if (firstVal > total) {
                                                            setError('결제수단별 지출액 합계가 총 지출액을 초과할 수 없습니다.');
                                                            return;
                                                        }
                                                        const secondVal = Math.max(0, total - firstVal);
                                                        next[second] = String(secondVal);
                                                    }
                                                } else if (selectedMethods.length === 3) {
                                                    const [first, second, third] = selectedMethods;
                                                    if (index === 0) {
                                                        const firstVal = Number(digits || '0');
                                                        const secondVal = Number(next[second] || '0');
                                                        const thirdVal = total - firstVal - secondVal;
                                                        if (thirdVal < 0) {
                                                            setError('결제수단별 지출액 합계가 총 지출액을 초과할 수 없습니다.');
                                                            return;
                                                        }
                                                        next[third] = String(Math.max(0, thirdVal));
                                                    } else if (index === 1) {
                                                        const firstVal = Number(next[first] || '0');
                                                        const secondVal = Number(digits || '0');
                                                        const thirdVal = total - firstVal - secondVal;
                                                        if (thirdVal < 0) {
                                                            setError('결제수단별 지출액 합계가 총 지출액을 초과할 수 없습니다.');
                                                            return;
                                                        }
                                                        next[third] = String(Math.max(0, thirdVal));
                                                    }
                                                }

                                                // 최종 합계 검증
                                                const sum = selectedMethods.reduce((acc, c) => acc + Number((next[c] || '0')), 0);
                                                if (sum > total) {
                                                    setError('결제수단별 지출액 합계가 총 지출액을 초과할 수 없습니다.');
                                                    return;
                                                }

                                                setError('');
                                                setMethodAmounts(next);
                                            }}
                                            placeholder="Value"
                                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                                        />
                                    </label>
                                </div>
                                );
                            })}
                    </div>
                )}

                <div style={{ marginBottom: 12 }}>
                    <fieldset style={{ border: '1px solid #444', padding: 12, borderRadius: 8, textAlign: 'left' }}>
                        <legend>결제수단 플랫폼</legend>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <input
                                type="checkbox"
                                checked={platformEnabled}
                                onChange={(e) => setPlatformEnabled(e.target.checked)}
                            />
                            <span>사용</span>
                        </div>
                        <select
                            value={platform}
                            onChange={(e) => setPlatform(e.target.value)}
                            disabled={!platformEnabled}
                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8, opacity: platformEnabled ? 1 : 0.6 }}
                        >
                            
                            {PLATFORMS.map(p => (
                                <option key={p.code} value={p.code}>{p.displayName}</option>
                            ))}
                        </select>
                    </fieldset>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', textAlign: 'left' }}>
                        메모

                        <input
                            type="text"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            maxLength={50}
                            placeholder="Value"
                            style={{ width: '100%', padding: 10, boxSizing: 'border-box', borderRadius: 8 }}
                        />
                    </label>
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px 16px', borderRadius: 8 }}>
                    {loading ? '생성 중...' : 'Submit'}
                </button>
            </form>

            {error && (
                <div style={{ marginTop: 12, color: 'crimson', textAlign: 'left' }}>
                    오류: {error}
                </div>
            )}

            {result && (
                <div style={{ marginTop: 12, color: 'green', textAlign: 'left' }}>
                    생성됨: id={result.id} createdAt={result.createdAt}
                </div>
            )}
        </div>
    );
}