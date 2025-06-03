"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { useMainStore } from "@/stores/mainStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { UpdateProductDto, ProductOption } from "@/types/product"
import type { UpdateProductVariantDto } from "@/types/productVariant"
import { ProductStatus } from "@/types/common"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowLeft,
  ArrowRight,
  PackageIcon,
  CircleDollarSign,
  RotateCcw,
  ImagePlus,
  Info,
  X,
  Calendar,
  Plus,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ImageGallery } from "../../_components/ImageGallery"
import Image from "next/image"
import { getImageUrl } from "@/lib/imageUtils"
import { slugify } from "@/lib/slugify"
import { MultiSelect } from "@/components/ui/multi-select"
import type React from "react"
import { Textarea } from "@/components/ui/textarea"
import { VariantOptions } from "../../_components/VariantOptions"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { uploadImage } from "@/app/actions/upload-file"
import { RichTextEditor } from "@/components/RichTextEditor"

interface VariantCombination {
  id: string
  enabled: boolean
  attributes: Record<string, string>
}

const areEqual = (array1: any[], array2: any[]) => {
  return JSON.stringify(array1) === JSON.stringify(array2)
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [productData, setProductData] = useState<any>(null)
  const [storeData, setStoreData] = useState<any>(null)
  const resolvedParams = use(params)

  // Get all the necessary functions from the store
  const {
    currentStore,
    updateProduct,
    categories,
    collections,
    fetchCategories,
    fetchCollections,
    fetchShopSettings,
    shopSettings,
    fetchExchangeRates,
    exchangeRates,
    fetchProductsByStore,
    currencies,
    fetchCurrencies,
  } = useMainStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [useVariants, setUseVariants] = useState(false)
  const [variants, setVariants] = useState<UpdateProductVariantDto[]>([])
  const [formData, setFormData] = useState<UpdateProductDto>({})
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false)
  const [productOptions, setProductOptions] = useState<ProductOption[]>([])
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([])
  const [hasFetched, setHasFetched] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (hasFetched) return
      console.log("🔍 DEBUG: Starting data fetch")
      console.log("🆔 DEBUG: Product ID from params:", resolvedParams.id)
      setIsLoading(true)
      setError(null)

      try {
        // Get the current store ID
        const storeId = useMainStore.getState().currentStore
        console.log("🏪 DEBUG: Current store ID:", storeId)
        setStoreData({ storeId })

        if (!storeId) {
          throw new Error("No store selected")
        }

        // Fetch basic data first
        console.log("📊 DEBUG: Fetching initial data...")
        await Promise.all([
          fetchCategories(),
          fetchCollections(),
          fetchShopSettings(),
          fetchExchangeRates(),
          fetchCurrencies(),
        ])
        console.log("✅ DEBUG: Initial data fetched successfully")

        // Fetch all products for the store
        console.log(`🛍️ DEBUG: Fetching all products for store: ${storeId}...`)
        const allProducts = await fetchProductsByStore(storeId)
        console.log(`✅ DEBUG: Fetched ${allProducts.length} products for store ${storeId}`)

        // Find the specific product by ID
        console.log(`🔍 DEBUG: Filtering for product with ID: ${resolvedParams.id}`)
        console.log(
          "🔍 DEBUG: Available product IDs:",
          allProducts.map((p) => p.id),
        )

        const product = allProducts.find((p) => p.id === resolvedParams.id)
        console.log("📦 DEBUG: Found product:", product ? product.title : "Not found")

        if (product) {
          console.log("✅ DEBUG: Product found")
          setProductData(product)

          setFormData({
            ...product,
            categoryIds: product.categories?.map((c) => c.id) || [],
            collectionIds: product.collections?.map((c) => c.id) || [],
            // Ensure new schema fields have default values if not present
            restockThreshold: product.restockThreshold ?? 5,
            restockNotify: product.restockNotify ?? true,
            releaseDate: product.releaseDate ? new Date(product.releaseDate) : undefined,
          })

          const productVariants =
            product.variants?.map((variant) => ({
              ...variant,
              isActive: variant.isActive ?? true,
              position: variant.position ?? 0,
            })) || []
          console.log("📦 DEBUG: Setting initial variants:", productVariants.length)
          console.log("📦 DEBUG: First variant sample:", productVariants[0] || "No variants")

          setVariants(productVariants)
          setUseVariants(productVariants.length > 1)

          // Extract product options and set up variantCombinations
          console.log("🔄 DEBUG: Extracting product options...")
          const options = extractProductOptions(productVariants)
          setProductOptions(options)

          // Generate variant combinations based on options
          if (options.length > 0) {
            console.log("🔄 DEBUG: Generating variant combinations...")
            const combinations = generateVariantCombinationsFromOptions(options, productVariants)
            setVariantCombinations(combinations)
            console.log(`✅ DEBUG: Generated ${combinations.length} variant combinations`)
          }
        } else {
          console.error("❌ DEBUG: Product not found in the fetched products")
          setError("Product not found")
          toast({
            variant: "destructive",
            title: "Error",
            description: "Producto no encontrado",
          })
          router.push("/products")
        }
      } catch (error) {
        console.error("❌ DEBUG: Error fetching data:", error)
        if (error instanceof Error) {
          console.error("❌ DEBUG: Error message:", error.message)
          console.error("❌ DEBUG: Error stack:", error.stack)
          setError(error.message)
        } else {
          setError("Unknown error occurred")
        }
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al cargar los datos del producto",
        })
      } finally {
        setIsLoading(false)
        setHasFetched(true)
        console.log("🏁 DEBUG: Data fetching process completed")
      }
    }

    fetchData()
  }, [
    resolvedParams.id,
    fetchCategories,
    fetchCollections,
    fetchShopSettings,
    fetchExchangeRates,
    fetchCurrencies,
    fetchProductsByStore,
    toast,
    router,
    hasFetched,
    currentStore,
  ])

  // Function to generate variant combinations from options
  const generateVariantCombinationsFromOptions = (
    options: ProductOption[],
    existingVariants: UpdateProductVariantDto[],
  ): VariantCombination[] => {
    if (!options.length) return []

    const generateCombos = (optionIndex = 0, current: Record<string, string> = {}): Record<string, string>[] => {
      if (optionIndex >= options.length) return [current]

      const currentOption = options[optionIndex]
      return currentOption.values.flatMap((value) => {
        const newCurrent = { ...current, [currentOption.title]: value }
        return generateCombos(optionIndex + 1, newCurrent)
      })
    }

    const combinations = generateCombos()

    return combinations.map((combo) => {
      // Check if this combination already exists in current variants
      const existingVariant = existingVariants.find((v) =>
        v.attributes
          ? Object.entries(combo).every(([key, value]) => v.attributes && v.attributes[key] === value)
          : false,
      )

      return {
        id: existingVariant?.id || `variant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        enabled: !!existingVariant, // Enabled if it already exists
        attributes: combo,
      }
    })
  }

  const extractProductOptions = (variants: UpdateProductVariantDto[]): ProductOption[] => {
    console.log("🔍 DEBUG: Extracting product options from variants:", variants.length)
    const optionsMap: Record<string, Set<string>> = {}
    variants.forEach((variant) => {
      if (!variant.attributes) {
        console.log("⚠️ DEBUG: Variant without attributes:", variant)
        return
      }

      Object.entries(variant.attributes || {}).forEach(([key, value]) => {
        if (key !== "type") {
          // Ignore the 'type' attribute used for simple variants
          if (!optionsMap[key]) optionsMap[key] = new Set()
          optionsMap[key].add(value)
        }
      })
    })
    const options = Object.entries(optionsMap).map(([title, values]) => ({
      title,
      values: Array.from(values),
    }))
    console.log("✅ DEBUG: Extracted product options:", options)
    return options
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    console.log(`🔄 DEBUG: Handling change for ${name}:`, value)
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      if (name === "title" && !isSlugManuallyEdited) {
        newData.slug = slugify(value)
      }
      return newData
    })
  }

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("🔄 DEBUG: Handling slug change:", e.target.value)
    setFormData((prev) => ({ ...prev, slug: slugify(e.target.value) }))
    setIsSlugManuallyEdited(true)
  }

  const handleVariantChange = (index: number, field: keyof UpdateProductVariantDto, value: any) => {
    console.log(`🔄 DEBUG: Handling variant change for index ${index}, field ${field}:`, value)
    setVariants((prev) => {
      const newVariants = [...prev]
      newVariants[index] = { ...newVariants[index], [field]: value }
      return newVariants
    })
  }

  const handleVariantPriceChange = (index: number, currencyId: string, price: number) => {
    console.log(`🔄 DEBUG: Handling variant price change for index ${index}, currency ${currencyId}:`, price)
    setVariants((prev) => {
      const newVariants = prev.map((v, i) => {
        if (i === index) {
          const newPrices = (v.prices || []).filter((p) => p.currencyId !== currencyId)
          newPrices.push({ currencyId, price })

          const baseCurrency = shopSettings?.[0]?.defaultCurrency
          if (baseCurrency && baseCurrency.id === currencyId) {
            exchangeRates.forEach((er) => {
              if (er.fromCurrencyId === baseCurrency.id) {
                const existingPrice = newPrices.find((p) => p.currencyId === er.toCurrencyId)
                if (existingPrice) {
                  existingPrice.price = price * er.rate
                } else {
                  newPrices.push({ currencyId: er.toCurrencyId, price: price * er.rate })
                }
              }
            })
          }

          return { ...v, prices: newPrices }
        }
        return v
      })

      return areEqual(newVariants, prev) ? prev : newVariants
    })
  }

  const handleImageUpload = async (variantIndex: number) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    // NO multiple - solo una imagen a la vez
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const { success, presignedUrl, fileUrl, error } = await uploadImage(shopSettings[0]?.name, file.name, file.type)
        if (!success || !presignedUrl) {
          console.error("Error al obtener la presigned URL:", error)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Sube el archivo directamente a R2 usando la presigned URL
        const uploadResponse = await fetch(presignedUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        })

        if (!uploadResponse.ok) {
          console.error("Error subiendo el archivo:", uploadResponse.statusText)
          toast({
            variant: "destructive",
            title: "Error",
            description: `Failed to upload ${file.name}`,
          })
          return
        }

        // Agregar la nueva imagen al array de imageUrls
        if (useVariants) {
          setVariants((prev) =>
            prev.map((v, index) =>
              index === variantIndex ? { ...v, imageUrls: [...(v.imageUrls || []), fileUrl] } : v,
            ),
          )
        } else {
          setFormData((prev) => ({ ...prev, imageUrls: [...(prev.imageUrls || []), fileUrl] }))
        }

        toast({
          title: "Imagen subida",
          description: "La imagen se subió correctamente",
        })
      } catch (error) {
        console.error("Error uploading file:", file.name, error)
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to upload ${file.name}`,
        })
      }
    }
    input.click()
  }

  const handleRemoveVariantImage = (variantIndex: number, imageIndex: number) => {
    setVariants((prev) =>
      prev.map((v, vIndex) => {
        if (vIndex === variantIndex) {
          const updatedImages = [...(v.imageUrls || [])]
          updatedImages.splice(imageIndex, 1)
          return { ...v, imageUrls: updatedImages }
        }
        return v
      }),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("📤 DEBUG: Submitting updated product data...")
    try {
      const productData: UpdateProductDto = {
        ...formData,
        variants: variants,
      }
      console.log("📦 DEBUG: Product data to update:", productData)

      await updateProduct(resolvedParams.id, productData)
      console.log("✅ DEBUG: Product updated successfully")
      toast({
        title: "Éxito",
        description: "Producto actualizado correctamente",
      })
      router.push("/products")
    } catch (error) {
      console.error("❌ DEBUG: Error updating product:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al actualizar el producto",
      })
    }
  }

  // Update variants when options or combinations change
  useEffect(() => {
    if (!hasFetched) return

    if (useVariants && variantCombinations.length > 0) {
      const enabledCombinations = variantCombinations.filter((v) => v.enabled)

      // Map enabled combinations to variants
      const newVariants = enabledCombinations.map((combo, index) => {
        // Check if a variant with these attributes already exists
        const existingVariant = variants.find((v) =>
          v.attributes && combo.attributes
            ? Object.entries(combo.attributes).every(([key, value]) => v.attributes && v.attributes[key] === value)
            : false,
        )

        if (!existingVariant) {
          // Create a new variant
          return {
            title: combo.attributes ? Object.values(combo.attributes).join(" / ") : `Variant ${index}`,
            sku: "",
            imageUrls: [],
            inventoryQuantity: 0,
            weightValue: 0,
            prices: [], // Ensure prices is initialized
            attributes: combo.attributes || {},
            isActive: true,
            position: index,
          }
        } else {
          return existingVariant
        }
      })

      // Only update if there are changes
      if (!areEqual(newVariants, variants)) {
        setVariants(newVariants)
      }
    }
  }, [useVariants, variantCombinations, hasFetched, variants])

  // Handle changes in useVariants
  useEffect(() => {
    if (!hasFetched) return

    if (!useVariants && variants.length > 1) {
      // If variants are disabled, keep only the first variant
      const mainVariant = variants[0]
      setVariants([
        {
          ...mainVariant,
          title: formData.title || "Variante Principal",
          attributes: { type: "simple" },
          isActive: true,
          imageUrls: [],
        },
      ])
    }
  }, [useVariants, hasFetched, variants, formData.title])

  const renderStep1 = () => {
    console.log("🖌️ DEBUG: Rendering step 1")
    return (
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <div className="flex w-full justify-between items-center">
            <div>
              <h3>Detalle del Producto</h3>
              <span className="content-font text-gray-500">Actualice la información básica de su producto.</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.status === ProductStatus.ACTIVE}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      status: checked ? ProductStatus.ACTIVE : ProductStatus.DRAFT,
                    }))
                  }
                />
                <span className="text-sm font-medium">
                  {formData.status === ProductStatus.ACTIVE ? (
                    <Badge className="bg-emerald-500">Activo</Badge>
                  ) : (
                    <Badge className="bg-gray-500">Borrador</Badge>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="box-section border-none gap-12 pb-6 items-start ">
          <div className="w-1/2 flex flex-col gap-3 ">
            <div className="space-y-2">
              <Label htmlFor="title">Nombre</Label>
              <Input id="title" name="title" value={formData.title || ""} onChange={handleChange} />
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Slug</Label>
                <div className="relative">
                  <Input value={formData.slug || ""} onChange={handleSlugChange} />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsSlugManuallyEdited(true)
                      setFormData((prev) => ({ ...prev, slug: slugify(prev.title || "") }))
                    }}
                    className="absolute right-0 top-0 h-full px-3 py-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3 w-1/2">
                <Label>Proveedor</Label>
                <Input name="vendor" value={formData.vendor || ""} onChange={handleChange} />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Colecciones</Label>
                <MultiSelect
                  options={collections.map((collection) => ({ label: collection.title, value: collection.id }))}
                  selected={formData.collectionIds || []}
                  onChange={(selected) => setFormData((prev) => ({ ...prev, collectionIds: selected }))}
                />
              </div>

              <div className="space-y-3 w-1/2">
                <Label>Categorías</Label>
                <MultiSelect
                  options={categories.map((category) => ({ label: category.name, value: category.id }))}
                  selected={formData.categoryIds || []}
                  onChange={(selected) => setFormData((prev) => ({ ...prev, categoryIds: selected }))}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-3 w-1/2">
                <Label>Fecha de lanzamiento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.releaseDate ? format(formData.releaseDate, "PPP") : <span>Seleccionar fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={formData.releaseDate ? formData.releaseDate : undefined}
                      onSelect={(date) => setFormData((prev) => ({ ...prev, releaseDate: date || undefined }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-3 w-1/2">
                <Label>Umbral de reabastecimiento</Label>
                <Input
                  type="number"
                  name="restockThreshold"
                  value={formData.restockThreshold || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, restockThreshold: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="space-y-3 w-full">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowBackorder"
                  checked={formData.allowBackorder || false}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, allowBackorder: checked === true }))}
                />
                <Label htmlFor="allowBackorder">Permitir pedidos pendientes</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Permitir a los clientes comprar productos que están fuera de stock
              </span>
            </div>

            <div className="space-y-3 w-full">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="restockNotify"
                  checked={formData.restockNotify === true}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, restockNotify: checked === true }))}
                />
                <Label htmlFor="restockNotify">Notificar reabastecimiento</Label>
                <Info className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                Recibir notificaciones cuando el inventario esté por debajo del umbral
              </span>
            </div>

            <div className="space-y-3">
              <Label>Descripción</Label>
              <RichTextEditor
                content={formData.description || ""}
                onChange={(content) => setFormData((prev) => ({ ...prev, description: content }))}
              />
            </div>

            <div className="space-y-3">
              <Label>Media</Label>
              <ImageGallery
                images={formData.imageUrls || []}
                onChange={(newImages) => setFormData((prev) => ({ ...prev, imageUrls: newImages }))}
                maxImages={10}
              />
            </div>
          </div>

          <div className="w-1/2 flex flex-col justify-start gap-3 ">
            <VariantOptions
              useVariants={useVariants}
              onUseVariantsChange={setUseVariants}
              options={productOptions}
              onOptionsChange={setProductOptions}
              variants={variantCombinations}
              onVariantsChange={setVariantCombinations}
            />
          </div>
        </div>
      </div>
    )
  }

  const renderStep2 = () => {
    console.log("🖌️ DEBUG: Rendering step 2")
    console.log("📦 DEBUG: Variants count:", variants.length)
    console.log("🔄 DEBUG: useVariants:", useVariants)
    console.log("⚙️ DEBUG: shopSettings:", shopSettings?.[0]?.name || "No shop settings")
    return (
      <div className="box-container h-fit">
        <div className="box-section flex flex-col justify-start items-start ">
          <h3>{useVariants ? "Detalles de Variantes" : "Detalles de Producto"}</h3>
          <span className="content-font text-gray-500">
            {useVariants ? "Gestione sus variantes de producto" : "Gestione su producto"}
          </span>
        </div>
        <div className="box-section border-none px-0 gap-12 pb-6">
          {variants.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="p-0 pl-6">Nombre</TableHead>
                  <TableHead className="p-0 w-[250px]">SKU</TableHead>
                  <TableHead className="p-0 w-[100px]">Peso</TableHead>
                  <TableHead className="p-0 w-[100px]">Cantidad</TableHead>
                  {(shopSettings?.[0]?.acceptedCurrencies || []).map((currency) => (
                    <TableHead className="p-0 w-[100px]" key={currency.id}>
                      Precio ({currency.code})
                    </TableHead>
                  ))}
                  {useVariants && <TableHead className="p-0 w-[400px]">Atributos</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={index} className={variant.isActive ? "" : "opacity-50"}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10 mr-2 bg-accent rounded-md">
                          {useVariants ? (
                            variant.imageUrls && variant.imageUrls.length > 0 ? (
                              <>
                                <Image
                                  src={getImageUrl(variant.imageUrls[0]) || "/placeholder.svg"}
                                  alt={variant.title || "Product variant"}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded-md"
                                />
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveVariantImage(index, 0)
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="absolute top-0 right-0 h-5 w-5 bg-background/80 rounded-full hover:bg-background"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                onClick={() => handleImageUpload(index)}
                                variant="ghost"
                                className="w-full h-full"
                              >
                                <ImagePlus className="w-5 h-5 text-gray-500" />
                              </Button>
                            )
                          ) : formData.imageUrls?.[0] ? (
                            <>
                              <Image
                                src={getImageUrl(formData.imageUrls[0]) || "/placeholder.svg"}
                                alt={variant.title || "Product variant"}
                                layout="fill"
                                objectFit="cover"
                                className="rounded-md"
                              />
                              <Button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setFormData((prev) => ({ ...prev, imageUrls: prev.imageUrls!.slice(1) }))
                                }}
                                variant="ghost"
                                size="icon"
                                className="absolute top-0 right-0 h-5 w-5 bg-background/80 rounded-full hover:bg-background"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </>
                          ) : (
                            <Button onClick={() => handleImageUpload(index)} variant="ghost" className="w-full h-full">
                              <ImagePlus className="w-5 h-5 text-gray-500" />
                            </Button>
                          )}
                        </div>

                        {/* Mostrar imágenes adicionales para variantes */}
                        {useVariants && variant.imageUrls && variant.imageUrls.length > 1 && (
                          <div className="flex flex-col gap-1">
                            {variant.imageUrls.slice(1, 3).map((imageUrl, imageIndex) => (
                              <div key={imageIndex + 1} className="relative w-6 h-6 bg-accent rounded">
                                <Image
                                  src={getImageUrl(imageUrl) || "/placeholder.svg"}
                                  alt={`${variant.title} - ${imageIndex + 2}`}
                                  layout="fill"
                                  objectFit="cover"
                                  className="rounded"
                                />
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveVariantImage(index, imageIndex + 1)
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -top-1 -right-1 h-3 w-3 bg-background/80 rounded-full hover:bg-background p-0"
                                >
                                  <X className="w-1.5 h-1.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botón para agregar más imágenes si hay menos de 3 */}
                        {useVariants && (!variant.imageUrls || variant.imageUrls.length < 3) && (
                          <Button
                            onClick={() => handleImageUpload(index)}
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 border-2 border-dashed border-muted-foreground/25 rounded hover:border-muted-foreground/50"
                          >
                            <Plus className="w-3 h-3 text-muted-foreground" />
                          </Button>
                        )}

                        <Input
                          value={variant.title || ""}
                          onChange={(e) => handleVariantChange(index, "title", e.target.value)}
                          className="border-0 p-0"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku || ""}
                        onChange={(e) => handleVariantChange(index, "sku", e.target.value)}
                        className="border-0 p-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.weightValue || ""}
                        onChange={(e) => handleVariantChange(index, "weightValue", Number(e.target.value))}
                        className="border-0 p-0"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.inventoryQuantity || ""}
                        onChange={(e) => handleVariantChange(index, "inventoryQuantity", Number(e.target.value))}
                        className="border-0 p-0"
                      />
                    </TableCell>
                    {(shopSettings?.[0]?.acceptedCurrencies || []).map((currency) => (
                      <TableCell key={currency.id}>
                        <Input
                          type="number"
                          value={variant.prices?.find((p) => p.currencyId === currency.id)?.price || ""}
                          onChange={(e) => handleVariantPriceChange(index, currency.id, Number(e.target.value))}
                          className="border-0 p-0"
                        />
                      </TableCell>
                    ))}
                    {useVariants && (
                      <TableCell>
                        <div className="flex flex-wrap gap-1 text-sm">
                          {variant.attributes &&
                            Object.entries(variant.attributes).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-1">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            ))}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-4">No hay variantes disponibles para este producto.</div>
          )}
        </div>
      </div>
    )
  }

  const renderStep3 = () => (
    <div className="box-container h-fit">
      <div className="box-section flex flex-col justify-start items-start ">
        <h3>Información Adicional</h3>
        <span className="content-font text-gray-500">Actualice metadatos para SEO.</span>
      </div>
      <div className="box-section border-none flex flex-col gap-8 pb-6">
        <div className="flex flex-col w-full">
          <div className="space-y-3">
            <Label htmlFor="metaTitle">Meta Título</Label>
            <Input
              id="metaTitle"
              name="metaTitle"
              value={formData.metaTitle || ""}
              onChange={handleChange}
              placeholder="Ingrese el meta título para SEO"
              className="w-full bg-muted/20"
            />
          </div>
          <div className="space-y-3">
            <Label htmlFor="metaDescription">Meta Descripción</Label>
            <Textarea
              id="metaDescription"
              name="metaDescription"
              value={formData.metaDescription || ""}
              onChange={handleChange}
              placeholder="Ingrese la meta descripción para SEO"
              rows={4}
              className="w-full bg-muted/20"
            />
          </div>
        </div>
      </div>
    </div>
  )

  // Simple debug panel to show raw data

  return (
    <div className="text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between h-[57px] border-b border-border bg-background px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 1 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(1)}
          >
            <PackageIcon className="text-foreground mr-2" />
            Detalles
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 2 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(2)}
          >
            <CircleDollarSign className="text-foreground mr-2" />
            Precios
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "text-muted-foreground hover:text-foreground h-[57px] rounded-none px-8",
              currentStep === 3 && "text-foreground border-b-[3px] pt-[10px] border-sky-600 ",
            )}
            onClick={() => setCurrentStep(3)}
          >
            <Info className="text-foreground mr-2" />
            Adicional
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep > 1 ? currentStep - 1 : currentStep)}
            disabled={currentStep === 1}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Anterior
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep < 3 ? currentStep + 1 : currentStep)}
            disabled={currentStep === 3}
            className="border-border text-muted-foreground hover:bg-accent"
          >
            Siguiente <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={handleSubmit} className="create-button">
            Actualizar Producto
          </Button>
        </div>
      </header>
      <ScrollArea className="h-[calc(100vh-3.6em)]">
        <div className="p-6">
          {currentStep === 1 ? renderStep1() : currentStep === 2 ? renderStep2() : renderStep3()}
        </div>
      </ScrollArea>
    </div>
  )
}
