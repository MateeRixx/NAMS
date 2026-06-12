import { useEffect, useRef, useState } from 'react';
import client from '../api/client';

interface CustomerEntry {
  name: string;
  phone: string;
  address: string;
  area: string;
  postalCode: string;
}

interface ZoneGroup {
  id: string;
  name: string;
  customers: CustomerEntry[];
}

interface DeliverySheetData {
  zones: ZoneGroup[];
  unzoned: CustomerEntry[];
  generatedAt: string;
}

export default function DeliverySheet() {
  const [data, setData] = useState<DeliverySheetData | null>(null);
  const [loading, setLoading] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    client.get('/customers/delivery-sheet')
      .then((res) => setData(res.data.data))
      .finally(() => setLoading(false));
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = [['Name', 'Phone', 'Address', 'Area', 'Postal Code', 'Zone']];

    for (const zone of data.zones) {
      for (const c of zone.customers) {
        rows.push([c.name, c.phone, c.address, c.area, c.postalCode, zone.name]);
      }
    }
    for (const c of data.unzoned) {
      rows.push([c.name, c.phone, c.address, c.area, c.postalCode, 'Unzoned']);
    }

    const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `delivery-sheet-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    window.print();
  }

  const totalCustomers = (data?.zones.reduce((s, z) => s + z.customers.length, 0) ?? 0) + (data?.unzoned.length ?? 0);

  if (loading) return <div className="loading">Loading...</div>;
  if (!data) return <div className="loading">Failed to load</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Delivery Sheet</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-sm" onClick={exportCsv}>Export CSV</button>
          <button className="btn btn-sm btn-primary" onClick={handlePrint}>Print</button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
        <strong>Total active customers: {totalCustomers}</strong>
        {' | '}Zones: {data.zones.length}
        {' | '}Unzoned: {data.unzoned.length}
        {' | '}Generated: {new Date(data.generatedAt).toLocaleString()}
      </div>

      <div ref={printRef} className="print-area">
        {data.zones.map((zone) => (
          <div key={zone.id} className="card" style={{ marginBottom: '1rem', breakInside: 'avoid' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>{zone.name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{zone.customers.length} customers</span>
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Area</th>
                  <th>Pincode</th>
                </tr>
              </thead>
              <tbody>
                {zone.customers.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td style={{ maxWidth: '250px' }}>{c.address}</td>
                    <td>{c.area}</td>
                    <td>{c.postalCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

        {data.unzoned.length > 0 && (
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
              <span>Unzoned Customers</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{data.unzoned.length} customers</span>
            </h3>
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Area</th>
                  <th>Pincode</th>
                </tr>
              </thead>
              <tbody>
                {data.unzoned.map((c, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>{c.name}</td>
                    <td>{c.phone}</td>
                    <td style={{ maxWidth: '250px' }}>{c.address}</td>
                    <td>{c.area}</td>
                    <td>{c.postalCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalCustomers === 0 && (
          <div className="empty-state">
            <p>No active customers with delivery addresses</p>
          </div>
        )}
      </div>

      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .sidebar, .topbar, .btn { display: none !important; }
          .main-content { margin-left: 0 !important; }
          .content { padding: 0 !important; }
          .card { box-shadow: none !important; border: 1px solid #ccc !important; break-inside: avoid; }
          .print-area { margin: 0; }
          h1 { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
