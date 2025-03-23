"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash, Download } from 'lucide-react';
// We'll use this type for our product items
interface Product {
  id: string;
  description: string;
  quantity: number;
  price: number;
  taxRate: number;
}

export default function InvoiceGenerator() {
  const [products, setProducts] = useState<Product[]>([
    { id: '1', description: '', quantity: 1, price: 0, taxRate: 0 }
  ]);
  const [shopInfo, setShopInfo] = useState({
    name: '',
    address: '',
    email: '',
    phone: ''
  });
  const [clientInfo, setClientInfo] = useState({
    name: '',
    address: '',
    email: '',
    phone: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Add a new product row
  const addProduct = () => {
    setProducts([
      ...products,
      {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        price: 0,
        taxRate: 0
      }
    ]);
  };

  // Remove a product row
  const removeProduct = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(product => product.id !== id));
    } else {
      toast.error("You need at least one product");
    }
  };

  // Update a product field
  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(
      products.map(product => 
        product.id === id 
          ? { ...product, [field]: field === 'description' ? value : Number(value) } 
          : product
      )
    );
  };

  // Generate the invoice PDF
  const generateInvoice = async () => {
    // Validation
    if (!shopInfo.name || !clientInfo.name) {
      toast.error("Shop and client information is required");
      return;
    }

    if (products.some(p => !p.description || p.quantity <= 0 || p.price <= 0)) {
      toast.error("All products must have a description, quantity, and price");
      return;
    }

    setIsGenerating(true);

    try {
      // Import easyinvoice dynamically
      const easyinvoice = await import('easyinvoice');
      
      const data = {
        apiKey: "free",
        mode: "development" as "development" | "production",
        images: {
          // You can add your logo here if needed
          logo: "",
        },
        sender: {
          company: shopInfo.name,
          address: shopInfo.address,
          email: shopInfo.email,
          phone: shopInfo.phone
        },
        client: {
          company: clientInfo.name,
          address: clientInfo.address,
          email: clientInfo.email,
          phone: clientInfo.phone
        },
        information: {
          number: `INV-${Date.now().toString().substring(6)}`,
          date: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        products: products.map(p => ({
          quantity: String(p.quantity),
          description: p.description,
          taxRate: String(p.taxRate),
          price: String(p.price)
        })),
        bottomNotice: "Thank you for your business!"
      };

      const result = await easyinvoice.default.createInvoice(data as any);
      
      // Create a download link for the PDF
      const link = document.createElement('a');
      link.href = `data:application/pdf;base64,${result.pdf}`;
      link.download = `invoice-${data.information.number}.pdf`;
      link.click();
      
      toast.success("Invoice generated successfully");
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="bg-[#131313] border-[#333333] text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Generate Invoice</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Shop Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Shop Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={shopInfo.name}
                  onChange={(e) => setShopInfo({...shopInfo, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="shopAddress">Address</Label>
                <Input
                  id="shopAddress"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={shopInfo.address}
                  onChange={(e) => setShopInfo({...shopInfo, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="shopEmail">Email</Label>
                <Input
                  id="shopEmail"
                  type="email"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={shopInfo.email}
                  onChange={(e) => setShopInfo({...shopInfo, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="shopPhone">Phone</Label>
                <Input
                  id="shopPhone"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={shopInfo.phone}
                  onChange={(e) => setShopInfo({...shopInfo, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          {/* Client Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Client Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={clientInfo.name}
                  onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="clientAddress">Address</Label>
                <Input
                  id="clientAddress"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={clientInfo.address}
                  onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="clientEmail">Email</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={clientInfo.email}
                  onChange={(e) => setClientInfo({...clientInfo, email: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="clientPhone">Phone</Label>
                <Input
                  id="clientPhone"
                  className="bg-[#292929] border-[#626262] text-white"
                  value={clientInfo.phone}
                  onChange={(e) => setClientInfo({...clientInfo, phone: e.target.value})}
                />
              </div>
            </div>
          </div>
          
          {/* Products */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Products & Services</h3>
              <Button 
                onClick={addProduct}
                variant="outline"
                className="border-[#444444] text-gray-300 hover:bg-[#333333] hover:text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Header row */}
              <div className="grid grid-cols-12 gap-2 text-sm text-gray-400">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Tax Rate (%)</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* Product rows */}
              {products.map((product) => (
                <div key={product.id} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <Input
                      className="bg-[#292929] border-[#626262] text-white"
                      value={product.description}
                      onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                      placeholder="Item description"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="bg-[#292929] border-[#626262] text-white"
                      value={product.quantity}
                      onChange={(e) => updateProduct(product.id, 'quantity', e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="bg-[#292929] border-[#626262] text-white"
                      value={product.price}
                      onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      className="bg-[#292929] border-[#626262] text-white"
                      value={product.taxRate}
                      onChange={(e) => updateProduct(product.id, 'taxRate', e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(product.id)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-transparent"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Invoice Summary - This would calculate totals */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-gray-400">Subtotal:</div>
              <div className="text-right">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  products.reduce((sum, item) => sum + (item.price * item.quantity), 0)
                )}
              </div>
              
              <div className="text-gray-400">Tax:</div>
              <div className="text-right">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  products.reduce((sum, item) => sum + (item.price * item.quantity * item.taxRate / 100), 0)
                )}
              </div>
              
              <div className="font-medium">Total:</div>
              <div className="text-right font-medium">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
                  products.reduce((sum, item) => sum + (item.price * item.quantity * (1 + item.taxRate / 100)), 0)
                )}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={generateInvoice}
            disabled={isGenerating}
            className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80 ml-auto"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              <span className="flex items-center">
                <Download className="h-4 w-4 mr-2" />
                Generate Invoice
              </span>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}