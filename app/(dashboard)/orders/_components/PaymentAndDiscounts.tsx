"use client"

import type React from "react"

import { memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PaymentStatus } from "@/types/common"
import type { CreateOrderDto, UpdateOrderDto } from "@/types/order"
import type { PaymentProvider } from "@/types/payments"

interface PaymentAndDiscountsProps {
  formData: CreateOrderDto & Partial<UpdateOrderDto>
  setFormData: React.Dispatch<React.SetStateAction<CreateOrderDto & Partial<UpdateOrderDto>>>
  paymentProviders: PaymentProvider[]
}

export const PaymentAndDiscounts = memo(function PaymentAndDiscounts({
  formData,
  setFormData,
  paymentProviders,
}: PaymentAndDiscountsProps) {
  const handlePaymentProviderChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentProviderId: value,
    }))
  }

  const handlePaymentStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: value as PaymentStatus,
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pago y Descuentos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payment-provider">Método de Pago</Label>
          <Select value={formData.paymentProviderId || ""} onValueChange={handlePaymentProviderChange}>
            <SelectTrigger id="payment-provider">
              <SelectValue placeholder="Seleccionar método de pago" />
            </SelectTrigger>
            <SelectContent>
              {paymentProviders.map((provider) => (
                <SelectItem key={provider.id} value={provider.id}>
                  {provider.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment-status">Estado del Pago</Label>
          <Select value={formData.paymentStatus || ""} onValueChange={handlePaymentStatusChange}>
            <SelectTrigger id="payment-status">
              <SelectValue placeholder="Seleccionar estado del pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PaymentStatus.PENDING}>Pendiente</SelectItem>
              <SelectItem value={PaymentStatus.COMPLETED}>Completado</SelectItem>
              <SelectItem value={PaymentStatus.FAILED}>Fallido</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
})
