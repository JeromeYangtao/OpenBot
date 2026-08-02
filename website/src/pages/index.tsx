import { useCallback, useEffect, useState } from 'react';
import styles from './index.less';

interface AssetBalance {
  currency: string;
  free: number;
  used: number;
  total: number;
}

interface BalanceResponse {
  balances: AssetBalance[];
}

interface ErrorResponse {
  message?: string | string[];
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumSignificantDigits: 12,
});

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : '查询余额失败';
}

async function readErrorMessage(response: Response): Promise<string> {
  const fallback = `查询余额失败（HTTP ${response.status}）`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return Array.isArray(body.message)
      ? body.message.join('；')
      : body.message || fallback;
  } catch {
    return fallback;
  }
}

export default function HomePage() {
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const fetchBalances = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await fetch('/api/cex/gate/balance', { signal });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as BalanceResponse;
      setBalances(data.balances);
    } catch (requestError: unknown) {
      if (requestError instanceof DOMException && requestError.name === 'AbortError') {
        return;
      }

      setBalances([]);
      setError(getErrorMessage(requestError));
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchBalances(controller.signal);
    return () => controller.abort();
  }, [fetchBalances]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Gate Account</p>
          <h1>账户余额</h1>
          <p className={styles.description}>查看 Gate 账户当前的非零资产余额。</p>
        </div>
        <button
          className={styles.refreshButton}
          disabled={loading}
          onClick={() => void fetchBalances()}
          type="button"
        >
          {loading ? '查询中…' : '刷新余额'}
        </button>
      </header>

      {error ? (
        <section className={styles.message} role="alert">
          <strong>无法获取余额</strong>
          <span>{error}</span>
        </section>
      ) : null}

      {!error && !loading && balances.length === 0 ? (
        <section className={styles.message}>
          <strong>暂无余额</strong>
          <span>当前账户没有非零资产。</span>
        </section>
      ) : null}

      {!error && balances.length > 0 ? (
        <div className={styles.tableWrapper}>
          <table>
            <thead>
              <tr>
                <th>币种</th>
                <th>可用</th>
                <th>占用</th>
                <th>总额</th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr key={balance.currency}>
                  <td className={styles.currency}>{balance.currency}</td>
                  <td>{numberFormatter.format(balance.free)}</td>
                  <td>{numberFormatter.format(balance.used)}</td>
                  <td>{numberFormatter.format(balance.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
