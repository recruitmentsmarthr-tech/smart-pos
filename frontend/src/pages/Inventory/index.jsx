import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../api";
import { useDialog } from "~/contexts/DialogContext";
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Layers, Loader2 } from "lucide-react";
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
import {
  Card,
  CardContent,
} from "~/components/ui/card";
import AdvancedSearch from "./AdvancedSearch";
import Pagination from "~/components/Pagination";
import usePrevious from "~/hooks/usePrevious";

const InventoryIndex = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const initialPage = parseInt(queryParams.get('page') || '1', 10);
  const initialFilters = {
    name: queryParams.get('name') || "",
    category_id: queryParams.get('category_id') || "",
    sell_price_gt: queryParams.get('sell_price_gt') || "",
    sell_price_lt: queryParams.get('sell_price_lt') || "",
    buy_price_gt: queryParams.get('buy_price_gt') || "",
    buy_price_lt: queryParams.get('buy_price_lt') || "",
    quantity_gt: queryParams.get('quantity_gt') || "",
    quantity_lt: queryParams.get('quantity_lt') || "",
    total_sold_gt: queryParams.get('total_sold_gt') || "",
    total_sold_lt: queryParams.get('total_sold_lt') || "",
    arrival_date_eq: queryParams.get('arrival_date_eq') || "",
    arrival_date_start: queryParams.get('arrival_date_start') || "",
    arrival_date_end: queryParams.get('arrival_date_end') || "",
  };
  
  const [page, setPage] = useState(initialPage);
  const [sort, setSort] = useState({ field: "id", order: "desc" });
  const [filters, setFilters] = useState(initialFilters);
  const [categories, setCategories] = useState([]);
  const limit = 10;
  const prevFilters = usePrevious(filters);

  useEffect(() => {
    if (prevFilters && JSON.stringify(filters) !== JSON.stringify(prevFilters)) {
      setPage(1);
    }
  }, [filters, prevFilters]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories/");
      setCategories(res.data || []);
    } catch (err) {
      console.error("Fetch Error:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "")
      );
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      if (sort.order) {
        searchParams.set('sort_by', sort.field);
        searchParams.set('sort_order', sort.order);
      }
      for (const [key, value] of Object.entries(cleanedFilters)) {
        searchParams.set(key, value);
      }
      
      const res = await api.get("/stock/", { params: searchParams });
      setProducts(res.data.items || []);
      setTotalCount(res.data.total || 0);
      
      // Update URL without reloading page
      navigate(`?${searchParams.toString()}`, { replace: true });

    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters, sort, navigate]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const { showDialog } = useDialog();
  const handleDelete = async (stockId) => {
    showDialog(
      "Confirm Deletion",
      "Are you sure you want to delete this item?",
      async () => {
        try {
          await api.delete(`/stock/${stockId}`);
          showDialog("Success", "Item deleted successfully.");
          fetchProducts();
        } catch (err) {
          const detail = err.response?.data?.detail || "Failed to delete item.";
          showDialog("Error", `Error: ${detail}`);
        }
      }
    );
  };

  const handleSort = (field) => {
    setSort(prevSort => {
      if (prevSort.field === field) {
        if (prevSort.order === "asc") return { field, order: "desc" };
        if (prevSort.order === "desc") return { field, order: null };
        return { field, order: "asc" };
      }
      return { field, order: "asc" };
    });
  };

  const renderSortArrow = (field) => {
    if (sort.field === field && sort.order) {
      return sort.order === "asc" ? <ArrowUp size={16} className="ml-2" /> : <ArrowDown size={16} className="ml-2" />;
    }
    return null;
  };

  return (
    <div className="h-full w-full flex flex-col p-4 sm:p-6 md:p-8 lg:p-10 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-serif">Inventory</h1>
          <span className="text-xs text-muted-foreground">({totalCount} items)</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/categories")}>
            <Layers size={16} className="mr-2" /> Manage Categories
          </Button>
          <Button onClick={() => navigate('/inventory/add')}>
            <Plus size={16} className="mr-2" /> Add Item
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AdvancedSearch
          filters={filters}
          setFilters={setFilters}
          categories={categories}
          fetchProducts={fetchProducts}
        />
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-auto p-0">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-white">
                <TableRow>
                  <TableHead onClick={() => handleSort("name")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Product Name {renderSortArrow("name")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("category")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Category {renderSortArrow("category")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("price")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Sell Price {renderSortArrow("price")}</div>
                  </TableHead>
                  <TableHead className="text-xs sm:text-sm">Sale Status</TableHead>
                  <TableHead onClick={() => handleSort("cost_price")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Buy Price {renderSortArrow("cost_price")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("quantity")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">QTY {renderSortArrow("quantity")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("total_sold")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">QTY Sold {renderSortArrow("total_sold")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("arrival_date")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Arrival Date {renderSortArrow("arrival_date")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("updated_at")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Updated At {renderSortArrow("updated_at")}</div>
                  </TableHead>
                  <TableHead onClick={() => handleSort("created_at")} className="cursor-pointer text-xs sm:text-sm">
                    <div className="flex items-center">Created At {renderSortArrow("created_at")}</div>
                  </TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan="11" className="h-24 text-center">
                      <Loader2 className="animate-spin text-primary mx-auto" size={24} />
                    </TableCell>
                  </TableRow>
                ) : products.length > 0 ? products.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-xs sm:text-sm">{item.name || "N/A"}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.category?.name || 'N/A'}</TableCell>
                    <TableCell className="text-xs sm:text-sm">${item.price ? Number(item.price).toFixed(2) : "0.00"}</TableCell>
                    <TableCell className="text-xs sm:text-sm">
                      {item.is_on_sale ? (
                        <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10">
                          {item.discount_percent}% OFF
                        </span>
                      ) : (
                        "N/A"
                      )}
                    </TableCell>
                    <TableCell className="text-xs sm:text-sm">${item.cost_price ? Number(item.cost_price).toFixed(2) : "0.00"}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.quantity ?? 0}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.total_sold ?? 0}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{item.arrival_date ? new Date(item.arrival_date).toLocaleDateString() : 'N/A'}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{new Date(item.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs sm:text-sm">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/inventory/edit/${item.id}`, { state: { page } })}>
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan="10" className="h-24 text-center">
                      No products found.
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

export default InventoryIndex;