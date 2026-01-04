import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { Eye, Search, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "~/components/ui/table";
import { Card, CardContent } from "~/components/ui/card";
import Pagination from "~/components/Pagination";
import { Input } from "~/components/ui/input";

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState({ customer_name: '' });
  const limit = 10;

  const fetchVouchers = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      searchParams.set('limit', limit);
      if (filters.customer_name) {
        searchParams.set('customer_name', filters.customer_name);
      }
      
      const res = await api.get("/vouchers/", { params: searchParams });
      setVouchers(res.data.items || []);
      setTotalCount(res.data.total || 0);

      navigate(`?${searchParams.toString()}`, { replace: true });
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, navigate]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchVouchers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchVouchers]);
  
  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">Voucher Management</h1>
          <span className="text-xs text-muted-foreground">({totalCount} vouchers)</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Input 
            placeholder="Search by customer name..."
            value={filters.customer_name}
            onChange={(e) => setFilters({...filters, customer_name: e.target.value})}
            className="max-w-sm"
          />
        </div>
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  <TableHead>Voucher #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Total Discount</TableHead>
                  <TableHead>Disc. %</TableHead>
                  <TableHead>Disc. $</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan="8" className="h-24 text-center">
                      <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                    </TableCell>
                  </TableRow>
                ) : vouchers.length > 0 ? vouchers.map((voucher) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-medium">{voucher.voucher_number}</TableCell>
                    <TableCell>{voucher.customer?.name || 'N/A'}</TableCell>
                    <TableCell>${voucher.total_amount.toFixed(2)}</TableCell>
                    <TableCell>${voucher.total_discount.toFixed(2)}</TableCell>
                    <TableCell>{voucher.discount_percentage}%</TableCell>
                    <TableCell>${voucher.discount_amount.toFixed(2)}</TableCell>
                    <TableCell>{new Date(voucher.created_at).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/vouchers/${voucher.id}`, { state: { fromPage: page } })}>
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan="8" className="h-24 text-center">
                      No vouchers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Pagination
          page={page}
          setPage={setPage}
          totalCount={totalCount}
          limit={limit}
        />
      </div>
    </div>
  );
};

export default VoucherManagement;
