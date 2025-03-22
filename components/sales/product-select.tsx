"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getProducts } from "@/app/actions/product-actions"

interface ProductSelectProps {
  value: number | null
  onChange: (value: number, name: string, price: number) => void
  onAddNew: () => void
  userId?: number
}

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

export default function ProductSelect({ value, onChange, onAddNew, userId }: ProductSelectProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        // Pass userId to ensure we only get products created by this user
        const result = await getProducts(userId)
        if (result.success) {
          setProducts(result.data)
        } else {
          setError(result.message || "Failed to load products")
        }
      } catch (error) {
        console.error("Error fetching products:", error)
        setError("An error occurred while loading products")
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [userId])

  const selectedProduct = products.find((product) => product.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value && selectedProduct ? selectedProduct.name : "Select product..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search product..." />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <CommandEmpty>Error: {error}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No product found.</CommandEmpty>
                <CommandGroup>
                  {products.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={product.name}
                      onSelect={() => {
                        onChange(product.id, product.name, product.price)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === product.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span>{product.name}</span>
                        <div className="flex gap-2 text-xs text-muted-foreground">
                          <span>${product.price}</span>
                          <span>•</span>
                          <span
                            className={cn(
                              product.stock <= 5 ? "text-red-500" : product.stock <= 10 ? "text-amber-500" : "",
                            )}
                          >
                            Stock: {product.stock}
                          </span>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onAddNew()
                  setOpen(false)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

