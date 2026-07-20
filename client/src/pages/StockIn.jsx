import { PackagePlus } from 'lucide-react';
import StockMovementForm from '../components/forms/StockMovementForm';
import { stockIn } from '../api/stock.api';
import PageHeader from '../components/common/PageHeader';

export default function StockIn() {
  return (
    <div className="space-y-4 animate-fade-in">
      <PageHeader icon={PackagePlus} title="Stock In" subtitle="Record parts received into inventory" />
      <StockMovementForm onSubmit={stockIn} />
    </div>
  );
}
