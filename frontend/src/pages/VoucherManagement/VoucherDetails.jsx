import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import api from '~/api';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

const VoucherDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const fromPage = location.state?.fromPage || 1;

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vouchers/${id}`);
        setVoucher(res.data);
      } catch (error) {
        console.error("Error fetching voucher details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVoucher();
  }, [id]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin" size={32} /></div>;
  }

  if (!voucher) {
    return <div className="text-center">Voucher not found.</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <Button asChild variant="outline">
          <Link to={`/vouchers?page=${fromPage}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Vouchers
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Voucher Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div><strong>Voucher #:</strong> {voucher.voucher_number}</div>
          <div><strong>Customer:</strong> {voucher.customer?.name || 'N/A'}</div>
          {voucher.delivery_address && (
            <div><strong>Delivery Address:</strong> {voucher.delivery_address}</div>
          )}
          <div><strong>Date:</strong> {new Date(voucher.created_at).toLocaleString()}</div>
          <div className="border-t pt-4">
            <h3 className="font-bold mb-2">Items</h3>
            <ul>
              {voucher.items.map(item => (
                <li key={item.product_id} className="border-b py-2 flex justify-between">
                  <span>{item.product_name} x {item.quantity}</span>
                  <span>${item.subtotal.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="border-t pt-4 space-y-2">
            <h3 className="font-bold mb-2 text-right">Summary</h3>
            {voucher.discount_percentage > 0 && (
              <div className="flex justify-end space-x-4">
                <span>Discount (%):</span>
                <span>{voucher.discount_percentage}%</span>
              </div>
            )}
            {voucher.discount_amount > 0 && (
              <div className="flex justify-end space-x-4">
                <span>Discount ($):</span>
                <span>-${voucher.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-2 flex justify-end space-x-4 font-bold">
              <span>Total Discount:</span>
              <span>-${voucher.total_discount.toFixed(2)}</span>
            </div>
          </div>
          <div className="pt-2 flex justify-end space-x-4 font-bold text-xl border-t mt-2">
            <span>Total:</span>
            <span>${voucher.total_amount.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VoucherDetails;
