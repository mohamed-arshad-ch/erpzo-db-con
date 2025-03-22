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
import { getCustomers } from "@/app/actions/customer-actions"

interface CustomerSelectProps {
  value: number | null
  onChange: (value: number | null, name?: string) => void
  onAddNew: () => void
  userId?: number
}

interface Customer {
  id: number
  name: string
  email: string
}

export default function CustomerSelect({ value, onChange, onAddNew, userId }: CustomerSelectProps) {
  const [open, setOpen] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        // Pass userId to ensure we only get customers created by this user
        const result = await getCustomers(userId)
        if (result.success) {
          setCustomers(result.data)
        } else {
          setError(result.message || "Failed to load customers")
        }
      } catch (error) {
        console.error("Error fetching customers:", error)
        setError("An error occurred while loading customers")
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [userId])

  const selectedCustomer = customers.find((customer) => customer.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value && selectedCustomer ? selectedCustomer.name : "Select customer..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search customer..." />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <CommandEmpty>Error: {error}</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>No customer found.</CommandEmpty>
                <CommandGroup>
                  {customers.map((customer) => (
                    <CommandItem
                      key={customer.id}
                      value={customer.name}
                      onSelect={() => {
                        onChange(customer.id, customer.name)
                        setOpen(false)
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", value === customer.id ? "opacity-100" : "opacity-0")} />
                      <div className="flex flex-col">
                        <span>{customer.name}</span>
                        <span className="text-xs text-muted-foreground">{customer.email}</span>
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
                Add New Customer
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

