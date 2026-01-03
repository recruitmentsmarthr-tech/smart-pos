import React from 'react';

const Receipt = React.forwardRef(({ voucher }, ref) => {
  if (!voucher) return null;

  const subtotal = voucher.items.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div ref={ref} className="bg-white text-black p-4 w-[302px] text-[10px]">
      <div className="text-center mb-2">
        <h1 className="text-lg font-bold">SMART POS</h1>
        <p>123 Coding Lane, Dev City</p>
        <p>Tel: 555-1234</p>
      </div>
      <div className="border-t border-dashed border-black my-2"></div>
      <div className="flex justify-between">
        <span>Voucher:</span>
        <span>{voucher.voucher_number}</span>
      </div>
      <div className="flex justify-between">
        <span>Date:</span>
        <span>{new Date(voucher.created_at).toLocaleString()}</span>
      </div>
      <div className="flex justify-between">
        <span>Cashier:</span>
        <span>{voucher.staff_id}</span>
      </div>
      <div className="flex justify-between mb-1">
        <span>Customer:</span>
        <span>{voucher.customer?.name || 'Walk-in'}</span>
      </div>
      {voucher.customer?.phone && (
        <div className="flex justify-between mb-1">
            <span>Cust. Phone:</span>
            <span>{voucher.customer.phone}</span>
        </div>
      )}
      {voucher.customer?.address && (
        <div className="flex justify-between mb-2">
            <span className="pr-2">Cust. Address:</span>
            <span className="text-right">{voucher.customer.address}</span>
        </div>
      )}
      {voucher.delivery_address && (
        <div className="flex justify-between mb-2">
            <span className="pr-2">Delivery:</span>
            <span className="text-right">{voucher.delivery_address}</span>
        </div>
      )}
      
      <div className="border-t border-dashed border-black my-2"></div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">ITEM</th>
            <th className="text-right">QTY</th>
            <th className="text-right">PRICE</th>
            <th className="text-right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {voucher.items.map(item => (
            <tr key={item.product_id}>
              <td className="text-left">{item.product_name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">${item.price_at_sale.toFixed(2)}</td>
              <td className="text-right">${item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black my-2"></div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {voucher.total_discount > 0 && (
            <div className="flex justify-between">
                <span>Discount:</span>
                <span>-${voucher.total_discount.toFixed(2)}</span>
            </div>
        )}
        <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
          <span>TOTAL:</span>
          <span>${voucher.total_amount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-4">
        <p>Thank you for your purchase!</p>
      </div>
    </div>
  );
});

export default Receipt;
