import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Search, X, UserPlus, Check, Loader2 } from 'lucide-react';
import api from '~/api';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { cn } from '~/lib/utils';
import AdvancedSearch from '~/pages/Inventory/AdvancedSearch';
import Pagination from '~/components/Pagination';
import ProductCard from '~/components/ProductCard'; // Import the new component

const VoucherGeneration = () => {
  const [products, setProducts] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  const [voucherItems, setVoucherItems] = useState([]);
  const [discount, setDiscount] = useState(0);

  // States for Product Search and Pagination
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: "" }); // Initial filter for product name search
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const limit = 15; // Products per page

  // Fetch Categories for AdvancedSearch
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get("/categories/");
        setCategories(res.data || []);
      } catch (err) {
        console.error("Fetch Categories Error:", err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products with pagination and filters
  const lastProductsRef = useRef([]); // To store the last successfully set products

  const fetchProducts = useCallback(async (currentFilters) => {
    setLoadingProducts(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([_, v]) => v !== "")
      );
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      searchParams.set('limit', limit); // Add limit parameter
      
      for (const [key, value] of Object.entries(cleanedFilters)) {
        searchParams.set(key, value);
      }
      
      const res = await api.get("/stock/", { params: searchParams });
      const newProducts = res.data.items || [];

      // Only update state if the new data is actually different from the last data
      const isContentIdentical =
        newProducts.length === lastProductsRef.current.length &&
        newProducts.every((p, i) =>
          p.id === lastProductsRef.current[i].id &&
          p.name === lastProductsRef.current[i].name &&
          p.price === lastProductsRef.current[i].price &&
          p.quantity === lastProductsRef.current[i].quantity &&
          p.total_sold === lastProductsRef.current[i].total_sold // Include total_sold in comparison
        ); // Add the missing closing parenthesis here

      if (!isContentIdentical) {
        setProducts(newProducts);
        lastProductsRef.current = newProducts;
      }

      setTotalCount(res.data.total || 0);

    } catch (err) {
      console.error("Fetch Products Error:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [page, limit]); // Removed 'filters' from dependencies

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts(filters); // Pass current filters to fetchProducts
    }, 300); // Debounce API call

    return () => clearTimeout(debounce);
  }, [fetchProducts, filters]); // Added 'filters' to useEffect dependencies, as fetchProducts now takes it as an argument


  // Fetch customers for search
  useEffect(() => {
    const fetchCustomers = async () => {
      if (customerSearchTerm.length > 1) { // Only search if at least 2 characters
        try {
          const response = await api.get(`/customers/?search=${customerSearchTerm}`);
          setCustomerSearchResults(response.data || []);
        } catch (error) {
          console.error("Failed to fetch customers:", error);
          setCustomerSearchResults([]);
        }
      } else {
        setCustomerSearchResults([]);
      }
    };
    const debounce = setTimeout(() => {
        fetchCustomers();
    }, 300);

    return () => clearTimeout(debounce);
  }, [customerSearchTerm]);

  const handleAddItem = useCallback((product) => {
    setVoucherItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { product_id: product.id, name: product.name, price: product.price, quantity: 1, images: product.images }]; // Include images for card
      }
    });
    // setSearchTerm(''); // Don't clear search term for product list now
  }, [setVoucherItems]);

  const handleRemoveItem = (productId) => {
    setVoucherItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
        handleRemoveItem(productId);
        return;
    }
    setVoucherItems(prevItems =>
      prevItems.map(item =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName || !newCustomerPhone) {
      alert("Customer name and phone cannot be empty.");
      return;
    }
    try {
      const response = await api.post('/customers/', { name: newCustomerName, phone: newCustomerPhone });
      setSelectedCustomer(response.data);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setIsCustomerPopoverOpen(false); // Close popover
      alert("Customer created and selected!");
    } catch (error) {
      console.error("Failed to create customer:", error);
      const errorMessage = error.response?.data?.detail || "Failed to create customer.";
      alert(`Error: ${errorMessage}`);
    }
  };

  const subtotal = voucherItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalAmount = subtotal - discount;

  const handleSubmitVoucher = async () => {
    if (voucherItems.length === 0) {
      alert("Cannot create an empty voucher.");
      return;
    }

    const voucherData = {
      items: voucherItems.map(({ product_id, quantity }) => ({ product_id, quantity })),
      customer_id: selectedCustomer ? selectedCustomer.id : null,
      discount: parseFloat(discount) || 0,
    };

    try {
      const response = await api.post('/vouchers/', voucherData);
      alert(`Voucher ${response.data.voucher_number} created successfully!`);
      // Reset state after successful submission
      setVoucherItems([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setFilters({ name: "" }); // Reset product search filters
      setPage(1); // Reset product list page
      await fetchProducts(filters); // Explicitly re-fetch products after successful voucher generation
    } catch (error) {
      console.error("Failed to create voucher:", error);
      const errorMessage = error.response?.data?.detail || "An unexpected error occurred.";
      alert(`Error: ${errorMessage}`);
    }
  };

    return (

      // Outermost Container: Takes full viewport, acts as main flex container for left/right columns

      // p-X for overall padding, gap-X for spacing between columns

      <div className="flex flex-col lg:flex-row h-screen w-full p-2 sm:p-4 md:p-6 gap-2"> 

        

        {/* Left Panel: Products Section - Takes available horizontal space, stacks its cards vertically */}

        <div className="flex flex-col flex-grow h-full"> 

          {/* Advanced Search Card: Fixed height based on its content */}

          <Card> {/* Removed mb-4 */}

            <CardHeader className="p-4 pb-2"> {/* Reduced padding */}

              {/* Removed CardTitle "Products" */}

            </CardHeader>

            <CardContent className="p-4 pt-0"> {/* Reduced padding */}

              <AdvancedSearch

                filters={filters}

                setFilters={setFilters}

                categories={categories}

              />

            </CardContent>

          </Card>

  

          {/* Product List Card: Takes remaining vertical space, stacks its children (header, scrollable content, pagination) */}

          <Card className="flex-grow flex flex-col mt-4"> {/* Added mt-4 for spacing */}

            <CardHeader className="p-4 pb-2"> {/* Reduced padding */}

              {/* Removed CardTitle "Product List" */}

            </CardHeader>

            {/* Scrollable Product Grid Content */}

            <CardContent className="overflow-y-auto flex-grow hide-scrollbar"> {/* Removed explicit max-h, added flex-grow */}

              {loadingProducts ? (

                <div className="flex items-center justify-center h-full">

                  <Loader2 className="animate-spin text-primary" size={32} />

                </div>

              ) : products.length > 0 ? (

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"> {/* Adjusted responsive grid */}

                  {products.map(product => (

                    <ProductCard key={product.id} product={product} onAddToCart={handleAddItem} />

                  ))}

                </div>

              ) : (

                <div className="flex items-center justify-center h-full text-muted-foreground">

                  No products found.

                </div>

              )}

            </CardContent>

            {/* Pagination Footer: Fixed height */}

            <div className="p-4 border-t">

              <Pagination

                page={page}

                setPage={setPage}

                totalCount={totalCount}

                limit={limit}

              />

            </div>

          </Card>

        </div>

  

        {/* Right Panel: Current Sale Section - Responsive width */}

        <div className="flex flex-col w-full lg:w-72 shrink-0 h-full mt-4 lg:mt-0 lg:ml-2"> {/* Adjusted responsive width and margin */}

          <Card className="flex flex-col h-full">

            <CardHeader>

              <CardTitle>Current Sale</CardTitle>

            </CardHeader>

            {/* Scrollable Items List Content */}

            <CardContent className="overflow-y-auto flex-grow hide-scrollbar">            {/* Customer Selection */}
            <div className="mb-4">
                {selectedCustomer ? (
                    <div className="flex items-center justify-between p-2 border rounded-md bg-slate-50">
                        <p className="text-sm font-medium">{selectedCustomer.name} ({selectedCustomer.phone})</p>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                            <X className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                ) : (
                    <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Select Customer
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput 
                                    placeholder="Search customer or add new..." 
                                    value={customerSearchTerm}
                                    onValueChange={setCustomerSearchTerm}
                                />
                                <CommandList>
                                    <CommandEmpty>No customer found.</CommandEmpty>
                                    <CommandGroup heading="Customers">
                                        {customerSearchResults.map((customer) => (
                                            <CommandItem
                                                key={customer.id}
                                                value={customer.name}
                                                onSelect={() => {
                                                    setSelectedCustomer(customer);
                                                    setIsCustomerPopoverOpen(false);
                                                    setCustomerSearchTerm('');
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {customer.name} ({customer.phone})
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandGroup heading="Add New Customer">
                                        <div className="p-2">
                                            <Input
                                                placeholder="Name"
                                                value={newCustomerName}
                                                onChange={(e) => setNewCustomerName(e.target.value)}
                                                className="mb-2"
                                            />
                                            <Input
                                                placeholder="Phone (optional)"
                                                value={newCustomerPhone}
                                                onChange={(e) => setNewCustomerPhone(e.target.value)}
                                                className="mb-2"
                                            />
                                            <Button onClick={handleCreateCustomer} className="w-full">Add Customer</Button>
                                        </div>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Items List */}
            <div className="space-y-2">
              {voucherItems.length === 0 ? (
                <p className="text-center text-muted-foreground">No items added.</p>
              ) : (
                voucherItems.map(item => (
                  <div key={item.product_id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.product_id, parseInt(e.target.value))}
                            className="w-16 h-8 text-center"
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.product_id)} className="h-8 w-8">
                            <X className="h-4 w-4 text-destructive"/>
                        </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>

          {/* Footer with Totals */}
          <div className="p-4 border-t">
             <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span>Discount</span>
                    <Input 
                        type="number" 
                        value={discount}
                        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                        className="w-24 h-8"
                        placeholder="0.00"
                    />
                </div>
                <div className="flex justify-between font-bold text-base pt-2">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                </div>
             </div>
             <Button className="w-full mt-4" onClick={handleSubmitVoucher}>
                Complete Sale
             </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default VoucherGeneration;