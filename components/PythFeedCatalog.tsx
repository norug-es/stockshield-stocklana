'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';

type Feed = {
  id: number;
  symbol: string;
  description: string;
  minChannel: string;
};

export default function PythFeedCatalog() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [source, setSource] = useState('CHECKING');
  const [copied, setCopied] = useState<number | null>(null);

  async function loadFeeds() {
    setSource('CHECKING');
    try {
      const response = await fetch('/api/pyth/feeds');
      const data = await response.json();
      setFeeds(Array.isArray(data.feeds) ? data.feeds : []);
      setSource(data.source || 'ERROR');
    } catch {
      setFeeds([]);
      setSource('ERROR');
    }
  }

  useEffect(() => {
    queueMicrotask(() => { void loadFeeds(); });
  }, []);

  async function copyFeed(feed: Feed) {
    await navigator.clipboard.writeText(`PYTH_PRO_FEED_ID=${feed.id}`);
    setCopied(feed.id);
  }

  return (
    <section className="panel pythCatalog">
      <div className="row between wrap">
        <div>
          <div className="label">PYTH PRO FEED CATALOG</div>
          <h3>Choose the underlying equity feed</h3>
          <p className="tiny">Only entitled, stable equity feeds are shown. The API key stays on the server.</p>
        </div>
        <button className="secondary iconButton" onClick={loadFeeds} title="Refresh Pyth feeds"><RefreshCw size={15} /> Refresh</button>
      </div>
      {source === 'UNCONFIGURED' && <p className="scannerError">Configure a new PYTH_PRO_API_KEY to load your entitled feed catalog.</p>}
      {source === 'ERROR' && <p className="scannerError">Pyth feed catalog unavailable. Check the server key and Pyth access.</p>}
      {source === 'LIVE' && !feeds.length && <p className="tiny">No stable equity feeds are available for this account.</p>}
      {feeds.length > 0 && <div className="feedTable"><div className="feedRow feedHeader"><span>ID</span><span>SYMBOL</span><span>MIN CHANNEL</span><span /></div>{feeds.map((feed) => <div className="feedRow" key={feed.id}><b>{feed.id}</b><span title={feed.description}>{feed.symbol}</span><small>{feed.minChannel}</small><button className="secondary iconButton" onClick={() => copyFeed(feed)} title={`Copy PYTH_PRO_FEED_ID for ${feed.symbol}`}>{copied === feed.id ? <Check size={14} /> : <Copy size={14} />}</button></div>)}</div>}
    </section>
  );
}
