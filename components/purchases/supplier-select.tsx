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
import { getSuppliers } from "@/app/actions/supplier-actions"

interface SupplierSelectProps {
  value: string | number | null
  onChange: (value: string | number | null, name?: string) => void
  onAddNew?: () => void
  userId?: number
  disabled?: boolean
}

interface Supplier {
  id: number
  name: string
  email?: string
  phone?: string
}

export default function SupplierSelect({ value, onChange, onAddNew, userId, disabled = false }: SupplierSelectProps) {
  const [open, setOpen] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState("")

  useEffect(() => {
    const fetchSuppliers = async () => {
      try {
        setLoading(true)
        // Pass userId to ensure we only get suppliers created by this user
        const result = await getSuppliers(userId)
        if (result.success) {
          setSuppliers(result.data)
        } else {
          setError(result.message || "Failed to load suppliers")
        }
      } catch (error) {
        console.error("Error fetching suppliers:", error)
        setError("An error occurred while loading suppliers")
      } finally {
        setLoading(false)
      }
    }

    fetchSuppliers()
  }, [userId])

  const selectedSupplier =
    typeof value === "number"
      ? suppliers.find((supplier) => supplier.id === value)
      : suppliers.find((supplier) => supplier.name === value)

  const handleSelect = (currentValue: string) => {
    // Check if the selected value is an existing supplier
    const supplier = suppliers.find((s) => s.name === currentValue)

    if (supplier) {
      onChange(supplier.id, supplier.name)
    } else {
      // If it's a new supplier name, pass the string
      onChange(currentValue, currentValue)
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedSupplier ? selectedSupplier.name : value || "Select supplier..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput
            placeholder="Search supplier..."
            value={inputValue}
            onValueChange={setInputValue}
            onKeyDown={(e) => {
              if (e.key === "Enter" && inputValue) {
                e.preventDefault()
                handleSelect(inputValue)
              }
            }}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <CommandEmpty>Error: {error}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No supplier found. Press enter to add "{inputValue}"</CommandEmpty>
                <CommandGroup>
                  {suppliers.map((supplier) => (
                    <CommandItem key={supplier.id} value={supplier.name} onSelect={() => handleSelect(supplier.name)}>
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === supplier.id || value === supplier.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <div className="flex flex-col">
                        <span>{supplier.name}</span>
                        {supplier.email && <span className="text-xs text-muted-foreground">{supplier.email}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
            {onAddNew && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      onAddNew()
                      setOpen(false)
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Supplier
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

