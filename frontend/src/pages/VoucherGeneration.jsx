import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDialog } from '~/contexts/DialogContext';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '~/components/ui/dialog';
import { Search, X, UserPlus, Check, Loader2, Plus, Minus, RefreshCcw, Home, Download, Pencil } from 'lucide-react';
import api from '~/api';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from '~/components/ui/command';
import { cn } from '~/lib/utils';
import AdvancedSearch from '~/pages/Inventory/AdvancedSearch';
import Pagination from '~/components/Pagination';
import ProductCard from '~/components/ProductCard';
import QuantitySelector from '~/components/QuantitySelector';
import Receipt from '~/components/Receipt';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';

const createSingleVoucherRequest = (
  items, 
  customerId, 
  discountPercentage, 
  discountAmount, 
  deliveryAddress
) => ({
  items: items.map(item => ({ product_id: item.product_id, quantity: item.quantity })),
  customer_id: customerId,
  discount_percentage: discountPercentage,
  discount_amount: discountAmount,
  delivery_address: deliveryAddress,
});


const VoucherGeneration = () => {
  const [originalProducts, setOriginalProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); 
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerRemark, setNewCustomerRemark] = useState('');

  const [voucherItems, setVoucherItems] = useState([]);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isNewCustomerDialogOpen, setIsNewCustomerDialogOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [additionalVoucherRequests, setAdditionalVoucherRequests] = useState([]);
  const [editingVoucherInfo, setEditingVoucherInfo] = useState(null);

  const [isAddingAnotherVoucher, setIsAddingAnotherVoucher] = useState(false);
  const [newVoucherCustomerSearchTerm, setNewVoucherCustomerSearchTerm] = useState('');
  const [newVoucherCustomerSearchResults, setNewVoucherCustomerSearchResults] = useState([]);
  const [newVoucherSelectedCustomer, setNewVoucherSelectedCustomer] = useState(null);
  const [newVoucherDeliveryAddress, setNewVoucherDeliveryAddress] = useState('');
  const [isNewVoucherCustomerPopoverOpen, setIsNewVoucherCustomerPopoverOpen] = useState(false);
  const [applyAddressToAll, setApplyAddressToAll] = useState(true);

  const receiptRef = useRef();
  const [voucherForReceipt, setVoucherForReceipt] = useState(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);
  const [canAddAnother, setCanAddAnother] = useState(true);

  useEffect(() => {
    if (voucherForReceipt && receiptRef.current) {
      handleDownloadVoucher(voucherForReceipt);
    }
  }, [voucherForReceipt]);

  const handleDownloadVoucher = useCallback(async (voucherData) => {
    if (!receiptRef.current) return;
    try {
      const canvas = await window.html2canvas(receiptRef.current, { scale: 3 });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `voucher-${voucherData.voucher_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setVoucherForReceipt(null);
    } catch (error) {
      console.error("Error generating PNG:", error);
    }
  }, []);

  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState({ name: "" });
  const [categories, setCategories] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const limit = 15;

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

  const fetchProducts = useCallback(async (currentFilters) => {
    setLoadingProducts(true);
    try {
      const cleanedFilters = Object.fromEntries(
        Object.entries(currentFilters).filter(([_, v]) => v !== "")
      );
      const searchParams = new URLSearchParams();
      searchParams.set('page', page);
      searchParams.set('limit', limit);
      
      for (const [key, value] of Object.entries(cleanedFilters)) {
        searchParams.set(key, value);
      }
      
      const res = await api.get("/stock/", { params: searchParams });
      const fetchedProducts = res.data.items || [];
      setOriginalProducts(JSON.parse(JSON.stringify(fetchedProducts)));
      setTotalCount(res.data.total || 0);
    } catch (err) {
      console.error("Fetch Products Error:", err);
    } finally {
      setLoadingProducts(false);
    }
  }, [page, limit]); 

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchProducts(filters); 
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchProducts, filters]);

  // Recalculate derived `products` state whenever carts change
  useEffect(() => {
    const allocatedQuantities = {};
    voucherItems.forEach(item => {
      allocatedQuantities[item.product_id] = (allocatedQuantities[item.product_id] || 0) + item.quantity;
    });
    additionalVoucherRequests.forEach(req => {
      req.items.forEach(item => {
        allocatedQuantities[item.product_id] = (allocatedQuantities[item.product_id] || 0) + item.quantity;
      });
    });

    setProducts(originalProducts.map(p => {
      const allocated = allocatedQuantities[p.id] || 0;
      return { ...p, quantity: p.quantity - allocated };
    }));
  }, [voucherItems, additionalVoucherRequests, originalProducts]);


  useEffect(() => {
    const fetchCustomers = async () => {
      if (customerSearchTerm.length > 1) {
        try {
          const response = await api.get(`/customers/`, { params: { search: customerSearchTerm, limit: 10 } });
          setCustomerSearchResults(response.data.items || []);
        } catch (error) {
          console.error("Failed to fetch customers:", error);
        }
      } else {
        setCustomerSearchResults([]);
      }
    };
    const debounce = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(debounce);
  }, [customerSearchTerm]);

  useEffect(() => {
    const fetchNewVoucherCustomers = async () => {
      if (newVoucherCustomerSearchTerm.length > 1) { 
        try {
          const response = await api.get(`/customers/`, { params: { search: newVoucherCustomerSearchTerm, limit: 10 } });
          setNewVoucherCustomerSearchResults(response.data.items || []);
        } catch (error) {
          console.error("Failed to fetch customers for new voucher:", error);
        }
      } else {
        setNewVoucherCustomerSearchResults([]);
      }
    };
    const debounce = setTimeout(() => fetchNewVoucherCustomers(), 300);
    return () => clearTimeout(debounce);
  }, [newVoucherCustomerSearchTerm]);

  const { showDialog } = useDialog();

  const handleAddItem = useCallback((product) => {
    const originalProduct = originalProducts.find(p => p.id === product.id);
    if (!originalProduct) return;

    const qtyInAllCarts = (voucherItems.find(i => i.product_id === product.id)?.quantity || 0) 
      + additionalVoucherRequests.reduce((sum, req) => sum + (req.items.find(i => i.product_id === product.id)?.quantity || 0), 0);

    if (qtyInAllCarts >= originalProduct.quantity) {
      showDialog("Warning", `Not enough stock for '${product.name}'.`);
      return;
    }
    
    setVoucherItems(prevItems => {
      const existingItem = prevItems.find(item => item.product_id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevItems, { product_id: product.id, name: product.name, price: product.price, quantity: 1, images: product.images }];
    });
  }, [originalProducts, voucherItems, additionalVoucherRequests, showDialog]);

  const handleRemoveItem = (productId) => {
    setVoucherItems(prevItems => prevItems.filter(item => item.product_id !== productId));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    const originalProduct = originalProducts.find(p => p.id === productId);
    if (!originalProduct) return;
    
    if (newQuantity < 1) {
      handleRemoveItem(productId);
      return;
    }

    const qtyInOtherCarts = additionalVoucherRequests.reduce((sum, req) => sum + (req.items.find(i => i.product_id === productId)?.quantity || 0), 0);
    const stockLimit = originalProduct.quantity - qtyInOtherCarts;

    if (newQuantity > stockLimit) {
      showDialog("Warning", `Not enough stock for '${originalProduct.name}'. Only ${stockLimit} available for this cart.`);
      newQuantity = stockLimit;
    }

    setVoucherItems(prev =>
      prev.map(item =>
        item.product_id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleResetSale = () => {
    fetchProducts(filters);
    setVoucherItems([]);
    setSelectedCustomer(null);
    setDiscountPercentage(0);
    setDiscountAmount(0);
    setDeliveryAddress('');
    setAdditionalVoucherRequests([]);
    setNewVoucherCustomerSearchTerm(''); 
    setNewVoucherSelectedCustomer(null);
    setNewVoucherDeliveryAddress('');
    setIsAddingAnotherVoucher(false);
    setEditingVoucherInfo(null);
  };

  const handleCreateCustomer = async () => {
    if (!newCustomerName) {
      showDialog("Warning", "Customer name cannot be empty.");
      return;
    }
    try {
      const customerData = { name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail, address: newCustomerAddress, remark: newCustomerRemark };
      const response = await api.post('/customers/', customerData);
      setSelectedCustomer(response.data);
      setNewCustomerName(''); setNewCustomerPhone(''); setNewCustomerEmail(''); setNewCustomerAddress(''); setNewCustomerRemark('');
      setIsNewCustomerDialogOpen(false);
      showDialog("Success", "Customer created and added to sale!");
    } catch (error) {
      console.error("Failed to create customer:", error);
      showDialog("Error", `Error: ${error.response?.data?.detail || "An unexpected error occurred."}`);
    }
  };

  const handleAddAnotherVoucher = () => {
    if (!newVoucherSelectedCustomer && !newVoucherDeliveryAddress) {
        showDialog("Warning", "Please select a customer or provide a delivery address for the new voucher.");
        return;
    }
    const newRequest = {
        items: JSON.parse(JSON.stringify(voucherItems)),
        customer_id: newVoucherSelectedCustomer ? newVoucherSelectedCustomer.id : null,
        customer_name: newVoucherSelectedCustomer ? newVoucherSelectedCustomer.name : null,
        delivery_address: newVoucherDeliveryAddress,
    };
    setAdditionalVoucherRequests(prev => [...prev, newRequest]);
    setNewVoucherCustomerSearchTerm('');
    setNewVoucherSelectedCustomer(null);
    setNewVoucherDeliveryAddress('');
    setIsAddingAnotherVoucher(false);
  };

  const handleSaveEditedVoucher = () => {
    if (!editingVoucherInfo) return;
    const { index, items } = editingVoucherInfo;
    setAdditionalVoucherRequests(prev =>
      prev.map((voucher, i) => (i === index ? { ...voucher, items: items } : voucher))
    );
    setEditingVoucherInfo(null);
  };

  const subtotal = voucherItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalAmount = subtotal * (1 - (discountPercentage || 0) / 100) - (discountAmount || 0);

  const checkSufficientStock = (allItemLists, onStockError) => {
    const totalQuantities = {};
    allItemLists.forEach(items => {
        (items || []).forEach(item => {
            totalQuantities[item.product_id] = (totalQuantities[item.product_id] || 0) + item.quantity;
        });
    });

    for (const productId in totalQuantities) {
        if (totalQuantities[productId] === 0) continue;
        const originalProduct = originalProducts.find(p => p.id == productId);
        const originalStock = originalProduct?.quantity || 0;

        if (totalQuantities[productId] > originalStock) {
            if (onStockError) {
                const productName = originalProduct?.name || `Product ID ${productId}`;
                onStockError(`Not enough stock for ${productName}. Required: ${totalQuantities[productId]}, Available: ${originalStock}`);
            }
            return false;
        }
    }
    return true;
  };

  useEffect(() => {
    const allCurrentItems = [voucherItems, ...additionalVoucherRequests.map(r => r.items)];
    const prospectiveItems = [...allCurrentItems, voucherItems];
    setCanAddAnother(checkSufficientStock(prospectiveItems));
  }, [voucherItems, additionalVoucherRequests, originalProducts]);

  const executeVoucherCreation = async () => {
    const allItemLists = [voucherItems, ...additionalVoucherRequests.map(r => r.items)];
    
    if (!checkSufficientStock(allItemLists, (errorMessage) => showDialog("Stock Error", errorMessage))) {
      return;
    }
    
    const sanitizedAdditionalRequests = additionalVoucherRequests.map(({ customer_name, ...rest }) => createSingleVoucherRequest(rest.items, rest.customer_id, discountPercentage, discountAmount, rest.delivery_address));
    const allRequests = [createSingleVoucherRequest(voucherItems, selectedCustomer?.id, discountPercentage, discountAmount, deliveryAddress), ...sanitizedAdditionalRequests];

    if (allRequests.every(req => req.items.length === 0)) {
        showDialog("Warning", "Cannot create vouchers with no items.");
        return;
    }
    
    setIsGeneratingPng(true);
    const batchVoucherData = { vouchers: allRequests };

    try {
      const response = await api.post('/vouchers/', batchVoucherData);
      showDialog("Success", `${response.data.length} voucher(s) created successfully! Starting download...`);
      for (const voucher of response.data) {
        await new Promise(resolve => {
          setVoucherForReceipt(voucher);
          setTimeout(resolve, 1000); 
        });
      }
      handleResetSale();
      setIsConfirmOpen(false);
    } catch (error) {
      console.error("Failed to create voucher:", error);
      showDialog("Error", `Error: ${error.response?.data?.detail || "An unexpected error occurred."}`);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <>
      <div style={{ position: 'fixed', left: '-9999px', top: 0, zIndex: -10 }}>
        <Receipt ref={receiptRef} voucher={voucherForReceipt} />
      </div>

      <div className="flex flex-col lg:flex-row h-screen w-full p-2 sm:p-4 md:p-6 gap-2"> 
        <div className="flex flex-col flex-grow h-full"> 
          <Card><CardHeader className="p-4 pb-2"></CardHeader><CardContent className="p-4 pt-0"><AdvancedSearch filters={filters} setFilters={setFilters} categories={categories}/></CardContent></Card>
          <Card className="flex-grow flex flex-col mt-4">
            <CardHeader className="p-4 pb-2"></CardHeader>
            <CardContent className="overflow-y-auto flex-grow hide-scrollbar">
              {loadingProducts ? <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={32} /></div>
              : <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{products.map(p => <ProductCard key={p.id} product={p} onAddToCart={handleAddItem} />)}</div>}
            </CardContent>
            <div className="p-4 border-t"><Pagination page={page} setPage={setPage} totalCount={totalCount} limit={limit}/></div>
          </Card>
        </div>
  
        <div className="flex flex-col w-full lg:w-96 shrink-0 h-full mt-4 lg:mt-0 lg:ml-2">
          <Card className="flex flex-col h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Current Sale</CardTitle>
              <Button variant="ghost" size="icon" onClick={handleResetSale} title="Reset Current Sale"><RefreshCcw className="h-4 w-4 text-orange-500" /></Button>
            </CardHeader>
            <CardContent className="flex-grow overflow-y-auto hide-scrollbar p-4 space-y-2">
              {voucherItems.length === 0 ? <div className="flex items-center justify-center h-full text-muted-foreground"><p>No items in sale.</p></div>
              : voucherItems.map(item => {
                  const originalProduct = originalProducts.find(p => p.id === item.product_id);
                  const totalOriginalStock = originalProduct?.quantity || 0;
                  let qtyInOtherCarts = 0;
                  additionalVoucherRequests.forEach((req) => {
                      const itemInOtherVoucher = req.items.find(it => it.product_id === item.product_id);
                      if (itemInOtherVoucher) {
                          qtyInOtherCarts += itemInOtherVoucher.quantity;
                      }
                  });
                  const stockLimit = totalOriginalStock - qtyInOtherCarts;
                  return (
                    <div key={item.product_id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-grow w-2/5">
                        <img src={item.images?.[0]?.url || '/placeholder.svg'} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                        <div className="flex-grow">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.price?.toFixed(2) || '0.00'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <QuantitySelector
                          quantity={item.quantity}
                          onQuantityChange={(newQuantity) => handleQuantityChange(item.product_id, newQuantity)}
                          stockLimit={stockLimit}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(item.product_id)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </CardContent>
            <div className="p-4 border-t space-y-4 shrink-0">
              <div className="space-y-2">
                  <Label>Customer</Label>
                   <div className="p-2 border rounded-md min-h-[40px] bg-slate-50">
                      {selectedCustomer ? <div className="flex items-center justify-between gap-1 bg-slate-200 rounded-full px-2 py-0.5 text-sm"><span>{selectedCustomer.name}</span><button type="button" onClick={() => setSelectedCustomer(null)} className="rounded-full hover:bg-slate-300"><X className="h-3 w-3" /></button></div>
                      : <p className="text-sm text-muted-foreground px-1">Walk-in Customer</p>}
                  </div>
                  <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                      <PopoverTrigger asChild><Button variant="outline" className="w-full"><UserPlus className="mr-2 h-4 w-4" />{selectedCustomer ? 'Change Customer' : 'Select Customer'}</Button></PopoverTrigger>
                      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder="Search customer..." value={customerSearchTerm} onValueChange={setCustomerSearchTerm}/><CommandList><CommandEmpty>No customer found.</CommandEmpty><CommandGroup heading="Customers">{customerSearchResults.map(c => <CommandItem key={c.id} value={c.name} onSelect={() => {setSelectedCustomer(c); setIsCustomerPopoverOpen(false); setCustomerSearchTerm('');}}><Check className={cn("mr-2 h-4 w-4", selectedCustomer?.id === c.id ? "opacity-100" : "opacity-0")}/>{c.name} ({c.phone})</CommandItem>)}</CommandGroup><CommandItem onSelect={() => {setIsCustomerPopoverOpen(false); setIsNewCustomerDialogOpen(true);}} className="text-primary"><UserPlus className="mr-2 h-4 w-4" />Add New Customer</CommandItem></CommandList></Command></PopoverContent>
                  </Popover>
              </div>
              <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogTrigger asChild><Button variant="outline" className="w-full justify-center font-normal"><Home className="mr-2 h-4 w-4" />{deliveryAddress ? <span className="truncate">{deliveryAddress}</span> : "Add Delivery Address"}</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Delivery Address</DialogTitle></DialogHeader>
                  <Textarea placeholder="Enter full delivery address..." value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="resize-none min-h-[100px]"/>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="apply-to-all" checked={applyAddressToAll} onCheckedChange={setApplyAddressToAll} />
                    <label htmlFor="apply-to-all" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Apply to all additional vouchers
                    </label>
                  </div>
                  <DialogFooter>
                    <Button onClick={() => {
                      if (applyAddressToAll) {
                        setAdditionalVoucherRequests(prev => prev.map(req => ({ ...req, delivery_address: deliveryAddress })));
                      }
                      setIsAddressDialogOpen(false);
                    }}>Done</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <div className="border-t -mx-4"></div>
              <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center"><Label htmlFor="discount-percentage">Discount (%)</Label><Input id="discount-percentage" type="number" value={discountPercentage} onChange={e => setDiscountPercentage(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right"/></div>
                  <div className="flex justify-between items-center"><Label htmlFor="discount-amount">Discount ($)</Label><Input id="discount-amount" type="number" value={discountAmount} onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)} className="w-24 h-8 text-right"/></div>
                  <div className="flex justify-between font-bold text-base pt-2"><span>Total</span><span>${totalAmount.toFixed(2)}</span></div>
              </div>
               <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogTrigger asChild><Button size="lg" className="w-full" disabled={voucherItems.length === 0}>Confirm Sale</Button></DialogTrigger>
                <DialogContent className="max-w-4xl">
                    <DialogHeader><DialogTitle>Confirm Batch Sale</DialogTitle></DialogHeader>
                     <div className="grid grid-cols-2 gap-6 py-4">
                        <div><h4 className="font-semibold mb-2">Initial Voucher Details</h4>
                            <p className="text-sm p-2 border rounded-md">Customer: {selectedCustomer ? selectedCustomer.name : "Walk-in"}</p>
                            <div className="flex items-center justify-between">
                                <p className="text-sm p-2 border rounded-md mt-2 flex-grow">
                                Delivery Address: {deliveryAddress || "Not specified"}
                                </p>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" size="sm" className="ml-2 mt-2"><Pencil className="h-3 w-3"/></Button>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <div className="grid gap-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Edit Delivery Address</h4>
                                                <p className="text-sm text-muted-foreground">Update the main delivery address.</p>
                                            </div>
                                            <Textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} className="resize-none"/>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Items in Main Cart ({voucherItems.reduce((acc, item) => acc + item.quantity, 0)})</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {voucherItems.map(item => {
                                const originalProduct = originalProducts.find(p => p.id === item.product_id);
                                const totalOriginalStock = originalProduct?.quantity || 0;
                                let qtyInOtherCarts = 0;
                                additionalVoucherRequests.forEach((req) => {
                                    const itemInOtherVoucher = req.items.find(it => it.product_id === item.product_id);
                                    if (itemInOtherVoucher) {
                                        qtyInOtherCarts += itemInOtherVoucher.quantity;
                                    }
                                });
                                const stockLimit = totalOriginalStock - qtyInOtherCarts;
                                return (
                                <div key={item.product_id} className="flex items-center justify-between text-sm">
                                  <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">${item.price?.toFixed(2) || '0.00'}</p></div>
                                  <div className="flex items-center gap-2">
                                    <QuantitySelector
                                      quantity={item.quantity}
                                      onQuantityChange={(newQuantity) => handleQuantityChange(item.product_id, newQuantity)}
                                      stockLimit={stockLimit}
                                    />
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleRemoveItem(item.product_id)}><X className="h-4 w-4 text-destructive" /></Button>
                                  </div>
                                </div>
                                );
                            })}
                          </div>
                        </div>
                    </div>
                    <div className="mt-4 border-t pt-4"><h4 className="font-semibold mb-2">Additional Vouchers ({additionalVoucherRequests.length})</h4>
                        {additionalVoucherRequests.length === 0 ? <p className="text-sm text-muted-foreground">No additional vouchers added yet.</p>
                        : <div className="space-y-2">{additionalVoucherRequests.map((req, index) => <div key={index} className="p-2 border rounded-md bg-slate-50 flex justify-between items-center"><div><p className="text-sm font-medium">{req.customer_name || (req.delivery_address ? "Walk-in" : "N/A")} - {req.delivery_address || "No Address"}</p><p className="text-xs text-muted-foreground">Items: {req.items.reduce((acc, item) => acc + item.quantity, 0)}</p></div>
                                        <div className="flex items-center gap-1">
                                                <Button variant="outline" size="sm" className="h-7" onClick={() => setEditingVoucherInfo({ index, items: JSON.parse(JSON.stringify(req.items)) })}>
                                                    <Pencil className="h-3 w-3 mr-1"/> Items
                                                </Button>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-7">Address</Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent>
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Edit Delivery Address</h4>
                                                                <p className="text-sm text-muted-foreground">Update address for this voucher.</p>
                                                            </div>
                                                            <Textarea value={req.delivery_address || ''} onChange={(e) => {
                                                                const newAddress = e.target.value;
                                                                setAdditionalVoucherRequests(prev => prev.map((voucher, i) => i === index ? { ...voucher, delivery_address: newAddress } : voucher));
                                                            }} className="resize-none"/>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setAdditionalVoucherRequests(prev => prev.filter((_, i) => i !== index))}><X className="h-4 w-4 text-destructive"/></Button>
                                            </div>
                                        </div>)}</div>}
                        <TooltipProvider><Tooltip><TooltipTrigger asChild><div className="w-full mt-4"><Button variant="outline" className="w-full" onClick={() => setIsAddingAnotherVoucher(true)} disabled={!canAddAnother}><Plus className="mr-2 h-4 w-4" />Add Another Customer/Voucher</Button></div></TooltipTrigger>{!canAddAnother && (<TooltipContent><p>Insufficient stock to add another voucher with the current items.</p></TooltipContent>)}</Tooltip></TooltipProvider>
                    </div>
                     <div className="p-4 border-t"><div className="space-y-2 text-sm"><div className="flex justify-between items-center"><span>Discount (%)</span><Input type="number" value={discountPercentage} readOnly className="w-24 h-8 text-right bg-gray-100"/></div><div className="flex justify-between items-center"><span>Discount ($)</span><Input type="number" value={discountAmount} readOnly className="w-24 h-8 text-right bg-gray-100"/></div><div className="flex justify-between font-bold text-base pt-2"><span>Total (for one voucher)</span><span>${totalAmount.toFixed(2)}</span></div></div></div>
                    <DialogFooter><Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isGeneratingPng}>Cancel</Button><Button onClick={executeVoucherCreation} disabled={isGeneratingPng}><Download className="mr-2 h-4 w-4" />Confirm & Create Vouchers ({1 + additionalVoucherRequests.length})</Button></DialogFooter>
                </DialogContent>
            </Dialog>
            </div>
          </Card>

          <Dialog open={isNewCustomerDialogOpen} onOpenChange={setIsNewCustomerDialogOpen}><DialogContent><DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><Input placeholder="Customer Name (Required)" value={newCustomerName} onChange={e=>setNewCustomerName(e.target.value)}/><Input placeholder="Phone" value={newCustomerPhone} onChange={e=>setNewCustomerPhone(e.target.value)}/><Input placeholder="Email" value={newCustomerEmail} onChange={e=>setNewCustomerEmail(e.target.value)}/><Input placeholder="Address" value={newCustomerAddress} onChange={e=>setNewCustomerAddress(e.target.value)}/><Textarea placeholder="Remark..." value={newCustomerRemark} onChange={e=>setNewCustomerRemark(e.target.value)} className="resize-none"/></div><DialogFooter><Button variant="outline" onClick={()=>setIsNewCustomerDialogOpen(false)}>Cancel</Button><Button onClick={handleCreateCustomer}>Add Customer</Button></DialogFooter></DialogContent></Dialog>
          <Dialog open={isAddingAnotherVoucher} onOpenChange={setIsAddingAnotherVoucher}><DialogContent><DialogHeader><DialogTitle>Add Another Voucher</DialogTitle></DialogHeader><div className="grid gap-4 py-4"><Label>Customer for this Voucher</Label><Popover open={isNewVoucherCustomerPopoverOpen} onOpenChange={setIsNewVoucherCustomerPopoverOpen}><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start font-normal">{newVoucherSelectedCustomer ? newVoucherSelectedCustomer.name : "Select Customer (Optional)"}<Search className="ml-auto h-4 w-4 shrink-0 opacity-50" /></Button></PopoverTrigger><PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0"><Command><CommandInput placeholder="Search customer..." value={newVoucherCustomerSearchTerm} onValueChange={setNewVoucherCustomerSearchTerm}/><CommandList><CommandEmpty>No customer found.</CommandEmpty><CommandGroup heading="Customers">{newVoucherCustomerSearchResults.map(c => {const allAssignedCustomerIds=[selectedCustomer?.id, ...additionalVoucherRequests.map(req=>req.customer_id)].filter(Boolean); const isAlreadyAssigned=allAssignedCustomerIds.includes(c.id); return <CommandItem key={c.id} value={c.name} onSelect={()=>{if(isAlreadyAssigned){showDialog("Warning",`${c.name} is already assigned to another voucher.`); return;} setNewVoucherSelectedCustomer(c); setIsNewVoucherCustomerPopoverOpen(false); setNewVoucherCustomerSearchTerm('');}} disabled={isAlreadyAssigned} className={isAlreadyAssigned ? "opacity-50 cursor-not-allowed" : ""}><Check className={cn("mr-2 h-4 w-4",newVoucherSelectedCustomer?.id===c.id?"opacity-100":"opacity-0")}/>{c.name} ({c.phone}){isAlreadyAssigned && <span className="ml-2 text-xs text-muted-foreground">(Assigned)</span>}</CommandItem>})}</CommandGroup></CommandList></Command></PopoverContent></Popover>{newVoucherSelectedCustomer && <div className="flex items-center gap-1"><span>Selected: {newVoucherSelectedCustomer.name}</span><Button variant="ghost" size="icon" onClick={()=>setNewVoucherSelectedCustomer(null)} className="h-6 w-6"><X className="h-3 w-3" /></Button></div>}<Label className="mt-2">Delivery Address (Optional)</Label><Textarea placeholder="Enter delivery address for this voucher..." value={newVoucherDeliveryAddress} onChange={e=>setNewVoucherDeliveryAddress(e.target.value)} className="resize-none min-h-[80px]"/></div><DialogFooter><Button variant="outline" onClick={()=>setIsAddingAnotherVoucher(false)}>Cancel</Button><Button onClick={handleAddAnotherVoucher} disabled={!newVoucherSelectedCustomer && !newVoucherDeliveryAddress}><Plus className="mr-2 h-4 w-4" />Add Voucher</Button></DialogFooter></DialogContent></Dialog>
          
          {editingVoucherInfo && (
            <Dialog open={true} onOpenChange={() => setEditingVoucherInfo(null)}>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>Edit Voucher Items for {additionalVoucherRequests[editingVoucherInfo.index]?.customer_name || 'Walk-in'}</DialogTitle></DialogHeader>
                <div className="py-4 space-y-3 max-h-96 overflow-y-auto">
                  {editingVoucherInfo.items.map(item => {
                    const originalProduct = originalProducts.find(p => p.id === item.product_id);
                    const totalOriginalStock = originalProduct?.quantity || 0;

                    let qtyInOtherCarts = voucherItems.find(i => i.product_id === item.product_id)?.quantity || 0;
                    additionalVoucherRequests.forEach((req, i) => {
                        if (i !== editingVoucherInfo.index) {
                            const itemInOtherVoucher = req.items.find(it => it.product_id === item.product_id);
                            if (itemInOtherVoucher) {
                                qtyInOtherCarts += itemInOtherVoucher.quantity;
                            }
                        }
                    });
                    const stockLimit = totalOriginalStock - qtyInOtherCarts;
                    
                    return (
                      <div key={item.product_id} className="flex items-center justify-between">
                        <div className="flex-grow">
                          <p className="font-medium truncate">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.price?.toFixed(2) || '0.00'}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <QuantitySelector
                            quantity={item.quantity}
                            onQuantityChange={(newQuantity) => {
                              setEditingVoucherInfo(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.product_id === item.product_id ? {...i, quantity: newQuantity} : i).filter(i => i.quantity > 0)
                              }));
                            }}
                            stockLimit={stockLimit}
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                            setEditingVoucherInfo(prev => ({
                              ...prev,
                              items: prev.items.filter(i => i.product_id !== item.product_id)
                            }));
                          }}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  {editingVoucherInfo.items.length === 0 && <p className="text-sm text-muted-foreground text-center">No items in this voucher.</p>}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditingVoucherInfo(null)}>Cancel</Button>
                  <Button onClick={handleSaveEditedVoucher}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
      </div>
    </div>
  </>
);
};
      
export default VoucherGeneration;
