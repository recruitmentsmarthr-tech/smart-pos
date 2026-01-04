import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { Edit, Eye, Search, Loader2, PlusCircle } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
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

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  const [page, setPage] = useState(initialPage);
  const [searchTerm, setSearchTerm] = useState('');
  const limit = 10;

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      searchParams.set('limit', limit);
      if (searchTerm) {
        searchParams.set('search', searchTerm);
      }
      
      const res = await api.get("/customers/", { params: searchParams });
      setCustomers(res.data.items || []);
      setTotalCount(res.data.total || 0);

      navigate(`?${searchParams.toString()}`, { replace: true });
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, navigate]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchCustomers]);
  
  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">Customer Management</h1>
        <Button asChild>
          <Link to="/customers/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Customer
          </Link>
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-4">
          <Input 
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Remark</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan="6" className="h-24 text-center">
                      <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                    </TableCell>
                  </TableRow>
                ) : customers.length > 0 ? customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.phone || 'N/A'}</TableCell>
                    <TableCell>{customer.email || 'N/A'}</TableCell>
                    <TableCell>{customer.address || 'N/A'}</TableCell>
                    <TableCell>{customer.remark || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => navigate(`/customers/edit/${customer.id}`)}>
                        <Edit size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan="6" className="h-24 text-center">
                      No customers found.
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

export default CustomerManagement;
